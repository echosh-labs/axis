/*
MIT License

Copyright (c) 2026 Justin Andrew Wood

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
File: internal/server/server_test.go
Description: Unit tests for Axis server API endpoints, focusing on the MCP-aligned
content retrieval and normalized status lifecycle (Pending, Execute, Complete).
*/
package server

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"axis/internal/database"
	"axis/internal/workspace"
)

func setupTestServer(t *testing.T) *Server {
	f, err := os.CreateTemp("", "test*.db")
	if err != nil {
		t.Fatal(err)
	}
	f.Close()

	db, err := database.NewDB(f.Name())
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() {
		db.Close()
		os.Remove(f.Name())
	})

	s := &Server{
		ws:       nil,
		db:       db,
		user:     &workspace.User{Name: "Test User", Email: "test@example.com", ID: "123"},
		mode:     "AUTO",
		statuses: make(map[string]string),
		clients:  make(map[chan SSEMessage]bool),
		logger:   slog.New(slog.NewJSONHandler(io.Discard, nil)),
	}
	return s
}

func TestHandleMode(t *testing.T) {
	s := setupTestServer(t)

	// Test GET (expect default AUTO from setup)
	req := httptest.NewRequest("GET", "/api/mode", nil)
	rr := httptest.NewRecorder()
	s.handleMode(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %v", rr.Code)
	}

	var resp ModeResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Mode != "AUTO" {
		t.Errorf("expected AUTO, got %s", resp.Mode)
	}

	// Test SET to MANUAL
	req = httptest.NewRequest("GET", "/api/mode?set=MANUAL", nil)
	rr = httptest.NewRecorder()
	s.handleMode(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %v", rr.Code)
	}
	if s.mode != "MANUAL" {
		t.Errorf("expected internal mode to update to MANUAL")
	}

	// Test SET to invalid mode
	req = httptest.NewRequest("GET", "/api/mode?set=INVALID", nil)
	rr = httptest.NewRecorder()
	s.handleMode(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid mode, got %v", rr.Code)
	}
}

func TestHandleUser(t *testing.T) {
	s := setupTestServer(t)
	req := httptest.NewRequest("GET", "/api/user", nil)
	rr := httptest.NewRecorder()

	s.handleUser(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %v", rr.Code)
	}

	var resp UserResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}

	if resp.Email != "test@example.com" {
		t.Errorf("expected test@example.com, got %s", resp.Email)
	}
}

func TestHandleStatus(t *testing.T) {
	s := setupTestServer(t)
	s.registryCache.items = []workspace.RegistryItem{
		{ID: "item-1", Title: "Test Item"},
	}

	req := httptest.NewRequest("POST", "/api/status?id=item-1&status=Complete", nil)
	rr := httptest.NewRecorder()
	s.handleStatus(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %v", rr.Code)
	}

	s.modeMu.RLock()
	status := s.statuses["item-1"]
	s.modeMu.RUnlock()

	if status != "Complete" {
		t.Errorf("expected status to be Complete, got %s", status)
	}

	// Invalid status
	req = httptest.NewRequest("POST", "/api/status?id=item-1&status=FakeStatus", nil)
	rr = httptest.NewRecorder()
	s.handleStatus(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid status, got %v", rr.Code)
	}
}
