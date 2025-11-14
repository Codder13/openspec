import * as vscode from "vscode";
import { parseTasksFile, isPhaseHeading } from "../parsers/taskParser";
import type { Task } from "../models/task";

export class TaskDecorator {
  private grayBarDecorationType: vscode.TextEditorDecorationType;
  private greenBarDecorationType: vscode.TextEditorDecorationType;
  private phaseHeaderDecorationType: vscode.TextEditorDecorationType;
  private completedPhaseHeaderDecorationType: vscode.TextEditorDecorationType;

  constructor() {
    // Gray left border for connecting bars and incomplete phases
    this.grayBarDecorationType = vscode.window.createTextEditorDecorationType({
      borderWidth: "0 0 0 3px",
      borderStyle: "solid",
      borderColor: new vscode.ThemeColor("editorLineNumber.foreground"),
      isWholeLine: true,
    });

    // Green left border for completed phases
    this.greenBarDecorationType = vscode.window.createTextEditorDecorationType({
      borderWidth: "0 0 0 3px",
      borderStyle: "solid",
      borderColor: new vscode.ThemeColor("testing.iconPassed"),
      isWholeLine: true,
    });

    // Phase header styling (not complete)
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

    // Completed phase header styling
    this.completedPhaseHeaderDecorationType =
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

    const grayBarRanges: vscode.Range[] = [];
    const greenBarRanges: vscode.Range[] = [];
    const phaseHeaderRanges: vscode.Range[] = [];
    const completedPhaseHeaderRanges: vscode.Range[] = [];

    // Detect phases and apply continuous bars
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isPhaseHeading(line)) {
        const phaseTasks = this.getTasksForPhase(tasks, i, lines);

        // Find the end of the phase (next phase header, next ## heading, or end of file)
        let endLine = lines.length - 1;
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].match(/^##\s+/)) {
            // Stop before the next heading
            endLine = j - 1;
            break;
          }
        }

        // Trim trailing empty lines to avoid gaps
        while (endLine > i && lines[endLine].trim() === "") {
          endLine--;
        }

        const allCompleted =
          phaseTasks.length > 0 &&
          phaseTasks.every((t) => t.status === "completed");

        // Apply bar to entire phase (header + all lines until next phase)
        for (let lineNum = i; lineNum <= endLine; lineNum++) {
          const range = new vscode.Range(lineNum, 0, lineNum, 0);

          if (lineNum === i) {
            // Phase header gets special treatment
            if (allCompleted) {
              completedPhaseHeaderRanges.push(range);
            } else {
              phaseHeaderRanges.push(range);
            }
          } else {
            // All other lines in the phase get the continuous bar
            if (allCompleted) {
              greenBarRanges.push(range);
            } else {
              grayBarRanges.push(range);
            }
          }
        }
      }
    }

    editor.setDecorations(this.grayBarDecorationType, grayBarRanges);
    editor.setDecorations(this.greenBarDecorationType, greenBarRanges);
    editor.setDecorations(this.phaseHeaderDecorationType, phaseHeaderRanges);
    editor.setDecorations(
      this.completedPhaseHeaderDecorationType,
      completedPhaseHeaderRanges
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
      if (isPhaseHeading(lines[i])) {
        endLine = i;
        break;
      }
    }

    // Collect all tasks between this phase and the next (including all nested children)
    const collectTasksRecursively = (task: Task) => {
      if (task.line > phaseLineNum && task.line < endLine) {
        phaseTasks.push(task);
      }
      // Always collect children recursively
      for (const child of task.children) {
        collectTasksRecursively(child);
      }
    };

    // Start from all top-level tasks
    for (const task of tasks) {
      collectTasksRecursively(task);
    }

    return phaseTasks;
  }

  public dispose() {
    this.grayBarDecorationType.dispose();
    this.greenBarDecorationType.dispose();
    this.phaseHeaderDecorationType.dispose();
    this.completedPhaseHeaderDecorationType.dispose();
  }
}
