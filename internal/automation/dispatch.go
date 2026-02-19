/*
PROPRIETARY AND CONFIDENTIAL LICENSE
Copyright © 2026 Justin Andrew Wood. All Rights Reserved.
*/

/*
File: internal/automation/dispatch.go
Description: Dispatches tasks to the standalone Copilot CLI using non-interactive
prompt mode with full permissions enabled.
*/
package automation

import (
	"fmt"
	"os"
	"os/exec"
)

// DispatchToCLI executes the copilot CLI with the provided task.
// Uses --allow-all to permit tool execution and URL access without manual confirmation.
func DispatchToCLI(task string) error {
	// Command syntax: copilot -p <prompt> --allow-all
	// --allow-all is equivalent to --allow-all-tools --allow-all-paths --allow-all-urls
	cmd := exec.Command("copilot", "-p", task, "--allow-all")

	// Redirect output to the server terminal for real-time monitoring
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// Use Start instead of Run to avoid blocking the HTTP handler
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to launch copilot: %w", err)
	}

	return nil
}
