"use client";

import React, { useState } from "react";
import { useDrawings } from "@/providers/DrawingsProvider";
import { Trash2, FileText, Plus, Edit2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DrawingsList() {
  const { drawings, currentDrawingId, createDrawing, deleteDrawing, renameDrawing, setCurrentDrawingId } = useDrawings();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    const name = prompt("Enter drawing name:", `Drawing ${drawings.length + 1}`);
    if (name) {
      createDrawing(name);
    }
  };

  const handleRename = (id: string) => {
    const drawing = drawings.find((d) => d.id === id);
    if (drawing) {
      setEditingId(id);
      setEditName(drawing.name);
    }
  };

  const handleSaveName = (id: string) => {
    if (editName.trim()) {
      renameDrawing(id, editName);
    }
    setEditingId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="w-full">
      <button
        onClick={handleCreate}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors mb-2"
      >
        <Plus className="w-4 h-4" />
        New Drawing
      </button>

      <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
        {drawings.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-sidebar-foreground/50">
            <p className="mb-2">No drawings yet.</p>
            <p className="text-[11px]">Click \"New Drawing\" to start!</p>
          </div>
        ) : (
          drawings.map((drawing) => (
            <div
              key={drawing.id}
              className={cn(
                "group relative flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                currentDrawingId === drawing.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 cursor-pointer"
              )}
            >
              <FileText className="w-4 h-4 shrink-0 opacity-60" />

              {editingId === drawing.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName(drawing.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 bg-sidebar-accent/30 px-2 py-0.5 rounded text-xs text-sidebar-accent-foreground outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  onClick={() => setCurrentDrawingId(drawing.id)}
                  className={cn(
                    "flex-1 min-w-0 cursor-pointer p-1 rounded transition-colors",
                    currentDrawingId === drawing.id && "bg-sidebar-accent/50"
                  )}
                >
                  <div className="truncate text-xs font-medium">{drawing.name}</div>
                  <div className="text-[10px] opacity-60">{formatDate(drawing.updatedAt)}</div>
                </div>
              )}

              {editingId === drawing.id ? (
                <>
                  <button
                    onClick={() => handleSaveName(drawing.id)}
                    className="p-1 rounded hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(drawing.id);
                    }}
                    className="p-1 rounded hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${drawing.name}"?`)) {
                        deleteDrawing(drawing.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
