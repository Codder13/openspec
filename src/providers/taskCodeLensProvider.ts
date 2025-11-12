import * as vscode from "vscode";
import * as path from "node:path";
import { parseTasksFile, findTaskAtLine } from "../parsers/taskParser";
import { runTask } from "../commands/runTask";

export class TaskCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  public provideCodeLenses(
    document: vscode.TextDocument
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    // Only provide CodeLens for tasks.md files in openspec/changes/*/
    if (
      !document.fileName.includes("openspec/changes/") ||
      !document.fileName.endsWith("tasks.md")
    ) {
      return [];
    }

    try {
      // Extract change ID from path
      const changeIdMatch = document.fileName.match(
        /openspec\/changes\/([^/]+)\/tasks\.md/
      );
      if (!changeIdMatch) {
        return [];
      }
      const changeId = changeIdMatch[1];

      // Parse tasks
      const tasks = parseTasksFile(document.getText(), changeId);
      const codeLenses: vscode.CodeLens[] = [];

      // Helper to process tasks recursively
      const processTasks = (taskList: typeof tasks) => {
        for (const task of taskList) {
          const line = document.lineAt(task.line);
          const range = new vscode.Range(line.range.start, line.range.start);

          const statusIcon =
            task.status === "completed"
              ? "✓"
              : task.status === "in-progress"
              ? "●"
              : "▶";
          const actionText =
            task.status === "completed"
              ? "Rerun task"
              : task.status === "in-progress"
              ? "Continue task"
              : "Start task";

          const icon =
            task.status === "completed" ? "$(check)" : "$(debug-start)";

          codeLenses.push(
            new vscode.CodeLens(range, {
              title: `${icon} ${actionText}`,
              command: "openspec.runTask",
              arguments: [task],
            })
          );

          // Process children
          if (task.children.length > 0) {
            processTasks(task.children);
          }
        }
      };

      processTasks(tasks);
      return codeLenses;
    } catch (error) {
      console.error("Error providing CodeLens:", error);
      return [];
    }
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}
