import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { queryClient } from '../services/queryClient';
import { dailyKeys } from './useDailyView';
import type { DailyViewData, AssignTaskPayload, Assignment } from '../types';

export function useAssignTask() {
    return useMutation({
        mutationFn: async (payload: AssignTaskPayload) => {
            const res = await api.post('/daily-view/assign', payload);
            return res.data as Assignment;
        },
        onMutate: async (payload) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: dailyKeys.date(payload.date) });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData<DailyViewData>(dailyKeys.date(payload.date));

            // Optimistically update to the new value
            if (previousData) {
                const optimisticData = { ...previousData };

                let sourceAssignment: any = null;

                if (payload.type === 'FROM_BANK') {
                    const task = optimisticData.task_bank.find(t => t.id === payload.id);
                    if (task) {
                        optimisticData.task_bank = optimisticData.task_bank.filter(t => t.id !== payload.id);
                        sourceAssignment = {
                            id: -(Date.now()), // Temp ID
                            task_id: task.id,
                            aide_id: payload.aide_id,
                            date: payload.date,
                            start_time: payload.start_time,
                            end_time: payload.end_time,
                            status: 'ASSIGNED',
                            version: 1,
                            task: task,
                            classroom: task.classroom
                        };
                    }
                } else if (payload.type === 'FROM_RELIEF') {
                    const assignment = optimisticData.relief_pool.find(a => a.id === payload.id);
                    if (assignment) {
                        optimisticData.relief_pool = optimisticData.relief_pool.filter(a => a.id !== payload.id);
                        sourceAssignment = {
                            ...assignment,
                            aide_id: payload.aide_id,
                            start_time: payload.start_time,
                            end_time: payload.end_time,
                            status: 'ASSIGNED'
                        };
                    }
                }

                if (sourceAssignment) {
                    optimisticData.aides = optimisticData.aides.map(aide => {
                        if (aide.id === payload.aide_id) {
                            return {
                                ...aide,
                                assignments: [...aide.assignments, sourceAssignment]
                            };
                        }
                        return aide;
                    });

                    queryClient.setQueryData(dailyKeys.date(payload.date), optimisticData);
                }
            }

            return { previousData };
        },
        onError: (err: any, payload: AssignTaskPayload, context: any) => {
            if (context?.previousData) {
                queryClient.setQueryData(dailyKeys.date(payload.date), context.previousData);
            }
        },
        onSettled: (data, error, payload) => {
            queryClient.invalidateQueries({ queryKey: dailyKeys.date(payload.date) });
        },
    });
}
