import { Plus } from "lucide-react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { insertGroupListInstanceAt } from "../../utils/insert-group-list-instance";

function findParentGroupListId(instancePos: number, nodeViewProps: NodeViewProps) {
  const { editor } = nodeViewProps;
  const $pos = editor.state.doc.resolve(instancePos);

  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.name !== "groupList") continue;

    const groupListId = node.attrs.groupListId;
    if (typeof groupListId === "string" && groupListId.length > 0) {
      return groupListId;
    }
  }

  return null;
}

export function GroupListInstanceView(props: NodeViewProps) {
  const { node, getPos } = props;

  const handleAddBelow = () => {
    const instancePos = getPos();
    if (typeof instancePos !== "number") return;

    const groupListId = findParentGroupListId(instancePos, props);
    if (!groupListId) return;

    insertGroupListInstanceAt(props.editor, groupListId, instancePos + node.nodeSize);
  };

  return (
    <NodeViewWrapper
      className="relative -ml-7 pl-7 [&:hover>.instance-add-btn]:opacity-100 [&:hover>.instance-add-btn]:pointer-events-auto"
      data-type="group-list-instance"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        contentEditable={false}
        aria-label="Add instance below"
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleAddBelow}
        className="instance-add-btn absolute left-1 top-0 z-10 opacity-0 pointer-events-none transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <Plus />
      </Button>
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
