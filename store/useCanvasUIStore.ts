import { create } from "zustand";

interface CanvasUIState {
  scale: number;
  stagePos: { x: number; y: number };
  selectedIds: string[];
  groupDraftIds: string[];
  layerRenameId: string | null;
  layerRenameValue: string;
  isWorkspacePanelCollapsed: boolean;
  scriptEditorOpen: boolean;
  spriteManagerOpen: boolean;
  selectedSpriteForScript: any;
  selectedSpriteForManager: any;
  canvasBackground: string;
  activeTool: "select" | "draw" | "pan";
  drawTool: "brush" | "eraser" | "line";
  drawColor: string;
  drawSize: number;
  drawStyle: "solid" | "dashed";
  cursorPos: { x: number; y: number };
  isPanning: boolean;
  clipboard: any[] | null;
  redoStack: any[];

  // Actions
  setScale: (scale: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setSelectedIds: (ids: string[]) => void;
  setGroupDraftIds: (ids: string[]) => void;
  setLayerRenameId: (id: string | null) => void;
  setLayerRenameValue: (value: string) => void;
  setIsWorkspacePanelCollapsed: (collapsed: boolean) => void;
  setScriptEditorOpen: (open: boolean) => void;
  setSpriteManagerOpen: (open: boolean) => void;
  setSelectedSpriteForScript: (sprite: any) => void;
  setSelectedSpriteForManager: (sprite: any) => void;
  setCanvasBackground: (color: string) => void;
  setActiveTool: (tool: any) => void;
  setDrawTool: (tool: any) => void;
  setDrawColor: (color: string) => void;
  setDrawSize: (size: number) => void;
  setDrawStyle: (style: any) => void;
  setCursorPos: (pos: { x: number; y: number }) => void;
  setIsPanning: (panning: boolean) => void;
  setClipboard: (items: any[] | null) => void;
  setRedoStack: (items: any[]) => void;
}

export const useCanvasUIStore = create<CanvasUIState>((set) => ({
  scale: 1,
  stagePos: { x: 0, y: 0 },
  selectedIds: [],
  groupDraftIds: [],
  layerRenameId: null,
  layerRenameValue: "",
  isWorkspacePanelCollapsed: false,
  scriptEditorOpen: false,
  spriteManagerOpen: false,
  selectedSpriteForScript: null,
  selectedSpriteForManager: null,
  canvasBackground: "#000",
  activeTool: "select",
  drawTool: "brush",
  drawColor: "#111827",
  drawSize: 3,
  drawStyle: "solid",
  cursorPos: { x: 0, y: 0 },
  isPanning: false,
  clipboard: null,
  redoStack: [],

  setScale: (scale) => set({ scale }),
  setStagePos: (pos) => set({ stagePos: pos }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setGroupDraftIds: (ids) => set({ groupDraftIds: ids }),
  setLayerRenameId: (id) => set({ layerRenameId: id }),
  setLayerRenameValue: (value) => set({ layerRenameValue: value }),
  setIsWorkspacePanelCollapsed: (collapsed) => set({ isWorkspacePanelCollapsed: collapsed }),
  setScriptEditorOpen: (open) => set({ scriptEditorOpen: open }),
  setSpriteManagerOpen: (open) => set({ spriteManagerOpen: open }),
  setSelectedSpriteForScript: (sprite) => set({ selectedSpriteForScript: sprite }),
  setSelectedSpriteForManager: (sprite) => set({ selectedSpriteForManager: sprite }),
  setCanvasBackground: (color) => set({ canvasBackground: color }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setDrawTool: (tool) => set({ drawTool: tool }),
  setDrawColor: (color) => set({ drawColor: color }),
  setDrawSize: (size) => set({ drawSize: size }),
  setDrawStyle: (style) => set({ drawStyle: style }),
  setCursorPos: (pos) => set({ cursorPos: pos }),
  setIsPanning: (panning) => set({ isPanning: panning }),
  setClipboard: (items) => set({ clipboard: items }),
  setRedoStack: (items) => set({ redoStack: items }),
}));
