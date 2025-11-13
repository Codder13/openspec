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
      // First, open a new chat session
      await vscode.commands.executeCommand("workbench.action.chat.newChat");
      // Small delay to ensure new chat is created
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Send the prompt to the new chat
      await vscode.commands.executeCommand("workbench.action.chat.open", {
        query: prompt,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      await vscode.env.clipboard.writeText(prompt);
      const action = await vscode.window.showInformationMessage(
        "Context copied to clipboard. Paste it into the chat.",
        "Open Chat"
      );
      if (action === "Open Chat") {
        await vscode.commands.executeCommand("workbench.action.chat.open");
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to run task: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
