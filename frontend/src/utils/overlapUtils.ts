import { timeToMinutes, timeIntervalsOverlap } from '../components/TimetableGrid/timeUtils';

export interface OverlapItem {
    id: number;
    start_time: string;
    end_time: string;
}

export interface LaneAssignment<T extends OverlapItem> {
    item: T;
    lane: number;
    totalLanes: number;
    laneSpan: number;
}

/**
 * Groups items that overlap with each other into groups.
 */
export function groupOverlappingItems<T extends OverlapItem>(items: T[]): T[][] {
    if (items.length === 0) return [];

    const sortedItems = [...items].sort((a, b) =>
        timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );

    const groups: T[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < sortedItems.length; i++) {
        if (processed.has(sortedItems[i].id)) continue;

        const currentGroup: T[] = [sortedItems[i]];
        processed.add(sortedItems[i].id);

        let foundOverlap = true;
        while (foundOverlap) {
            foundOverlap = false;
            for (let j = 0; j < sortedItems.length; j++) {
                if (processed.has(sortedItems[j].id)) continue;

                const hasOverlap = currentGroup.some(groupItem =>
                    timeIntervalsOverlap(
                        groupItem.start_time, groupItem.end_time,
                        sortedItems[j].start_time, sortedItems[j].end_time
                    )
                );

                if (hasOverlap) {
                    currentGroup.push(sortedItems[j]);
                    processed.add(sortedItems[j].id);
                    foundOverlap = true;
                }
            }
        }
        groups.push(currentGroup);
    }

    return groups;
}

/**
 * Assigns items in a group to lanes using a greedy algorithm.
 */
export function assignLanes<T extends OverlapItem>(group: T[]): LaneAssignment<T>[] {
    const lanes: T[][] = [];
    const itemToLane = new Map<number, number>();

    const sortedGroup = [...group].sort((a, b) =>
        timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );

    for (const item of sortedGroup) {
        let assigned = false;
        for (let l = 0; l < lanes.length; l++) {
            const lastInLane = lanes[l][lanes[l].length - 1];
            if (timeToMinutes(item.start_time) >= timeToMinutes(lastInLane.end_time)) {
                lanes[l].push(item);
                itemToLane.set(item.id, l);
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            lanes.push([item]);
            itemToLane.set(item.id, lanes.length - 1);
        }
    }

    const totalLanes = lanes.length;
    const assignments: LaneAssignment<T>[] = [];

    for (const item of group) {
        const lane = itemToLane.get(item.id) || 0;

        // Greedy spanning: check how many lanes this item can span
        let laneSpan = 1;
        for (let l = lane + 1; l < totalLanes; l++) {
            const hasCollision = lanes[l].some(other =>
                timeIntervalsOverlap(item.start_time, item.end_time, other.start_time, other.end_time)
            );
            if (hasCollision) break;
            laneSpan++;
        }

        assignments.push({
            item,
            lane,
            totalLanes,
            laneSpan
        });
    }

    return assignments;
}

/**
 * Combines grouping and lane assignment for a list of items.
 */
export function calculateOverlaps<T extends OverlapItem>(items: T[]): LaneAssignment<T>[] {
    const groups = groupOverlappingItems(items);
    const allAssignments: LaneAssignment<T>[] = [];

    for (const group of groups) {
        allAssignments.push(...assignLanes(group));
    }

    return allAssignments;
}
