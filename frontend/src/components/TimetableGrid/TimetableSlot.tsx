import { Droppable } from '@hello-pangea/dnd';
import type { ID } from '../../types';

type TimetableSlotProps = {
  droppableId: string;
  children?: React.ReactNode;
};

export function TimetableSlot({ droppableId, children }: TimetableSlotProps) {
  return (
    <Droppable droppableId={droppableId}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 40, border: '1px dashed #e5e7eb', borderRadius: 4, padding: 4 }}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}


