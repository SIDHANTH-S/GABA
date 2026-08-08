# IPC Contract (Verified)

This document provides a complete inventory of the Inter-Process Communication (IPC) channels actually implemented and used in the current codebase.

*Source of truth: `apps/browser-shell/src/agent-core/ipc-handlers.ts` and `apps/browser-shell/src/preload.ts`.*

## 1. Browser Window & Navigation

| Channel | Type | Direction | Payload | Returns | Status |
|---------|------|-----------|---------|---------|--------|
| `browser:state-update` | Push | Main → Renderer | `BrowserState` | - | Active |
| `browser:navigate` | Invoke | Renderer → Main | `string` (url) | void | Active |
| `browser:reload` | Invoke | Renderer → Main | - | void | Active |
| `browser:stop` | Invoke | Renderer → Main | - | void | Active |
| `browser:openTab` | Invoke | Renderer → Main | `string?` (url) | void | Active |
| `browser:closeTab` | Invoke | Renderer → Main | `string` (id) | void | Active |
| `browser:activateTab` | Invoke | Renderer → Main | `string` (id) | void | Active |
| `browser:getState` | Invoke | Renderer → Main | - | `BrowserState` | Active |
| `browser:goBack` | Invoke | Renderer → Main | - | void | Active |
| `browser:goForward` | Invoke | Renderer → Main | - | void | Active |

## 2. Workspace & UI Overlays

| Channel | Type | Direction | Payload | Returns | Status |
|---------|------|-----------|---------|---------|--------|
| `browser:setBounds` | Invoke | Renderer → Main | `{ x, y, width, height }` | void | Active |
| `browser:setWorkspaceWidth` | Invoke | Renderer → Main | `width: number, save: boolean` | void | Active |
| `browser:toggleWorkspace` | Invoke | Renderer → Main | - | void | Active |
| `ui:toggle-command-bar` | Invoke | Renderer → Main | - | void | Active |
| `ui:dismiss-overlays` | Invoke | Renderer → Main | - | void | Active |
| `ui:set-overlay-visible` | Invoke | Renderer → Main | `{ name, visible }` | void | Active |

## 3. Page Context & AI Parsing

| Channel | Type | Direction | Payload | Returns | Status |
|---------|------|-----------|---------|---------|--------|
| `page:get-semantic-model` | Invoke | Renderer → Main | - | `SemanticPageModel` | Active |
| `page:subscribe-updates` | Push | Main → Renderer | `SemanticPageModel` | - | Active |
| `extract:page-data` | Invoke | Renderer → Main | `{ format: 'json' \| 'csv' }` | `{ content, path, format }` | Active |

## 4. AI Agent Pipeline & Execution

| Channel | Type | Direction | Payload | Returns | Status |
|---------|------|-----------|---------|---------|--------|
| `agent:run-task` | Invoke | Renderer → Main | `{ intent: string }` | `TaskPlan` | Active |
| `agent:task-progress` | Push | Main → Renderer | `TaskPlanUpdate` | - | Active |
| `agent:checkpoint-request` | Push | Main → Renderer | `CheckpointPayload` | - | Active |
| `agent:checkpoint-resolve` | Invoke | Renderer → Main | `{ id, approved }` | void | Active |

## 5. Memory & Profiles

| Channel | Type | Direction | Payload | Returns | Status |
|---------|------|-----------|---------|---------|--------|
| `memory:get-profile` | Invoke | Renderer → Main | - | `UserProfile` | Active |
| `memory:get-domain` | Invoke | Renderer → Main | `string` (domain) | `DomainMemory` | Active |
| `memory:set-profile` | Invoke | Renderer → Main | `Partial<UserProfile>` | void | Active |

## 6. Workflows

| Channel | Type | Direction | Payload | Returns | Status |
|---------|------|-----------|---------|---------|--------|
| `workflow:start-recording`| Invoke | Renderer → Main | `{ name, trigger }` | void | Active |
| `workflow:stop-recording` | Invoke | Renderer → Main | `{ name }` | `WorkflowRecording` | Active |
| `workflow:replay` | Invoke | Renderer → Main | `string` (workflowId) | `TaskPlan` | Active |
| `workflow:list` | Invoke | Renderer → Main | - | `WorkflowRecording[]` | Active |

## 7. Known Stubs / Scaffolded Channels

| Channel | Type | Direction | Payload | Returns | Status |
|---------|------|-----------|---------|---------|--------|
| `tabs:get-groups` | Invoke | Renderer → Main | - | `[]` (Empty Array) | **Stubbed** |
| `tabs:group-by-intent` | Invoke | Renderer → Main | - | `[]` (Empty Array) | **Stubbed** |

*Note: The `preload.ts` exposes two overlapping API objects: `window.browser` and `window.electronAPI`. While they share some functionality, both are currently active and used by different React components.*
