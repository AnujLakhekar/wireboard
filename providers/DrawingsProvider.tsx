"use client";

import React, { createContext, useContext } from "react";
import { useDrawingsManager } from "@/hooks/use-drawings-manager";

interface DrawingsContextType {
  drawings: Array<{
    id: string;
    name: string;
    objects: unknown[];
    createdAt: number;
    updatedAt: number;
    thumbnail?: string;
  }>;
  currentDrawingId: string | null;
  setCurrentDrawingId: (id: string | null) => void;
  createDrawing: (name: string) => string;
  updateCurrentDrawing: (objects: unknown[]) => void;
  deleteDrawing: (id: string) => void;
  renameDrawing: (id: string, newName: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveTime: number;
  isSynced: boolean;
  cloudStatus: 'signed-out' | 'syncing' | 'synced' | 'error';
  isAuthLoading: boolean;
  cloudDrawingCount: number;
  localOnlyDrawingCount: number;
  isDrawingLocalOnly: (drawingId: string) => boolean;
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
    cloudStatus,
    isAuthLoading,
    cloudDrawingCount,
    localOnlyDrawingCount,
    isDrawingLocalOnly,
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
    cloudStatus,
    isAuthLoading,
    cloudDrawingCount,
    localOnlyDrawingCount,
    isDrawingLocalOnly,
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
