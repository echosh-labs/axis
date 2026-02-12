package snipersbox

import (
	"context"
	"math"
	"math/rand"
	"time"
)

// AuctionState represents the live data emitted to the sniper's box widget.
type AuctionState struct {
	Item         string  `json:"item"`
	CurrentBid   float64 `json:"current_bid"`
	SecondsLeft  int     `json:"seconds_left"`
	IsProcessing bool    `json:"is_processing"`
}

// BidAction represents a user's intent to bid.
type BidAction struct {
	Amount float64 `json:"amount"`
}

// Action represents a command to manipulate the auction state.
type Action struct {
	Type    string
	Payload interface{}
}

// Config controls how the mock auction stream behaves.
type Config struct {
	Item                   string
	StartingBid            float64
	WindowSeconds          int
	CompetitorChance       float64
	CompetitorMinIncrement float64
	CompetitorMaxIncrement float64
}

// DefaultConfig returns sensible defaults that mirror the UI stub.
func DefaultConfig() Config {
	return Config{
		Item:                   "Vintage Lens",
		StartingBid:            145.50,
		WindowSeconds:          45,
		CompetitorChance:       0.2,
		CompetitorMinIncrement: 1,
		CompetitorMaxIncrement: 10,
	}
}

func (c Config) normalized() Config {
	defaults := DefaultConfig()
	if c.Item == "" {
		c.Item = defaults.Item
	}
	if c.StartingBid <= 0 {
		c.StartingBid = defaults.StartingBid
	}
	if c.WindowSeconds <= 0 {
		c.WindowSeconds = defaults.WindowSeconds
	}
	if c.CompetitorChance <= 0 {
		c.CompetitorChance = defaults.CompetitorChance
	}
	if c.CompetitorMinIncrement <= 0 {
		c.CompetitorMinIncrement = defaults.CompetitorMinIncrement
	}
	if c.CompetitorMaxIncrement <= 0 {
		c.CompetitorMaxIncrement = defaults.CompetitorMaxIncrement
	}
	if c.CompetitorMaxIncrement < c.CompetitorMinIncrement {
		c.CompetitorMaxIncrement = c.CompetitorMinIncrement
	}
	return c
}

// StreamMockData emits synthetic auction updates at one hertz until the
// countdown reaches zero or the context is canceled. The provided channel must
// be serviced by the caller to avoid blocking the stream.
func StreamMockData(ctx context.Context, updates chan<- AuctionState, actions <-chan Action, cfg Config) error {
	cfg = cfg.normalized()

	randSrc := rand.New(rand.NewSource(time.Now().UnixNano())) // local source prevents data races
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	state := AuctionState{
		Item:        cfg.Item,
		CurrentBid:  cfg.StartingBid,
		SecondsLeft: cfg.WindowSeconds,
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case action := <-actions:
			switch action.Type {
			case "USER_BID":
				if payload, ok := action.Payload.(BidAction); ok {
					state.CurrentBid = roundToCents(state.CurrentBid + payload.Amount)
					state.SecondsLeft = cfg.WindowSeconds // Reset timer on user bid
					state.IsProcessing = true             // Mark as processing to give feedback
				}
			}
		case <-ticker.C:
			if state.SecondsLeft == 0 {
				// Auction ended, we can stop the stream.
				return nil
			}

			state.SecondsLeft--
			state.IsProcessing = false

			if randSrc.Float64() < cfg.CompetitorChance {
				bump := cfg.CompetitorMinIncrement
				if cfg.CompetitorMaxIncrement > cfg.CompetitorMinIncrement {
					bump += randSrc.Float64() * (cfg.CompetitorMaxIncrement - cfg.CompetitorMinIncrement)
				}
				state.CurrentBid = roundToCents(state.CurrentBid + bump)
				state.IsProcessing = true
			}

			select {
			case <-ctx.Done():
				return ctx.Err()
			case updates <- state:
			}
		}
	}
}

func roundToCents(value float64) float64 {
	return math.Round(value*100) / 100
}
