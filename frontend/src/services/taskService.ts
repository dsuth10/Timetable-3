import axios from 'axios';
import { Task, CreateTaskPayload } from '../types/contracts';

const API_BASE_URL = 'http://localhost:5000/api';

export const taskService = {
  fetchTasksByClassroom: async (classroomId: number): Promise<Task[]> => {
    const response = await axios.get(`${API_BASE_URL}/tasks?classroom_id=${classroomId}`);
    // Map backend 'notes' field to frontend 'description' for consistency
    return response.data.map((task: any) => ({
      ...task,
      description: task.notes || task.description
    }));
  },

  createTask: async (payload: CreateTaskPayload): Promise<Task> => {
    const response = await axios.post(`${API_BASE_URL}/tasks`, payload);
    const task = response.data;
    // Map backend 'notes' field to frontend 'description'
    return {
      ...task,
      description: task.notes || task.description
    };
  }
};
