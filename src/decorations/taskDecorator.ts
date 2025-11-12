import * as vscode from "vscode";
import { parseTasksFile } from "../parsers/taskParser";
import type { Task } from "../models/task";

export class TaskDecorator {
  private taskDecorationType: vscode.TextEditorDecorationType;
  private completedDecorationType: vscode.TextEditorDecorationType;
  private inProgressDecorationType: vscode.TextEditorDecorationType;

  constructor() {
    // Gray text with left border for not-started tasks
    this.taskDecorationType = vscode.window.createTextEditorDecorationType({
      before: {
        contentText: "▶ Start task",
        color: new vscode.ThemeColor("editorCodeLens.foreground"),
        margin: "0 1em 0 0",
      },
      isWholeLine: true,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });

    // Green checkmark for completed
    this.completedDecorationType = vscode.window.createTextEditorDecorationType(
      {
        before: {
          contentText: "✓ Rerun task",
          color: new vscode.ThemeColor("testing.iconPassed"),
          margin: "0 1em 0 0",
        },
        isWholeLine: true,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      }
    );

    // Blue circle for in-progress
    this.inProgressDecorationType =
      vscode.window.createTextEditorDecorationType({
        before: {
          contentText: "● Continue task",
          color: new vscode.ThemeColor("charts.blue"),
          margin: "0 1em 0 0",
        },
        isWholeLine: true,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
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
    const tasks = parseTasksFile(editor.document.getText(), changeId);

    const notStartedRanges: vscode.Range[] = [];
    const completedRanges: vscode.Range[] = [];
    const inProgressRanges: vscode.Range[] = [];

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

    editor.setDecorations(this.taskDecorationType, notStartedRanges);
    editor.setDecorations(this.completedDecorationType, completedRanges);
    editor.setDecorations(this.inProgressDecorationType, inProgressRanges);
  }

  public dispose() {
    this.taskDecorationType.dispose();
    this.completedDecorationType.dispose();
    this.inProgressDecorationType.dispose();
  }
}
