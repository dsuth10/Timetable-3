import { Draggable } from '@hello-pangea/dnd';
import type { Assignment } from '../../types';

type TaskCardProps = {
  assignment: Assignment;
  index: number;
};

export function TaskCard({ assignment, index }: TaskCardProps) {
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


