# axis-mundi

Unified command-center for Google Workspace automation and strategic triage.

## Features

- **Hybrid TUI**: Keyboard-centric React terminal for browser-based management.
- **Real-Time Uplink**: Server-Sent Events (SSE) for zero-latency registry updates in `AUTO` mode.
- **State Persistence**: Server-side state tracking ensures operational mode survival across restarts.
- **Workspace Integration**: Native Go implementation for Google Workspace APIs.
- **Service Account Impersonation**: Secure delegation using domain-wide credentials.

### Dual Operation Modes

- **AUTO**: Continuous background retraction and telemetry monitoring via SSE.
- **MANUAL**: Precise keyboard navigation, inspection, and object purging.

## Architecture

- **Backend**: Go (1.24+)
  - **Entry**: `cmd/axis`
  - **Logic**: `internal/server` (HTTP/SSE), `internal/workspace` (Google APIs).
- **Frontend**: React + Vite + Tailwind CSS
  - **Source**: `web/src`
  - **Build**: `web/dist` (Served statically by Go).

## Setup

### Prerequisites

- Go 1.24+
- Node.js 18+ (for frontend build)
- GCP Service Account with Domain-Wide Delegation (`keep`, `admin.directory.user`).

### Environment

Populate `.env` in the root directory:

```env
ADMIN_EMAIL=admin@example.com
SERVICE_ACCOUNT_EMAIL=axis-agent@project-id.iam.gserviceaccount.com
USER_EMAIL=target-user@example.com
PORT=8080
```

### Installation

1. **Build Frontend**:
   ```bash
   cd web
   npm install
   npm run build
   cd ..
   ```

2. **Start Backend**:
   ```bash
   go mod tidy
   go run ./cmd/axis
   ```

3. **Access**: Navigate to [http://localhost:8080](http://localhost:8080).

## Development

For rapid UI development with Hot Module Replacement (HMR):

1. **Start Backend** (Terminal 1):
   ```bash
   go run ./cmd/axis
   ```

2. **Start Frontend Proxy** (Terminal 2):
   ```bash
   cd web && npm run dev
   ```

3. **Access** via [http://localhost:5173](http://localhost:5173).

## Interaction Schema

- `[A]`: Enable AUTO Mode (Background Streaming).
- `[M]`: Enable MANUAL Mode (Interactive Control).
- `[R]`: Trigger Manual Registry Refresh.
- `[Arrows]`: Navigate registry list.
- `[Enter/Space]`: Inspect raw object data.
- `[Delete]`: Purge selected object.
- `[Esc]`: Close detail view.