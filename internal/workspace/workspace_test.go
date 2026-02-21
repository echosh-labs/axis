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
File: internal/workspace/workspace_test.go
Description: Unit tests for the Workspace service. Validates service initialization,
registry item consolidation, and Google API service wrapping logic.
*/
package workspace

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	admin "google.golang.org/api/admin/directory/v1"
	docs "google.golang.org/api/docs/v1"
	drive "google.golang.org/api/drive/v3"
	keep "google.golang.org/api/keep/v1"
	"google.golang.org/api/option"
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

func TestListRegistryItems(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/notes" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"notes": [{"name": "notes/1", "title": "Test Note", "trashed": false}]}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	ctx := context.Background()
	keepSvc, err := keep.NewService(ctx, option.WithEndpoint(ts.URL), option.WithoutAuthentication())
	if err != nil {
		t.Fatal(err)
	}

	ws := NewService(nil, keepSvc, nil, nil, nil)
	items, err := ws.ListRegistryItems()
	if err != nil {
		t.Fatal(err)
	}

	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].Title != "Test Note" {
		t.Errorf("expected title 'Test Note', got '%s'", items[0].Title)
	}
}
