"use client";
import React, { useState } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function CanvasWithMenu({ objects, setObjects }: any) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDelete = () => {
    if (selectedId) {
      setObjects((prev: any[]) => prev.filter((obj) => obj.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleDuplicate = () => {
    const objToClone = objects.find((o: any) => o.id === selectedId);
    if (objToClone) {
      const newNode = {
        ...objToClone,
        id: `${objToClone.type}-${Date.now()}`,
        x: objToClone.x + 20,
        y: objToClone.y + 20,
      };
      setObjects([...objects, newNode]);
    }
  };

  return (
    <ContextMenu>
      {/* Wrap the Stage in the Trigger */}
      <ContextMenuTrigger className="w-full h-full">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          onContextMenu={(e) => {
            // This is the Konva event. We use it to find which node was clicked
            const pkg = e.target;
            const stage = pkg.getStage();

            if (pkg === stage) {
              // Right-clicked the empty background
              setSelectedId(null);
            } else {
              // Right-clicked a specific shape
              setSelectedId(pkg.id());
            }
          }}
        >
          <Layer>
            {objects.map((obj: any) => (
              <Rect
                key={obj.id}
                {...obj}
                // Ensure ID is passed to the underlying Konva node
                id={obj.id} 
              />
            ))}
          </Layer>
        </Stage>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64">
        {selectedId ? (
          /* SHAPE SPECIFIC ACTIONS */
          <>
            <ContextMenuItem onClick={handleDuplicate}>
              Duplicate Shape
              <ContextMenuShortcut>⌘D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={handleDelete}>
              Delete
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        ) : (
          /* GENERAL CANVAS ACTIONS */
          <>
            <ContextMenuItem>
              New Layer
            </ContextMenuItem>
            <ContextMenuItem>
              Paste
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}