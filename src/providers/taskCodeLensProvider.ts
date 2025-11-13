import * as vscode from "vscode";
import * as path from "node:path";
import { parseTasksFile, findTaskAtLine } from "../parsers/taskParser";
import { runTask } from "../commands/runTask";
import type { Task } from "../models/task";

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

      // Detect phase headers and collect their tasks
      const lines = document.getText().split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match phase headers: ## Phase N: Title
        const phaseMatch = line.match(/^##\s+(Phase\s+\d+:.*?)$/);
        if (phaseMatch) {
          const phaseTitle = phaseMatch[1];
          const phaseTasks = this.getTasksForPhase(tasks, i, lines);

          if (phaseTasks.length > 0) {
            const range = new vscode.Range(i, 0, i, 0);

            // Check if all tasks in the phase are completed (including nested children)
            const allCompleted = this.areAllTasksCompleted(phaseTasks);

            const title = allCompleted
              ? "$(check-all) Phase completed"
              : "$(run-all) Run entire phase";

            codeLenses.push(
              new vscode.CodeLens(range, {
                title: title,
                command: "openspec.runPhase",
                arguments: [phaseTasks],
              })
            );
          }
        }
      }

      // Helper to process tasks recursively
      const processTasks = (taskList: typeof tasks) => {
        for (const task of taskList) {
          const line = document.lineAt(task.line);
          const range = new vscode.Range(line.range.start, line.range.start);

          let title: string;
          if (task.status === "completed") {
            // Green checkmark for completed tasks
            title = "$(check) Task completed";
          } else if (task.status === "in-progress") {
            // Blue/gray for in-progress
            title = "$(debug-start) Continue task";
          } else {
            // Gray for not started
            title = "$(debug-start) Start task";
          }

          codeLenses.push(
            new vscode.CodeLens(range, {
              title: title,
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

  private getTasksForPhase(
    tasks: Task[],
    phaseLineNum: number,
    lines: string[]
  ): Task[] {
    const phaseTasks: Task[] = [];

    // Find the next phase header or end of file
    let endLine = lines.length;
    for (let i = phaseLineNum + 1; i < lines.length; i++) {
      if (lines[i].match(/^##\s+Phase\s+\d+:/)) {
        endLine = i;
        break;
      }
    }

    // Collect all tasks between this phase and the next
    const collectTasks = (taskList: Task[]) => {
      for (const task of taskList) {
        if (task.line > phaseLineNum && task.line < endLine) {
          phaseTasks.push(task);
        }
        if (task.children.length > 0) {
          collectTasks(task.children);
        }
      }
    };

    collectTasks(tasks);
    return phaseTasks;
  }

  private areAllTasksCompleted(phaseTasks: Task[]): boolean {
    // Recursively check if all tasks and their children are completed
    const checkTask = (task: Task): boolean => {
      if (task.status !== "completed") {
        return false;
      }
      // Check all children recursively
      return task.children.every((child) => checkTask(child));
    };

    return phaseTasks.length > 0 && phaseTasks.every((task) => checkTask(task));
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}
