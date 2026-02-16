# axis-mundi

A high-performance command-center and connectivity bridge between Google Gemini voice interfaces and Google Workspace orchestration. Axis Mundi serves as the ingestion and triage layer for voice-generated data.

## Core Connectivity

* **Gemini Voice Bridge**: Acts as a functional uplink between personal mobile devices (via Google Gemini) and professional Workspace accounts.

* **Voice-to-Keep Ingestion**: Captures spoken directives through personal Gemini interfaces, automatically generating Google Keep notes for system ingestion.

* **Orchestration Interface**: Provides a high-speed TUI for the management, inspection, and execution of voice-driven tasks.

## Features

* **Hybrid TUI**: Keyboard-centric React terminal for rapid object management.

* **Real-Time Uplink**: Server-Sent Events (SSE) for zero-latency registry updates.

* **State Persistence**: Server-side tracking of task lifecycles and operational modes.

* **Service Account Impersonation**: Secure delegation using domain-wide credentials.

## Interaction Schema

### Task Lifecycle Status

* **Pending**: Initial state of ingested voice notes awaiting triage.

* **Execute**: Directive approved for automation or manual processing.

* **Complete**: Task finalized and archived within the Workspace environment.

### Controls

* `[PageUp/PageDown]`: Cycle status (Pending → Execute → Complete).

* `[A]`: Enable AUTO Mode (Background Monitoring).

* `[M]`: Enable MANUAL Mode (Interactive Control).

* `[Arrows]`: Navigate registry list.

* `[Enter/Space]`: Inspect note payload.

* `[Delete]`: Purge note from registry.

## Setup

### Prerequisites

* Go 1.24+

* Node.js 18+

* GCP Service Account with Domain-Wide Delegation for Keep, Admin Directory, Docs, Sheets, and Drive.

## Environment

Configure `.env` in the root directory with the appropriate administrative and service account credentials: