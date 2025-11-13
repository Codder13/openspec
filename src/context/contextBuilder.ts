import * as vscode from "vscode";
import * as path from "node:path";
import type { Task, TaskContext, SpecDelta } from "../models/task";
import { parseTasksFile, getTasksBefore } from "../parsers/taskParser";

export async function buildContext(
	task: Task,
	changeId: string,
	workspaceRoot: string,
): Promise<TaskContext & { changeRoot: string; openspecRoot: string }> {
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
		changeRoot,
		openspecRoot,
	};
}

export function formatPrompt(
	context: TaskContext & { changeRoot: string; openspecRoot: string },
	changeId: string,
): string {
	let prompt = "# OpenSpec Task Execution\n\n";

	prompt += "## Context Files\n\n";
	prompt +=
		"Please read and follow the methodology and conventions from these files:\n\n";
	prompt += `- @${path.join(context.openspecRoot, "AGENTS.md")}\n`;

	if (context.projectMd) {
		prompt += `- @${path.join(context.openspecRoot, "project.md")}\n`;
	}

	prompt += `- @${path.join(context.changeRoot, "proposal.md")}\n`;

	if (context.designMd) {
		prompt += `- @${path.join(context.changeRoot, "design.md")}\n`;
	}

	if (context.specs.length > 0) {
		prompt += "\n### Specification Deltas\n\n";
		for (const spec of context.specs) {
			prompt += `- @${path.join(
				context.changeRoot,
				"specs",
				spec.capability,
				"spec.md",
			)}\n`;
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

	prompt += "## Current Task\n\n";
	prompt += `**Task:** ${context.currentTask.title}\n\n`;
	if (context.currentTask.requirementRefs.length > 0) {
		prompt += `**Related Requirements:** ${context.currentTask.requirementRefs.join(
			", ",
		)}\n\n`;
	}

	prompt += "## Instructions\n\n";
	prompt +=
		"Please implement the current task above following OpenSpec methodology and project conventions from the context files. ";
	prompt +=
		"Review the specification deltas to understand what requirements to implement. ";
	prompt += "Previous tasks show what has already been completed.\n\n";

	prompt += "**IMPORTANT:** After completing this task:\n";
	prompt += `1. Update the task status in @${path.join(
		context.changeRoot,
		"tasks.md",
	)}\n`;
	prompt +=
		"2. Change the checkbox from `[ ]` to `[-]` (in-progress) or `[x]` (completed)\n";
	prompt +=
		"3. This helps track progress and provides visibility into what's been done\n";

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
