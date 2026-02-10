# axis-mundi

Unified command-center for Google Workspace automation and strategic triage.

## Features

* **Hybrid TUI**: Keyboard-centric React terminal for browser-based management.
* **Workspace Integration**: Native Go implementation for Google Keep and Admin Directory APIs.
* **Service Account Impersonation**: Secure delegation using domain-wide credentials.
* **Gemini AI Synthesis**: Integrated LLM analysis for note content and workspace summaries.
* **Dual Operation Modes**:
    * **AUTO**: Cyclical background retraction and telemetry monitoring.
    * **MANUAL**: Precise keyboard navigation, inspection, and object purging.

## Architecture

* **Backend**: Go (cmd/axis), `google.golang.org/api`.
* **Frontend**: React, Tailwind CSS, hosted via Go `net/http` server.
* **Intelligence**: Gemini 2.5 Flash API for agentic insights.

## Setup

1. Configure GCP Service Account with Domain-Wide Delegation and required scopes (`keep`, `admin.directory.user`).
2. Populate `.env` with:
    * `ADMIN_EMAIL`
    * `SERVICE_ACCOUNT_EMAIL`
    * `TEST_USER_EMAIL`
3. Execute `go mod tidy` to resolve dependencies.
4. Ensure `web/dist/index.html` contains the React TUI source.

## Interaction Schema

* **[A]**: Enable AUTO Mode (Background Polling).
* **[M]**: Enable MANUAL Mode (Keyboard Navigation).
* **[R]**: Trigger Manual Registry Refresh.
* **[Arrows]**: Navigate registry list.
* **[Enter/Space]**: Inspect raw object data.
* **[Delete]**: Purge selected object.
* **[Esc]**: Close detail view.