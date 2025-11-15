# OpenSpec VS Code Extension

The complimentary extension for using OpenSpec with VS Code.

## Features

### Task Execution with AI Chat

Run OpenSpec tasks directly from your `tasks.md` file with full context automatically injected into VS Code's AI chat.

**How it works:**

1. Open any `tasks.md` file in `openspec/changes/<change-id>/tasks.md`
2. You'll see a "▶️ Start task" or "🔵 Continue task" button above each task
3. Click the button to start an AI chat session with:
   - OpenSpec methodology (`AGENTS.md`)
   - Project conventions (`project.md`)
   - Change proposal (`proposal.md`)
   - Technical design (`design.md` if exists)
   - All spec deltas for the change
   - Previous tasks for context
   - The current task to implement

The AI assistant will have all the context needed to help you implement the task following OpenSpec conventions.

**Status Indicators:**
- ⚪ Not started: `- [ ]` Task not yet begun
- 🔵 In progress: `- [-]` or `- [~]` Currently working
- ✅ Completed: `- [x]` Finished

## Requirements

- VS Code 1.94.0 or higher
- OpenSpec-initialized workspace
- GitHub Copilot (recommended) or other AI chat extension

## Usage

1. Open a workspace with OpenSpec structure (`openspec/` directory)
2. Navigate to any `tasks.md` file in `openspec/changes/*/tasks.md`
3. Click the "▶️ Start task" CodeLens above any task
4. The AI chat will open with full context

If the Chat API is not available, the context will be copied to your clipboard - just paste it into your AI assistant.

## Extension Settings

This extension contributes the following settings:

* `openspec.showIndividualTaskButtons`: Enable/disable individual task run buttons. When set to `false`, only phase-level "Run entire phase" buttons are displayed for a cleaner view. (default: `true`)

### Customizing CodeLens Appearance

To change the font size of the CodeLens buttons (Start task, Run entire phase, etc.), adjust your VS Code settings:

1. Open Settings (Cmd+, or Ctrl+,)
2. Search for "editor.codeLens"
3. Adjust `editor.codeLensFontSize` to your preferred size (e.g., `12`, `14`, `16`)

Or add to your `settings.json`:
```json
{
  "editor.codeLensFontSize": 14,
  "openspec.showIndividualTaskButtons": false  // Optional: hide individual task buttons
}
```

## Known Issues

- First version MVP - more features coming soon
- Tree view for task navigation (planned)
- Task status toggling (planned)

## Release Notes

### 0.0.1

Initial MVP release:
- CodeLens "Run Task" buttons in tasks.md files
- Automatic context injection for AI chat
- Support for task status indicators

---

**Enjoy!**
