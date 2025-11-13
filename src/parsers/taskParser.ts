import type { Task, TaskStatus } from "../models/task";

export function parseTasksFile(content: string, changeId: string): Task[] {
	const lines = content.split("\n");
	const tasks: Task[] = [];
	const taskStack: Array<{ task: Task; indent: number }> = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Match task items: - [ ] Task description
		const itemMatch = line.match(/^(\s*)-\s+\[([x\s-~])\]\s+(.+)$/);
		if (itemMatch) {
			const indent = itemMatch[1].length;
			const statusChar = itemMatch[2];
			const title = itemMatch[3].trim();

			const status: TaskStatus =
				statusChar === "x"
					? "completed"
					: statusChar === "-" || statusChar === "~"
						? "in-progress"
						: "not-started";

			// Extract requirement references: _Requirements: 1.1, 2.3_
			const reqMatch = title.match(/_Requirements:\s+([\d.]+(?:,\s*[\d.]+)*)_/);
			const requirementRefs = reqMatch
				? reqMatch[1].split(",").map((r) => r.trim())
				: [];

			const task: Task = {
				id: `${changeId}-${i}`,
				title,
				status,
				level: Math.floor(indent / 2),
				line: i,
				changeId,
				requirementRefs,
				children: [],
			};

			// Find parent based on indentation
			while (
				taskStack.length > 0 &&
				taskStack[taskStack.length - 1].indent >= indent
			) {
				taskStack.pop();
			}

			if (taskStack.length > 0) {
				// Add as child of parent
				taskStack[taskStack.length - 1].task.children.push(task);
			} else {
				// Top-level task
				tasks.push(task);
			}

			taskStack.push({ task, indent });
		}
	}

	return tasks;
}

export function findTaskAtLine(tasks: Task[], line: number): Task | undefined {
	for (const task of tasks) {
		if (task.line === line) {
			return task;
		}
		const found = findTaskAtLine(task.children, line);
		if (found) {
			return found;
		}
	}
	return undefined;
}

export function getAllTasksFlat(tasks: Task[]): Task[] {
	const result: Task[] = [];
	for (const task of tasks) {
		result.push(task);
		result.push(...getAllTasksFlat(task.children));
	}
	return result;
}

export function getTasksBefore(tasks: Task[], currentLine: number): Task[] {
	const flatTasks = getAllTasksFlat(tasks);
	return flatTasks.filter((t) => t.line < currentLine);
}
