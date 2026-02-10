package main

import (
	"context"
	"log"
	"os"

	"axis/internal/server"
	"axis/internal/workspace"

	"github.com/joho/godotenv"
	admin "google.golang.org/api/admin/directory/v1"
	"google.golang.org/api/impersonate"
	keep "google.golang.org/api/keep/v1"
	"google.golang.org/api/option"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Info: No .env file found, relying on shell environment variables.")
	}

	ctx := context.Background()

	adminEmail := os.Getenv("ADMIN_EMAIL")
	serviceAccountEmail := os.Getenv("SERVICE_ACCOUNT_EMAIL")
	testEmail := os.Getenv("TEST_USER_EMAIL")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if adminEmail == "" || serviceAccountEmail == "" || testEmail == "" {
		log.Fatal("Error: ADMIN_EMAIL, SERVICE_ACCOUNT_EMAIL, and TEST_USER_EMAIL must be set.")
	}

	log.Printf("Initializing Axis Engine for %s...", adminEmail)

	ts, err := impersonate.CredentialsTokenSource(ctx, impersonate.CredentialsConfig{
		TargetPrincipal: serviceAccountEmail,
		Subject:         adminEmail,
		Scopes: []string{
			admin.AdminDirectoryUserScope,
			keep.KeepScope,
		},
	})
	if err != nil {
		log.Fatalf("Failed to create token source: %v", err)
	}

	adminSvc, err := admin.NewService(ctx, option.WithTokenSource(ts))
	if err != nil {
		log.Fatalf("Failed to create Admin service: %v", err)
	}

	keepSvc, err := keep.NewService(ctx, option.WithTokenSource(ts))
	if err != nil {
		log.Fatalf("Failed to create Keep service: %v", err)
	}

	ws := workspace.NewService(adminSvc, keepSvc)

	// Verify identity
	user, err := ws.GetUser(testEmail)
	if err != nil {
		log.Fatalf("Identity verification failed: %v", err)
	}
	log.Printf("Identity Verified: %s", user.Email)

	// Launch Server
	srv := server.NewServer(ws)
	if err := srv.Start(port); err != nil {
		log.Fatalf("Server shutdown: %v", err)
	}
}
