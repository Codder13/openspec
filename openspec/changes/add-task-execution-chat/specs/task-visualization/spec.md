## ADDED Requirements

### Requirement: Task Tree View Container

The extension SHALL provide a dedicated view container for OpenSpec tasks.

#### Scenario: Show OpenSpec Tasks view in sidebar

- **WHEN** extension is activated
- **THEN** "OpenSpec Tasks" icon appears in activity bar
- **AND** clicking icon reveals tasks tree view

#### Scenario: Show placeholder when no changes

- **WHEN** OpenSpec Tasks view is opened in workspace without active changes
- **THEN** view shows "No active changes found" message
- **AND** shows button "Initialize OpenSpec" that runs `openspec init`

### Requirement: Task Tree Data Provider

The extension SHALL provide hierarchical task data to VS Code tree view.

#### Scenario: Group tasks by change

- **WHEN** workspace has multiple active changes
- **THEN** tree view shows top-level nodes for each change (e.g., "add-task-execution-chat")
- **AND** each change node is collapsible

#### Scenario: Show task phases and items

- **WHEN** change node is expanded
- **THEN** shows phase headers (e.g., "Phase 1: Task Execution UI")
- **AND** shows individual task items with status icons

#### Scenario: Show task progress in parent nodes

- **WHEN** parent task has subtasks
- **THEN** parent node shows progress badge (e.g., "2/5")
- **AND** progress is calculated as (completed subtasks / total subtasks)

#### Scenario: Update tree on file changes

- **WHEN** tasks.md file is modified and saved
- **THEN** tree view refreshes automatically via file watcher
- **AND** task statuses and structure reflect file changes

### Requirement: Task Tree Item Actions

The extension SHALL provide inline actions on tree items.

#### Scenario: Run task action

- **WHEN** hovering over a task in tree view
- **THEN** ▶️ (play) icon appears as inline action
- **AND** clicking icon executes `openspec.runTask` command with task context

#### Scenario: Toggle status action

- **WHEN** hovering over a task in tree view
- **THEN** checkbox icon appears as inline action
- **AND** clicking icon cycles task status: not-started → in-progress → completed

#### Scenario: Navigate to task action

- **WHEN** clicking task tree item (not inline action)
- **THEN** tasks.md file opens in editor
- **AND** cursor navigates to task line
- **AND** line is revealed and centered in viewport

### Requirement: Task Status Icons

The extension SHALL use consistent icons for task status visualization.

#### Scenario: Display not-started icon

- **WHEN** task has status "not-started"
- **THEN** tree item shows ⚪ (empty circle) icon

#### Scenario: Display in-progress icon

- **WHEN** task has status "in-progress"
- **THEN** tree item shows 🔵 (blue circle) icon
- **AND** icon has subtle animation (pulse or spin)

#### Scenario: Display completed icon

- **WHEN** task has status "completed"
- **THEN** tree item shows ✅ (checkmark) icon
- **AND** task text has strikethrough styling

### Requirement: Tree View Toolbar Actions

The extension SHALL provide toolbar actions for tree view.

#### Scenario: Refresh tree view action

- **WHEN** user clicks refresh icon in tree view toolbar
- **THEN** all changes are re-scanned from filesystem
- **AND** tree view updates with latest task data

#### Scenario: Filter tasks action

- **WHEN** user clicks filter icon in tree view toolbar
- **THEN** quick pick shows options: "All", "Not Started", "In Progress", "Completed"
- **AND** selecting option filters tree to show only matching tasks
- **AND** filter persists until changed or extension reloads

#### Scenario: Collapse all action

- **WHEN** user clicks collapse-all icon in tree view toolbar
- **THEN** all change nodes and task phases collapse
- **AND** only top-level change nodes remain visible

### Requirement: Tree Item Context Menu

The extension SHALL provide context menu actions for tree items.

#### Scenario: Copy task to clipboard

- **WHEN** user right-clicks task in tree view
- **THEN** context menu shows "Copy Task" option
- **AND** selecting it copies task title to clipboard

#### Scenario: Copy task with context

- **WHEN** user right-clicks task in tree view
- **THEN** context menu shows "Copy Task with Context" option
- **AND** selecting it copies full task context (all files) to clipboard

#### Scenario: Mark task complete

- **WHEN** user right-clicks task in tree view
- **THEN** context menu shows "Mark Complete" option (if not already completed)
- **AND** selecting it updates task checkbox to `[x]` in tasks.md

### Requirement: Tree View Performance

The extension SHALL render task tree efficiently for large changes.

#### Scenario: Lazy load subtasks

- **WHEN** change has many tasks (>50)
- **THEN** subtasks are loaded lazily when parent node expands
- **AND** initial tree render completes in <500ms

#### Scenario: Debounce file change events

- **WHEN** tasks.md file is modified multiple times rapidly
- **THEN** tree view refreshes at most once per 500ms
- **AND** avoids redundant filesystem reads

### Requirement: Tree View Workspace State

The extension SHALL persist tree view state across VS Code sessions.

#### Scenario: Remember expanded nodes

- **WHEN** user expands change nodes in tree view
- **AND** closes and reopens VS Code
- **THEN** previously expanded nodes remain expanded

#### Scenario: Remember active filter

- **WHEN** user applies task status filter
- **AND** closes and reopens VS Code
- **THEN** same filter remains active in tree view
