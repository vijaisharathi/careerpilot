import { apiClient } from './api.client';
import {
  BackendLearningRoadmap,
  GenerateRoadmapPayload,
  UpdateSchedulePayload,
  RegenerateRoadmapPayload,
} from '../types/roadmap.types';

export const roadmapService = {
  getActiveRoadmap: async (): Promise<BackendLearningRoadmap | null> => {
    try {
      const data = await apiClient.get<BackendLearningRoadmap | null>('/roadmap');
      return data;
    } catch {
      return null;
    }
  },

  generateRoadmap: async (
    payload: GenerateRoadmapPayload = {}
  ): Promise<BackendLearningRoadmap> => {
    const data = await apiClient.post<BackendLearningRoadmap>('/roadmap/generate', payload);
    return data;
  },

  updateTaskStatus: async (
    taskId: string,
    completed: boolean
  ): Promise<BackendLearningRoadmap> => {
    const data = await apiClient.patch<BackendLearningRoadmap>(`/roadmap/tasks/${taskId}`, {
      completed,
    });
    return data;
  },

  updateSchedule: async (
    payload: UpdateSchedulePayload
  ): Promise<BackendLearningRoadmap> => {
    const data = await apiClient.patch<BackendLearningRoadmap>('/roadmap/schedule', payload);
    return data;
  },

  regenerateRoadmap: async (
    payload: RegenerateRoadmapPayload = {}
  ): Promise<BackendLearningRoadmap> => {
    const data = await apiClient.post<BackendLearningRoadmap>('/roadmap/regenerate', payload);
    return data;
  },
};

