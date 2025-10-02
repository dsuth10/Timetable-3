import { useMemo } from 'react';
import { useUndoStore } from '../store/stores/undoStore';

export default function UndoRedoControls() {
  const { undo, redo, canUndo, canRedo, executing } = useUndoStore((s) => ({
    undo: s.undo,
    redo: s.redo,
    canUndo: s.canUndo,
    canRedo: s.canRedo,
    executing: s.executing,
  }));

  const disabledUndo = useMemo(() => !canUndo() || executing, [canUndo, executing]);
  const disabledRedo = useMemo(() => !canRedo() || executing, [canRedo, executing]);

  return (
    <div style={{ display: 'inline-flex', gap: 8 }}>
      <button onClick={() => undo()} disabled={disabledUndo} data-testid="undo-btn">Undo</button>
      <button onClick={() => redo()} disabled={disabledRedo} data-testid="redo-btn">Redo</button>
    </div>
  );
}


