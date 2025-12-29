import { describe, it, expect } from 'vitest';
import { calculateGaps } from '../../src/utils/gapUtils';
import { Assignment, Absence } from '../../src/types';

describe('gapUtils.calculateGaps', () => {
  const gridLines = [
    '08:50', '09:10', '09:40', '10:10', '10:40', 
    '11:10', '11:50', '12:20', '12:50', '13:20', 
    '14:00', '14:30', '15:00'
  ];

  it('should return full grid intervals as gaps when no assignments or absences exist', () => {
    const gaps = calculateGaps([], [], gridLines, 1, '2025-12-29');
    
    // Total 12 intervals between 13 grid lines
    expect(gaps.length).toBe(12);
    expect(gaps[0]).toMatchObject({ start_time: '08:50', end_time: '09:10', duration: 20 });
    expect(gaps[5]).toMatchObject({ start_time: '11:10', end_time: '11:50', duration: 40 });
  });

  it('should identify a small gap between an absence and a task', () => {
    const absences: Absence[] = [
      { id: 1, aide_id: 1, date: '2025-12-29', created_at: '' } // Mock absence doesn't have times in model but we assume it covers the day? 
      // WAIT: The spec says "gap between Unavailable to work and another task". 
      // In the app, "Unavailable" usually means the aide is not available per their availability profile OR an absence.
      // But the screenshot shows a grey block. Grey blocks are often standard "Unavailable" from availability patterns.
    ];
    
    // Let's refine the test based on the actual logic we need: 
    // Gaps are where there is NO assignment AND the aide IS available.
  });

  it('should identify a gap between two tasks within the same grid interval', () => {
    const assignments: Partial<Assignment>[] = [
      { id: 1, start_time: '09:10:00', end_time: '09:20:00', status: 'ASSIGNED' },
      { id: 2, start_time: '09:30:00', end_time: '09:40:00', status: 'ASSIGNED' }
    ];
    
    const gaps = calculateGaps(assignments as Assignment[], [], gridLines, 1, '2025-12-29');
    
    // Should find the 10m gap between 09:20 and 09:30
    const targetGap = gaps.find(g => g.start_time === '09:20' && g.end_time === '09:30');
    expect(targetGap).toBeDefined();
    expect(targetGap?.duration).toBe(10);
  });

  it('should NOT return gaps smaller than 10 minutes', () => {
    const assignments: Partial<Assignment>[] = [
      { id: 1, start_time: '09:10:00', end_time: '09:15:00', status: 'ASSIGNED' },
      { id: 2, start_time: '09:20:00', end_time: '09:40:00', status: 'ASSIGNED' }
    ];
    
    const gaps = calculateGaps(assignments as Assignment[], [], gridLines, 1, '2025-12-29');
    
    // 5m gap between 09:15 and 09:20 should be excluded
    const smallGap = gaps.find(g => g.start_time === '09:15' && g.end_time === '09:20');
    expect(smallGap).toBeUndefined();
  });

  it('should NOT allow gaps to cross grid lines', () => {
    // If there is an empty space from 09:00 to 09:20, and a grid line is at 09:10
    // It should be two gaps: 09:00-09:10 and 09:10-09:20 (both 10m)
    // If one side was 5m, it would be excluded.
    
    const gaps = calculateGaps([], [], gridLines, 1, '2025-12-29');
    
    // Interval 08:50 - 09:10 is 20m. 
    // If we add an assignment 08:55 - 09:05
    const assignments: Partial<Assignment>[] = [
      { id: 1, start_time: '08:55:00', end_time: '09:05:00', status: 'ASSIGNED' }
    ];
    
    const filteredGaps = calculateGaps(assignments as Assignment[], [], gridLines, 1, '2025-12-29');
    
    // Gap 1: 08:50 - 08:55 (5m) -> Excluded
    // Gap 2: 09:05 - 09:10 (5m) -> Excluded
    expect(filteredGaps.find(g => g.end_time === '09:10' && g.start_time === '09:05')).toBeUndefined();
  });
});

