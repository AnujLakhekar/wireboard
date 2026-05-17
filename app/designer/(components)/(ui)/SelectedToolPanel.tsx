"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "../(store)/useEditor";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Sliders,
  Check,
  Square,
  Circle,
  Triangle,
  Star,
  Zap,
  Hexagon,
  TrendingUp,
  MoreVertical,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Upload,
  FileImage,
  ImageIcon,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/* ==========================================
   TYPES & INTERFACES
   ========================================== */
interface FilterState {
  color: string | null;
  orientation: "landscape" | "portrait" | "squarish" | null;
}

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  alt_description: string | null;
  urls: {
    regular: string;
    small: string;
  };
  user?: {
    name: string;
    links?: { html: string };
    profile_image?: { small: string };
  };
}

/* ==========================================
   1. TEMPLATES PANEL
   ========================================== */
export const TemplatesPanel = () => (
  <div className="w-full h-full bg-background flex flex-col select-none">
    <div className="py-3 px-4 border-b border-border/50">
      <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
        Templates
      </span>
    </div>
    <div className="p-4 text-xs font-medium text-muted-foreground">
      Templates Panel Content
    </div>
  </div>
);

/* ==========================================
   2. TEXT PANEL (TYPOGRAPHY)
   ========================================== */
export const TextPanel = () => {
  const { pageSize, addLayerToActiveStage } = useEditorStore();
  const [textContent, setTextContent] = useState<string>("Heading Text");
  
  const [settings, setSettings] = useState({
    x: 0,
    y: 0,
    color: {
      gradient: false,
      textCl: "#111827",
    },
    stroke: {
      size: 0,
      color: "#000000",
    },
    font: {
      weight: "700",
      size: 36,
      fontFamily: "sans-serif",
    },
    align: "left" as "left" | "center" | "right",
  });

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleAddText = () => {
    const estimatedWidth = textContent.length * (settings.font.size * 0.6);
    const estimatedHeight = settings.font.size * 1.2;

    const centerX = Math.round((pageSize.width - estimatedWidth) / 2);
    const centerY = Math.round((pageSize.height - estimatedHeight) / 2);

    addLayerToActiveStage({
      type: "text",
      text: textContent,
      x: centerX,
      y: centerY,
      width: Math.round(estimatedWidth),
      height: Math.round(estimatedHeight),
      fontSize: settings.font.size,
      fontFamily: settings.font.fontFamily,
      fontWeight: settings.font.weight,
      align: settings.align,
      fill: settings.color.textCl,
      stroke: settings.stroke.size > 0 ? settings.stroke.color : undefined,
      strokeWidth: settings.stroke.size,
      rotation: 0,
    } as any);
  };

  return (
    <div className="w-full h-full bg-background flex flex-col select-none">
      <div className="py-3 px-4 flex items-center justify-between border-b border-border/50">
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          Typography
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Display Content
          </label>
          <Input
            type="text"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Type canvas text..."
            className="h-8 text-xs bg-muted/20 border-input focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Font & Geometry Layout
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={settings.font.fontFamily}
              onChange={(e) => updateSetting("font", "fontFamily", e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-input bg-muted/20 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
              <option value="cursive">Cursive</option>
            </select>

            <select
              value={settings.font.weight}
              onChange={(e) => updateSetting("font", "weight", e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-input bg-muted/20 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="300">Light (300)</option>
              <option value="400">Regular (400)</option>
              <option value="600">SemiBold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="900">Black (900)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-muted-foreground min-w-[50px]">Align</span>
            <select
              value={settings.align}
              onChange={(e) => setSettings((prev) => ({ ...prev, align: e.target.value as any }))}
              className="h-8 px-2 text-xs rounded-md border border-input bg-muted/20 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-muted-foreground min-w-[50px]">Size (px)</span>
            <Input
              type="number"
              value={settings.font.size}
              onChange={(e) => updateSetting("font", "size", Math.max(1, parseInt(e.target.value) || 0))}
              className="h-8 text-xs bg-muted/20 border-input w-20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Fill Color
          </label>
          <div className="flex items-center gap-2 border border-border/60 bg-muted/20 rounded-md p-1.5">
            <div className="relative w-7 h-7 rounded border border-border/80 overflow-hidden shrink-0">
              <input
                type="color"
                value={settings.color.textCl}
                onChange={(e) => updateSetting("color", "textCl", e.target.value)}
                className="absolute inset-0 w-full h-full scale-150 cursor-pointer p-0 border-none"
              />
            </div>
            <Input
              type="text"
              value={settings.color.textCl.toUpperCase()}
              onChange={(e) => updateSetting("color", "textCl", e.target.value)}
              className="h-7 text-[11px] font-mono bg-background border-none uppercase"
              maxLength={7}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Stroke Properties
          </label>
          <div className="flex flex-col gap-2 border border-border/40 bg-muted/10 rounded-md p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">Thickness</span>
              <Input
                type="number"
                value={settings.stroke.size}
                onChange={(e) => updateSetting("stroke", "size", Math.max(0, parseInt(e.target.value) || 0))}
                className="h-7 text-xs bg-background border-input w-16"
                min={0}
              />
            </div>
            
            {settings.stroke.size > 0 && (
              <div className="flex items-center justify-between gap-2 transition-all">
                <span className="text-[11px] text-muted-foreground">Stroke Color</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative w-6 h-6 rounded border border-border/80 overflow-hidden">
                    <input
                      type="color"
                      value={settings.stroke.color}
                      onChange={(e) => updateSetting("stroke", "color", e.target.value)}
                      className="absolute inset-0 w-full h-full scale-150 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAddText}
          className="w-full h-8 text-xs mt-2 font-semibold tracking-wide"
        >
          Insert Text Layer
        </Button>
      </div>
    </div>
  );
};

/* ==========================================
   3. DRAW PANEL
   ========================================== */
export const DrawPanel = () => (
  <div className="w-full h-full bg-background flex flex-col select-none">
    <div className="py-3 px-4 border-b border-border/50">
      <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
        Drawing Brush
      </span>
    </div>
    <div className="p-4 text-xs font-medium text-muted-foreground">
      Brush Settings Content
    </div>
  </div>
);

/* ==========================================
   4. UPLOAD PANEL
   ========================================== */
export const UploadPanel = () => {
  // 1. Get editor configuration hooks
  const { pageSize, addLayerToActiveStage } = useEditorStore();
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Fallback Dev State: Grab the first available user ID to query images
  // (Replace this with your actual auth hook like `const user = useUser();` when ready)
  const allUsers = useQuery(api.users.viewer); // Assumes you have a list users query, or pass a hardcoded ID for now
  const activeUserId = allUsers?._id;

  // 3. Convex Hooks
  const generateUploadUrl = useMutation(api.genStorage.generateUploadUrl);
  const sendImage = useMutation(api.genStorage.sendImage);
  const getStorageUrl = useMutation(api.genStorage.getStorageUrl);
  
  // Real-time reactive list of user files
  const userImages = useQuery(
    api.genStorage.getImagesByUser, 
    activeUserId ? { author: activeUserId } : "skip"
  );

  // 4. Inject existing asset directly into the Canvas workspace
  const handleInjectToCanvas = (url: string) => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      const imageAspectRatio = img.width / img.height;
      const MAX_CANVAS_BOUND = Math.min(pageSize.width, pageSize.height) * 0.4;

      let calculatedWidth = MAX_CANVAS_BOUND;
      let calculatedHeight = MAX_CANVAS_BOUND;

      if (imageAspectRatio > 1) {
        calculatedHeight = MAX_CANVAS_BOUND / imageAspectRatio;
      } else {
        calculatedWidth = MAX_CANVAS_BOUND * imageAspectRatio;
      }

      addLayerToActiveStage({
        type: "image",
        src: url,
        width: Math.round(calculatedWidth),
        height: Math.round(calculatedHeight),
        x: Math.round((pageSize.width - calculatedWidth) / 2),
        y: Math.round((pageSize.height - calculatedHeight) / 2),
        rotation: 0,
      });
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUserId) return;

    if (!file.type.startsWith("image/")) return;
    setUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed.");
      const { storageId } = await result.json();

      await sendImage({ storageId, author: activeUserId });

      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  return (
    <div className="w-full h-full bg-background flex flex-col select-none overflow-y-auto">
      <div className="py-3 px-4 border-b border-border/50">
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          Upload Assets
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={uploading || !activeUserId}
        />

        {/* Dropzone trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !activeUserId}
          className={`w-full aspect-[16/10] border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 transition-all ${
            uploading || !activeUserId
              ? "border-muted-foreground/20 bg-muted/5 cursor-not-allowed"
              : "border-border/60 bg-muted/10 hover:bg-muted/30 hover:border-primary/50 cursor-pointer"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-xs font-medium">Uploading asset...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold">Import localized media</p>
              {!activeUserId && (
                <p className="text-[10px] text-destructive">Missing valid active user account context</p>
              )}
            </div>
          )}
        </button>

        <hr className="border-border/40" />

        {/* --- CONVEX IMAGE GALLERY LIST --- */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">
            Your Uploaded Files
          </span>

          {!userImages ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading cloud storage files...
            </div>
          ) : userImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg bg-muted/5 text-center px-4">
              <ImageIcon className="h-5 w-5 text-muted-foreground/60 mb-1" />
              <p className="text-xs font-medium text-muted-foreground">No asset files found</p>
              <p className="text-[10px] text-muted-foreground/60">Upload components above to fill workspace library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {userImages.map((img) => (
                <button
                  key={img._id}
                  type="button"
                  onClick={() => img.resolvedUrl && handleInjectToCanvas(img.resolvedUrl)}
                  className="group relative aspect-square bg-muted rounded-md border border-border/60 overflow-hidden hover:border-primary/70 transition-all cursor-pointer active:scale-95"
                  title="Click to insert onto stage"
                >
                  {img.resolvedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.resolvedUrl}
                      alt="User asset"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileImage className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  {/* TTL Indicator Overlay Badge */}
                  {!img.permanent && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white py-0.5 px-1 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      Temp Asset
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   5. LAYERS PANEL (INTERACTIVE WITH DND & SHADCN)
   ========================================== */
export const LayersPanel = () => {
  const { 
    stages, 
    activeStageId, 
    selectedLayerId, 
    setSelectedLayerId,
    updateLayerOrder,       
    modifyLayerProperties,  
    deleteLayer,            
    duplicateLayer          
  } = useEditorStore();

  const activeStage = stages.find((s) => s.id === activeStageId);
  const layers = activeStage?.layers ?? [];
  
  // High z-index elements go to the top of the list layout visually
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const getLayerLabel = (layer: any) => {
    switch (layer.type) {
      case "text":
        return `Text: "${layer.text?.substring(0, 20) || "untitled"}"`;
      case "image":
        return "Image Layer";
      case "rect":
        return "Rectangle";
      case "circle":
        return "Circle";
      default:
        return layer.type || "Layer";
    }
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case "text":
        return "T";
      case "image":
        return "🖼";
      case "rect":
        return "▭";
      case "circle":
        return "●";
      default:
        return "◇";
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !updateLayerOrder) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    // Convert visual top-to-bottom index back to backend zIndex sorting
    const movedLayer = sortedLayers[sourceIndex];
    const actualDestinationIndex = layers.length - 1 - destinationIndex;

    if (!movedLayer) return;
    updateLayerOrder(movedLayer.id, actualDestinationIndex);
  };

  return (
    <div className="w-full h-full bg-background flex flex-col select-none">
      {/* Header */}
      <div className="py-3 px-4 flex items-center justify-between border-b border-border/50">
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          Layers
        </span>
        <p className="text-muted-foreground text-xs font-semibold">{layers.length}</p>
      </div>

      {/* Layer List Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-xs">
            No layers yet. Add elements to get started.
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="layers-list">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef} 
                  className="p-2 space-y-1.5"
                >
                  {sortedLayers.map((layer, index) => (
                    <Draggable key={layer.id} draggableId={layer.id} index={index}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          onClick={() => setSelectedLayerId(layer.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all border ${
                            selectedLayerId === layer.id
                              ? "bg-primary/10 border-primary/40 text-foreground font-medium"
                              : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          } ${snapshot.isDragging ? "shadow-lg bg-background border-primary border-dashed z-50" : ""}`}
                        >
                          {/* Drag Handle */}
                          <div 
                            {...dragProvided.dragHandleProps} 
                            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground rounded"
                          >
                            <GripVertical className="h-3.5 w-3.5 opacity-60" />
                          </div>

                          {/* Icon Indicator */}
                          <span className="text-sm font-bold opacity-70 min-w-[20px] text-center">
                            {getLayerIcon(layer.type)}
                          </span>

                          {/* Layer Label */}
                          <span className="flex-1 truncate">{getLayerLabel(layer)}</span>

                          {/* Inline Controls */}
                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            {/* Visibility Toggle */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => modifyLayerProperties?.(layer.id, { visible: !layer.visible })}
                            >
                              {layer.visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 opacity-40" />}
                            </Button>

                            {/* Lock Toggle */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => modifyLayerProperties?.(layer.id, { locked: !layer.locked })}
                            >
                              {layer.locked ? <Lock className="h-3.5 w-3.5 text-destructive" /> : <Unlock className="h-3.5 w-3.5 opacity-40" />}
                            </Button>

                            {/* More Actions Context Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36 text-xs">
                                <DropdownMenuItem className="gap-2" onClick={() => duplicateLayer?.(layer.id)}>
                                  <Copy className="h-3.5 w-3.5" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => deleteLayer?.(layer.id)}>
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

/* ==========================================
   6. ELEMENTS PANEL (GEOMETRY LAYOUTS)
   ========================================== */
export const ElementsPanel = () => {
  const { pageSize, addLayerToActiveStage } = useEditorStore();

  const handleAddShape = (shapeType: string) => {
    const defaultSize = Math.min(pageSize.width, pageSize.height) * 0.25;
    const centerX = Math.round((pageSize.width - defaultSize) / 2);
    const centerY = Math.round((pageSize.height - defaultSize) / 2);

    let schemaPayload: Record<string, any> = {
      type: shapeType,
      x: centerX,
      y: centerY,
      fill: "#3b82f6",
      stroke: "#1d4ed8",
      strokeWidth: 2,
      rotation: 0,
    };

    switch (shapeType) {
      case "rect":
        schemaPayload = {
          ...schemaPayload,
          width: Math.round(defaultSize),
          height: Math.round(defaultSize),
          cornerRadius: 0,
        };
        break;
      case "circle":
        schemaPayload = {
          ...schemaPayload,
          x: Math.round(pageSize.width / 2),
          y: Math.round(pageSize.height / 2),
          radius: Math.round(defaultSize / 2),
        };
        break;
      case "ellipse":
        schemaPayload = {
          ...schemaPayload,
          x: Math.round(pageSize.width / 2),
          y: Math.round(pageSize.height / 2),
          radiusX: Math.round(defaultSize / 2),
          radiusY: Math.round(defaultSize / 3),
        };
        break;
      case "star":
        schemaPayload = {
          ...schemaPayload,
          x: Math.round(pageSize.width / 2),
          y: Math.round(pageSize.height / 2),
          numPoints: 5,
          innerRadius: Math.round(defaultSize / 4),
          outerRadius: Math.round(defaultSize / 2),
        };
        break;
      case "ring":
        schemaPayload = {
          ...schemaPayload,
          x: Math.round(pageSize.width / 2),
          y: Math.round(pageSize.height / 2),
          innerRadius: Math.round(defaultSize / 3),
          outerRadius: Math.round(defaultSize / 2),
        };
        break;
      case "regularPolygon":
        schemaPayload = {
          ...schemaPayload,
          x: Math.round(pageSize.width / 2),
          y: Math.round(pageSize.height / 2),
          sides: 6,
          radius: Math.round(defaultSize / 2),
        };
        break;
      case "arrow":
        schemaPayload = {
          ...schemaPayload,
          points: [0, 0, Math.round(defaultSize), Math.round(defaultSize)],
          pointerLength: 10,
          pointerWidth: 10,
        };
        break;
      case "line":
        schemaPayload = {
          ...schemaPayload,
          points: [0, 0, Math.round(defaultSize), 0],
          tension: 0,
          closed: false,
        };
        break;
      case "arc":
        schemaPayload = {
          ...schemaPayload,
          x: Math.round(pageSize.width / 2),
          y: Math.round(pageSize.height / 2),
          innerRadius: 0,
          outerRadius: Math.round(defaultSize / 2),
          angle: 60,
          clockwise: true,
        };
        break;
      default:
        return;
    }

    addLayerToActiveStage(schemaPayload);
  };

  const vectorCategories = [
    {
      title: "Standard primitives",
      items: [
        { id: "rect", label: "Rectangle", icon: Square },
        { id: "circle", label: "Circle", icon: Circle },
        { id: "ellipse", label: "Ellipse", icon: Circle },
      ],
    },
    {
      title: "Polygons & Display Vectors",
      items: [
        { id: "regularPolygon", label: "Hexagon", icon: Hexagon },
        { id: "star", label: "Star Node", icon: Star },
        { id: "ring", label: "Ring/Donut", icon: Circle },
      ],
    },
    {
      title: "Structural Traces & Curves",
      items: [
        { id: "line", label: "Simple Line", icon: TrendingUp },
        { id: "arrow", label: "Vector Arrow", icon: Zap },
        { id: "arc", label: "Arc Wedge", icon: Triangle },
      ],
    },
  ];

  return (
    <div className="w-full h-full bg-background flex flex-col select-none">
      <div className="py-3 px-4 flex items-center justify-between border-b border-border/50">
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          Geometry Layouts
        </span>
        <p className="text-muted-foreground text-xs font-semibold text-primary">Vectors</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
        {vectorCategories.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 px-0.5">
              {group.title}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddShape(item.id)}
                    className="flex flex-col items-center justify-center border border-border/60 bg-muted/20 hover:bg-muted/70 hover:border-border rounded-md p-3 transition-all duration-150 group gap-1.5 active:scale-95"
                  >
                    <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-transform stroke-[2]" />
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground text-center font-medium truncate w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================
   7. PHOTOS PANEL (UNSPLASH FEED)
   ========================================== */
export const PhotosPanel = () => {
  const { pageSize, selectedTool, addLayerToActiveStage } = useEditorStore();
  const [images, setImages] = useState<UnsplashPhoto[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>({
    color: null,
    orientation: null,
  });

  const fetchUnsplashPhotos = useCallback(async (
    query: string,
    currentFilters: FilterState,
    shouldSetState: boolean = true,
  ): Promise<UnsplashPhoto[] | null> => {
    if (selectedTool !== "photos") return null;
    setLoading(true);
    try {
      const res = await fetch("/api/unplash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: query,
          filters: {
            color: currentFilters.color,
            orientation: currentFilters.orientation,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to pull matching dataset");
      const data = await res.json();
      const normalizedData = Array.isArray(data) ? data : [];
      if (shouldSetState) {
        setImages(normalizedData);
      }
      return normalizedData;
    } catch (error) {
      console.error("Error fetching photos:", error);
      if (shouldSetState) {
        setImages([]);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedTool]);

  useEffect(() => {
    if (selectedTool === "photos") {
      fetchUnsplashPhotos(searchQuery, filters);
    }
  }, [selectedTool, filters, fetchUnsplashPhotos, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUnsplashPhotos(searchQuery, filters);
  };

  const updateFilter = (type: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
  };

  function handlePhotoSelect(photo: UnsplashPhoto) {
    const imageSrcWidth = photo.width;
    const imageSrcHeight = photo.height;
    const imageAspectRatio = imageSrcWidth / imageSrcHeight;
    const MAX_CANVAS_BOUND = Math.min(pageSize.width, pageSize.height) * 0.35;

    let calculatedWidth = MAX_CANVAS_BOUND;
    let calculatedHeight = MAX_CANVAS_BOUND;

    if (imageAspectRatio > 1) {
      calculatedHeight = MAX_CANVAS_BOUND / imageAspectRatio;
    } else {
      calculatedWidth = MAX_CANVAS_BOUND * imageAspectRatio;
    }

    addLayerToActiveStage({
      type: "image",
      src: photo.urls.regular,
      width: Math.round(calculatedWidth),
      height: Math.round(calculatedHeight),
      x: Math.round((pageSize.width - calculatedWidth) / 2),
      y: Math.round((pageSize.height - calculatedHeight) / 2),
      rotation: 0,
    });
  }

  return (
    <div className="w-full h-full bg-background flex flex-col select-none">
      <div className="py-3 px-4 flex items-center justify-between border-b border-border/50">
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          Library
        </span>
        <p className="text-muted-foreground text-xs">
          via <span className="text-foreground font-semibold">Unsplash</span>
        </p>
      </div>

      <div className="p-3 border-b border-border/50 bg-muted/30 flex flex-col gap-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-1.5 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search graphics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background border-input focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs px-2.5">
            Find
          </Button>
        </form>

        <div className="flex gap-1.5 items-center w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] flex-1 border-input gap-1 text-muted-foreground hover:text-foreground capitalize"
              >
                <SlidersHorizontal className="h-3 w-3" />
                {filters.orientation ? `${filters.orientation}` : "Layout"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-40 text-xs border-border bg-popover text-popover-foreground"
            >
              <DropdownMenuItem onClick={() => updateFilter("orientation", null)} className="flex items-center justify-between">
                All Orientations {!filters.orientation && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter("orientation", "landscape")} className="flex items-center justify-between">
                Landscape {filters.orientation === "landscape" && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter("orientation", "portrait")} className="flex items-center justify-between">
                Portrait {filters.orientation === "portrait" && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter("orientation", "squarish")} className="flex items-center justify-between">
                Square {filters.orientation === "squarish" && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] flex-1 border-input gap-1 text-muted-foreground hover:text-foreground capitalize"
              >
                <Sliders className="h-3 w-3" />
                {filters.color ? `${filters.color.replace(/_/g, " ")}` : "Color"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 text-xs border-border bg-popover text-popover-foreground max-h-60 overflow-y-auto custom-scrollbar"
            >
              <DropdownMenuItem onClick={() => updateFilter("color", null)} className="flex items-center justify-between">
                Any Color {!filters.color && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
              {[
                "black_and_white", "black", "white", "yellow", "orange", 
                "red", "purple", "magenta", "green", "teal", "blue"
              ].map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => updateFilter("color", c)}
                  className="flex items-center justify-between capitalize"
                >
                  {c.replace(/_/g, " ")} {filters.color === c && <Check className="h-3 w-3" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid Image Render Area */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {loading ? (
          <div className="text-center p-4 text-xs text-muted-foreground animate-pulse">
            Pulling graphics engine data...
          </div>
        ) : images && images.length === 0 ? (
          <div className="text-center p-4 text-xs text-muted-foreground">
            No matches located. Try another keyword.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images?.map((photo) => (
              <div
                key={photo.id}
                onClick={() => handlePhotoSelect(photo)}
                className="relative aspect-square rounded-md overflow-hidden bg-muted/40 cursor-pointer group border border-border/20 hover:border-border/60 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.urls.small}
                  alt={photo.alt_description || "Unsplash Asset"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] text-white truncate font-medium">
                    {photo.user?.name || "Creator"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ==========================================
   PARENT STRUCTURAL COMPONENT (IN-FLOW LAYOUT)
   ========================================== */
const SelectedToolPanel = () => {
  const { selectedTool } = useEditorStore();
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const panelMap: Record<string, React.ComponentType> = {
    templates: TemplatesPanel,
    text: TextPanel,
    photos: PhotosPanel,
    elements: ElementsPanel,
    draw: DrawPanel,
    upload: UploadPanel,
    layers: LayersPanel,
  };

  const ActivePanelComponent = panelMap[selectedTool];

  useEffect(() => {
    if (selectedTool) setIsOpen(true);
  }, [selectedTool]);

  return (
    <div
      className={`relative h-full border-r border-border bg-background shadow-sm transition-all duration-300 ease-in-out flex flex-col select-none ${
        isOpen ? "w-80" : "w-0 border-r-0"
      }`}
    >
      <div className={`flex-1 overflow-y-auto w-80 ${!isOpen && "hidden"}`}>
        {ActivePanelComponent ? (
          <ActivePanelComponent />
        ) : (
          <div className="p-4 text-xs text-muted-foreground">Select a tool from the sidebar</div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((p) => !p)}
        className="absolute top-6 -translate-y-1/2 -right-4 h-8 w-4 bg-black  hover:bg-black/90 rounded-l-none rounded-r-md z-50 pointer-events-auto"
        title={isOpen ? "Collapse Panel" : "Expand Panel"}
      >
        {isOpen ? (
          <ChevronLeft className="h-8 w-4 stroke-[2.5] text-white bg-black rounded-r-md" />
        ) : (
          <ChevronRight className="h-8 w-4 stroke-[2.5] text-white bg-black rounded-r-md" />
        )}
      </Button>
    </div>
  );
};

export default SelectedToolPanel;