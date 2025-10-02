import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useMemo } from 'react';
import type { TeacherAide, Assignment } from '../../types';

type TimetableGridProps = {
  aides: TeacherAide[];
  assignmentsByAide: Record<string, Assignment[]>; // key: aide.id string
};

export function TimetableGrid({ aides, assignmentsByAide }: TimetableGridProps) {
  const columns = useMemo(() => aides.map((a) => String(a.id)), [aides]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 12 }}>
      {columns.map((col) => (
        <Droppable droppableId={col} key={col}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ minHeight: 200, border: '1px solid #ddd', borderRadius: 4, padding: 8 }}
              data-testid={`aide-col-${col}`}
            >
              {(assignmentsByAide[col] || []).map((asg, idx) => (
                <Draggable draggableId={`asg-${asg.id}`} index={idx} key={asg.id}>
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      data-testid={`assignment-card-${asg.id}`}
                      style={{
                        padding: 8,
                        marginBottom: 8,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: 4,
                        ...dragProvided.draggableProps.style,
                      }}
                    >
                      {asg.start_time.slice(0, 5)}–{asg.end_time.slice(0, 5)} · Task #{asg.task_id}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </div>
  );
}




