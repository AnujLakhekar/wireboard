"use client";

import React, { useState, useEffect, useRef, RefObject } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import { useEditorStore, CANVAS_PRESETS } from "../(store)/useEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Layout,
  Palette,
  FilePlus,
  Layers,
  Monitor,
  Undo2,
  Redo2,
  FileCode,
  Printer,
  FileImage,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import GradientText from "@/components/GradientText";
import { useShiftKey } from "@/hooks/useShiftKey";
import { calculateSnappingGuides } from "@/utills/snapping";
import { exportCanvasWorkspace } from "@/utills/exportEngine";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BsFiletypeJpg, BsFiletypePdf, BsFiletypePng } from "react-icons/bs";
import { toast } from "sonner";
import ProfileMenu from "@/components/ProfileMenu";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const GRID_SIZE = 25;

// --- INTERNAL COMPONENT: HISTORY CONTROLS ---
function HistoryControls() {
  const { undo, redo, past, future } = useEditorStore();

  // Listen globally to Command/Control + Z or Y hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-1 bg-background shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={undo}
        disabled={past.length === 0}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={redo}
        disabled={future.length === 0}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

const CanvasImageRenderer = ({
  layer,
  onDragActions,
  onSelect,
}: {
  layer: any;
  onDragActions: any;
  onSelect: any;
}) => {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null,
  );

  useEffect(() => {
    if (!layer.src) return;
    const img = new window.Image();
    img.src = layer.src;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageElement(img);
    };
  }, [layer.src]);

  if (!imageElement) return null;

  return (
    <KonvaImage
      image={imageElement}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      id={layer.id}
      name="selectable"
      draggable
      onClick={onSelect}
      onTap={onSelect}
      {...onDragActions}
    />
  );
};

const BG_COLOR_OPTIONS = [
  { name: "Pure White", value: "#ffffff" },
  { name: "Studio Gray", value: "#f3f4f6" },
  { name: "Dark Mode", value: "#111827" },
  { name: "Cream", value: "#fdfbf7" },
];

export function CanvasNewPageDialog() {
  const { setPageSize, applyPreset, setCanvasBg, createStage } =
    useEditorStore();

  const [selectedPreset, setSelectedPreset] =
    useState<string>("instagram_post");
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [chosenBg, setChosenBg] = useState<string>("#ffffff");

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const target = CANVAS_PRESETS.find((p) => p.name === value);
    if (target) {
      setCustomWidth(target.width);
      setCustomHeight(target.height);
    }
  };

  const handleCreateCanvas = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPreset === "custom") {
      setPageSize(customWidth, customHeight);
    } else {
      applyPreset(selectedPreset);
    }

    setCanvasBg(chosenBg);
    createStage({
      width: customWidth,
      height: customHeight,
      bgColor: chosenBg,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          New art
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-background border-border">
        <form onSubmit={handleCreateCanvas} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <FilePlus className="h-4 w-4 text-muted-foreground" />
              New art
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Layout className="h-3 w-3" /> Size Preset
            </Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-full h-9 text-xs border-input bg-background">
                <SelectValue placeholder="Choose Artboard Dimension Preset" />
              </SelectTrigger>
              <SelectContent>
                {CANVAS_PRESETS.map((preset) => (
                  <SelectItem
                    key={preset.name}
                    value={preset.name}
                    className="text-xs"
                  >
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="canvas-width"
                className="text-xs font-semibold text-muted-foreground font-mono"
              >
                Width (px)
              </Label>
              <Input
                id="canvas-width"
                type="number"
                disabled={selectedPreset !== "custom"}
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value) || 100)}
                className="h-9 text-xs border-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="canvas-height"
                className="text-xs font-semibold text-muted-foreground font-mono"
              >
                Height (px)
              </Label>
              <Input
                id="canvas-height"
                type="number"
                disabled={selectedPreset !== "custom"}
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value) || 100)}
                className="h-9 text-xs border-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Palette className="h-3 w-3" /> Canvas Background Color
            </Label>
            <div className="flex gap-2 items-center">
              {BG_COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setChosenBg(color.value)}
                  className={`w-7 h-7 rounded-full border transition-all ${
                    chosenBg === color.value
                      ? "ring-2 ring-ring ring-offset-2 scale-105"
                      : "border-input"
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
              <div className="flex-1 ml-2">
                <Input
                  type="text"
                  maxLength={7}
                  value={chosenBg}
                  onChange={(e) => setChosenBg(e.target.value)}
                  className="h-7 text-[11px] text-center font-mono uppercase border-input"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 flex gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs"
              >
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit" size="sm" className="h-9 text-xs">
                Generate Stage
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditorHeaderBarProps {
  canvasInstanceRef: RefObject<any>;
}

export function EditorHeaderBar({ canvasInstanceRef }: EditorHeaderBarProps) {
  const {
    stages,
    activeStageId,
    setActiveStage,
    pageSize,
    konvaStageRef,
    setKonvaStageRef,
  } = useEditorStore();
  const activeStage = stages.find((s) => s.id === activeStageId);

  const user = useQuery(api.users.viewer);

  useEffect(() => {
    if (activeStage) {
      canvasInstanceRef.current?.batchDraw();
    }
  }, [activeStage?.backgroundColor, activeStage?.width, activeStage?.height]);

  return (
    <header className="h-14 w-full bg-background border-b border-border px-6 flex items-center justify-between z-40 select-none">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            wireboard
            <GradientText
              colors={["#5227FF", "#FF9FFC", "#B497CF"]}
              animationSpeed={8}
              showBorder={false}
              className="custom-class"
            >
              Designer
            </GradientText>
          </span>
        </div>

        {stages.length > 0 && (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="stage-selector"
              className="text-xs text-muted-foreground font-medium"
            >
              Page:
            </Label>
            <Select
              value={activeStageId || ""}
              onValueChange={(value) => setActiveStage(value)}
            >
              <SelectTrigger
                id="stage-selector"
                className="w-44 h-8 text-xs border-input bg-muted/50"
              >
                <SelectValue placeholder="Select Stage View" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem
                    key={stage.id}
                    value={stage.id}
                    className="text-xs"
                  >
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Export Action Triggers Group UI */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => {
                  if (!canvasInstanceRef?.current) {
                    toast.error("Export canceled: Active canvas not found.");
                    return;
                  }
                  exportCanvasWorkspace(canvasInstanceRef.current, { format: "png" });
                }} >
                  <BsFiletypePng className="h-3 w-3 mr-2" />
                  Export as png
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => {
                  if (!canvasInstanceRef?.current) {
                    toast.error("Export canceled: Active canvas not found.");
                    return;
                  }
                  exportCanvasWorkspace(canvasInstanceRef.current, { format: "jpeg" });
                }}>
                  <BsFiletypeJpg  className="h-3 w-3 mr-2" />
                  Export as jpg
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => {
                  if (!canvasInstanceRef?.current) {
                    toast.error("Export canceled: Active canvas not found.");
                    return;
                  }
                  exportCanvasWorkspace(canvasInstanceRef.current, { format: "pdf" });
                }}>
                  <BsFiletypePdf className="h-3 w-3 mr-2" />
                  Export as pdf
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Center Action Zone: Dimensional Display + Integrated Undo/Redo Engine */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-muted border border-border/50 rounded-md text-[11px] font-mono text-muted-foreground">
          <Monitor className="h-3 w-3 text-muted-foreground/70" />
          <span className="font-bold text-foreground">
            {activeStage ? activeStage.width : pageSize.width}px
          </span>
          <span>×</span>
          <span className="font-bold text-foreground">
            {activeStage ? activeStage.height : pageSize.height}px
          </span>
        </div>

        <HistoryControls />
      </div>

      <div className="flex items-center gap-3">
        <CanvasNewPageDialog />
        <ProfileMenu ImageSrc={user?.image || ""} Name={String(user?.name) || ""} Email={user?.email || ""} />
      </div>
    </header>
  );
}

const Editor = ({
  canvasInstanceRef,
}: {
  canvasInstanceRef: React.RefObject<any>;
}) => {
  const {
    pageSize,
    stages,
    activeStageId,
    updateLayer,
    selectedLayerId,
    setSelectedLayerId,
    modifyLayerProperties,
  } = useEditorStore();

  const setKonvaStageRef = useEditorStore((state) => state.setKonvaStageRef);
  const isShiftPressed = useShiftKey();
  const [guides, setGuides] = useState<
    Array<{ x1: number; y1: number; x2: number; y2: number }>
  >([]);
  const activeStage = stages.find((s) => s.id === activeStageId);
  const layers = activeStage?.layers ?? [];

  const transformerRef = useRef<any>(null);

  const currentStageInstance = stages.find((s) => s.id === activeStageId);

  useEffect(() => {
    // Keep the global store ref in sync with the mounted stage ref
    try {
      setKonvaStageRef(canvasInstanceRef?.current ?? null);
    } catch (e) {
      // ignore
    }
  }, [canvasInstanceRef?.current, setKonvaStageRef]);

  const displayWidth = currentStageInstance
    ? currentStageInstance.width
    : pageSize.width;
  const displayHeight = currentStageInstance
    ? currentStageInstance.height
    : pageSize.height;
  const displayBg = currentStageInstance
    ? currentStageInstance.backgroundColor
    : "#ffffff";

  useEffect(() => {
    if (!transformerRef.current || !canvasInstanceRef.current) return;

    if (!selectedLayerId) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
      return;
    }

    const selectedNode = canvasInstanceRef.current.findOne(
      `#${selectedLayerId}`,
    );

    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer().batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedLayerId, currentStageInstance]);

  const handleStageBackgroundClick = (e: any) => {
    const clickedOnEmptySpace =
      e.target === e.target.getStage() || e.target.name() === "background-base";
    if (clickedOnEmptySpace) {
      setSelectedLayerId(null);
    }
  };

  return (
    <div
      className={
        "flex-1 h-full overflow-auto relative flex flex-col items-center justify-center p-12 custom-grid-background " +
        (currentStageInstance?.backgroundColor == "#ffffff"
          ? "bg-black"
          : "bg-white")
      }
    >
      <div
        className="border border-border/80 rounded-sm overflow-hidden bg-background shadow-lg"
        style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
      >
        {currentStageInstance ? (
          <Stage
            width={displayWidth}
            height={displayHeight}
            ref={canvasInstanceRef}
            onMouseDown={handleStageBackgroundClick}
            onTouchStart={handleStageBackgroundClick}
          >
            <Layer>
              <Rect
                name="background-base"
                x={0}
                y={0}
                width={displayWidth}
                height={displayHeight}
                fill={displayBg}
              />

              {currentStageInstance?.layers.map((layer) => {
                const elementInteractionEvents = {
                  onDragMove: (e: any) => {
                    const target = e.target;
                    // Local drag snapping layout alignment configurations
                    const snappedXEle =
                      Math.round(target.x() / GRID_SIZE) * GRID_SIZE;
                    const snappedYEle =
                      Math.round(target.y() / GRID_SIZE) * GRID_SIZE;

                    const currentBounds = {
                      id: layer.id,
                      x: target.x(),
                      y: target.y(),
                      width: target.width(),
                      height: target.height(),
                    };

                    if (!isShiftPressed) {
                      target.x(snappedXEle);
                      target.y(snappedYEle);
                      return;
                    }
                  },
                  onDragEnd: (e: any) => {
                    const target = e.target;
                    // This updates store parameters once dragging stops entirely, preserving clean state histories
                    updateLayer(layer.id, {
                      x: target.x(),
                      y: target.y(),
                    });
                  },
                  onTransformEnd: (e: any) => {
                    const target = e.target;
                    const currentScaleX = target.scaleX();
                    const currentScaleY = target.scaleY();

                    target.scaleX(1);
                    target.scaleY(1);

                    updateLayer(layer.id, {
                      x: target.x(),
                      y: target.y(),
                      width: Math.max(5, target.width() * currentScaleX),
                      height: Math.max(5, target.height() * currentScaleY),
                      rotation: target.rotation(),
                    });
                  },
                };

                const handleSelect = (e: any) => {
                  e.cancelBubble = true;

                  setSelectedLayerId(layer.id);
                };

                if (layer.type === "rect") {
                  return (
                    <Rect
                      key={layer.id}
                      id={layer.id}
                      name="selectable"
                      x={layer.x}
                      y={layer.y}
                      width={layer.width}
                      height={layer.height}
                      fill={layer.fill || "#3498db"}
                      rotation={layer.rotation}
                      draggable
                      onClick={handleSelect}
                      onTap={handleSelect}
                      {...elementInteractionEvents}
                    />
                  );
                }

                if (layer.type === "circle") {
                  return (
                    <Circle
                      key={layer.id}
                      id={layer.id}
                      name="selectable"
                      x={layer.x}
                      y={layer.y}
                      radius={Math.min(layer.width, layer.height) / 2}
                      fill={layer.fill || "#e74c3c"}
                      rotation={layer.rotation}
                      draggable
                      onClick={handleSelect}
                      onTap={handleSelect}
                      {...elementInteractionEvents}
                    />
                  );
                }

                if (layer.type === "text") {
                  const weightAsNumber = Number(layer.fontWeight || "400");
                  const resolvedFontStyle =
                    weightAsNumber >= 600 ? "bold" : "normal";
                  return (
                    <Text
                      key={layer.id}
                      id={layer.id}
                      name="selectable"
                      x={layer.x}
                      y={layer.y}
                      text={layer.text || "Sample Text"}
                      fontSize={layer.fontSize || 24}
                      fontFamily={layer.fontFamily || "sans-serif"}
                      fontStyle={resolvedFontStyle}
                      fill={layer.fill || "#2c3e50"}
                      stroke={layer.stroke}
                      strokeWidth={layer.strokeWidth || 0}
                      align={layer.align || "left"}
                      width={layer.width}
                      rotation={layer.rotation}
                      draggable
                      onClick={handleSelect}
                      onTap={handleSelect}
                      {...elementInteractionEvents}
                    />
                  );
                }

                if (layer.type === "image") {
                  return (
                    <CanvasImageRenderer
                      key={layer.id}
                      layer={layer}
                      onSelect={handleSelect}
                      onDragActions={elementInteractionEvents}
                    />
                  );
                }

                return null;
              })}

              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 10 || newBox.height < 10) {
                    return oldBox;
                  }
                  return newBox;
                }}
                anchorStyleFunc={(anchor) => {
                  anchor.cornerRadius(50);
                  anchor.fill("#ffffff");
                  anchor.stroke("#2563eb");
                  anchor.strokeWidth(2);
                }}
              />
            </Layer>
          </Stage>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
            <Layers className="h-8 w-8 text-muted-foreground/40 stroke-[1.5]" />
            No active stage. Use the "New art" button to create your first
            canvas.
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
