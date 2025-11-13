import * as vscode from "vscode";
import { parseTasksFile } from "../parsers/taskParser";
import type { Task } from "../models/task";

export class TaskDecorator {
  private taskDecorationType: vscode.TextEditorDecorationType;
  private completedDecorationType: vscode.TextEditorDecorationType;
  private inProgressDecorationType: vscode.TextEditorDecorationType;
  private phaseHeaderDecorationType: vscode.TextEditorDecorationType;
  private completedPhaseDecorationType: vscode.TextEditorDecorationType;

  constructor() {
    // Gray left border for not-started tasks
    this.taskDecorationType = vscode.window.createTextEditorDecorationType({
      borderWidth: "0 0 0 3px",
      borderStyle: "solid",
      borderColor: new vscode.ThemeColor("editorLineNumber.foreground"),
      isWholeLine: true,
    });

    // Green left border for completed tasks
    this.completedDecorationType = vscode.window.createTextEditorDecorationType(
      {
        borderWidth: "0 0 0 3px",
        borderStyle: "solid",
        borderColor: new vscode.ThemeColor("testing.iconPassed"),
        isWholeLine: true,
      }
    );

    // Blue left border for in-progress tasks
    this.inProgressDecorationType =
      vscode.window.createTextEditorDecorationType({
        borderWidth: "0 0 0 3px",
        borderStyle: "solid",
        borderColor: new vscode.ThemeColor("charts.blue"),
        isWholeLine: true,
      });

    // Gray background for phase headers (not complete)
    this.phaseHeaderDecorationType =
      vscode.window.createTextEditorDecorationType({
        borderWidth: "0 0 0 4px",
        borderStyle: "solid",
        borderColor: new vscode.ThemeColor("editorLineNumber.foreground"),
        isWholeLine: true,
        backgroundColor: new vscode.ThemeColor(
          "editor.lineHighlightBackground"
        ),
      });

    // Green background for completed phase headers
    this.completedPhaseDecorationType =
      vscode.window.createTextEditorDecorationType({
        borderWidth: "0 0 0 4px",
        borderStyle: "solid",
        borderColor: new vscode.ThemeColor("testing.iconPassed"),
        isWholeLine: true,
        backgroundColor: new vscode.ThemeColor(
          "editor.lineHighlightBackground"
        ),
      });
  }

  public updateDecorations(editor: vscode.TextEditor) {
    if (
      !editor.document.fileName.endsWith("tasks.md") ||
      !editor.document.fileName.includes("openspec/changes/")
    ) {
      return;
    }

    const changeIdMatch = editor.document.fileName.match(
      /openspec\/changes\/([^/]+)\/tasks\.md/
    );
    if (!changeIdMatch) {
      return;
    }

    const changeId = changeIdMatch[1];
    const content = editor.document.getText();
    const tasks = parseTasksFile(content, changeId);
    const lines = content.split("\n");

    const notStartedRanges: vscode.Range[] = [];
    const completedRanges: vscode.Range[] = [];
    const inProgressRanges: vscode.Range[] = [];
    const phaseHeaderRanges: vscode.Range[] = [];
    const completedPhaseRanges: vscode.Range[] = [];

    const processTask = (task: Task) => {
      const line = editor.document.lineAt(task.line);
      const range = new vscode.Range(
        new vscode.Position(task.line, 0),
        new vscode.Position(task.line, 0)
      );

      if (task.status === "completed") {
        completedRanges.push(range);
      } else if (task.status === "in-progress") {
        inProgressRanges.push(range);
      } else {
        notStartedRanges.push(range);
      }

      task.children.forEach(processTask);
    };

    tasks.forEach(processTask);

    // Detect phase headers and color them based on completion status
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^##\s+Phase\s+\d+:/)) {
        const phaseTasks = this.getTasksForPhase(tasks, i, lines);
        const allCompleted =
          phaseTasks.length > 0 &&
          phaseTasks.every((t) => t.status === "completed");
        const range = new vscode.Range(i, 0, i, line.length);

        if (allCompleted) {
          completedPhaseRanges.push(range);
        } else {
          phaseHeaderRanges.push(range);
        }
      }
    }

    editor.setDecorations(this.taskDecorationType, notStartedRanges);
    editor.setDecorations(this.completedDecorationType, completedRanges);
    editor.setDecorations(this.inProgressDecorationType, inProgressRanges);
    editor.setDecorations(this.phaseHeaderDecorationType, phaseHeaderRanges);
    editor.setDecorations(
      this.completedPhaseDecorationType,
      completedPhaseRanges
    );
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

  public dispose() {
    this.taskDecorationType.dispose();
    this.completedDecorationType.dispose();
    this.inProgressDecorationType.dispose();
    this.phaseHeaderDecorationType.dispose();
    this.completedPhaseDecorationType.dispose();
  }
}
