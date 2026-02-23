// Copyright (c) 2026 Justin Andrew Wood. All rights reserved.
// This software is licensed under the AGPL-3.0.
// Commercial licensing is available at echosh-labs.com.
package database

import (
	"os"
	"testing"
)

func TestDB(t *testing.T) {
	dbPath := "test.db"
	defer os.Remove(dbPath)

	db, err := NewDB(dbPath)
	if err != nil {
		t.Fatalf("failed to create db: %v", err)
	}
	defer db.Close()

	// Test Mode
	if err := db.SetMode("MANUAL"); err != nil {
		t.Errorf("failed to set mode: %v", err)
	}
	mode, err := db.GetMode()
	if err != nil {
		t.Errorf("failed to get mode: %v", err)
	}
	if mode != "MANUAL" {
		t.Errorf("expected mode MANUAL, got %s", mode)
	}

	// Test Status
	if err := db.SetStatus("note-1", "Blocked"); err != nil {
		t.Errorf("failed to set status: %v", err)
	}
	statuses, err := db.GetStatuses()
	if err != nil {
		t.Errorf("failed to get statuses: %v", err)
	}
	if statuses["note-1"] != "Blocked" {
		t.Errorf("expected status Blocked, got %s", statuses["note-1"])
	}

	// Test Update Status
	if err := db.SetStatus("note-1", "Complete"); err != nil {
		t.Errorf("failed to update status: %v", err)
	}
	statuses, _ = db.GetStatuses()
	if statuses["note-1"] != "Complete" {
		t.Errorf("expected status Complete, got %s", statuses["note-1"])
	}

	// Test Delete Status
	if err := db.DeleteStatus("note-1"); err != nil {
		t.Errorf("failed to delete status: %v", err)
	}
	statuses, _ = db.GetStatuses()
	if _, exists := statuses["note-1"]; exists {
		t.Errorf("expected note-1 to be deleted")
	}
}
