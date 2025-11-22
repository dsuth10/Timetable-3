// Core shared types for frontend

export type ID = number;

export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR';

export interface TeacherAide {
  id: ID;
  name: string;
  qualifications?: string | null;
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
  capacity?: number | null;
  notes?: string | null;
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

export interface Assignment {
  id: ID;
  task_id: ID;
  aide_id: ID | null;
  recurring_series_id?: ID | null;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  status: 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETE';
  version: number;
  created_at?: string;
  updated_at?: string;
  aide?: TeacherAide; // Included when fetching with relationships
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




