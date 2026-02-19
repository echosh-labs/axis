package server

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAutomationHandlerAcceptsTask(t *testing.T) {
	calls := make(chan string, 1)
	s := &Server{
		mode:     "MANUAL",
		statuses: make(map[string]string),
		clients:  make(map[chan SSEMessage]bool),
		logger:   slog.New(slog.NewTextHandler(io.Discard, nil)),
		dispatch: func(task string) error {
			calls <- task
			return nil
		},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/automation/dispatch", s.handleAutomationTask)

	srv := httptest.NewServer(mux)
	defer srv.Close()

	body, err := json.Marshal(map[string]string{"task": "sample prompt"})
	if err != nil {
		t.Fatalf("failed to marshal request: %v", err)
	}

	resp, err := http.Post(srv.URL+"/api/automation/dispatch", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("post failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		t.Fatalf("expected 202 Accepted, got %d", resp.StatusCode)
	}

	select {
	case task := <-calls:
		if task != "sample prompt" {
			t.Fatalf("unexpected task forwarded: %s", task)
		}
	default:
		t.Fatal("dispatcher did not run")
	}
}
