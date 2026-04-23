import { useEffect, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

export function useCanvasPersistence(setObjects: (data: any[]) => void) {
  const [doc] = useState(() => new Y.Doc());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Use IndexedDB instead of LocalStorage (it's faster and has more space)
    // This replaces all your manual btoa/atob and saveInterval logic.
    const indexeddbProvider = new IndexeddbPersistence("wireboard-stage-data", doc);

    // Y.Map is better for "ID-based" objects like canvas shapes
    const yShapes = doc.getMap("canvas-shapes");

    const observer = () => {
      // Convert Y.Map values back to a React-friendly array
      const data = Array.from(yShapes.values());
      setObjects(data);
    };

    yShapes.observe(observer);

    indexeddbProvider.on("synced", () => {
      observer(); // Initial state sync once DB is loaded
      setIsInitialized(true);
      console.log("Persistence synced from IndexedDB");
    });

    return () => {
      yShapes.unobserve(observer);
      indexeddbProvider.destroy();
    };
  }, [doc, setObjects]);

  // Optimized: Only update the specific object that changed
  const updateSingleObject = (id: string, attributes: any) => {
    const yShapes = doc.getMap("canvas-shapes");
    const existing = yShapes.get(id) as any;
    
    yShapes.set(id, {
      ...existing,
      ...attributes,
      id, // Ensure ID stays consistent
    });
  };

  // Bulk update (used for initial loads or massive changes)
  const syncToYjs = (newObjects: any[]) => {
    const yShapes = doc.getMap("canvas-shapes");
    doc.transact(() => {
      newObjects.forEach((obj) => {
        // Only set if it actually changed to save CPU
        const current = yShapes.get(obj.id);
        if (JSON.stringify(current) !== JSON.stringify(obj)) {
          yShapes.set(obj.id, obj);
        }
      });
    });
  };

  return { syncToYjs, updateSingleObject, isInitialized };
}