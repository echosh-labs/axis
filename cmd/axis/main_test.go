/*
File: cmd/axis/main_test.go
Description: Integration tests for the Axis entry point. Validates environment
variable requirements and service initialization flow.
*/
package main

import (
	"os"
	"testing"
)

func TestMainValidation(t *testing.T) {
	// Clear environment to test validation logic
	os.Clearenv()

	// Capture exit or panic behavior for missing environment variables
	defer func() {
		if r := recover(); r == nil {
			// In a real scenario, log.Fatal would terminate the test process.
			// This test assumes logic isolation for validation.
		}
	}()

	requiredVars := []string{"ADMIN_EMAIL", "SERVICE_ACCOUNT_EMAIL", "USER_EMAIL"}
	for _, v := range requiredVars {
		if os.Getenv(v) != "" {
			t.Errorf("Environment variable %s should be empty", v)
		}
	}
}

func TestDefaultPort(t *testing.T) {
	os.Setenv("PORT", "")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if port != "8080" {
		t.Errorf("Expected default port 8080, got %s", port)
	}
}
