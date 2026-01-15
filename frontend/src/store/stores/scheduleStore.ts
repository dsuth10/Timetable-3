import { create } from 'zustand';
import type { TimelineConfig } from '../../types';

interface ScheduleSegment {
    start: string;
    end: string;
}

interface ScheduleState {
    startTimeMinutes: number;
    endTimeMinutes: number;
    scheduleSegments: ScheduleSegment[];
    setScheduleConfig: (config: TimelineConfig) => void;
}

// Default values aligned with timeUtils.ts defaults
const DEFAULT_START_TIME_MINUTES = 8 * 60 + 50; // 08:50
const DEFAULT_END_TIME_MINUTES = 15 * 60; // 15:00
const DEFAULT_SEGMENTS: ScheduleSegment[] = [
    { start: '08:50', end: '09:10' },
    { start: '09:10', end: '09:40' },
    { start: '09:40', end: '10:10' },
    { start: '10:10', end: '10:40' },
    { start: '10:40', end: '11:10' },
    { start: '11:10', end: '11:50' },
    { start: '11:50', end: '12:20' },
    { start: '12:20', end: '12:50' },
    { start: '12:50', end: '13:20' },
    { start: '13:20', end: '14:00' },
    { start: '14:00', end: '14:30' },
    { start: '14:30', end: '15:00' },
];

/**
 * Convert time string (HH:MM:SS or HH:MM) to minutes since midnight
 * Duplicated from timeUtils to avoid circular dependency
 */
function timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Add minutes to a time string and return new time
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
    const totalMinutes = timeToMinutes(timeStr) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
    startTimeMinutes: DEFAULT_START_TIME_MINUTES,
    endTimeMinutes: DEFAULT_END_TIME_MINUTES,
    scheduleSegments: DEFAULT_SEGMENTS,
    setScheduleConfig: (config) => {
        if (!config) return;

        try {
            const startTimeMinutes = timeToMinutes(config.start_time || "08:50");
            const endTimeMinutes = timeToMinutes(config.end_time || "15:00");

            const scheduleSegments = (config.slots || []).map(s => {
                const start = s.start_time ? s.start_time.substring(0, 5) : "00:00";
                return {
                    start,
                    end: addMinutesToTime(start, s.duration_minutes || 30)
                };
            });

            set({
                startTimeMinutes,
                endTimeMinutes,
                scheduleSegments
            });
        } catch (e) {
            console.warn("Failed to set schedule config:", e);
        }
    },
}));
