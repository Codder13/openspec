# Change: Add Task Execution with AI Chat Context

## Why

The OpenSpec extension currently lacks a critical feature that Kiro provides: the ability to execute individual tasks from a change proposal directly within VS Code with full AI context. Currently, developers must:

1. Manually read through `proposal.md`, `design.md`, `tasks.md`, and related specs
2. Context-switch between documentation and implementation
3. Manually provide context to AI assistants when working on tasks
4. Track task completion status separately from the task list

This creates friction in the implementation workflow and reduces the effectiveness of AI-assisted development. By adding task execution buttons that automatically:
- Start a new AI chat session
- Inject relevant context (AGENTS.md, project.md, proposal.md, design.md, specs)
- Include the specific task being worked on
- Provide upstream task context for dependencies

We enable developers to work more efficiently with AI assistance while maintaining spec-driven development practices.

## What Changes

### 1. Task Execution UI in Tasks View

- Add "Run Task" button (▶️ play icon) next to each task and subtask in the tasks.md preview
- Add "Start task" CodeLens above each task in the markdown editor
- Show task status indicators (not-started, in-progress, completed) based on checkbox state
- Render task hierarchy visually (parent tasks and subtasks)

### 2. AI Chat Context Injection

When "Run Task" is clicked:
- Create new AI chat session (using VS Code Chat API)
- Inject structured context prompt containing:
  - `openspec/AGENTS.md` - OpenSpec methodology instructions
  - `openspec/project.md` - Project conventions and tech stack
  - `changes/<change-id>/proposal.md` - Why and what is changing
  - `changes/<change-id>/design.md` - Technical decisions (if exists)
  - `changes/<change-id>/specs/*/spec.md` - All spec deltas for the change
  - Previous task content - Tasks above the current one for context
  - Current task details - The specific task to implement
- Format context as structured markdown with clear sections
- Include task requirements from spec deltas (search for referenced requirement IDs)

### 3. Task Status Tracking

- Parse `tasks.md` checkbox state (`- [ ]`, `- [x]`) to determine status
- Show visual indicators in task list view:
  - ⚪ Not started: `- [ ]`
  - 🔵 In progress: `- [-]` or `- [~]` (convention to add)
  - ✅ Completed: `- [x]`
- Allow toggling task status via UI interactions
- Update `tasks.md` file when status changes

### 4. Task Navigation and Discovery

- Add "OpenSpec: Show Tasks" command to command palette
- Create dedicated Tasks view in VS Code sidebar
- Show all tasks from active changes in a tree view
- Support filtering by status (show all, only incomplete, only in-progress)
- Click task to jump to location in tasks.md

## Impact

### Affected Capabilities

- **task-execution** (new) - Execute tasks with AI chat context
- **task-visualization** (new) - Visual task list with status indicators
- **ai-chat-integration** (new) - Structured context injection for AI assistants

### Affected Files

**Extension Core**:
- `src/extension.ts` - Register commands and views
- `src/taskExecution.ts` (new) - Task execution logic and chat integration
- `src/taskParser.ts` (new) - Parse tasks.md and extract task structure
- `src/contextBuilder.ts` (new) - Build AI chat context from OpenSpec files

**UI Components**:
- `src/views/taskTreeView.ts` (new) - Sidebar tree view for tasks
- `src/views/taskDecorations.ts` (new) - Editor decorations for task status
- `src/providers/taskCodeLensProvider.ts` (new) - CodeLens "Start task" buttons

**VS Code Configuration**:
- `package.json` - Add commands, views, and activation events

### Breaking Changes

None. This is purely additive functionality.

## User Experience Impact

**Before**:
- Developers manually read all context files
- Copy-paste content into AI chat sessions
- Track task status mentally or in external tools
- No clear workflow for task-by-task implementation

**After**:
- Click "Run Task" button to start AI-assisted implementation
- All relevant context automatically injected into chat
- Visual task list shows progress at a glance
- Clear workflow: review → execute → complete → archive

## Success Criteria

1. "Run Task" button appears next to each task in tasks.md preview
2. Clicking button creates new AI chat with full context
3. Chat context includes AGENTS.md, project.md, proposal.md, design.md, specs
4. Current task and upstream tasks included in context
5. Task status indicators show in editor and tree view
6. Tasks view in sidebar displays all active change tasks
7. Task completion can be tracked via checkbox updates
8. Context is well-formatted and easy for AI to parse
9. Works with both parent tasks and subtasks
10. No performance issues when loading large task lists
