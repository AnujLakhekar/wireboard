import { useEffect, useState, useCallback, useRef } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

export interface Drawing {
  id: string;
  name: string;
  objects: any[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export function useDrawingsManager() {
  const [doc] = useState(() => new Y.Doc());
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaving = useCallback(() => {
    if (saveStatusTimerRef.current) {
      clearTimeout(saveStatusTimerRef.current);
    }

    setSaveStatus('saving');
    setLastSaveTime(Date.now());
    saveStatusTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 250);
  }, []);

  useEffect(() => {
    // 1. Connect to IndexedDB (handles auto-save and persistence automatically)
    const provider = new IndexeddbPersistence("wireboard-app-db", doc);
    const yDrawingsMap = doc.getMap<Drawing>("drawings-map");

    // 2. Observer: Updates React state whenever Yjs data changes
    const observer = () => {
      // Convert Map values to Array for the UI list, sorted by date
      const drawingsArray = Array.from(yDrawingsMap.values()).sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      setDrawings(drawingsArray);
    };

    yDrawingsMap.observe(observer);

    provider.on("synced", () => {
      observer(); // Initial sync
      setIsSynced(true);
      setSaveStatus('saved');
      setLastSaveTime(Date.now());
    });

    return () => {
      yDrawingsMap.unobserve(observer);
      provider.destroy();
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, [doc]);

  // Create a new drawing
  const createDrawing = useCallback((name: string): string => {
    markSaving();
    const id = crypto.randomUUID();
    const newDrawing: Drawing = {
      id,
      name,
      objects: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    doc.getMap("drawings-map").set(id, newDrawing);
    setCurrentDrawingId(id);
    return id;
  }, [doc, markSaving]);

  // Update current drawing (Optimized: No delete/insert dance)
  const updateCurrentDrawing = useCallback((objects: any[]) => {
    if (!currentDrawingId) return;
    markSaving();

    const yDrawingsMap = doc.getMap("drawings-map");
    const existing = yDrawingsMap.get(currentDrawingId);

    if (existing) {
      // transacting ensures this is treated as one single atomic update
      doc.transact(() => {
        yDrawingsMap.set(currentDrawingId, {
          ...existing,
          objects,
          updatedAt: Date.now(),
        });
      });
    }
  }, [currentDrawingId, doc, markSaving]);

  const deleteDrawing = useCallback((id: string) => {
    markSaving();
    doc.getMap("drawings-map").delete(id);
    if (currentDrawingId === id) setCurrentDrawingId(null);
  }, [currentDrawingId, doc, markSaving]);

  const renameDrawing = useCallback((id: string, newName: string) => {
    markSaving();
    const yDrawingsMap = doc.getMap("drawings-map");
    const existing = yDrawingsMap.get(id);
    if (existing) {
      yDrawingsMap.set(id, { ...existing, name: newName, updatedAt: Date.now() });
    }
  }, [doc, markSaving]);

  return {
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
    // Helper to get the actual drawing object
    currentDrawing: drawings.find(d => d.id === currentDrawingId) || null
  };
}