import { useEffect, useState } from "react";
import * as Y from "yjs";

const STORAGE_KEY = "wireboard-stage-data";

export function useCanvasPersistence(setObjects: (data: any[]) => void) {
  const [doc] = useState(() => new Y.Doc());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Load from LocalStorage on Mount
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const uint8array = Uint8Array.from(atob(savedState), (c) => c.charCodeAt(0));
        Y.applyUpdate(doc, uint8array);
      } catch (e) {
        console.error("Failed to load persisted state:", e);
      }
    }

    const yArray = doc.getArray("canvas-objects");

    // 2. Sync Yjs changes to React State
    const observer = () => {
      const data = yArray.toArray();
      // Filter out any duplicates based on ID
      const uniqueData = Array.from(new Map(data.map((item: any) => [item.id, item])).values());
      setObjects(uniqueData);
    };
    yArray.observe(observer);
    
    // Initial sync
    const initialData = yArray.toArray();
    const uniqueInitial = Array.from(new Map(initialData.map((item: any) => [item.id, item])).values());
    setObjects(uniqueInitial);
    setIsInitialized(true);

    // 3. Save to LocalStorage on every Yjs change
    const saver = () => {
      if (typeof window !== "undefined") {
        const stateUpdate = Y.encodeStateAsUpdate(doc);
        const base64 = btoa(String.fromCharCode(...stateUpdate));
        localStorage.setItem(STORAGE_KEY, base64);
      }
    };
    doc.on("update", saver);

    return () => {
      yArray.unobserve(observer);
      doc.off("update", saver);
    };
  }, [doc, setObjects]);

  // Function to push updates TO Yjs (which then triggers the save)
  const syncToYjs = (newObjects: any[]) => {
    const yArray = doc.getArray("canvas-objects");
    // Filter duplicates before syncing
    const uniqueObjects = Array.from(new Map(newObjects.map((item: any) => [item.id, item])).values());
    doc.transact(() => {
      yArray.delete(0, yArray.length);
      yArray.push(uniqueObjects);
    });
  };

  return { syncToYjs, isInitialized };
}