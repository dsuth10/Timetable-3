import { Draggable } from '@hello-pangea/dnd';
import { memo } from 'react';
import type { Assignment } from '../../types';

type TaskCardProps = {
  assignment: Assignment;
  index: number;
};

function TaskCardBase({ assignment, index }: TaskCardProps) {
  return (
    <Draggable draggableId={`asg-${assignment.id}`} index={index}>
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          {...dragProvided.dragHandleProps}
          style={{
            padding: 8,
            marginBottom: 8,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 4,
            ...dragProvided.draggableProps.style,
          }}
          data-testid={`assignment-card-${assignment.id}`}
        >
          {assignment.start_time.slice(0, 5)}–{assignment.end_time.slice(0, 5)} · Task #{assignment.task_id}
        </div>
      )}
    </Draggable>
  );
}

export const TaskCard = memo(TaskCardBase, (prev, next) => {
  const a = prev.assignment;
  const b = next.assignment;
  return (
    a.id === b.id &&
    a.aide_id === b.aide_id &&
    a.start_time === b.start_time &&
    a.end_time === b.end_time &&
    a.status === b.status &&
    prev.index === next.index
  );
});


