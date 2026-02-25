package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"google.golang.org/api/chat/v1"
	"google.golang.org/api/impersonate"
	"google.golang.org/api/option"
)

func main() {
	godotenv.Load()
	ctx := context.Background()
	serviceAccountEmail := os.Getenv("SERVICE_ACCOUNT_EMAIL")
	userEmail := os.Getenv("USER_EMAIL")

	// User Auth (Impersonating admin/user)
	tsUser, err := impersonate.CredentialsTokenSource(ctx, impersonate.CredentialsConfig{
		TargetPrincipal: serviceAccountEmail,
		Subject:         userEmail,
		Scopes: []string{
			"https://www.googleapis.com/auth/chat.spaces.create",
			"https://www.googleapis.com/auth/chat.messages.create",
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	chatSvcUser, err := chat.NewService(ctx, option.WithTokenSource(tsUser))

	// Set up the DM between the calling user and the App!
	req := &chat.SetUpSpaceRequest{
		Space: &chat.Space{
			SpaceType:       "DIRECT_MESSAGE",
			SingleUserBotDm: true,
		},
	}

	space, err := chatSvcUser.Spaces.Setup(req).Do()
	if err != nil {
		fmt.Println("Spaces.Setup as User error:", err)
		return
	}

	fmt.Println("Space setup successful! Name:", space.Name)

	// Now send the message as the App! Or as the User?
	// Let's send it as the App using another token source
	tsBot, err := impersonate.CredentialsTokenSource(ctx, impersonate.CredentialsConfig{
		TargetPrincipal: serviceAccountEmail,
		Scopes: []string{
			"https://www.googleapis.com/auth/chat.bot",
			"https://www.googleapis.com/auth/chat.messages.create",
		},
	})
	chatSvcBot, _ := chat.NewService(ctx, option.WithTokenSource(tsBot))

	msg := &chat.Message{Text: "Testing telemetry from Bot after User setup!"}
	_, err = chatSvcBot.Spaces.Messages.Create(space.Name, msg).Do()
	if err != nil {
		// App can't send? Try User sending it
		fmt.Println("Bot send error:", err)
	} else {
		fmt.Println("Bot send success!")
	}
}
