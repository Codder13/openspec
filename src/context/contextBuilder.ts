import * as vscode from "vscode";
import * as path from "node:path";
import type { Task, TaskContext, SpecDelta } from "../models/task";
import { parseTasksFile, getTasksBefore } from "../parsers/taskParser";

export async function buildContext(
  task: Task,
  changeId: string,
  workspaceRoot: string
): Promise<TaskContext> {
  const openspecRoot = path.join(workspaceRoot, "openspec");
  const changeRoot = path.join(openspecRoot, "changes", changeId);

  // Read AGENTS.md
  const agentsMd = await readFile(path.join(openspecRoot, "AGENTS.md"));

  // Read project.md (optional)
  const projectMd = await readFile(path.join(openspecRoot, "project.md"));

  // Read proposal.md
  const proposalMd = await readFile(path.join(changeRoot, "proposal.md"));

  // Read design.md (optional)
  const designMd = await readFile(path.join(changeRoot, "design.md"));

  // Read all spec deltas
  const specs = await readSpecDeltas(changeRoot);

  // Get previous tasks (tasks before current task)
  const tasksContent = await readFile(path.join(changeRoot, "tasks.md"));
  const allTasks = parseTasksFile(tasksContent, changeId);
  const previousTasks = getTasksBefore(allTasks, task.line);
  return {
    agentsMd,
    projectMd,
    proposalMd,
    designMd,
    specs,
    previousTasks,
    currentTask: task,
  };
}

export function formatPrompt(context: TaskContext): string {
  let prompt = "# OpenSpec Task Execution Context\n\n";

  prompt += "## OpenSpec Methodology\n\n";
  prompt += context.agentsMd;
  prompt += "\n\n";

  if (context.projectMd) {
    prompt += "## Project Context\n\n";
    prompt += context.projectMd;
    prompt += "\n\n";
  }

  prompt += "## Change Proposal\n\n";
  prompt += context.proposalMd;
  prompt += "\n\n";

  if (context.designMd) {
    prompt += "## Technical Design\n\n";
    prompt += context.designMd;
    prompt += "\n\n";
  }

  if (context.specs.length > 0) {
    prompt += "## Specification Deltas\n\n";
    for (const spec of context.specs) {
      prompt += `### ${spec.capability}\n\n`;
      prompt += spec.content;
      prompt += "\n\n";
    }
  }

  if (context.previousTasks.length > 0) {
    prompt += "## Previous Tasks (for context)\n\n";
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

  prompt += "## Current Task\n\n";
  prompt += `**Task:** ${context.currentTask.title}\n\n`;
  if (context.currentTask.requirementRefs.length > 0) {
    prompt += `**Related Requirements:** ${context.currentTask.requirementRefs.join(
      ", "
    )}\n\n`;
  }

  prompt += "## Instructions\n\n";
  prompt +=
    "Please implement the current task above following OpenSpec methodology and project conventions. ";
  prompt +=
    "Use the specification deltas to understand what requirements to implement. ";
  prompt +=
    "Previous tasks provide context about what has already been completed.\n";

  return prompt;
}

async function readFile(filePath: string): Promise<string> {
  try {
    const uri = vscode.Uri.file(filePath);
    const content = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(content).toString("utf8");
  } catch {
    return "";
  }
}

async function readSpecDeltas(changeRoot: string): Promise<SpecDelta[]> {
  const specsDir = path.join(changeRoot, "specs");
  const specs: SpecDelta[] = [];

  try {
    const specsDirUri = vscode.Uri.file(specsDir);
    const entries = await vscode.workspace.fs.readDirectory(specsDirUri);

    for (const [name, type] of entries) {
      if (type === vscode.FileType.Directory) {
        const specFile = path.join(specsDir, name, "spec.md");
        const content = await readFile(specFile);
        if (content) {
          specs.push({ capability: name, content });
        }
      }
    }
  } catch {
    // No specs directory or read error
  }

  return specs;
}
