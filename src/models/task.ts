export type TaskStatus = "not-started" | "in-progress" | "completed";

export interface Task {
	id: string;
	title: string;
	status: TaskStatus;
	level: number;
	line: number;
	changeId: string;
	requirementRefs: string[];
	children: Task[];
}

export interface TaskContext {
	agentsMd: string;
	projectMd?: string;
	proposalMd: string;
	designMd?: string;
	specs: SpecDelta[];
	previousTasks: Task[];
	currentTask: Task;
}

export interface SpecDelta {
	capability: string;
	content: string;
}
