import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragDrop } from '../../src/hooks/useDragDrop';
import * as availabilityUtils from '../../src/utils/availabilityUtils';

// Define mocks before imports
vi.mock('../../src/services/assignmentsApi', () => ({
    assignmentsApi: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
    }
}));

vi.mock('../../src/services/tasksApi', () => ({
    tasksApi: {
        createOneOff: vi.fn(),
        update: vi.fn(),
    }
}));

vi.mock('../../src/store/stores/undoStore', () => ({
    useUndoStore: () => ({
        execute: vi.fn(),
    })
}));

vi.mock('../../src/store/stores/tasks', () => ({
    useTasksStore: () => ({
        tasks: [
            { id: 101, title: 'Task Template 1', default_duration: 30 }
        ],
    })
}));

vi.mock('../../src/store/stores/reliefPool', () => {
    const mockState = { tasks: [] };
    const mockStore = () => mockState;
    (mockStore as any).getState = () => mockState;
    return {
        useReliefPoolStore: mockStore
    };
});

vi.mock('../../src/store/stores/uiStore', () => ({
    useUiStore: () => ({
        selectedClassId: 1,
    })
}));

vi.mock('../../src/components/TimetableGrid/timeUtils', () => ({
    useTimeUtils: () => ({
        generateTimeSlots: () => ['09:00', '09:30', '10:00'],
        getSegmentForTime: (time: string) => {
            if (time === '09:10') return { start: '09:10', end: '09:40' };
            return { start: time, end: '09:30' };
        },
        calculateDuration: () => 30,
        timeToMinutes: (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        },
        addMinutesToTime: (t, m) => {
            const [hours, mins] = t.split(':').map(Number);
            const totalMins = hours * 60 + mins + m;
            const h = Math.floor(totalMins / 60);
            const mi = totalMins % 60;
            return `${h.toString().padStart(2, '0')}:${mi.toString().padStart(2, '0')}`;
        },
        endTimeMinutes: 15 * 60,
        minutesToTime: (m) => {
            const h = Math.floor(m / 60);
            const mi = m % 60;
            return `${h.toString().padStart(2, '0')}:${mi.toString().padStart(2, '0')}`;
        }
    })
}));

vi.mock('../../src/utils/gapUtils', () => ({
    calculateGaps: () => [
        { start_time: '09:20', end_time: '09:40' }
    ],
    findSmallGap: () => false,
}));

describe('useDragDrop', () => {
    let dispatchEventSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

        vi.spyOn(availabilityUtils, 'isAideAvailable').mockImplementation((avail, date, start, end) => {
            // Mock availability: 09:20 - 15:00
            if (start < '09:20:00') return false;
            return true;
        });

        vi.spyOn(availabilityUtils, 'getAvailabilityInfo').mockReturnValue({
            hasAvailability: true,
            weekday: 'Wednesday',
            timeWindow: { start: '09:20:00', end: '15:00:00' },
            isAvailable: true
        });
    });

    afterEach(() => {
        dispatchEventSpy.mockRestore();
    });

    it('VERIFICATION: successfully drops task template when slot start is unavailable but gap snap fixes it', async () => {
        console.log('Running test: VERIFICATION');
        const options = {
            defaultDate: '2026-01-28', // Critical for slot drops
            aides: [
                {
                    id: 9,
                    name: 'Dan Castellaneta',
                    availability: [{ start_time: '09:20:00', end_time: '15:00:00', weekday: 'WE' }],
                    assignments: []
                }
            ] as any[]
        };

        const { result } = renderHook(() => useDragDrop(options));
        const onDragEnd = (result.current as any).onDragEnd;

        await act(async () => {
            await onDragEnd({
                draggableId: 'task-101',
                source: { droppableId: 'task-bank' },
                destination: { droppableId: 'aide-9-slot-09:10' }
            });
        });

        expect(dispatchEventSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'app:error'
            })
        );
    });
});
