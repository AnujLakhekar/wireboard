"use client";
import React, { useEffect, useState } from "react";
import { useEditorStore } from "../(store)/useEditor";
import { Move, RotateCw, Maximize2, Trash2, Text } from "lucide-react";

const ObjectController = () => {
  const {
    stages,
    activeStageId,
    selectedLayerId,
    setSelectedLayerId,
    modifyLayerProperties, // Assumed mutation action in your Zustand store
    deleteLayer, // Assumed deletion action in your Zustand store
    setSelectedTool, // Action to switch active tool in the editor
    setIsOpen,
  } = useEditorStore();

  const activeStage = stages.find((s) => s.id === activeStageId);
  const activeLayer = activeStage?.layers.find((l) => l.id === selectedLayerId);

  useEffect(() => {
    if (!activeLayer) return;
    if (activeLayer.type === "text") {
      setSelectedTool("texteditor");
    } else if (activeLayer.type === "image") {
      setSelectedTool("photoeditor");
    } else if (!selectedLayerId) {
      setIsOpen(false); // Open the panel for non-text/image layers but do not switch tool
    } else {
      setIsOpen(false);
    }
  }, [activeLayer, setSelectedTool]);

  // Derive panel visibility directly from state during render to avoid useEffect synchronization bugs
  const isOpen = !!activeLayer;

  if (!isOpen) return null;

  // Handle real-time layout mutation inputs
  const handlePropertyChange = (property: string, value: number | string) => {
    if (!selectedLayerId || !activeStageId) return;

    modifyLayerProperties(activeLayer.id, {
      [property]: value,
    });
  };

  const handleDelete = () => {
    if (!selectedLayerId || !activeStageId) return;
    deleteLayer(selectedLayerId);
    setSelectedLayerId(null); // Clear selection state
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/3 z-40 w-auto min-w-[400px] max-w-[90vw] bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-xl shadow-2xl p-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Component Structural Identifier */}
      <div className="flex items-center gap-2 border-r border-zinc-800 pr-3">
        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 select-none">
          {activeLayer.type}
        </span>
      </div>

      {/* Numerical Coordinate Transforms Controls (X, Y) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-medium">X</span>
          <input
            type="number"
            value={Math.round(activeLayer.x || 0)}
            onChange={(e) => handlePropertyChange("x", Number(e.target.value))}
            className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-medium">Y</span>
          <input
            type="number"
            value={Math.round(activeLayer.y || 0)}
            onChange={(e) => handlePropertyChange("y", Number(e.target.value))}
            className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      <div className="h-4 w-[1px] bg-zinc-800" />

      {/* Scale Dimensions Bounds Controls (Width, Height) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-medium">W</span>
          <input
            type="number"
            value={Math.round(activeLayer.width || 0)}
            onChange={(e) =>
              handlePropertyChange("width", Math.max(1, Number(e.target.value)))
            }
            className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-medium">H</span>
          <input
            type="number"
            value={Math.round(activeLayer.height || 0)}
            onChange={(e) =>
              handlePropertyChange(
                "height",
                Math.max(1, Number(e.target.value)),
              )
            }
            className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="h-4 w-[1px] bg-zinc-800" />

      {/* Rotation Transform (0° - 360°) */}
      <div className="flex items-center gap-2">
        <RotateCw
          onClick={(e) => handlePropertyChange("rotation", Number(0))}
          className="w-3.5 h-3.5 text-zinc-500"
        />
        <input
          type="number"
          value={Math.round(activeLayer.rotation || 0)}
          onChange={(e) =>
            handlePropertyChange("rotation", Number(e.target.value))
          }
          className="w-14 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Rotation Transform (0° - 360°) */}
      {activeLayer.type == "text" && (
        <div className="flex items-center gap-2">
          <Text className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={activeLayer.text}
            onChange={(e) =>
              handlePropertyChange("text", String(e.target.value))
            }
            className="max-w-[100px] bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Absolute Utility Actions (Destructive Deletion) */}
      <div className="flex items-center border-l border-zinc-800 pl-3 ml-auto">
        <button
          type="button"
          onClick={handleDelete}
          className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-red-400 rounded-md transition-colors cursor-pointer"
          title="Delete layer from canvas stage"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ObjectController;
