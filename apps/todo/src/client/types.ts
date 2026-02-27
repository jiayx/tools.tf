/** @jsxImportSource react */

export type TaskFlag =
  | 'DATE_AMBIGUOUS'
  | 'MISSING_TIME_DEFAULTED'
  | 'FUZZY_TIME_DEFAULTED'
  | 'MISSING_DUE'
  | 'LOW_CONFIDENCE';

export type TaskDue = {
  date: string;
  time: string;
  timezone: string;
  source_text: string;
};

export type TaskStep = {
  id: string;
  title: string;
  estimated_hours: number;
  done: boolean;
};

export type TaskStatus = 'upcoming_start' | 'upcoming_due' | 'in_progress' | 'completed';

export type ParseCandidateTask = {
  id: string;
  title: string;
  context: string;
  due: TaskDue | null;
  complexity: number;
  estimated_hours: number;
  steps: TaskStep[];
  confidence: number;
  flags: TaskFlag[];
  start_by: TaskDue | null;
  start_by_locked: boolean;
  ambiguity_options?: {
    first: string;
    second: string;
    selected: string;
  };
};

export type ClientTask = {
  id: string;
  parse_id: string | null;
  title: string;
  context: string;
  due: TaskDue | null;
  start_by: TaskDue | null;
  complexity: number;
  estimated_hours: number;
  steps: TaskStep[];
  confidence: number;
  flags: TaskFlag[];
  start_by_locked: boolean;
  manual_status: TaskStatus | null;
  completed: boolean;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type ParseResponse = {
  parse_id: string;
  tasks: ParseCandidateTask[];
  parse_engine: 'workers_ai' | 'heuristic';
};

export type BatchCreateResponse = {
  tasks_created: ClientTask[];
};

export type TasksResponse = {
  tasks: ClientTask[];
};

export type TaskResponse = {
  task: ClientTask;
};
