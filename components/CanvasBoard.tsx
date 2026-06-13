"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import { useMutation, useQuery } from "convex/react";
import {
  useMutation as useRoomMutation,
  useStorage as useRoomStorage,
} from "@/liveblocks.config";

import {
  Stage,
  Layer,
  Rect,
  Text,
  Group as KonvaGroup,
  Circle,
  Star,
  Arrow,
  Line,
  Wedge,
  Sprite,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { useRouter, useSearchParams } from "next/navigation";

// Shadcn UI Context Menu
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import {
  Circle as CircleIcon,
  Lock,
  LockOpen,
  Layers,
  Layers2,
  MousePointer2,
  Square,
  Trash2,
  Copy,
  Plus,
  Pencil,
  Check,
  X,
  Eye,
  PaintRoller,
  Ruler,
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
  MoveUp,
  MoveDown,
  ArrowRightFromLine,
  EyeOff,
  Wand2,
  Zap,
  Star as StarIcon,
  Pen,
  Sliders,
  PanelLeftIcon,
  Code,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCanvasState } from "@/providers/CanvasStateProvider";
import { useCanvasPersistence } from "@/hooks/use-canvas-persistence";
import { useDrawings } from "@/providers/DrawingsProvider";
import { AutoSaveIndicator } from "@/components/auto-save-indicator";
import { CanvasSkeleton } from "@/components/canvas-skeleton";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useCanvasUIStore } from "@/store/useCanvasUIStore";
import { Slider } from "@/components/ui/slider";
import useImage from "use-image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor from "@monaco-editor/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import ProfileMenu from "@/components/ProfileMenu";
import Live from "@/components/Live/Live";

type ToolMode = "select" | "draw" | "pan";
type BrushStyle = "solid" | "dashed";
type DrawTool = "brush" | "eraser" | "line";

const brushStyleToDash = (style: BrushStyle): number[] => {
  if (style === "dashed") return [12, 8];
  return [];
};

// --- Controller Component ---
const Controller = ({
  onAddShape,
  activeTool,
  onSelectTool,
}: {
  onAddShape: (type: string) => void;
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shapeTools = [
    { id: "rect", name: "Rectangle", icon: Square },
    { id: "circle", name: "Circle", icon: CircleIcon },
    { id: "arrow", name: "Arrow", icon: ArrowRightFromLine },
    { id: "star", name: "Star", icon: StarIcon },
  ];

  return (
    <div
      ref={dropdownRef}
      className="fixed bottom-4 left-1/2 z-40 sm:w-[30vw] md:w-[30vw] lg:w-[16vw] -translate-x-1/2"
    >
      <Card className="overflow-visible rounded-2xl border border-muted/70 bg-background backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="flex items-center justify-center gap-2" style={{ padding: "6px" }}>
            <button
              type="button"
              onClick={() => onSelectTool("select")}
              className={`grid size-10 place-items-center rounded-xl border transition-all ${activeTool === "select" ? "border-destructive/70 bg-destructive text-white" : "border-zinc-700/70 bg-background text-zinc-300 hover:bg-zinc-850"}`}
              aria-label="Select"
            >
              <MousePointer2 className="h-4 w-4" />
            </button>

            <div className="h-7 w-px bg-zinc-800" />

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "shapes" ? null : "shapes")
                }
                className="flex h-10 items-center gap-2 rounded-xl border border-muted/70 bg-muted px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Shapes"
              >
                <Square className="h-4 w-4" />
                Shapes
              </button>

              {openDropdown === "shapes" && (
                <div className="absolute bottom-full left-0 mb-2 min-w-44 overflow-hidden rounded-xl border border-muted/80 bg-muted p-1 shadow-lg text-muted-foreground">
                  {shapeTools.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onAddShape(opt.id);
                        setOpenDropdown(null);
                      }}
                      className="flex w-full items-center text-muted-foreground gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-card hover:text-foreground"
                    >
                      <opt.icon className="h-4 w-4" />
                      {opt.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-7 w-px bg-zinc-800" />

            <button
              type="button"
              onClick={() => onSelectTool("draw")}
              className={`flex h-10 items-center gap-2 rounded-xl border border-muted/70 px-3 text-xs font-medium text-muted-foreground transition-colors ${activeTool === "draw" ? "bg-destructive text-white" : "bg-muted hover:bg-muted"}`}
              aria-label="Draw"
            >
              <Pen className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Brush Control Panel ---
const BrushPanel = ({
  activeTool,
  drawTool,
  color,
  size,
  style,
  onDrawToolChange,
  onColorChange,
  onSizeChange,
  onStyleChange,
}: {
  activeTool: ToolMode;
  drawTool: DrawTool;
  color: string;
  size: number;
  style: BrushStyle;
  onDrawToolChange: (tool: DrawTool) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onStyleChange: (style: BrushStyle) => void;
}) => {
  if (activeTool !== "draw") return null;

  const colors = [
    "#111827",
    "#ef4444",
    "#2563eb",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
  ];

  return (
    <Card className="fixed bottom-24 left-1/2 z-40 w-[min(95vw,46rem)] -translate-x-1/2 rounded-2xl border border-muted/70 bg-background/90 backdrop-blur-xl">
      <CardContent style={{ padding: "12px" }}>
        <div className="flex flex-wrap items-center gap-2.5">
          <Tabs
            value={drawTool}
            onValueChange={(value: string) =>
              onDrawToolChange(value as DrawTool)
            }
            className="min-w-40"
          >
            <TabsList className="grid h-8 w-full grid-cols-3 rounded-lg border border-muted bg-background/80">
              <TabsTrigger value="brush">Brush</TabsTrigger>
              <TabsTrigger value="eraser">Eraser</TabsTrigger>
              <TabsTrigger value="line">Line</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1">
            {colors.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onColorChange(value)}
                className={`size-6 rounded-full border border-zinc-600 transition-transform hover:scale-105 ${color === value ? "ring-2 ring-cyan-400" : ""}`}
                style={{ backgroundColor: value }}
                aria-label={`Brush color ${value}`}
              />
            ))}
          </div>

          <div className="ml-auto flex min-w-40 items-center gap-2 rounded-lg border border-muted bg-background/80 px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Size
            </span>
            <Slider
              value={[size]}
              min={1}
              max={24}
              step={1}
              onValueChange={(value) => onSizeChange(value[0] ?? size)}
              className="flex-1"
            />
            <Badge variant="outline" className="h-6 border-zinc-700 bg-zinc-950 px-2 text-[10px]">
              {size}px
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {(["solid", "dashed"] as BrushStyle[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onStyleChange(option)}
                className={`rounded-md border px-2 py-1 text-[10px] font-medium capitalize transition-colors ${style === option ? "border-muted-foreground bg-foreground text-background" : "border-muted bg-background text-foreground hover:bg-muted"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Shape Renderer Component ---
const ShapeRenderer = React.memo(
  ({ id, isInteractionEnabled }: { id: string; isInteractionEnabled: boolean }) => {
    const shapeRef = useRef<any>(null);
    const obj = useCanvasStore((state) => state.objectsById[id]);

    if (!obj) return null;

    const commonProps: any = {
      id: obj.id,
      ref: shapeRef,
      x: obj.x,
      y: obj.y,
      fill: obj.fill || "#3b82f6",
      stroke: obj.stroke || "#111827",
      strokeWidth: obj.strokeWidth || 2,
      draggable: isInteractionEnabled && !obj.isLocked,
      opacity: obj.opacity ?? 1,
      rotation: obj.rotation || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      visible: obj.visible !== false,
      dash: brushStyleToDash(obj.brushStyle || "solid"),
    };

    switch (obj.type) {
      case "rect":
        return <Rect {...commonProps} width={obj.width || 100} height={obj.height || 100} />;
      case "circle":
        return <Circle {...commonProps} radius={obj.radius || 50} />;
      case "star":
        return <Star {...commonProps} numPoints={obj.numPoints || 5} innerRadius={obj.innerRadius || 20} outerRadius={obj.outerRadius || 40} />;
      case "arrow":
        return <Arrow {...commonProps} points={obj.points || [0, 0, 100, 100]} pointerLength={10} pointerWidth={10} />;
      default:
        return null;
    }
  }
);
ShapeRenderer.displayName = "ShapeRenderer";

// --- Canvas Board (Children Component wrapped by Page) ---
export default function CanvasBoard() {
  const { objects, setObjects } = useCanvasStore();
  
  // Destructure accurately matched to your custom CanvasUIState interface names
  const {
    activeTool,
    drawTool,
    drawColor,
    drawSize,
    drawStyle,
    canvasBackground,
    setActiveTool,
    setDrawTool,
    setDrawColor,
    setDrawSize,
    setDrawStyle,
  } = useCanvasUIStore();

  const sharedObjects = useRoomStorage((root) => root.objects);
  const updateSharedObjects = useRoomMutation(({ storage }, nextObjects: any) => {
    storage.set("objects", nextObjects);
  }, []);

  const lastSharedSnapshotRef = useRef<string>("");
  const sharedObjectsString = useMemo(() => JSON.stringify(sharedObjects), [sharedObjects]);
  const localObjectsString = useMemo(() => JSON.stringify(objects), [objects]);

  useEffect(() => {
    if (!sharedObjects || !Array.isArray(sharedObjects)) return;

    if (sharedObjects.length > 0 && sharedObjectsString !== localObjectsString) {
      setObjects(sharedObjects as any[]);
    }

    if (sharedObjects.length > 0) {
      lastSharedSnapshotRef.current = sharedObjectsString;
    }
  }, [sharedObjectsString, localObjectsString, sharedObjects, setObjects]);

  useEffect(() => {
    if (localObjectsString !== lastSharedSnapshotRef.current) {
      updateSharedObjects(objects);
      lastSharedSnapshotRef.current = localObjectsString;
    }
  }, [localObjectsString, objects, updateSharedObjects]);

  const handleAddShape = (type: string) => {
    const id = uuidv4();
    const newShape = {
      id,
      type,
      x: window.innerWidth / 2 - 50,
      y: window.innerHeight / 2 - 50,
      width: 100,
      height: 100,
      fill: drawColor,
      stroke: "#111827",
      strokeWidth: 2,
      isLocked: false,
      visible: true,
      brushStyle: drawStyle,
    };
    setObjects([...objects, newShape]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: canvasBackground }}>
      <Live />
      <Controller
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onAddShape={handleAddShape}
      />
      <BrushPanel
        activeTool={activeTool}
        drawTool={drawTool}
        color={drawColor}
        size={drawSize}
        style={drawStyle}
        onDrawToolChange={setDrawTool}
        onColorChange={setDrawColor}
        onSizeChange={setDrawSize}
        onStyleChange={setDrawStyle}
      />
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {objects.map((obj: any) => (
            <ShapeRenderer
              key={obj.id}
              id={obj.id}
              isInteractionEnabled={activeTool === "select"}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}