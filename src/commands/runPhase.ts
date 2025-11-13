import * as vscode from "vscode";
import type { Task } from "../models/task";
import { buildContext, formatPrompt } from "../context/contextBuilder";

export async function runPhase(phaseTasks: Task[]): Promise<void> {
  try {
    if (!phaseTasks || phaseTasks.length === 0) {
      vscode.window.showErrorMessage("No tasks in this phase");
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder open");
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const firstTask = phaseTasks[0];
    const phaseTitle = getPhaseTitle(firstTask);

    // Build context for the phase
    vscode.window.showInformationMessage(
      `Building context for phase: ${phaseTitle}`
    );
    
    const context = await buildContext(
      firstTask,
      firstTask.changeId,
      workspaceRoot
    );

    // Format prompt for all tasks in the phase
    const prompt = formatPhasePrompt(context, phaseTasks, phaseTitle);

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
      `Failed to run phase: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function getPhaseTitle(task: Task): string {
  // Extract phase title from task title if it starts with "Phase N:"
  const match = task.title.match(/^(Phase \d+:.*?)(?:\s*\(|$)/);
  return match ? match[1] : task.title;
}

function formatPhasePrompt(
  context: any,
  phaseTasks: Task[],
  phaseTitle: string
): string {
  let prompt = "# OpenSpec Phase Execution\n\n";

  prompt += "## Context Files\n\n";
  prompt +=
    "Please read and follow the methodology and conventions from these files:\n\n";
  prompt += `- @${context.openspecRoot}/AGENTS.md\n`;

  if (context.projectMd) {
    prompt += `- @${context.openspecRoot}/project.md\n`;
  }

  prompt += `- @${context.changeRoot}/proposal.md\n`;

  if (context.designMd) {
    prompt += `- @${context.changeRoot}/design.md\n`;
  }

  if (context.specs.length > 0) {
    prompt += "\n### Specification Deltas\n\n";
    for (const spec of context.specs) {
      prompt += `- @${context.changeRoot}/specs/${spec.capability}/spec.md\n`;
    }
  }

  prompt += "\n";

  if (context.previousTasks.length > 0) {
    prompt += "## Previous Tasks (completed)\n\n";
    for (const prevTask of context.previousTasks) {
      const indent = "  ".repeat(prevTask.level);
      const statusIcon =
        prevTask.status === "completed"
          ? "✅"
          : prevTask.status === "in-progress"
          ? "🔵"
          : "⚪";
      prompt += `${indent}- ${statusIcon} ${prevTask.title}\n`;
    }
    prompt += "\n";
  }

  prompt += `## Current Phase: ${phaseTitle}\n\n`;
  prompt +=
    "Please complete ALL tasks in this phase in sequence. For each task:\n\n";

  for (const task of phaseTasks) {
    const indent = "  ".repeat(task.level - phaseTasks[0].level);
    prompt += `${indent}- [ ] ${task.title}`;
    if (task.requirementRefs.length > 0) {
      prompt += ` _(Requirements: ${task.requirementRefs.join(", ")})_`;
    }
    prompt += "\n";
  }

  prompt += "\n## Instructions\n\n";
  prompt +=
    "Implement ALL tasks in the phase above following OpenSpec methodology and project conventions from the context files. ";
  prompt +=
    "Review the specification deltas to understand what requirements to implement. ";
  prompt += "Previous tasks show what has already been completed.\n\n";
  
  prompt += "**IMPORTANT:** After completing each task:\n";
  prompt += `1. Update the task status in @${context.changeRoot}/tasks.md\n`;
  prompt += "2. Mark in-progress tasks with `[-]` and completed tasks with `[x]`\n";
  prompt += "3. Keep the status up-to-date as you work through each task\n";
  prompt += "4. This helps track progress and provides visibility into what's been done\n";

  return prompt;
}
