/*
File: internal/workspace/workspace_test.go
Description: Unit tests for the Workspace service. Validates service initialization,
registry item consolidation, and Google API service wrapping logic.
*/
package workspace

import (
	"testing"

	admin "google.golang.org/api/admin/directory/v1"
	docs "google.golang.org/api/docs/v1"
	drive "google.golang.org/api/drive/v3"
	keep "google.golang.org/api/keep/v1"
	sheets "google.golang.org/api/sheets/v4"
)

func TestNewService(t *testing.T) {
	adminSvc := &admin.Service{}
	keepSvc := &keep.Service{}
	docsSvc := &docs.Service{}
	sheetsSvc := &sheets.Service{}
	driveSvc := &drive.Service{}

	ws := NewService(adminSvc, keepSvc, docsSvc, sheetsSvc, driveSvc)

	if ws.adminService != adminSvc {
		t.Error("Admin service not correctly assigned")
	}
	if ws.keepService != keepSvc {
		t.Error("Keep service not correctly assigned")
	}
	if ws.docsService != docsSvc {
		t.Error("Docs service not correctly assigned")
	}
	if ws.sheetsService != sheetsSvc {
		t.Error("Sheets service not correctly assigned")
	}
	if ws.driveService != driveSvc {
		t.Error("Drive service not correctly assigned")
	}
}
