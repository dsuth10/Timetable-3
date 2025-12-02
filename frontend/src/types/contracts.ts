export interface Task {
  id: number;
  title: string;
  description?: string; // Frontend uses 'description', backend maps to 'notes'
  notes?: string; // Backend field name (for responses)
  classroom_id: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  classroom_id: number;
}

export interface Assignment {
  id: number;
  aide_id: number;
  task_id: number;
  date: string;
  time_slot_id: number;
}

export interface CreateAssignmentPayload {
  aide_id: number;
  task_id: number;
  date: string;
  time_slot_id: number;
}
