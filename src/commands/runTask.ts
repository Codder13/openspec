import * as vscode from "vscode";
import type { Task } from "../models/task";
import { buildContext, formatPrompt } from "../context/contextBuilder";

export async function runTask(task: Task): Promise<void> {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder open");
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    // Build context
    vscode.window.showInformationMessage(
      `Building context for task: ${task.title}`
    );
    const context = await buildContext(task, task.changeId, workspaceRoot);

    // Format prompt
    const prompt = formatPrompt(context, task.changeId);

    // Try to send to chat
    try {
      // Use the chat API to start a new chat with the prompt
      await vscode.commands.executeCommand("workbench.action.chat.open", {
        query: prompt,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      await vscode.env.clipboard.writeText(prompt);
      const action = await vscode.window.showInformationMessage(
        "Context copied to clipboard. Paste it into the chat that just opened.",
        "OK"
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to run task: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
