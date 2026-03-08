import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection, type EditorState } from "@tiptap/pm/state";

export const CARET_JUMP_UNDO_META = "caretJumpUndo";
const CARET_JUMP_UNDO_RESTORE_META = "caretJumpUndoRestore";

export type CaretJumpUndoMeta = {
  from: number;
  to: number;
};

type CaretJumpStack = CaretJumpUndoMeta[];

const caretJumpUndoPluginKey = new PluginKey<CaretJumpStack>("caretJumpUndo");

function isCaretJumpUndoMeta(meta: unknown): meta is CaretJumpUndoMeta {
  if (!meta || typeof meta !== "object") return false;
  const value = meta as Record<string, unknown>;
  return typeof value.from === "number" && typeof value.to === "number";
}

function clampSelectionPos(maxContentSize: number, pos: number): number {
  return Math.max(1, Math.min(pos, maxContentSize));
}

function getJumpStack(state: EditorState): CaretJumpStack {
  return caretJumpUndoPluginKey.getState(state) ?? [];
}

export const CaretJumpUndo = Extension.create({
  name: "caretJumpUndo",
  priority: 1_000,

  addKeyboardShortcuts() {
    return {
      "Mod-z": () => {
        const { state, view } = this.editor;
        const jumpStack = getJumpStack(state);
        if (jumpStack.length === 0) return false;

        const latestJump = jumpStack[jumpStack.length - 1];
        if (!state.selection.empty || state.selection.from !== latestJump.to) {
          return false;
        }

        const restorePos = clampSelectionPos(state.doc.content.size, latestJump.from);
        const tr = state.tr
          .setSelection(TextSelection.create(state.doc, restorePos))
          .setMeta(CARET_JUMP_UNDO_RESTORE_META, true)
          .scrollIntoView();
        view.dispatch(tr);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<CaretJumpStack>({
        key: caretJumpUndoPluginKey,
        state: {
          init: () => [],
          apply: (tr, jumpStack) => {
            const jumpMeta = tr.getMeta(CARET_JUMP_UNDO_META);
            if (!tr.docChanged && isCaretJumpUndoMeta(jumpMeta)) {
              return [...jumpStack, jumpMeta];
            }

            if (tr.getMeta(CARET_JUMP_UNDO_RESTORE_META) === true) {
              return jumpStack.slice(0, -1);
            }

            if (tr.docChanged || tr.selectionSet) {
              return [];
            }

            return jumpStack;
          },
        },
      }),
    ];
  },
});
