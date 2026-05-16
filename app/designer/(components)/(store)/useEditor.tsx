import { create } from "zustand";

// 1. Strict Layer Architecture
export interface CanvasLayer {
  id: string;
  type: "image" | "text" | "rect" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;       // For vector shapes or solid colors
  src?: string;        // High-res URL path for Unsplash imagery targets
  text?: string;       // Custom content string if type is text
  rotation: number;
  zIndex: number;
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
  { name: "instagram_post", width: 1080, height: 1080, label: "Instagram Square (1:1)" },
  { name: "instagram_story", width: 1080, height: 1920, label: "Instagram Story (9:16)" },
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

  // Stage Collection Engine (For multi-page/multi-artboard mechanics)
  stages: StageInstance[];
  activeStageId: string | null;
  setActiveStage: (id: string) => void;
  createStage: (config: { width: number; height: number; bgColor: string }) => void;
  
  // Layer Manipulation Engine
  addLayerToActiveStage: (layerData: Partial<CanvasLayer>) => void;
  updateLayer: (layerId: string, updates: Partial<CanvasLayer>) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Core Defaults
  selectedTool: "photos",
  pageSize: { width: 1080, height: 1080 },
  canvasBg: "#ffffff",
  stages: [],
  activeStageId: null,

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  setPageSize: (width, height) => set({ pageSize: { width, height } }),
  
  setCanvasBg: (color) => set({ canvasBg: color }),

  applyPreset: (name) => set((state) => {
    const target = CANVAS_PRESETS.find((p) => p.name === name);
    return target ? { pageSize: { width: target.width, height: target.height } } : state;
  }),

  setActiveStage: (id) => set({ activeStageId: id }),

  // Structural Stage Initialization
  createStage: (config) => set((state) => {
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
      stages: [...state.stages, newStage],
      activeStageId: state.activeStageId ? state.activeStageId : newStageId, // Auto-focus if first item
    };
  }),

  // Add asset layers directly inside the selected operational stage layout array
  addLayerToActiveStage: (layerData) => set((state) => {
    if (!state.activeStageId) return state;

    return {
      stages: state.stages.map((stage) => {
        if (stage.id !== state.activeStageId) return stage;

        const baseLayer: CanvasLayer = {
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: layerData.type || "rect",
          x: layerData.x ?? (stage.width - (layerData.width || 200)) / 2, // Centered
          y: layerData.y ?? (stage.height - (layerData.height || 200)) / 2,
          width: layerData.width || 200,
          height: layerData.height || 200,
          rotation: layerData.rotation || 0,
          zIndex: stage.layers.length + 1,
          ...layerData,
        };

        return {
          ...stage,
          layers: [...stage.layers, baseLayer],
        };
      }),
    };
  }),

  // Handle live vector/image drag transforms smoothly without frame drop anomalies
  updateLayer: (layerId, updates) => set((state) => ({
    stages: state.stages.map((stage) => {
      if (stage.id !== state.activeStageId) return stage;
      return {
        ...stage,
        layers: stage.layers.map((layer) => 
          layer.id === layerId ? { ...layer, ...updates } : layer
        ),
      };
    }),
  })),
}));