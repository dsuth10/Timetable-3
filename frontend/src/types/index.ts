// Core shared types for frontend

export type ID = number;

export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR';

export interface TeacherAide {
  id: ID;
  name: string;
  details?: string | null;
  colour_hex: string;
  // When fetched with include=availability, this is populated
  availability?: Availability[];
  created_at?: string;
}

export interface Availability {
  id: ID;
  aide_id: ID;
  weekday: Weekday;
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
}

export type TaskCategory =
  | 'PLAYGROUND'
  | 'CLASS_SUPPORT'
  | 'GROUP_SUPPORT'
  | 'INDIVIDUAL_SUPPORT';

export interface Classroom {
  id: ID;
  name: string;
  room_number: string;
  teacher: string;
  capacity?: number | null;
  notes?: string | null;
  year_level?: string | null;
  is_composite?: boolean;
  composite_year_levels?: string | null;
  colour_hex: string;
  created_at?: string;
}

export interface Task {
  id: ID;
  title: string;
  category: TaskCategory;
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  classroom_id?: ID | null;
  notes?: string | null;
  status?: 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETE';
  classroom?: Classroom;
  recurrence_rule?: string;
  expires_on?: string;
}

export interface RecurringSeries {
  id: ID;
  task_id: ID;
  aide_id: ID | null;
  recurrence_rule: string;
  expires_on: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  base_date: string;  // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
  task?: Task;
  aide?: TeacherAide;
  assignments_count?: number;
}

export type AssignmentStatus = 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETE' | 'RELIEF_POOL';

export interface Assignment {
  id: ID;
  task_id: ID;
  aide_id: ID | null;
  original_aide_id?: ID | null; // Stores the original aide when task enters Relief Pool
  recurring_series_id?: ID | null;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  status: AssignmentStatus;
  version: number;
  created_at?: string;
  updated_at?: string;
  aide?: TeacherAide; // Included when fetching with relationships
  original_aide?: TeacherAide; // Included for Relief Pool tasks
  task?: Task; // Included when fetching with relationships
  classroom?: Classroom; // Included for Relief Pool tasks
}

export interface Absence {
  id: ID;
  aide_id: ID;
  date: string; // YYYY-MM-DD
  reason?: string | null;
  created_at?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

// Relief Pool types
export interface ReliefPoolTask extends Assignment {
  original_aide_id: ID; // Required for Relief Pool tasks
  original_aide: TeacherAide;
  task: Task;
  classroom?: Classroom;
}

export interface ReliefPoolByDate {
  [date: string]: ID[];
}

export interface ReliefPoolResponse {
  tasks: ReliefPoolTask[];
  by_date: ReliefPoolByDate;
  total_count: number;
}

export interface ReliefPoolCountResponse {
  count: number;
  by_date: { [date: string]: number };
}

export interface ReliefPoolReassignRequest {
  aide_id: ID;
  start_time?: string;
  end_time?: string;
  version: number;
}

export interface ReliefPoolDismissRequest {
  reason?: string;
  version: number;
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Request {
  id: ID;
  requesting_teacher: string;
  task_title: string;
  task_category: TaskCategory;
  preferred_date: string; // YYYY-MM-DD
  preferred_time: string; // HH:MM:SS
  classroom_id?: ID | null;
  notes?: string | null;
  status: RequestStatus;
  created_at?: string;
  classroom?: Classroom;
}

export interface TeacherRequestCreate {
  requesting_teacher: string;
  task_title: string;
  task_category: TaskCategory;
  preferred_date: string;
  preferred_time: string;
  classroom_id?: ID | null;
  notes?: string | null;
}

// Daily View types
export interface AideWithStatus extends TeacherAide {
  is_absent: boolean;
  assignments: Assignment[];
}

export interface TimelineSlotConfig {
  start_time: string; // HH:MM:SS
  duration_minutes: number;
}

export interface TimelineConfig {
  slots: TimelineSlotConfig[];
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
}

export interface TermInfo {
  date: string;
  term_number?: number | null;
  week_number?: number | null;
  display_label?: string | null;
}

export interface DailyViewData {
  aides: AideWithStatus[];
  relief_pool: Assignment[];
  task_bank: Task[];
  timeline_config: TimelineConfig;
  term_info?: TermInfo;
}

export type AssignmentSourceType = 'FROM_BANK' | 'FROM_RELIEF';

export interface AssignTaskPayload {
  type: AssignmentSourceType;
  id: ID;
  date: string;
  aide_id: ID;
  start_time: string;
  end_time: string;
}

export interface TooltipData {
  task_title: string;
  category: string;
  classroom: {
    name: string;
    room_number: string;
    teacher: string;
  } | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  assigned_aides: string[];
  recurrence: {
    is_recurring: boolean;
    dates: string[];
    has_more: boolean;
  };
  notes: string;
}