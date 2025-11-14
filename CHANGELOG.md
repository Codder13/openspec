# Change Log

All notable changes to the "openspec" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.4] - 2025-11-14

### Added
- Phase heading detection now supports numbered headings like `## 1. Schema & Data Prep` in addition to "Phase N" titles.
- Shared `isPhaseHeading` helper exported from the parser for reuse across decorations and CodeLens providers.

### Changed
- Task parser, CodeLens provider, and visual decorators now rely on the shared helper so any heading style updates automatically apply everywhere.

## [0.0.3] - 2025-11-13

### Added
- **Run Phase command**: Execute all tasks in a phase at once with "Run entire phase" button
- **Visual task grouping**: Jira-style continuous colored bars on the left side of phases
  - Gray bars for incomplete phases
  - Green bars for completed phases (when all tasks are done)
  - Thicker bars (4px) for phase headers with subtle background highlighting
- **Phase completion indicators**: Phase headers show "Phase completed" with double-check icon when all tasks are done
- **Task status decorations**: Color-coded left borders for visual task tracking
- **AI context reminders**: Prompts now remind AI to update task status after completion
- **Configuration setting**: `openspec.showIndividualTaskButtons` to toggle individual task buttons on/off
- **Updated icons**: Cleaner check marks without background for completed items
  - Simple check mark for completed tasks
  - Double check mark for completed phases

### Changed
- CodeLens buttons now use cleaner icons (check mark without background)
- Improved phase detection to properly include all nested subtasks in completion check
- Continuous bars eliminate gaps between phases for better visual grouping
- README updated with configuration instructions for CodeLens font size and button visibility

### Fixed
- Phase completion now correctly checks all nested children tasks recursively
- Continuous bars no longer have gaps from CodeLens spacing
- Trailing empty lines properly trimmed to avoid visual gaps between phases

## [0.0.2] - 2025-11-13

### Added
- Extension icon (openspec_logo.png)
- Repository link to GitHub (https://github.com/Codder13/openspec)