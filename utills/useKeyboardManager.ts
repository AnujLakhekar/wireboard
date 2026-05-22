"use client";
import { useEditorStore } from "@/app/designer/(components)/(store)/useEditor";
import { useEffect } from "react";

export const useKeyboardManager = () => {
  const {
    deleteLayer,
    selectedLayerId,
    setSelectedLayerId,
    addLayerToActiveStage,
    duplicateLayer,
    setAlignGridMode,
  } = useEditorStore();

  const stage = useEditorStore((state) =>
    state.stages.find((s) => s.id === state.activeStageId),
  );
  const layers = stage ? stage.layers : [];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 1. CRITICAL GUARD: Bypass hotkeys if the user is typing in a text area or input field
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      // 2. Extract key flags for cleaner condition matching
      const key = event.key.toLowerCase();
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;

      // 3. Command Matrix Router
      switch (key) {
        // Delete or Backspace -> Drops targeted active node
        case "delete":
        case "backspace":
          if (selectedLayerId) {
            event.preventDefault();
            deleteLayer(selectedLayerId);
          }
          break;

        // Escape -> Unfocus current active transform layer
        case "escape":
          event.preventDefault();
          setSelectedLayerId(null);
          break;

        case "t":
          if (isCmdOrCtrl && isShift) {
            return;
          }

          addLayerToActiveStage({
            id: `layer-${Date.now()}`,
            type: "text",
            x: 0,
            y: 0,
            width: selectedLayerId
              ? (layers.find((l) => l.id === selectedLayerId)?.width ?? 80) + 20
              : 100,
            height: selectedLayerId
              ? (layers.find((l) => l.id === selectedLayerId)?.height ?? 80) +
                20
              : 100,
            text: "New Text Layer",
            fill:
              layers.find((l) => l.id === selectedLayerId)?.fill || "#000000",
            fontSize: 24,
          });

          break;

        case "c":
          if (isCmdOrCtrl) {
            duplicateLayer(
              layers.find((l) => l.id === selectedLayerId)?.id || "",
            );
          }

          break;

        default:
          break;
      }
    };

    // Bind real listener context down directly to the macro window viewport
    window.addEventListener("keydown", handleKeyDown);

    // Clean memory leakage profiles dynamically during unmount routines
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedLayerId,
    deleteLayer,
    setSelectedLayerId,
    addLayerToActiveStage,
    duplicateLayer,
    setAlignGridMode,
  ]);
};
