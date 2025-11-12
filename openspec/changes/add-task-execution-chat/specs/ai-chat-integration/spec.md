## ADDED Requirements

### Requirement: Chat Session Creation

The extension SHALL create AI chat sessions with structured context via VS Code Chat API.

#### Scenario: Create chat with task context

- **WHEN** user triggers task execution
- **THEN** extension calls `vscode.chat.sendRequest()` with structured prompt
- **AND** chat panel opens in VS Code

#### Scenario: Handle chat API unavailable

- **WHEN** VS Code Chat API is not available (older VS Code version or no chat provider)
- **THEN** extension shows error message "Chat API unavailable"
- **AND** offers fallback: "Copy context to clipboard" button

### Requirement: Context Prompt Formatting

The extension SHALL format task context as structured markdown for AI comprehension.

#### Scenario: Structure context with clear sections

- **WHEN** building context prompt
- **THEN** prompt includes distinct markdown sections:
  - `# OpenSpec Task Execution Context`
  - `## OpenSpec Methodology` (AGENTS.md content)
  - `## Project Context` (project.md content)
  - `## Change Proposal` (proposal.md content)
  - `## Technical Design` (design.md content if exists)
  - `## Specification Deltas` (all spec deltas)
  - `## Previous Tasks` (upstream task list)
  - `## Current Task` (task details and requirements)
  - `## Instructions` (what AI should do)

#### Scenario: Include task-specific instructions

- **WHEN** formatting context prompt
- **THEN** final `## Instructions` section includes:
  - Instruction to implement the current task
  - Guidance to refer to previous tasks for context
  - Reminder to follow project conventions from project.md
  - Instruction to validate against spec requirements

#### Scenario: Format spec deltas by capability

- **WHEN** change has multiple spec deltas
- **THEN** each spec is formatted as subsection:
  - `### Spec: [capability-name]`
  - Followed by spec delta content

### Requirement: Context Token Management

The extension SHALL manage context size to avoid exceeding chat provider token limits.

#### Scenario: Estimate context token count

- **WHEN** building context
- **THEN** extension estimates token count (1 token ≈ 4 characters)
- **AND** logs token estimate to output channel

#### Scenario: Warn when context exceeds typical limits

- **WHEN** estimated token count > 80,000 tokens
- **THEN** extension shows warning notification
- **AND** suggests reducing context (e.g., exclude previous tasks)

#### Scenario: Truncate previous tasks if too large

- **WHEN** total context exceeds 100,000 tokens
- **THEN** extension truncates `## Previous Tasks` section
- **AND** includes only last 5 tasks instead of all
- **AND** adds note: "(Earlier tasks omitted due to context size)"

### Requirement: Chat Participant Routing

The extension SHALL route task execution context to appropriate chat participant.

#### Scenario: Use GitHub Copilot if available

- **WHEN** GitHub Copilot chat participant is available
- **THEN** extension sends request to `@copilot` participant
- **AND** uses `prompt` message type

#### Scenario: Fallback to generic chat

- **WHEN** GitHub Copilot is not available
- **THEN** extension sends request to default chat participant
- **AND** warns user that results may vary with different AI providers

### Requirement: Context Refresh

The extension SHALL support refreshing context during task execution.

#### Scenario: Refresh context command

- **WHEN** user invokes `OpenSpec: Refresh Task Context` during active chat
- **THEN** extension rebuilds context from latest file versions
- **AND** sends updated context to chat

#### Scenario: Detect file changes during task execution

- **WHEN** proposal.md, design.md, or spec files are edited during active chat
- **THEN** extension shows notification: "Context files changed"
- **AND** offers action: "Refresh Context"

### Requirement: Context Clipboard Fallback

The extension SHALL provide clipboard-based fallback when chat API fails.

#### Scenario: Copy context to clipboard

- **WHEN** chat API is unavailable or user chooses fallback
- **THEN** extension formats context as markdown
- **AND** copies to clipboard
- **AND** shows notification: "Context copied to clipboard. Paste into chat."

#### Scenario: Save context to temporary file

- **WHEN** user invokes `OpenSpec: Save Task Context to File`
- **THEN** extension creates temporary `.md` file with context
- **AND** opens file in editor for review
- **AND** file name includes task ID and timestamp

### Requirement: Chat History Tracking

The extension SHALL track chat sessions associated with tasks.

#### Scenario: Record chat session metadata

- **WHEN** task execution starts chat session
- **THEN** extension stores metadata in workspace state:
  - Task ID
  - Change ID
  - Chat session timestamp
  - Chat participant used

#### Scenario: Show recent task chats

- **WHEN** user invokes `OpenSpec: Show Recent Task Chats`
- **THEN** quick pick displays recent chat sessions
- **AND** selecting session reopens chat (if possible) or shows metadata

### Requirement: Multi-Task Chat Context

The extension SHALL support executing multiple tasks in sequence.

#### Scenario: Continue to next task

- **WHEN** user completes task and marks it done
- **AND** invokes `OpenSpec: Run Next Task`
- **THEN** extension finds next incomplete task
- **AND** creates new chat with context including completed task

#### Scenario: Include completed task in next context

- **WHEN** running next task after previous is complete
- **THEN** `## Previous Tasks` section includes completed task
- **AND** shows task status: "✅ 1.1 Task name [COMPLETED]"

### Requirement: Context Customization

The extension SHALL allow users to customize context inclusion.

#### Scenario: Configure context files via settings

- **WHEN** user opens extension settings
- **THEN** settings include options:
  - `openspec.context.includeAgentsMd` (default: true)
  - `openspec.context.includeProjectMd` (default: true)
  - `openspec.context.includeDesignMd` (default: true)
  - `openspec.context.includePreviousTasks` (default: true)
  - `openspec.context.maxPreviousTasks` (default: 10)

#### Scenario: Exclude design.md from context

- **WHEN** `openspec.context.includeDesignMd` is false
- **THEN** context builder skips design.md file
- **AND** context prompt does not include `## Technical Design` section
