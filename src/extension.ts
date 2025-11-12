// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { TaskCodeLensProvider } from "./providers/taskCodeLensProvider";
import { runTask } from "./commands/runTask";
import type { Task } from "./models/task";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "openspec" is now active!');

  // Register CodeLens provider for tasks.md files
  const codeLensProvider = new TaskCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: "**/openspec/changes/*/tasks.md" },
      codeLensProvider
    )
  );

  // Register run task command
  context.subscriptions.push(
    vscode.commands.registerCommand("openspec.runTask", (task: Task) => {
      runTask(task);
    })
  );

  // Watch for changes to tasks.md files to refresh CodeLens
  const fileWatcher = vscode.workspace.createFileSystemWatcher(
    "**/openspec/changes/*/tasks.md"
  );
  fileWatcher.onDidChange(() => codeLensProvider.refresh());
  fileWatcher.onDidCreate(() => codeLensProvider.refresh());
  fileWatcher.onDidDelete(() => codeLensProvider.refresh());
  context.subscriptions.push(fileWatcher);
}

// This method is called when your extension is deactivated
export function deactivate() {}
