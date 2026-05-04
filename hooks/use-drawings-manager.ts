import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface Drawing {
  id: string;
  name: string;
  objects: unknown[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

type RemoteDrawing = {
  _id: string;
  clientId?: string;
  title: string;
  data: string;
  updatedAt?: number;
  createdAt?: number;
  thumbnail?: string;
};

type CloudStatus = "signed-out" | "syncing" | "synced" | "error";

export function useDrawingsManager() {
  const [doc] = useState(() => new Y.Doc());
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<number>(() => Date.now());
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCloudSyncRef = useRef<Record<string, number>>({});
  const applyingRemoteRef = useRef(false);

  // Convex hooks: remote list and mutation
  const remoteDrawingsResult = useQuery(api.drawings.listForUser);
  const remoteDrawings = useMemo(
    () => remoteDrawingsResult ?? [],
    [remoteDrawingsResult],
  );
  const upsertDrawingMutation = useMutation(api.drawings.upsertDrawing);
  const deleteDrawingMutation = useMutation(api.drawings.deleteDrawing);
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();

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

  useEffect(() => {
    if (!isSynced || remoteDrawings.length === 0) return;

    applyingRemoteRef.current = true;
    const yDrawingsMap = doc.getMap<Drawing>("drawings-map");

    doc.transact(() => {
      for (const remoteDrawing of remoteDrawings as RemoteDrawing[]) {
        try {
          const clientId = remoteDrawing.clientId ?? remoteDrawing._id;
          if (!clientId) continue;

          const remoteUpdated = remoteDrawing.updatedAt ?? 0;
          const payload =
            typeof remoteDrawing.data === "string"
              ? JSON.parse(remoteDrawing.data)
              : remoteDrawing.data;

          const local = yDrawingsMap.get(clientId);
          const localUpdated = local?.updatedAt ?? 0;

          if (!local || remoteUpdated >= localUpdated) {
            yDrawingsMap.set(clientId, {
              id: clientId,
              name: payload?.name ?? remoteDrawing.title ?? "Untitled",
              objects: payload?.objects ?? [],
              createdAt: payload?.createdAt ?? remoteDrawing.createdAt ?? Date.now(),
              updatedAt: remoteUpdated || Date.now(),
              thumbnail: payload?.thumbnail,
            });
            lastCloudSyncRef.current[clientId] = remoteUpdated || Date.now();
          }
        } catch (error) {
          console.warn("Failed to merge remote drawing", error);
        }
      }
    });

    queueMicrotask(() => {
      applyingRemoteRef.current = false;
    });
  }, [doc, isSynced, remoteDrawings]);

  // Push local changes to Convex (debounced) when drawings or sync state changes
  useEffect(() => {
    if (!isSynced) return;
    if (isAuthLoading || !isAuthenticated) return;
    if (applyingRemoteRef.current) return;

    const timer = setTimeout(() => {
      (async () => {
        for (const d of drawings) {
          try {
            const lastCloud = lastCloudSyncRef.current[d.id] ?? 0;
            if ((d.updatedAt ?? 0) > lastCloud) {
              await upsertDrawingMutation({
                clientId: d.id,
                title: d.name,
                data: JSON.stringify(d),
                updatedAt: d.updatedAt ?? Date.now(),
              });
              lastCloudSyncRef.current[d.id] = d.updatedAt ?? Date.now();
            }
          } catch (e) {
            console.warn("Failed to upsert drawing to cloud", e);
            setSaveStatus("error");
          }
        }
      })();
    }, 500);

    return () => clearTimeout(timer);
  }, [drawings, isAuthenticated, isAuthLoading, isSynced, upsertDrawingMutation]);

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
  const updateCurrentDrawing = useCallback((objects: unknown[]) => {
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

    if (isAuthenticated) {
      void deleteDrawingMutation({ clientId: id }).catch((error) => {
        console.warn("Failed to delete drawing from cloud", error);
        setSaveStatus("error");
      });
    }
  }, [currentDrawingId, deleteDrawingMutation, doc, isAuthenticated, markSaving]);

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
    isCloudSynced: Boolean(isAuthenticated && isSynced),
    cloudStatus: (isAuthLoading
      ? "syncing"
      : isAuthenticated
        ? (isSynced ? "synced" : "syncing")
        : "signed-out") as CloudStatus,
    // Helper to get the actual drawing object
    currentDrawing: drawings.find(d => d.id === currentDrawingId) || null
  };
}