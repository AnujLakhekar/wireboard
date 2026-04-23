"use client";

import React, { createContext, useContext } from "react";
import { useDrawingsManager } from "@/hooks/use-drawings-manager";

interface DrawingsContextType {
  drawings: any[];
  currentDrawingId: string | null;
  setCurrentDrawingId: (id: string | null) => void;
  createDrawing: (name: string) => string;
  updateCurrentDrawing: (objects: any[]) => void;
  deleteDrawing: (id: string) => void;
  renameDrawing: (id: string, newName: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveTime: number;
  isSynced: boolean;
}

const DrawingsContext = createContext<DrawingsContextType | undefined>(undefined);

export function DrawingsProvider({ children }: { children: React.ReactNode }) {
  const {
    drawings,
    currentDrawingId,
    setCurrentDrawingId,
    createDrawing,
    updateCurrentDrawing,
    deleteDrawing,
    renameDrawing,
    isSynced,
    saveStatus,
    lastSaveTime,
  } = useDrawingsManager();

  const value: DrawingsContextType = {
    drawings,
    currentDrawingId,
    setCurrentDrawingId,
    createDrawing,
    updateCurrentDrawing,
    deleteDrawing,
    renameDrawing,
    isSynced,
    saveStatus,
    lastSaveTime,
  };

  return (
    <DrawingsContext.Provider value={value}>
      {children}
    </DrawingsContext.Provider>
  );
}

export function useDrawings() {
  const context = useContext(DrawingsContext);
  if (!context) {
    throw new Error("useDrawings must be used within DrawingsProvider");
  }
  return context;
}
