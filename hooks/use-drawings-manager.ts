import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";

export interface Drawing {
  id: string;
  name: string;
  objects: any[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

const DRAWINGS_STORAGE_KEY = "wireboard-drawings";
const DRAWINGS_BACKUP_KEY = "wireboard-drawings-backup";
const AUTO_SAVE_INTERVAL = 5000; // Auto-save every 5 seconds as backup

export function useDrawingsManager() {
  const [doc] = useState(() => new Y.Doc());
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  const drawingsRef = useRef<Drawing[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(DRAWINGS_STORAGE_KEY);
    if (savedState) {
      try {
        const uint8array = Uint8Array.from(atob(savedState), (c) => c.charCodeAt(0));
        Y.applyUpdate(doc, uint8array);
      } catch (e) {
        console.error("Failed to load drawings:", e);
        // Try to restore from backup if main fails
        const backupState = localStorage.getItem(DRAWINGS_BACKUP_KEY);
        if (backupState) {
          try {
            const uint8array = Uint8Array.from(atob(backupState), (c) => c.charCodeAt(0));
            Y.applyUpdate(doc, uint8array);
            console.warn("Restored from backup");
            setSaveStatus('saved');
          } catch (e2) {
            console.error("Backup restore failed:", e2);
            setSaveStatus('error');
          }
        }
      }
    }

    const yArray = doc.getArray("drawings");

    // Sync from Yjs to React state - use ref to avoid circular updates
    const observer = () => {
      const newDrawings = yArray.toArray() as Drawing[];
      drawingsRef.current = newDrawings;
      setDrawings(newDrawings);
    };
    yArray.observe(observer);
    
    // Initial sync
    const initialDrawings = yArray.toArray() as Drawing[];
    drawingsRef.current = initialDrawings;
    setDrawings(initialDrawings);

    // Save to localStorage on changes with status tracking
    const saver = () => {
      setSaveStatus('saving');
      
      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        try {
          const stateUpdate = Y.encodeStateAsUpdate(doc);
          const base64 = btoa(String.fromCharCode(...stateUpdate));
          localStorage.setItem(DRAWINGS_STORAGE_KEY, base64);
          
          // Also save backup
          const backupState = Y.encodeStateAsUpdate(doc);
          const backupBase64 = btoa(String.fromCharCode(...backupState));
          localStorage.setItem(DRAWINGS_BACKUP_KEY, backupBase64);
          
          setLastSaveTime(Date.now());
          setSaveStatus('saved');
          
          // Reset status after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
          console.error("Save failed:", error);
          setSaveStatus('error');
        }
      }, 300); // Immediate save with small debounce
    };
    
    doc.on("update", saver);

    // Periodic backup every 5 seconds
    const backupInterval = setInterval(() => {
      try {
        const stateUpdate = Y.encodeStateAsUpdate(doc);
        const backupBase64 = btoa(String.fromCharCode(...stateUpdate));
        localStorage.setItem(DRAWINGS_BACKUP_KEY, backupBase64);
      } catch (error) {
        console.error("Backup failed:", error);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      yArray.unobserve(observer);
      doc.off("update", saver);
      clearInterval(backupInterval);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [doc]);

  // Create a new drawing
  const createDrawing = (name: string): string => {
    const id = `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const drawing: Drawing = {
      id,
      name,
      objects: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const yArray = doc.getArray("drawings");
    doc.transact(() => {
      yArray.push([drawing]);
    });

    setCurrentDrawingId(id);
    return id;
  };

  // Update current drawing - prevent re-triggering observer
  const updateCurrentDrawing = (objects: any[]) => {
    if (!currentDrawingId) return;

    const uniqueObjects = objects.map((obj, idx) => ({
      ...obj,
      id: obj.id || `obj-${idx}`,
    }));

    const yArray = doc.getArray("drawings");
    doc.transact(() => {
      const idx = drawingsRef.current.findIndex((d) => d.id === currentDrawingId);
      if (idx !== -1) {
        const drawing = drawingsRef.current[idx];
        const updated: Drawing = {
          ...drawing,
          objects: uniqueObjects,
          updatedAt: Date.now(),
        };
        yArray.delete(idx, 1);
        yArray.insert(idx, [updated]);
      }
    });
  };

  // Load a drawing
  const loadDrawing = (id: string): any[] => {
    const drawing = drawings.find((d) => d.id === id);
    setCurrentDrawingId(id);
    return drawing?.objects || [];
  };

  // Delete a drawing
  const deleteDrawing = (id: string) => {
    const yArray = doc.getArray("drawings");
    doc.transact(() => {
      const idx = drawingsRef.current.findIndex((d) => d.id === id);
      if (idx !== -1) {
        yArray.delete(idx, 1);
      }
    });

    if (currentDrawingId === id) {
      setCurrentDrawingId(null);
    }
  };

  // Rename a drawing
  const renameDrawing = (id: string, newName: string) => {
    const yArray = doc.getArray("drawings");
    doc.transact(() => {
      const idx = drawingsRef.current.findIndex((d) => d.id === id);
      if (idx !== -1) {
        const drawing = drawingsRef.current[idx];
        const updated: Drawing = {
          ...drawing,
          name: newName,
          updatedAt: Date.now(),
        };
        yArray.delete(idx, 1);
        yArray.insert(idx, [updated]);
      }
    });
  };

  // Get current drawing objects
  const getCurrentDrawingObjects = (): any[] => {
    const drawing = drawings.find((d) => d.id === currentDrawingId);
    return drawing?.objects || [];
  };

  return {
    drawings,
    currentDrawingId,
    setCurrentDrawingId,
    createDrawing,
    updateCurrentDrawing,
    loadDrawing,
    getCurrentDrawingObjects,
    deleteDrawing,
    renameDrawing,
    saveStatus,
    lastSaveTime,
  };
}
