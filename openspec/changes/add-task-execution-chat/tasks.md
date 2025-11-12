# Implementation Tasks

## Phase 1: Core Task Parsing (3-4 hours)

### 1.1 Create Task Data Models

- [ ] Create `src/models/task.ts`
- [ ] Define `Task` interface with id, title, status, level, line, changeId, requirementRefs, children
- [ ] Define `TaskStatus` type: "not-started" | "in-progress" | "completed"
- [ ] Define `TaskTree` interface for change-level task collections
- [ ] Add TypeScript strict type checking validation
- [ ] _Requirements: task-execution.1_

### 1.2 Implement Task Parser

- [ ] Create `src/parsers/taskParser.ts`
- [ ] Implement `parseTasksFile(content: string): Task[]` function
- [ ] Add regex patterns for:
  - Headers: `/^(#+)\s+(.+)$/gm` (phases)
  - Items: `/^(\s*)-\s+\[([x\s-~])\]\s+(.+)$/gm` (tasks)
  - Requirements: `/_Requirements:\s+([\d.]+(?:,\s*[\d.]+)*)/g`
- [ ] Build hierarchical task tree from flat markdown list
- [ ] Extract requirement references from task descriptions
- [ ] Generate unique task IDs (hash of line + content)
- [ ] _Requirements: task-execution.1_

### 1.3 Add Task Parser Tests

- [ ] Create `src/test/taskParser.test.ts`
- [ ] Test parsing simple task list (no nesting)
- [ ] Test parsing nested subtasks (indentation)
- [ ] Test extracting requirement references
- [ ] Test detecting status from checkboxes: [ ], [x], [-], [~]
- [ ] Test edge cases: empty file, malformed tasks, special characters
- [ ] _Requirements: task-execution.1_

### 1.4 Implement Change Discovery

- [ ] Create `src/parsers/changeDiscovery.ts`
- [ ] Implement `findActiveChanges(workspaceRoot: string): string[]`
- [ ] Scan `openspec/changes/` directory
- [ ] Exclude `archive/` subdirectory
- [ ] Return list of change IDs
- [ ] Handle missing openspec/ directory gracefully
- [ ] _Requirements: task-execution.6_

## Phase 2: Context Building (4-5 hours)

### 2.1 Create Context Builder

- [ ] Create `src/context/contextBuilder.ts`
- [ ] Define `TaskContext` interface
- [ ] Implement `buildContext(task: Task, changeId: string): Promise<TaskContext>`
- [ ] Read `openspec/AGENTS.md` content
- [ ] Read `openspec/project.md` content
- [ ] Read `changes/<changeId>/proposal.md` content
- [ ] Read `changes/<changeId>/design.md` content (if exists)
- [ ] Read all `changes/<changeId>/specs/*/spec.md` files
- [ ] Extract previous tasks (tasks above current task in tasks.md)
- [ ] _Requirements: task-execution.2_

### 2.2 Implement Context Prompt Formatter

- [ ] Create `src/context/promptFormatter.ts`
- [ ] Implement `formatPrompt(context: TaskContext): string`
- [ ] Create markdown structure with sections:
  - `# OpenSpec Task Execution Context`
  - `## OpenSpec Methodology`
  - `## Project Context`
  - `## Change Proposal`
  - `## Technical Design` (if design.md exists)
  - `## Specification Deltas` (all specs by capability)
  - `## Previous Tasks`
  - `## Current Task`
  - `## Instructions`
- [ ] Add task-specific instructions for AI
- [ ] _Requirements: ai-chat-integration.2_

### 2.3 Add Requirement Reference Resolution

- [ ] Enhance context builder to resolve requirement refs
- [ ] Parse `_Requirements: 1.1, 2.3_` notation from task
- [ ] Search spec deltas for matching requirement headers
- [ ] Extract full requirement text including scenarios
- [ ] Include in `## Current Task` section
- [ ] _Requirements: task-execution.2_

### 2.4 Implement Token Estimation

- [ ] Create `src/context/tokenEstimator.ts`
- [ ] Implement `estimateTokens(text: string): number` (1 token ≈ 4 chars)
- [ ] Add logging for token count estimates
- [ ] Warn when context > 80,000 tokens
- [ ] Truncate previous tasks if context > 100,000 tokens
- [ ] _Requirements: ai-chat-integration.3_

## Phase 3: AI Chat Integration (3-4 hours)

### 3.1 Implement Run Task Command

- [ ] Create `src/commands/runTask.ts`
- [ ] Implement `runTask(task: Task, changeId: string)` command handler
- [ ] Call context builder to get full context
- [ ] Format context as prompt
- [ ] Invoke VS Code Chat API: `vscode.chat.sendRequest()`
- [ ] Handle chat API errors gracefully
- [ ] _Requirements: task-execution.3, ai-chat-integration.1_

### 3.2 Add Chat API Error Handling

- [ ] Check if chat API is available before calling
- [ ] Show error notification if unavailable
- [ ] Provide fallback: "Copy context to clipboard"
- [ ] Implement clipboard fallback using `vscode.env.clipboard.writeText()`
- [ ] _Requirements: task-execution.3, ai-chat-integration.6_

### 3.3 Implement Chat Participant Routing

- [ ] Detect available chat participants
- [ ] Prefer GitHub Copilot (`@copilot`) if available
- [ ] Fallback to default chat participant
- [ ] Warn user if using non-Copilot provider
- [ ] _Requirements: ai-chat-integration.4_

### 3.4 Add Save Context to File Command

- [ ] Create `src/commands/saveContext.ts`
- [ ] Implement `OpenSpec: Save Task Context to File` command
- [ ] Build context for selected task
- [ ] Create temporary `.md` file in workspace temp directory
- [ ] Name file: `task-context-<taskId>-<timestamp>.md`
- [ ] Open file in editor
- [ ] _Requirements: ai-chat-integration.6_

## Phase 4: Tree View Implementation (5-6 hours)

### 4.1 Create Tree Data Provider

- [ ] Create `src/providers/taskTreeDataProvider.ts`
- [ ] Implement `vscode.TreeDataProvider<TaskTreeItem>`
- [ ] Implement `getChildren()` for hierarchical structure
- [ ] Implement `getTreeItem()` for node rendering
- [ ] Add file watcher for tasks.md changes
- [ ] Trigger refresh on file changes (debounced 500ms)
- [ ] _Requirements: task-visualization.2, task-visualization.7_

### 4.2 Create Tree Item Model

- [ ] Create `src/models/taskTreeItem.ts`
- [ ] Extend `vscode.TreeItem`
- [ ] Add properties: task, changeId, children
- [ ] Set icon based on task status (⚪, 🔵, ✅)
- [ ] Set description (progress badge for parent tasks)
- [ ] Set command for navigation on click
- [ ] _Requirements: task-visualization.2, task-visualization.4_

### 4.3 Register Tree View

- [ ] Update `src/extension.ts` to register tree view
- [ ] Create view container in package.json contributes
- [ ] Register `taskTreeDataProvider` with VS Code
- [ ] Add view ID: `openspec.tasksView`
- [ ] Add activity bar icon (choose appropriate codicon)
- [ ] _Requirements: task-visualization.1_

### 4.4 Add Tree View Placeholder

- [ ] Implement empty state when no changes found
- [ ] Show "No active changes found" message
- [ ] Add "Initialize OpenSpec" button
- [ ] Button runs `openspec init` in integrated terminal
- [ ] _Requirements: task-visualization.1_

### 4.5 Implement Tree Item Actions

- [ ] Add inline action: ▶️ Run Task (command: `openspec.runTask`)
- [ ] Add inline action: Checkbox Toggle (command: `openspec.toggleTaskStatus`)
- [ ] Add context menu: "Copy Task"
- [ ] Add context menu: "Copy Task with Context"
- [ ] Add context menu: "Mark Complete"
- [ ] _Requirements: task-visualization.3, task-visualization.6_

### 4.6 Add Tree Toolbar Actions

- [ ] Add toolbar action: Refresh (command: `openspec.refreshTasks`)
- [ ] Add toolbar action: Filter (command: `openspec.filterTasks`)
- [ ] Add toolbar action: Collapse All (command: `openspec.collapseAllTasks`)
- [ ] Implement filter quick pick: All, Not Started, In Progress, Completed
- [ ] Store filter state in workspace state
- [ ] _Requirements: task-visualization.5_

### 4.7 Persist Tree View State

- [ ] Save expanded nodes to workspace state on collapse/expand
- [ ] Restore expanded nodes on extension activation
- [ ] Save active filter to workspace state
- [ ] Restore filter on activation
- [ ] _Requirements: task-visualization.8_

## Phase 5: CodeLens Integration (2-3 hours)

### 5.1 Create CodeLens Provider

- [ ] Create `src/providers/taskCodeLensProvider.ts`
- [ ] Implement `vscode.CodeLensProvider`
- [ ] Parse tasks.md when opened in editor
- [ ] Provide CodeLens above each task line
- [ ] CodeLens text: "▶️ Start task" for not-started, "🔵 Continue task" for in-progress
- [ ] CodeLens command: `openspec.runTask` with task context
- [ ] _Requirements: task-execution.3, task-execution.4_

### 5.2 Register CodeLens Provider

- [ ] Update `src/extension.ts` to register CodeLens provider
- [ ] Register for `tasks.md` files: `**/openspec/changes/*/tasks.md`
- [ ] Add package.json activation event: `onLanguage:markdown`
- [ ] _Requirements: task-execution.4_

### 5.3 Add Status Emoji to CodeLens

- [ ] Show status emoji in CodeLens text:
  - ⚪ for not-started
  - 🔵 for in-progress
  - ✅ for completed
- [ ] Update CodeLens on file changes (file watcher)
- [ ] _Requirements: task-execution.4_

## Phase 6: Task Status Updates (2-3 hours)

### 6.1 Implement Toggle Task Status Command

- [ ] Create `src/commands/toggleTaskStatus.ts`
- [ ] Implement status cycle: not-started → in-progress → completed → not-started
- [ ] Find task line in tasks.md
- [ ] Replace checkbox: `[ ]` → `[-]` → `[x]` → `[ ]`
- [ ] Preserve task description and indentation
- [ ] Update file via VS Code workspace edit API
- [ ] _Requirements: task-execution.7_

### 6.2 Add Mark Complete Command

- [ ] Create `src/commands/markTaskComplete.ts`
- [ ] Find task line in tasks.md
- [ ] Set checkbox to `[x]`
- [ ] Update file and refresh tree view
- [ ] _Requirements: task-execution.7, task-visualization.6_

### 6.3 Handle Subtask Status Propagation

- [ ] When all subtasks marked complete, suggest marking parent complete
- [ ] Show notification: "All subtasks complete. Mark parent task complete?"
- [ ] Add action buttons: "Yes" / "No"
- [ ] Update parent task checkbox if user confirms
- [ ] _Requirements: task-execution.7_

## Phase 7: Commands and Palette Integration (2-3 hours)

### 7.1 Register Core Commands

- [ ] Add `openspec.runTask` command to package.json
- [ ] Add `openspec.refreshTasks` command
- [ ] Add `openspec.filterTasks` command
- [ ] Add `openspec.toggleTaskStatus` command
- [ ] Add `openspec.markTaskComplete` command
- [ ] Add `openspec.saveTaskContext` command
- [ ] Add appropriate activation events

### 7.2 Add Quick Pick Task Selection

- [ ] Implement `OpenSpec: Run Task` command with quick pick
- [ ] List all tasks from all active changes
- [ ] Show change ID as quick pick item detail
- [ ] Show status icon in quick pick label
- [ ] Filter out completed tasks (optional)
- [ ] _Requirements: task-execution.3_

### 7.3 Add Copy Context Commands

- [ ] Implement `OpenSpec: Copy Task Context to Clipboard`
- [ ] Show quick pick to select task
- [ ] Build context and copy to clipboard
- [ ] Show success notification
- [ ] _Requirements: ai-chat-integration.6_

### 7.4 Add Refresh Context Command

- [ ] Implement `OpenSpec: Refresh Task Context`
- [ ] Check if active chat session exists
- [ ] Rebuild context from latest files
- [ ] Send updated context to chat
- [ ] _Requirements: ai-chat-integration.5_

## Phase 8: Configuration and Settings (1-2 hours)

### 8.1 Add Extension Settings

- [ ] Add `openspec.context.includeAgentsMd` (default: true)
- [ ] Add `openspec.context.includeProjectMd` (default: true)
- [ ] Add `openspec.context.includeDesignMd` (default: true)
- [ ] Add `openspec.context.includePreviousTasks` (default: true)
- [ ] Add `openspec.context.maxPreviousTasks` (default: 10)
- [ ] Add `openspec.context.tokenWarningThreshold` (default: 80000)
- [ ] _Requirements: ai-chat-integration.9_

### 8.2 Apply Settings in Context Builder

- [ ] Read settings in context builder
- [ ] Skip files based on include settings
- [ ] Limit previous tasks based on maxPreviousTasks setting
- [ ] Show warning based on tokenWarningThreshold
- [ ] _Requirements: ai-chat-integration.9_

## Phase 9: Error Handling and Edge Cases (2-3 hours)

### 9.1 Handle Missing OpenSpec Structure

- [ ] Detect missing `openspec/` directory
- [ ] Show helpful error message
- [ ] Suggest running `openspec init`
- [ ] Disable commands gracefully when not in OpenSpec workspace

### 9.2 Handle Malformed tasks.md

- [ ] Catch parsing errors in task parser
- [ ] Show error notification with details
- [ ] Log parse errors to output channel
- [ ] Gracefully skip malformed tasks

### 9.3 Handle Missing Context Files

- [ ] Check if required files exist before reading
- [ ] Show warning if proposal.md missing
- [ ] Skip optional files (design.md) without error
- [ ] Provide partial context if some files missing

### 9.4 Handle File Read Errors

- [ ] Wrap file reads in try-catch
- [ ] Show error notification on file read failure
- [ ] Log errors to output channel
- [ ] Provide fallback context when possible

## Phase 10: Testing and Polish (3-4 hours)

### 10.1 Add Unit Tests

- [ ] Test task parser with various markdown formats
- [ ] Test context builder with mock file system
- [ ] Test prompt formatter output
- [ ] Test token estimator accuracy
- [ ] Achieve >80% code coverage

### 10.2 Add Integration Tests

- [ ] Test end-to-end task execution flow
- [ ] Test tree view data provider with mock tasks
- [ ] Test CodeLens provider with mock editor
- [ ] Test command registration and execution

### 10.3 Manual Testing Checklist

- [ ] Test with openspec-model-development example tasks
- [ ] Verify tree view renders correctly
- [ ] Verify CodeLens appears in tasks.md editor
- [ ] Verify run task opens chat with context
- [ ] Verify status updates persist to file
- [ ] Test with multiple active changes
- [ ] Test with no active changes (empty state)
- [ ] Test filter and toolbar actions
- [ ] Test keyboard navigation in tree view

### 10.4 Performance Testing

- [ ] Test with large tasks.md (>100 tasks)
- [ ] Measure tree view render time
- [ ] Measure context building time
- [ ] Optimize slow operations if needed

### 10.5 Documentation

- [ ] Update README.md with task execution feature
- [ ] Add screenshots of tree view and CodeLens
- [ ] Document commands in command palette
- [ ] Add usage examples
- [ ] Document extension settings

## Phase 11: Deployment (1-2 hours)

### 11.1 Package Extension

- [ ] Run `pnpm run package` to build production bundle
- [ ] Verify bundle size is reasonable (<500kb)
- [ ] Test packaged extension in clean VS Code instance
- [ ] Verify all features work in production build

### 11.2 Create Release

- [ ] Update CHANGELOG.md with new features
- [ ] Bump version in package.json (e.g., 0.1.0)
- [ ] Create git tag for release
- [ ] Push to GitHub repository

### 11.3 Publish to VS Code Marketplace (Optional)

- [ ] Create publisher account (if not exists)
- [ ] Configure package.json with publisher info
- [ ] Run `vsce publish` to publish extension
- [ ] Verify extension appears in marketplace

---

## Dependencies and Blockers

**Prerequisites:**
- VS Code 1.106+ (for Chat API)
- OpenSpec CLI installed and workspace initialized
- TypeScript 5.9+ and webpack build working

**External Dependencies:**
- VS Code Chat API (may not be available on older VS Code versions)
- GitHub Copilot (optional, for best AI experience)

**Team Dependencies:**
- None (single developer can complete all tasks)

---

## Estimated Time Breakdown

| Phase                           | Hours  |
| ------------------------------- | ------ |
| Phase 1: Core Task Parsing      | 3-4    |
| Phase 2: Context Building       | 4-5    |
| Phase 3: AI Chat Integration    | 3-4    |
| Phase 4: Tree View              | 5-6    |
| Phase 5: CodeLens Integration   | 2-3    |
| Phase 6: Task Status Updates    | 2-3    |
| Phase 7: Commands and Palette   | 2-3    |
| Phase 8: Configuration          | 1-2    |
| Phase 9: Error Handling         | 2-3    |
| Phase 10: Testing and Polish    | 3-4    |
| Phase 11: Deployment            | 1-2    |
| **Total**                       | **28-39 hours** |

**Timeline**: 1-2 weeks for single developer

---

## Success Criteria

- [ ] Tree view shows all tasks from active changes
- [ ] Run task button creates AI chat with full context
- [ ] Context includes AGENTS.md, project.md, proposal.md, design.md, specs
- [ ] CodeLens appears above tasks in editor
- [ ] Task status updates persist to tasks.md
- [ ] Filter and toolbar actions work correctly
- [ ] Extension works with openspec-model-development examples
- [ ] No errors or warnings in extension host log
- [ ] All unit and integration tests passing
- [ ] Documentation complete and accurate
