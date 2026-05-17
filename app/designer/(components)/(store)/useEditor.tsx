import { create } from "zustand";

// 1. Strict Layer Architecture
export interface CanvasLayer {
  id: string;
  type: "image" | "text" | "rect" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string; // For vector shapes or solid colors
  src?: string;  // High-res URL path for Unsplash imagery targets
  text?: string; // Custom content string if type is text
  fontFamily?: string;
  fontWeight?: string;
  stroke?: string;
  strokeWidth?: number;
  align?: "left" | "center" | "right";
  rotation: number;
  zIndex: number;
  fontSize: number; // For text layers, default to 24px
}

// 2. Strict Stage/Page Architecture
export interface StageInstance {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  layers: CanvasLayer[];
}

export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
  label: string;
}

// Global Industry Aspect Boundary Configurations
export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    name: "instagram_post",
    width: 1080,
    height: 1080,
    label: "Instagram Square (1:1)",
  },
  {
    name: "instagram_story",
    width: 1080,
    height: 1920,
    label: "Instagram Story (9:16)",
  },
  { name: "a4_print", width: 794, height: 1123, label: "A4 Document" },
  { name: "custom", width: 800, height: 600, label: "Custom Layout" },
];

interface EditorStore {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;

  // Custom Page Configuration States (Current Global Context)
  pageSize: { width: number; height: number };
  canvasBg: string;
  setPageSize: (width: number, height: number) => void;
  setCanvasBg: (color: string) => void;
  applyPreset: (name: string) => void;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;

  // History Core Stacks
  past: StageInstance[][];   // Matrix tracking snapshot historical versions of the stages array
  future: StageInstance[][]; // Matrix tracking undone states available to restore

  // History Control Mechanisms
  undo: () => void;
  redo: () => void;

  // Stage Collection Engine (For multi-page/multi-artboard mechanics)
  stages: StageInstance[];
  activeStageId: string | null;
  setActiveStage: (id: string) => void;
  createStage: (config: {
    width: number;
    height: number;
    bgColor: string;
  }) => void;

  // Layer Manipulation Engine
  addLayerToActiveStage: (layerData: Partial<CanvasLayer>) => void;
  updateLayer: (layerId: string, updates: Partial<CanvasLayer>) => void;
  updateLayerOrder: (layerId: string, newIndex: number) => void;
  modifyLayerProperties: (layerId: string, props: Partial<CanvasLayer>) => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
}

// Helper to deep clone current stages before modifying state to prevent shared reference leaks
const cloneStages = (stages: StageInstance[]): StageInstance[] => {
  return JSON.parse(JSON.stringify(stages));
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Core Defaults
  selectedTool: "photos",
  pageSize: { width: 1080, height: 1080 },
  canvasBg: "#ffffff",
  stages: [],
  activeStageId: null,
  selectedLayerId: null,
  past: [],
  future: [],
  
  setSelectedLayerId: (id) => set({ selectedLayerId: id }),

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  setPageSize: (width, height) => set({ pageSize: { width, height } }),

  setCanvasBg: (color) => set({ canvasBg: color }),

  applyPreset: (name) =>
    set((state) => {
      const target = CANVAS_PRESETS.find((p) => p.name === name);
      return target
        ? { pageSize: { width: target.width, height: target.height } }
        : state;
    }),

  setActiveStage: (id) => set({ activeStageId: id }),

  // --- HISTORY CONTROL MECHANISMS ---
  undo: () => {
    const { past, stages, future } = get();
    if (past.length === 0) return; // No past stack to return to

    const previousSnapshot = past[past.length - 1];
    const updatedPast = past.slice(0, past.length - 1);

    set({
      past: updatedPast,
      // Push current active layout structure to future array for standard redo access
      future: [cloneStages(stages), ...future],
      stages: previousSnapshot,
      selectedLayerId: null, // Wipe active transformers to eliminate rendering scale bugs
    });
  },

  redo: () => {
    const { past, stages, future } = get();
    if (future.length === 0) return; // Forward track empty

    const nextSnapshot = future[0];
    const updatedFuture = future.slice(1);

    set({
      past: [...past, cloneStages(stages)],
      future: updatedFuture,
      stages: nextSnapshot,
      selectedLayerId: null,
    });
  },

  // Structural Stage Initialization
  createStage: (config) =>
    set((state) => {
      const currentSnapshot = cloneStages(state.stages);
      const newStageId = `stage-${Date.now()}`;
      const newStage: StageInstance = {
        id: newStageId,
        name: `Page ${state.stages.length + 1}`,
        width: config.width,
        height: config.height,
        backgroundColor: config.bgColor,
        layers: [],
      };

      return {
        past: [...state.past, currentSnapshot],
        future: [], // New user mutation clears structural future trajectory paths
        stages: [...state.stages, newStage],
        activeStageId: state.activeStageId ? state.activeStageId : newStageId,
      };
    }),

  // Add asset layers directly inside the selected operational stage layout array
  addLayerToActiveStage: (layerData) =>
    set((state) => {
      if (!state.activeStageId) return state;

      const currentSnapshot = cloneStages(state.stages);
      
      const updatedStages = state.stages.map((stage) => {
        if (stage.id !== state.activeStageId) return stage;

        const baseLayer: CanvasLayer = {
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: layerData.type || "rect",
          x: layerData.x ?? (stage.width - (layerData.width || 200)) / 2,
          y: layerData.y ?? (stage.height - (layerData.height || 200)) / 2,
          width: layerData.width || 200,
          height: layerData.height || 200,
          rotation: layerData.rotation || 0,
          zIndex: stage.layers.length + 1,
          fill: layerData.fill || "#cccccc",
          fontSize: layerData.fontSize || 24,
          ...layerData,
        } as CanvasLayer;

        return {
          ...stage,
          layers: [...stage.layers, baseLayer],
        };
      });

      return {
        past: [...state.past, currentSnapshot],
        future: [],
        stages: updatedStages,
      };
    }),

  // Handle live vector/image drag transforms smoothly without frame drop anomalies
  updateLayer: (layerId, updates) =>
    set((state) => {
      const currentSnapshot = cloneStages(state.stages);
      
      const updatedStages = state.stages.map((stage) => {
        if (stage.id !== state.activeStageId) return stage;
        return {
          ...stage,
          layers: stage.layers.map((layer) =>
            layer.id === layerId ? { ...layer, ...updates } : layer,
          ),
        };
      });

      return {
        past: [...state.past, currentSnapshot],
        future: [],
        stages: updatedStages,
      };
    }),

  // Reorder a layer within the active stage's layers array and normalize zIndex
  updateLayerOrder: (layerId, newIndex) =>
    set((state) => {
      if (!state.activeStageId) return state;
      const currentSnapshot = cloneStages(state.stages);

      const updatedStages = state.stages.map((stage) => {
        if (stage.id !== state.activeStageId) return stage;

        const idx = stage.layers.findIndex((l) => l.id === layerId);
        if (idx === -1) return stage;

        // Clamp newIndex
        const boundedIndex = Math.max(0, Math.min(newIndex, stage.layers.length - 1));

        const layersCopy = stage.layers.slice();
        const [moved] = layersCopy.splice(idx, 1);
        layersCopy.splice(boundedIndex, 0, moved);

        // Recompute zIndex based on order (1..n)
        const normalized = layersCopy.map((l, i) => ({ ...l, zIndex: i + 1 }));

        return {
          ...stage,
          layers: normalized,
        };
      });

      return {
        past: [...state.past, currentSnapshot],
        future: [],
        stages: updatedStages,
      };
    }),

  // Modify arbitrary layer properties (alias that ensures history and keeps zIndex intact)
  modifyLayerProperties: (layerId, props) =>
    set((state) => {
      if (!state.activeStageId) return state;
      const currentSnapshot = cloneStages(state.stages);

      const updatedStages = state.stages.map((stage) => {
        if (stage.id !== state.activeStageId) return stage;
        return {
          ...stage,
          layers: stage.layers.map((layer) =>
            layer.id === layerId ? { ...layer, ...props } : layer,
          ),
        };
      });

      return {
        past: [...state.past, currentSnapshot],
        future: [],
        stages: updatedStages,
      };
    }),

  // Remove a layer from the active stage
  deleteLayer: (layerId) =>
    set((state) => {
      if (!state.activeStageId) return state;
      const currentSnapshot = cloneStages(state.stages);

      const updatedStages = state.stages.map((stage) => {
        if (stage.id !== state.activeStageId) return stage;
        const filtered = stage.layers.filter((l) => l.id !== layerId);
        // Re-normalize zIndex
        const normalized = filtered.map((l, i) => ({ ...l, zIndex: i + 1 }));
        return {
          ...stage,
          layers: normalized,
        };
      });

      return {
        past: [...state.past, currentSnapshot],
        future: [],
        stages: updatedStages,
        selectedLayerId: state.selectedLayerId === layerId ? null : state.selectedLayerId,
      };
    }),

  // Duplicate a layer within the active stage (offset position slightly)
  duplicateLayer: (layerId) =>
    set((state) => {
      if (!state.activeStageId) return state;
      const currentSnapshot = cloneStages(state.stages);

      const updatedStages = state.stages.map((stage) => {
        if (stage.id !== state.activeStageId) return stage;

        const src = stage.layers.find((l) => l.id === layerId);
        if (!src) return stage;

        const newLayer: CanvasLayer = {
          ...JSON.parse(JSON.stringify(src)),
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: src.x + 10,
          y: src.y + 10,
          zIndex: stage.layers.length + 1,
        };

        return {
          ...stage,
          layers: [...stage.layers, newLayer],
        };
      });

      return {
        past: [...state.past, currentSnapshot],
        future: [],
        stages: updatedStages,
      };
    }),
}));