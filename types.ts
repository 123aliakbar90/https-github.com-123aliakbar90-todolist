
export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: string;
  subTasks: SubTask[];
  createdAt: number;
}

export interface AISuggestion {
  text: string;
  priority: Priority;
  category: string;
}
