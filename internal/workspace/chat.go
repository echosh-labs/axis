// Copyright (c) 2026 Justin Andrew Wood. All rights reserved.
// This software is licensed under the AGPL-3.0.
// Commercial licensing is available at echosh-labs.com.
/*
File: internal/workspace/chat.go
Description: Google Chat API integration for Axis Mundi. Handles sending direct
messages for telemetry and notifications.
*/
package workspace

import (
	"fmt"

	chat "google.golang.org/api/chat/v1"
)

// SendDirectMessage sends a direct message to the specified email address.
// Resolves the space or creates a DM and posts the message text.
func (s *Service) SendDirectMessage(email string, text string) error {
	if s.chatUserSvc == nil || s.chatBotSvc == nil {
		return fmt.Errorf("chat services are not initialized")
	}

	// 1. Establish the Direct Message Space using User Auth
	// Using SingleUserBotDm=true tells the API to establish the
	// 1:1 conversation between the authorized user and the app (bot).
	req := &chat.SetUpSpaceRequest{
		Space: &chat.Space{
			SpaceType:       "DIRECT_MESSAGE",
			SingleUserBotDm: true,
		},
	}

	space, err := s.chatUserSvc.Spaces.Setup(req).Do()
	if err != nil {
		return fmt.Errorf("failed to setup chat space for %s: %w", email, err)
	}

	// 2. Send the message to the established space using App (Bot) Auth
	msg := &chat.Message{
		Text: text,
	}

	_, err = s.chatBotSvc.Spaces.Messages.Create(space.Name, msg).Do()
	if err != nil {
		return fmt.Errorf("failed to send chat message to %s: %w", email, err)
	}

	return nil
}
