package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"axis/internal/snipersbox"
	"axis/internal/workspace"
)

// Server handles UI delivery and API proxying
type Server struct {
	workspace     *workspace.Service
	user          *workspace.User
	sniperActions chan snipersbox.Action
}

// NoteResponse for JSON delivery
type NoteResponse struct {
	Notes []workspace.Note `json:"notes"`
}

// UserResponse provides minimal operator context for the UI.
type UserResponse struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	ID    string `json:"id"`
}

func (s *Server) handleListNotes(w http.ResponseWriter, r *http.Request) {
	notes, err := s.workspace.ListNotes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(NoteResponse{Notes: notes})
}

func (s *Server) handleNoteDetail(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	note, err := s.workspace.GetNote(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func (s *Server) handleUser(w http.ResponseWriter, r *http.Request) {
	if s.user == nil {
		http.Error(w, "user profile unavailable", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserResponse{Name: s.user.Name, Email: s.user.Email, ID: s.user.ID})
}

func (s *Server) handleSniperStream(w http.ResponseWriter, r *http.Request) {
	// 1. Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*") // For development

	// 2. Get a flusher
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	// 3. Create a channel for auction updates
	updates := make(chan snipersbox.AuctionState)

	// 4. Use request context to manage stream lifecycle
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	// 5. Start the mock data stream in a goroutine
	go func() {
		defer close(updates)
		if err := snipersbox.StreamMockData(ctx, updates, s.sniperActions, snipersbox.DefaultConfig()); err != nil {
			if err != context.Canceled {
				log.Printf("SSE stream error: %v", err)
			}
		}
	}()

	// 6. Loop and push updates to the client
	for state := range updates {
		data, err := json.Marshal(state)
		if err != nil {
			// This is an internal error, client will just see a closed connection
			log.Printf("Failed to marshal auction state: %v", err)
			return
		}
		fmt.Fprintf(w, "data: %s\n\n", data)
		flusher.Flush()
	}
}

func (s *Server) handleSniperBid(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var bidAction snipersbox.BidAction
	if err := json.NewDecoder(r.Body).Decode(&bidAction); err != nil {
		http.Error(w, "Invalid bid payload", http.StatusBadRequest)
		return
	}

	// Send the action to the stream.
	// This will block if the stream isn't ready, so we use a select with a timeout.
	select {
	case s.sniperActions <- snipersbox.Action{Type: "USER_BID", Payload: bidAction}:
		w.WriteHeader(http.StatusAccepted)
	case <-time.After(1 * time.Second):
		http.Error(w, "Bid not accepted; stream may not be active", http.StatusServiceUnavailable)
	}
}

func (s *Server) handleDeleteNote(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	err := s.workspace.DeleteNote(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// StartServer initializes the routes and begins listening for HTTP requests
func StartServer(ws *workspace.Service, user *workspace.User) {
	s := &Server{
		workspace:     ws,
		user:          user,
		sniperActions: make(chan snipersbox.Action, 1), // Buffered channel
	}

	http.HandleFunc("/api/notes", s.handleListNotes)
	http.HandleFunc("/api/notes/detail", s.handleNoteDetail)
	http.HandleFunc("/api/notes/delete", s.handleDeleteNote)
	http.HandleFunc("/api/user", s.handleUser)
	http.HandleFunc("/api/sniper", s.handleSniperStream)
	http.HandleFunc("/api/sniper/bid", s.handleSniperBid)

	// Serve static files (React build) from a web directory
	// Ensure this directory exists or adjust to your frontend build path
	fs := http.FileServer(http.Dir("./web/dist"))
	http.Handle("/", fs)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Axis Terminal active at http://localhost:%s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Printf("Server failed: %v\n", err)
	}
}
