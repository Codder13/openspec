## ADDED Requirements

### Requirement: Task Parsing

The extension SHALL parse `tasks.md` files to extract task hierarchies, statuses, and metadata.

#### Scenario: Parse simple task list

- **WHEN** a `tasks.md` file contains markdown checkboxes with tasks
- **THEN** the parser extracts task title, status, line number, and indentation level

#### Scenario: Parse task with requirement references

- **WHEN** a task includes `_Requirements: 1.1, 2.3_` notation
- **THEN** the parser extracts the requirement IDs as an array

#### Scenario: Parse nested subtasks

- **WHEN** a task has indented subtasks beneath it
- **THEN** the parser creates a hierarchical tree with parent-child relationships

#### Scenario: Detect task status from checkbox

- **WHEN** a task has `- [ ]` checkbox
- **THEN** status is "not-started"
- **WHEN** a task has `- [x]` checkbox
- **THEN** status is "completed"
- **WHEN** a task has `- [-]` or `- [~]` checkbox
- **THEN** status is "in-progress"

### Requirement: AI Context Building

The extension SHALL build structured AI chat context from OpenSpec files for a given task.

#### Scenario: Build context for task in change

- **WHEN** user triggers task execution for a task in `changes/<id>/tasks.md`
- **THEN** context includes:
  - Content of `openspec/AGENTS.md`
  - Content of `openspec/project.md`
  - Content of `changes/<id>/proposal.md`
  - Content of `changes/<id>/design.md` (if exists)
  - Content of all `changes/<id>/specs/*/spec.md` files
  - List of tasks above current task (for dependency context)
  - Current task details

#### Scenario: Format context as structured prompt

- **WHEN** building context for AI chat
- **THEN** format as markdown with clear sections:
  - `## OpenSpec Methodology` (AGENTS.md)
  - `## Project Context` (project.md)
  - `## Change Proposal` (proposal.md)
  - `## Technical Design` (design.md, if exists)
  - `## Specification Deltas` (all spec.md files)
  - `## Previous Tasks` (completed and in-progress tasks)
  - `## Current Task` (task to implement)

#### Scenario: Handle missing optional files

- **WHEN** `design.md` does not exist for a change
- **THEN** context builder skips it without error
- **AND** other required files are still included

#### Scenario: Include requirement details from specs

- **WHEN** task references requirements (e.g., `_Requirements: 1.1, 2.3_`)
- **THEN** context includes the full text of those requirements from spec deltas

### Requirement: Task Execution Command

The extension SHALL provide a command to execute a task with AI chat context.

#### Scenario: Execute task via command palette

- **WHEN** user invokes `OpenSpec: Run Task` command
- **THEN** extension shows quick pick of all tasks from active changes
- **AND** selecting a task opens AI chat with full context

#### Scenario: Execute task via CodeLens

- **WHEN** user clicks "Start task" CodeLens above a task in tasks.md editor
- **THEN** AI chat opens with context for that specific task

#### Scenario: Execute task via tree view button

- **WHEN** user clicks ▶️ icon next to a task in OpenSpec Tasks tree view
- **THEN** AI chat opens with context for that task

#### Scenario: Handle chat API failure

- **WHEN** VS Code Chat API is unavailable or fails
- **THEN** extension shows error message
- **AND** offers fallback: "Copy context to clipboard"

### Requirement: Task Status Visualization

The extension SHALL display task status visually in editor and sidebar.

#### Scenario: Show task status in CodeLens

- **WHEN** viewing tasks.md in editor
- **THEN** CodeLens above each task shows status emoji:
  - ⚪ for not-started
  - 🔵 for in-progress
  - ✅ for completed

#### Scenario: Show task hierarchy in tree view

- **WHEN** OpenSpec Tasks view is visible in sidebar
- **THEN** tasks are displayed in collapsible tree structure
- **AND** parent tasks show progress badge (e.g., "2/5" for 2 of 5 subtasks done)

#### Scenario: Update tree view when tasks.md changes

- **WHEN** tasks.md file is edited and saved
- **THEN** tree view refreshes to reflect new task status

### Requirement: Task Navigation

The extension SHALL allow navigation to tasks from tree view and quick pick.

#### Scenario: Navigate to task from tree view

- **WHEN** user clicks a task in OpenSpec Tasks tree view
- **THEN** tasks.md file opens
- **AND** cursor moves to the task's line

#### Scenario: Filter tasks by status

- **WHEN** user clicks filter icon in tree view toolbar
- **THEN** quick pick shows filter options: All, Not Started, In Progress, Completed
- **AND** selecting a filter updates tree view to show only matching tasks

### Requirement: Change Detection

The extension SHALL detect active changes in the workspace.

#### Scenario: Discover active changes on activation

- **WHEN** extension activates in a workspace with OpenSpec structure
- **THEN** extension scans `openspec/changes/` directory
- **AND** identifies all subdirectories (excluding `archive/`) as active changes
- **AND** parses `tasks.md` for each change if present

#### Scenario: Show message when no changes found

- **WHEN** workspace has no `openspec/changes/` directory
- **THEN** OpenSpec Tasks view shows "No active changes" placeholder
- **AND** suggests running `openspec init` command

### Requirement: Task Status Updates

The extension SHALL allow updating task status via UI interactions.

#### Scenario: Toggle task status from tree view

- **WHEN** user clicks checkbox icon next to task in tree view
- **THEN** task status cycles: not-started → in-progress → completed → not-started
- **AND** tasks.md file is updated with new checkbox state

#### Scenario: Preserve task content when updating status

- **WHEN** task status is updated via tree view
- **THEN** only checkbox character is changed (`[ ]` → `[x]`)
- **AND** task description and indentation remain unchanged
