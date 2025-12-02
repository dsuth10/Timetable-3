import { create } from 'zustand';

export type UndoCommand = {
  id: string;
  description: string;
  do: () => Promise<void> | void;
  undo: () => Promise<void> | void;
};

type UndoState = {
  undoStack: UndoCommand[];
  redoStack: UndoCommand[];
  executing: boolean;
  execute: (cmd: UndoCommand) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

const MAX_DEPTH = 10;

export const useUndoStore = create<UndoState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  executing: false,

  async execute(cmd) {
    // Run the command and push it to the undo stack.
    set({ executing: true });
    try {
      await cmd.do();
      const nextUndo = [...get().undoStack, cmd].slice(-MAX_DEPTH);
      set({ undoStack: nextUndo, redoStack: [] });
    } catch (error) {
      // Re-throw the error so callers can handle it, but ensure executing is reset
      throw error;
    } finally {
      set({ executing: false });
    }
  },

  async undo() {
    const { undoStack, redoStack, executing } = get();
    if (executing || undoStack.length === 0) return;
    const cmd = undoStack[undoStack.length - 1];
    set({ executing: true });
    try {
      await cmd.undo();
      set({
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, cmd].slice(-MAX_DEPTH),
      });
    } finally {
      set({ executing: false });
    }
  },

  async redo() {
    const { undoStack, redoStack, executing } = get();
    if (executing || redoStack.length === 0) return;
    const cmd = redoStack[redoStack.length - 1];
    set({ executing: true });
    try {
      await cmd.do();
      set({
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, cmd].slice(-MAX_DEPTH),
      });
    } finally {
      set({ executing: false });
    }
  },

  clear() {
    set({ undoStack: [], redoStack: [] });
  },

  canUndo() {
    return get().undoStack.length > 0 && !get().executing;
  },

  canRedo() {
    return get().redoStack.length > 0 && !get().executing;
  },
}));


