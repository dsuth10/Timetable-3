import { DragDropContext, DropResult } from '@hello-pangea/dnd';

type Props = {
  onDragEnd: (result: DropResult) => void;
  children: React.ReactNode;
};

export default function AppDragDropContext({ onDragEnd, children }: Props) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
}


