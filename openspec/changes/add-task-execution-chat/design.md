# Design: Task Execution with AI Chat Context

## Context

This change introduces AI-assisted task execution for OpenSpec changes. The goal is to enable developers to click a button next to any task in a `tasks.md` file and automatically start an AI chat session with all relevant context pre-loaded.

**Constraints:**
- Must work within VS Code Extension API limitations
- Should not introduce external dependencies (keep zero runtime deps)
- Must handle large context files efficiently (some spec deltas may be long)
- Need to parse markdown task lists without heavy parsing libraries
- VS Code Chat API may have context size limitations

**Stakeholders:**
- Developers using OpenSpec for spec-driven development
- AI assistants (GitHub Copilot, other chat providers)
- Extension users who want streamlined task-by-task implementation

## Goals / Non-Goals

**Goals:**
- Provide one-click task execution with full AI context
- Automatically gather all relevant OpenSpec files for a task
- Support both parent tasks and subtasks with proper hierarchy
- Show task status visually in editor and sidebar
- Make context injection work with VS Code's Chat API
- Keep implementation simple and maintainable (<500 lines total new code)

**Non-Goals:**
- Automatic task completion detection (developer marks tasks done manually)
- Task dependency resolution and enforcement (trust developer to follow order)
- Integration with external task management tools (Jira, Linear, etc.)
- Custom markdown parser (use simple regex patterns)
- Real-time collaboration on tasks (single-user workflow)
- Task time tracking or analytics

## Decisions

### Decision 1: Use VS Code Chat API for Context Injection

**Chosen Approach:** Use `vscode.chat.createChatSession()` and inject context via structured prompt.

**Why:**
- Native VS Code API, no external dependencies
- Works with GitHub Copilot and other chat providers
- Allows structured context formatting
- User can continue conversation after initial context

**Alternatives Considered:**
- Clipboard-based approach: Copy context to clipboard, user pastes into chat
  - ❌ Poor UX, requires manual paste step
- Custom webview panel with chat interface:
  - ❌ Duplicates VS Code chat UI, high maintenance burden
- Direct API calls to AI providers (OpenAI, Anthropic):
  - ❌ Requires API keys, costs, doesn't leverage VS Code's chat integrations

**Trade-offs:**
- ✅ Native integration with VS Code chat
- ✅ Works with user's configured AI provider
- ⚠️ Context size limited by provider's token limits (typically 100k+ tokens, should be sufficient)

### Decision 2: Simple Regex-Based Task Parsing

**Chosen Approach:** Use regex patterns to parse `tasks.md` for tasks and checkboxes.

**Why:**
- Tasks.md follows predictable format (seen in example)
- No need for full markdown AST parsing
- Keeps extension lightweight (no markdown parsing dependencies)
- Fast parsing even for large task lists

**Pattern Examples:**
```typescript
const taskPattern = /^(#+)\s+(.+)$/gm;              // Headers: ## Phase 1: ...
const itemPattern = /^(\s*)-\s+\[([x\s-~])\]\s+(.+)$/gm;  // Items: - [ ] Task
const reqPattern = /_Requirements:\s+([\d.]+(?:,\s*[\d.]+)*)/g;  // - _Requirements: 1.1, 2.3_
```

**Alternatives Considered:**
- Full markdown parser library (remark, marked):
  - ❌ Adds significant bundle size (~50kb+)
  - ❌ Overkill for simple task list parsing
- VS Code's built-in markdown parser:
  - ❌ Doesn't expose task checkbox state parsing
- Hand-written recursive descent parser:
  - ❌ More complex than needed for task lists

**Trade-offs:**
- ✅ Zero dependencies, tiny code footprint
- ✅ Fast parsing (O(n) single pass)
- ⚠️ Fragile if task format changes dramatically (acceptable risk, format is stable)

### Decision 3: Task Status via Checkbox State

**Chosen Approach:** Use standard markdown checkbox syntax with extension:
- `- [ ]` = Not started
- `- [x]` = Completed  
- `- [-]` or `- [~]` = In progress (optional convention)

**Why:**
- Standard markdown checkboxes render correctly in any markdown viewer
- No custom file format needed
- VS Code already supports checkbox toggling in markdown preview
- Simple to parse and update programmatically

**Alternatives Considered:**
- Custom YAML frontmatter in tasks.md:
  - ❌ Not visible in standard markdown renderers
  - ❌ Requires separate status tracking file
- Separate `.openspec-tasks.json` status file:
  - ❌ Can get out of sync with tasks.md
  - ❌ Not human-readable
- Comments in tasks.md (`<!-- status: in-progress -->`):
  - ❌ Clutters task list, hard to read

**Trade-offs:**
- ✅ Works with existing markdown tooling
- ✅ Human-readable task status at a glance
- ⚠️ In-progress status (`[-]`) not standard markdown (but renders fine as checked box)

### Decision 4: Context File Discovery via Convention

**Chosen Approach:** Follow OpenSpec directory conventions to find context files:

```
openspec/
├── AGENTS.md                           # Always include
├── project.md                          # Always include
└── changes/
    └── <change-id>/
        ├── proposal.md                 # Always include
        ├── design.md                   # Include if exists
        ├── tasks.md                    # Parse for current task
        └── specs/
            └── <capability>/
                └── spec.md             # Include all specs
```

**Why:**
- OpenSpec has established directory structure
- No configuration needed, works out of the box
- Predictable file locations make gathering context straightforward

**Alternatives Considered:**
- User configuration for context files:
  - ❌ Adds complexity, most users want standard context
- Analyze task content to determine relevant files:
  - ❌ Too complex, error-prone
- Include entire workspace:
  - ❌ Too much context, exceeds token limits

**Trade-offs:**
- ✅ Zero configuration, works immediately
- ✅ Consistent context across all tasks
- ⚠️ May include unnecessary specs (acceptable, better too much than too little)

### Decision 5: Tree View for Task Navigation

**Chosen Approach:** Implement custom Tree View Provider in VS Code sidebar.

**Why:**
- Native VS Code UI pattern for hierarchical data
- Supports rich interactions (click to navigate, inline buttons)
- Can show status icons and badges
- Doesn't require webview or custom rendering

**Structure:**
```
📁 OpenSpec Tasks
  └─ 📁 add-task-execution-chat
      ├─ 📄 Phase 1: Task Execution UI (2/5)
      │   ├─ ⚪ 1.1 Add CodeLens provider
      │   ├─ ✅ 1.2 Create task tree view
      │   └─ ⚪ 1.3 Add run task buttons
      └─ 📄 Phase 2: AI Chat Integration (0/3)
          ├─ ⚪ 2.1 Implement context builder
          └─ ⚪ 2.2 Integrate with chat API
```

**Alternatives Considered:**
- Custom webview with task list:
  - ❌ Requires HTML/CSS/JS, higher maintenance
  - ❌ Doesn't integrate with VS Code keybindings
- Quick Pick menu for task selection:
  - ❌ Can't show status persistently
  - ❌ Requires opening menu repeatedly
- Tree view in Explorer sidebar (contribute to Files view):
  - ❌ Clutters file explorer, not discoverable

**Trade-offs:**
- ✅ Native VS Code UI, familiar to users
- ✅ Persistent visibility of task status
- ⚠️ Requires separate view container (adds sidebar icon)

## Architecture

### Component Structure

```
src/
├── extension.ts                  # Entry point, register commands/views
├── commands/
│   └── runTask.ts               # Command: openspec.runTask
├── parsers/
│   └── taskParser.ts            # Parse tasks.md into task tree
├── context/
│   └── contextBuilder.ts        # Build AI chat context from files
├── providers/
│   ├── taskCodeLensProvider.ts  # CodeLens "Start task" in editor
│   └── taskTreeDataProvider.ts  # Tree view in sidebar
└── models/
    └── task.ts                  # Task, TaskStatus interfaces
```

### Data Flow

```
User clicks "Run Task"
    ↓
runTask command triggered
    ↓
taskParser.parseTasksFile() → Task[]
    ↓
contextBuilder.buildContext(task) → string
    ↓
vscode.chat.createChatSession({ context })
    ↓
AI chat opens with pre-loaded context
```

### Key Interfaces

```typescript
interface Task {
  id: string;                    // Unique ID (hash of content + line)
  title: string;                 // Task description
  status: TaskStatus;            // not-started | in-progress | completed
  level: number;                 // Indentation level (0 = parent, 1+ = sub)
  line: number;                  // Line number in tasks.md
  changeId: string;              // Parent change ID
  requirementRefs: string[];     // Extracted from _Requirements: 1.1, 2.3_
  children: Task[];              // Nested subtasks
}

type TaskStatus = "not-started" | "in-progress" | "completed";

interface TaskContext {
  agentsMd: string;              // openspec/AGENTS.md content
  projectMd: string;             // openspec/project.md content
  proposalMd: string;            // changes/<id>/proposal.md
  designMd?: string;             // changes/<id>/design.md (optional)
  specs: SpecDelta[];            // All spec deltas for change
  previousTasks: Task[];         // Tasks above current task (context)
  currentTask: Task;             // Task being executed
}

interface SpecDelta {
  capability: string;            // Spec name (e.g., "task-execution")
  content: string;               // Spec delta markdown content
}
```

## Risks / Trade-offs

### Risk: Context Size Exceeds Chat Token Limits

**Mitigation:**
- Estimate token count before sending (rough: 1 token ≈ 4 chars)
- If too large, truncate or omit less critical files (e.g., skip previous tasks)
- Show warning to user: "Context too large, some files omitted"
- Future: Add configuration to customize which files to include

**Likelihood:** Low (most changes have <50k tokens of context)

### Risk: Task Parsing Breaks with Format Changes

**Mitigation:**
- Document expected tasks.md format in AGENTS.md
- Add validation warnings when parsing fails
- Provide manual fallback: "Show raw context in new file" command
- Test parser with diverse task.md examples from openspec-model-development

**Likelihood:** Medium (format is stable but not enforced)

### Risk: VS Code Chat API Changes

**Mitigation:**
- Use stable VS Code API version (1.106+)
- Add error handling for API failures
- Fallback to clipboard-based context injection if chat API unavailable
- Monitor VS Code release notes for Chat API updates

**Likelihood:** Low (Chat API is stable as of 1.106)

### Risk: Performance with Large Task Lists

**Mitigation:**
- Lazy-load task tree nodes (don't parse all changes upfront)
- Cache parsed task trees with file watcher invalidation
- Limit tree view to 100 tasks max with pagination
- Profile with large openspec-model-development examples

**Likelihood:** Low (most changes have <50 tasks)

## Migration Plan

No migration needed. This is net-new functionality with no state to migrate.

**Rollout:**
1. Implement core task parsing and context building (no UI)
2. Add CodeLens provider for in-editor "Start task" buttons
3. Add tree view for task navigation
4. Add command palette commands for discoverability
5. Test with real OpenSpec changes from openspec-model-development
6. Release as v0.1.0 of extension

**Rollback:**
- Feature is opt-in (users must click "Run Task" to use)
- No persistent state or file modifications (besides checkbox updates)
- Can be disabled by removing commands from package.json contributes

## Open Questions

1. **Should we support custom task status labels beyond `[ ]`, `[x]`, `[-]`?**
   - Proposal: Keep simple for MVP, add custom labels if users request
   
2. **How to handle task dependencies (task 2 depends on task 1)?**
   - Proposal: Trust developer to follow tasks.md order, no enforcement for MVP
   
3. **Should we integrate with VS Code's built-in task system (`tasks.json`)?**
   - Proposal: No, OpenSpec tasks are documentation/AI-context, not build tasks
   
4. **What if change has multiple tasks.md files (unlikely but possible)?**
   - Proposal: Only parse `changes/<id>/tasks.md`, ignore others for MVP

5. **Should context include git diff of changes?**
   - Proposal: No for MVP, user can view diff separately in VS Code
   - Future: Add `--include-diff` flag to context builder
