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

export type TaskRecord = {
  id: string;
  parse_id: string | null;
  title: string;
  context: string;
  due_at_utc: string | null;
  due_tz: string | null;
  start_by_utc: string | null;
  start_by_tz: string | null;
  complexity: number;
  estimated_hours: number;
  steps: TaskStep[];
  confidence: number;
  flags: TaskFlag[];
  start_by_locked: boolean;
  manual_status: TaskStatus | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type ParseResult = {
  parse_id: string;
  tasks: ParseCandidateTask[];
};

export type ParseInput = {
  text: string;
  base_timezone?: string;
  locale?: string;
};

export type BatchCreateInput = {
  parse_id: string;
  tasks_confirmed: ParseCandidateTask[];
};

export type TaskStatus = 'upcoming_start' | 'upcoming_due' | 'in_progress' | 'completed';
