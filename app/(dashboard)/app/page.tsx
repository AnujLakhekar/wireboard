"use client";
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Stage,
  Layer,
  Rect,
  Text,
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
import { useRouter } from "next/navigation";

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
  MousePointer2,
  Square,
  Trash2,
  Copy,
  PaintRoller,
  Ruler,
  ArrowRightFromLine,
  EyeOff,
  Move,
  Wand2,
  Zap,
  Star as StarIcon,
  Pen,
} from "lucide-react";

import { useCanvasState } from "@/providers/CanvasStateProvider";
import { useCanvasPersistence } from "@/hooks/use-canvas-persistence";
import { useDrawings } from "@/providers/DrawingsProvider";
import { AutoSaveIndicator } from "@/components/auto-save-indicator";
import { useCanvasStore } from "@/store/useCanvasStore";
import useImage from "use-image";

const Exporter = () => {
  return <></>;
};
// Export canvas as PNG
const exportCanvasAsPNG = (stageRef: any, drawingName: string = 'canvas') => {
  if (!stageRef?.current) return;
  try {
    const dataURL = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${drawingName}-${Date.now()}.png`;
    link.click();
  } catch (error) {
    console.error('Failed to export canvas:', error);
  }
};

type ToolMode = "select" | "draw";
type BrushStyle = "solid" | "dashed" | "dotted";
type DrawTool = "brush" | "eraser";

const CANVAS_BACKGROUND_PRESETS = [
  { label: "White", value: "#ffffff" },
  { label: "Soft", value: "#f8fafc" },
  { label: "Muted", value: "#f1f5f9" },
  { label: "Paper", value: "#fafaf9" },
  { label: "Slate", value: "#e2e8f0" },
  { label: "Dark", value: "#18181b" },
];

const brushStyleToDash = (style: BrushStyle): number[] => {
  if (style === "dashed") return [12, 8];
  if (style === "dotted") return [2, 10];
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

  const tools = [
    {
      id: "select",
      name: "Select",
      type: "action",
      Icon: MousePointer2,
    },
    {
      id: "shapes",
      name: "Shapes",
      type: "dropdown",
      Icon: CircleIcon,
      options: [
        { id: "rect", name: "Rectangle", icon: Square },
        { id: "circle", name: "Circle", icon: CircleIcon },
        { id: "arrow", name: "Arrow", icon: ArrowRightFromLine },
        { id: "star", name: "Star", icon: StarIcon },
      ],
    },
    {
      id: "pen",
      name: "Draw",
      type: "action",
      Icon: Pen,
    },
  ];

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background p-2 rounded-xl shadow-2xl border border-border flex items-center gap-2 z-60"
      ref={dropdownRef}
    >
      {tools.map((tool) => (
        <div key={tool.id} className="relative">
          <button
            onClick={() => {
              if (tool.type === "dropdown") {
                setOpenDropdown(openDropdown === tool.id ? null : tool.id);
                onSelectTool("select");
                return;
              }

              setOpenDropdown(null);
              if (tool.id === "pen") onSelectTool("draw");
              if (tool.id === "select") onSelectTool("select");
            }}
            className={`p-2 rounded-lg hover:bg-muted flex flex-col items-center min-w-12.5 transition-colors ${(openDropdown === tool.id || (tool.id === "pen" && activeTool === "draw") || (tool.id === "select" && activeTool === "select")) ? "bg-muted" : ""}`}
          >
            <tool.Icon className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">{tool.name}</span>
          </button>
          {tool.type === "dropdown" && openDropdown === tool.id && (
            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg shadow-xl p-1 min-w-35 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2">
              {tool.options?.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onAddShape(opt.id);
                    setOpenDropdown(null);
                  }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors text-left"
                >
                  {opt.icon ? (
                    <opt.icon className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4 opacity-50" />
                  )}
                  {opt.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TopTools = () => {
  return (
    <>
      <ArrowRightFromLine className="cursor-pointer" />
    </>
  );
};

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

  const colors = ["#111827", "#ef4444", "#2563eb", "#22c55e", "#f59e0b", "#8b5cf6"];

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-60 bg-background border border-border rounded-xl shadow-xl px-3 py-2 flex items-center gap-4">
      <div className="flex items-center gap-1">
        {(["brush", "eraser"] as DrawTool[]).map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => onDrawToolChange(tool)}
            className={`px-2 py-1 rounded-md text-xs border ${drawTool === tool ? "bg-muted border-primary" : "border-border hover:bg-muted"}`}
          >
            {tool}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {colors.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onColorChange(value)}
            className={`w-5 h-5 rounded-full border ${color === value ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
            style={{ backgroundColor: value }}
            aria-label={`Brush color ${value}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 min-w-35">
        <span className="text-xs text-muted-foreground">Size</span>
        <input
          type="range"
          min={1}
          max={24}
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-xs w-5 text-right">{size}</span>
      </div>

      <div className="flex items-center gap-1">
        {(["solid", "dashed", "dotted"] as BrushStyle[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onStyleChange(option)}
            className={`px-2 py-1 rounded-md text-xs border ${style === option ? "bg-muted border-primary" : "border-border hover:bg-muted"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

const CanvasImageShape = ({ obj, commonProps }: { obj: any; commonProps: any }) => {
  const [image, status] = useImage(obj.src || "");

  if (!image) {
    return (
      <Rect
        {...commonProps}
        width={obj.width || 120}
        height={obj.height || 120}
        fill={status === "failed" ? "#ef4444" : "#e5e7eb"}
        stroke="#111827"
        dash={[6, 4]}
      />
    );
  }

  return (
    <KonvaImage
      {...commonProps}
      image={image}
      width={obj.width || 120}
      height={obj.height || 120}
    />
  );
};

const CanvasSpriteShape = ({ obj, commonProps }: { obj: any; commonProps: any }) => {
  const [image, status] = useImage(obj.src || "");
  const spriteRef = useRef<any>(null);

  useEffect(() => {
    if (!spriteRef.current || !image) return;
    spriteRef.current.start();
  }, [image]);

  useEffect(() => {
    if (!spriteRef.current) return;

    if (obj.animation === "punch") {
      const timeout = setTimeout(() => {
        obj.onAnimationDone?.();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [obj.animation, obj.punchNonce, obj]);

  if (!image) {
    return (
      <Rect
        {...commonProps}
        width={obj.width || 74}
        height={obj.height || 122}
        fill={status === "failed" ? "#ef4444" : "#93c5fd"}
        stroke="#111827"
        dash={[4, 4]}
      />
    );
  }

  return (
    <Sprite
      {...commonProps}
      ref={spriteRef}
      image={image}
      animation={obj.animation || "idle"}
      animations={obj.animations || {}}
      frameRate={obj.frameRate || 7}
      frameIndex={obj.frameIndex || 0}
      width={obj.width || 80}
      height={obj.height || 120}
    />
  );
};

// --- Shape Component (Handles Individual Animations and Filters) ---
const ShapeRenderer = React.memo(({
  id,
  onSelect,
  onDragEnd,
  updateObj,
  isInteractionEnabled,
}: any) => {
  const shapeRef = useRef<any>(null);
  const obj = useCanvasStore((state) => state.objectsById[id]);

  // Apply Filters
  useEffect(() => {
    if (!obj) return;
    if (shapeRef.current) {
      const filters = [];
      if (obj.blur) filters.push(Konva.Filters.Blur);
      if (obj.grayscale) filters.push(Konva.Filters.Grayscale);
      if (obj.invert) filters.push(Konva.Filters.Invert);

      shapeRef.current.filters(filters);
      if (obj.blur) shapeRef.current.blurRadius(obj.blurValue || 10);

      // Mandatory for Konva filters to work
      shapeRef.current.cache();
    }
  }, [
    obj?.blur,
    obj?.grayscale,
    obj?.invert,
    obj?.blurValue,
    obj?.fill,
    obj?.width,
    obj?.height,
  ]);

  // Handle Animations
  useEffect(() => {
    if (!obj) return;
    const node = shapeRef.current;
    const layer = node?.getLayer?.();
    if (!node || !layer) return;

    let anim: Konva.Animation | undefined;
    if (obj.animation === "spin") {
      anim = new Konva.Animation((frame) => {
        if (shapeRef.current) shapeRef.current.rotation(frame!.time * 0.1);
      }, layer);
      anim.start();
    } else if (obj.animation === "pulse") {
      anim = new Konva.Animation((frame) => {
        if (shapeRef.current) {
          const scale = 1 + Math.sin(frame!.time * 0.005) * 0.1;
          shapeRef.current.scale({ x: scale, y: scale });
        }
      }, layer);
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [obj?.animation]);

  if (!obj) return null;

  const commonProps: any = {
    ...obj,
    id: obj.id,
    ref: shapeRef,
    draggable: isInteractionEnabled && obj.draggable !== false,
    listening: isInteractionEnabled && obj.listening !== false,
    onClick: isInteractionEnabled
      ? (e: any) => {
          e.cancelBubble = true;
          onSelect(obj.id);
        }
      : undefined,
    onDragEnd: isInteractionEnabled
      ? (e: any) => onDragEnd(obj.id, e.target.x(), e.target.y())
      : undefined,
    onMouseEnter: isInteractionEnabled
      ? () => {
          document.body.style.cursor = obj.type === "circle" ? "pointer" : "move";
        }
      : undefined,
    onMouseLeave: isInteractionEnabled
      ? () => {
          document.body.style.cursor = "default";
        }
      : undefined,
    onTransformEnd: isInteractionEnabled
      ? () => {
          const node = shapeRef.current;
          if (!node) return;
          updateObj(obj.id, {
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          });
        }
      : undefined,
  };

  if (obj.type === "rect") return <Rect {...commonProps} />;
  if (obj.type === "circle") return <Circle {...commonProps} />;
  if (obj.type === "star") return <Star {...commonProps} />;
  if (obj.type === "line")
    return (
      <Line
        {...commonProps}
        points={obj.points || []}
        stroke={obj.stroke || "#111827"}
        strokeWidth={obj.strokeWidth || 3}
        dash={obj.dash || []}
        tension={obj.tension ?? 0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={obj.globalCompositeOperation || "source-over"}
      />
    );
  if (obj.type === "arrow")
    return (
      <Arrow
        {...commonProps}
        points={[0, 0, 50, 50]}
        stroke={obj.fill}
        fill={obj.fill}
      />
    );
  if (obj.type === "text")
    return (
      <Text
        {...commonProps}
        text={obj.text || "Double click to edit"}
        fontSize={obj.fontSize || 20}
        fontFamily={obj.fontFamily || "Calibri"}
        fontStyle={obj.fontStyle || "normal"}
        onDblClick={() => {
          const nextText = window.prompt("Edit text", obj.text || "") ?? obj.text;
          updateObj(obj.id, { text: nextText });
        }}
      />
    );
  if (obj.type === "wedge")
    return (
      <Wedge
        {...commonProps}
        radius={obj.radius || 70}
        angle={obj.angle || 60}
        fill={obj.fill || "#ef4444"}
        stroke={obj.stroke || "black"}
        strokeWidth={obj.strokeWidth || 2}
        rotation={obj.rotation || -120}
      />
    );
  if (obj.type === "image") return <CanvasImageShape obj={obj} commonProps={commonProps} />;
  if (obj.type === "sprite") return <CanvasSpriteShape obj={obj} commonProps={commonProps} />;
  return null;
});

// --- Canvas Component ---
function Canvas({
  objects,
  setObjects,
  drawings,
  currentDrawingId,
  activeTool,
  drawColor,
  drawSize,
  drawStyle,
  drawTool,
  onManualSave,
}: {
  objects: any[];
  setObjects: any;
  drawings: any[];
  currentDrawingId: string | null;
  activeTool: ToolMode;
  drawColor: string;
  drawSize: number;
  drawStyle: BrushStyle;
  drawTool: DrawTool;
  onManualSave: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupDraftIds, setGroupDraftIds] = useState<string[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [clipboard, setClipboard] = useState<any>(null);
  const [redoStack, setRedoStack] = useState<any[]>([]); // For RedoF
  const trRef = useRef<Konva.Transformer>(null);
  const currentStage = useRef<Konva.Stage>(null);
  const isDrawingRef = useRef(false);
  const drawingLineIdRef = useRef<string | null>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const mediaTargetIdRef = useRef<string | null>(null);
  const router = useRouter();
  const { CanvasBoard, setCanvasBoard } = useCanvasState() as any;
  const [canvasBackground, setCanvasBackground] = useState("#f8fafc");

  useEffect(() => {
    const updateSize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (trRef.current && selectedId) {
      const node = currentStage.current?.findOne("#" + selectedId);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      }
    } else {
      trRef.current?.nodes([]);
    }
  }, [selectedId, objects]);

  useEffect(() => {
    setCanvasBoard((prev: any) => {
      const isSameObjects = prev.objects === objects;
      const isSameScale = prev.scale === scale;
      const isSameStagePos =
        prev.stagePos?.x === stagePos.x && prev.stagePos?.y === stagePos.y;

      if (isSameObjects && isSameScale && isSameStagePos) {
        return prev;
      }

      return { ...prev, objects, scale, stagePos };
    });
  }, [objects, scale, stagePos, setCanvasBoard]);

  const updateObj = (id: string, params: any) => {
    setObjects((prev: any[]) => {
      const target = prev.find((o) => o.id === id);
      if (!target) return prev;

      const nextX = params.x ?? target.x;
      const nextY = params.y ?? target.y;
      const dx = typeof target.x === "number" ? nextX - target.x : 0;
      const dy = typeof target.y === "number" ? nextY - target.y : 0;

      if (target.groupId && (dx !== 0 || dy !== 0)) {
        return prev.map((o) =>
          o.groupId === target.groupId
            ? {
                ...o,
                x: (typeof o.x === "number" ? o.x : 0) + dx,
                y: (typeof o.y === "number" ? o.y : 0) + dy,
                ...(o.id === id ? params : {}),
              }
            : o,
        );
      }

      return prev.map((o) => (o.id === id ? { ...o, ...params } : o));
    });
  };

  useEffect(() => {
    setCanvasBoard((prev: any) => {
      if (prev.currentStage === currentStage) {
        return prev;
      }

      return { ...prev, currentStage };
    });
  }, [currentStage]);

  useEffect(() => {
    if (activeTool === "draw") {
      setSelectedId(null);
      trRef.current?.nodes([]);
    }
  }, [activeTool]);

  useEffect(() => {
    const stage = currentStage.current;
    if (!stage) return;
    stage.container().style.backgroundColor = canvasBackground;
  }, [canvasBackground]);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool === "draw") return;

    if (e.target === e.target.getStage()) setSelectedId(null);

    if (CanvasBoard?.pendingShape) {
      const type = CanvasBoard.pendingShape;
      const newShape = {
        id: `${type}-${uuidv4()}`,
        type,
        x: cursorPos.x - (type === "rect" ? 50 : 0),
        y: cursorPos.y - (type === "rect" ? 50 : 0),
        fill: "#3b82f6",
        draggable: true,
        width: 100,
        height: 100,
        radius: 50,
        innerRadius: 30,
        outerRadius: 60,
        numPoints: 5,
        listening: true,
        // New Animation/Filter State
        animation: "none",
        blur: false,
        grayscale: false,
        invert: false,
      };
      setObjects((prev: any[]) => [...prev, newShape]);
      setCanvasBoard((prev: any) => ({ ...prev, pendingShape: null }));
    }
  };

  const startDrawing = () => {
    const stage = currentStage.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - stagePos.x) / scale;
    const y = (pointer.y - stagePos.y) / scale;
    const lineId = `line-${uuidv4()}`;

    setObjects((prev: any[]) => [
      ...prev,
      {
        id: lineId,
        type: "line",
        points: [x, y],
        stroke: drawTool === "eraser" ? "#000000" : drawColor,
        strokeWidth: drawSize,
        dash: brushStyleToDash(drawStyle),
        tension: 0.5,
        drawTool,
        globalCompositeOperation:
          drawTool === "eraser" ? "destination-out" : "source-over",
        draggable: true,
        listening: true,
      },
    ]);

    drawingLineIdRef.current = lineId;
    isDrawingRef.current = true;
  };

  const appendDrawingPoint = () => {
    const stage = currentStage.current;
    if (!stage || !isDrawingRef.current || !drawingLineIdRef.current) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - stagePos.x) / scale;
    const y = (pointer.y - stagePos.y) / scale;

    setCursorPos({ x, y });

    setObjects((prev: any[]) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const lastIndex = next.length - 1;
      const lastLine = next[lastIndex];

      if (!lastLine || lastLine.id !== drawingLineIdRef.current) {
        return prev;
      }

      const updatedLine = {
        ...lastLine,
        points: [...(lastLine.points || []), x, y],
      };
      next.splice(lastIndex, 1, updatedLine);
      return next;
    });
  };

  const finishDrawing = () => {
    isDrawingRef.current = false;
    drawingLineIdRef.current = null;
  };

  const selectedObject = objects.find((o) => o.id === selectedId);
  const isSelectedMedia = selectedObject?.type === "image" || selectedObject?.type === "sprite";

  const openMediaPicker = () => {
    if (!selectedObject || !isSelectedMedia) return;
    mediaTargetIdRef.current = selectedObject.id;
    mediaFileRef.current?.click();
  };

  const handleMediaFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const targetId = mediaTargetIdRef.current;
    if (!file || !targetId) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || "");
      const image = new window.Image();

      image.onload = () => {
        const canvasWidth = size.width || window.innerWidth;
        const canvasHeight = size.height || window.innerHeight;
        const ratio = Math.min(
          (canvasWidth - 40) / image.width,
          (canvasHeight - 40) / image.height,
          1,
        );

        updateObj(targetId, {
          src: dataUrl,
          width: Math.round(image.width * ratio),
          height: Math.round(image.height * ratio),
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        });
      };

      image.src = dataUrl;
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const addImageFromUrl = () => {
    const source = window.prompt("Paste image URL");
    if (!source) return;

    let normalizedSource = source.trim();
    try {
      normalizedSource = new URL(normalizedSource).toString();
    } catch {
      window.alert("Please enter a valid URL.");
      return;
    }

    const image = new window.Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvasWidth = size.width || window.innerWidth;
      const canvasHeight = size.height || window.innerHeight;
      const ratio = Math.min(
        (canvasWidth - 40) / image.width,
        (canvasHeight - 40) / image.height,
        1,
      );

      setObjects((prev: any[]) => [
        ...prev,
        {
          id: `image-${uuidv4()}`,
          type: "image",
          x: cursorPos.x || canvasWidth / 2,
          y: cursorPos.y || canvasHeight / 2,
          width: Math.round(image.width * ratio),
          height: Math.round(image.height * ratio),
          src: normalizedSource,
          draggable: true,
        },
      ]);
    };

    image.onerror = () => {
      window.alert("Could not load image from this URL.");
    };

    image.src = normalizedSource;
  };

  const replaceSelectedMediaFromUrl = () => {
    if (!selectedObject || !isSelectedMedia) return;

    const source = window.prompt("Paste image URL", selectedObject.src || "");
    if (!source) return;

    let normalizedSource = source.trim();
    try {
      normalizedSource = new URL(normalizedSource).toString();
    } catch {
      window.alert("Please enter a valid URL.");
      return;
    }

    const image = new window.Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvasWidth = size.width || window.innerWidth;
      const canvasHeight = size.height || window.innerHeight;
      const ratio = Math.min(
        (canvasWidth - 40) / image.width,
        (canvasHeight - 40) / image.height,
        1,
      );

      updateObj(selectedObject.id, {
        src: normalizedSource,
        width: Math.round(image.width * ratio),
        height: Math.round(image.height * ratio),
      });
    };

    image.onerror = () => {
      window.alert("Could not load image from this URL.");
    };

    image.src = normalizedSource;
  };

  const rotateSelectedMedia = (delta: number) => {
    if (!selectedObject || !isSelectedMedia) return;
    updateObj(selectedObject.id, { rotation: (selectedObject.rotation || 0) + delta });
  };

  const flipSelectedMedia = (axis: "x" | "y") => {
    if (!selectedObject || !isSelectedMedia) return;
    if (axis === "x") {
      updateObj(selectedObject.id, { scaleX: (selectedObject.scaleX || 1) * -1 });
      return;
    }
    updateObj(selectedObject.id, { scaleY: (selectedObject.scaleY || 1) * -1 });
  };

  const resetSelectedMediaTransform = () => {
    if (!selectedObject || !isSelectedMedia) return;
    updateObj(selectedObject.id, { rotation: 0, scaleX: 1, scaleY: 1 });
  };

  const exportSelectedMediaPng = () => {
    if (!selectedObject || !isSelectedMedia) return;
    const stage = currentStage.current;
    if (!stage) return;

    const node = stage.findOne(`#${selectedObject.id}`) as any;
    if (!node) return;

    const rect = node.getClientRect();
    const dataURL = stage.toDataURL({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      pixelRatio: 2,
    });

    const link = document.createElement("a");
    link.download = `${selectedObject.type}-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addCanvasItem = (type: "text" | "wedge" | "image" | "sprite") => {
    const x = cursorPos.x || size.width / 2;
    const y = cursorPos.y || size.height / 2;

    if (type === "text") {
      setObjects((prev: any[]) => [
        ...prev,
        {
          id: `text-${uuidv4()}`,
          type: "text",
          x,
          y,
          text: "Double click to edit",
          fontSize: 20,
          fontFamily: "Calibri",
          fill: "#111827",
          draggable: true,
        },
      ]);
      return;
    }

    if (type === "wedge") {
      setObjects((prev: any[]) => [
        ...prev,
        {
          id: `wedge-${uuidv4()}`,
          type: "wedge",
          x,
          y,
          radius: 70,
          angle: 60,
          rotation: -120,
          fill: "#ef4444",
          stroke: "black",
          strokeWidth: 2,
          draggable: true,
        },
      ]);
      return;
    }

    if (type === "image") {
      setObjects((prev: any[]) => [
        ...prev,
        {
          id: `image-${uuidv4()}`,
          type: "image",
          x,
          y,
          width: 160,
          height: 120,
          src: "https://konvajs.org/assets/yoda.jpg",
          draggable: true,
        },
      ]);
      return;
    }

    setObjects((prev: any[]) => [
      ...prev,
      {
        id: `sprite-${uuidv4()}`,
        type: "sprite",
        x,
        y,
        src: "https://konvajs.org/assets/blob-sprite.png",
        width: 74,
        height: 122,
        animation: "idle",
        frameRate: 7,
        animations: {
          idle: [2, 2, 70, 119, 71, 2, 74, 119, 146, 2, 81, 119, 226, 2, 76, 119],
          punch: [2, 138, 74, 122, 76, 138, 84, 122, 346, 138, 120, 122],
        },
        draggable: true,
      },
    ]);
  };

  const addImageFromDataUrl = (dataUrl: string, pointer?: { x: number; y: number }) => {
    const image = new window.Image();
    image.onload = () => {
      const canvasWidth = size.width || window.innerWidth;
      const canvasHeight = size.height || window.innerHeight;
      const ratio = Math.min(
        (canvasWidth - 40) / image.width,
        (canvasHeight - 40) / image.height,
        1,
      );

      const x = pointer ? (pointer.x - stagePos.x) / scale : cursorPos.x || canvasWidth / 2;
      const y = pointer ? (pointer.y - stagePos.y) / scale : cursorPos.y || canvasHeight / 2;

      setObjects((prev: any[]) => [
        ...prev,
        {
          id: `image-${uuidv4()}`,
          type: "image",
          x,
          y,
          width: Math.round(image.width * ratio),
          height: Math.round(image.height * ratio),
          src: dataUrl,
          draggable: true,
        },
      ]);
    };
    image.src = dataUrl;
  };

  const handleCanvasDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const stage = currentStage.current;
    if (!stage) return;

    stage.setPointersPositions(event.nativeEvent as unknown as MouseEvent);
    const pointer = stage.getPointerPosition() || {
      x: event.clientX,
      y: event.clientY,
    };

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = String(ev.target?.result || "");
        if (!dataUrl) return;
        addImageFromDataUrl(dataUrl, pointer);
      };
      reader.readAsDataURL(droppedFile);
      return;
    }

    const uri = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
    if (!uri) return;

    const maybeUrl = uri.trim();
    if (!/^https?:\/\//i.test(maybeUrl)) return;

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvasWidth = size.width || window.innerWidth;
      const canvasHeight = size.height || window.innerHeight;
      const ratio = Math.min(
        (canvasWidth - 40) / image.width,
        (canvasHeight - 40) / image.height,
        1,
      );

      setObjects((prev: any[]) => [
        ...prev,
        {
          id: `image-${uuidv4()}`,
          type: "image",
          x: (pointer.x - stagePos.x) / scale,
          y: (pointer.y - stagePos.y) / scale,
          width: Math.round(image.width * ratio),
          height: Math.round(image.height * ratio),
          src: maybeUrl,
          draggable: true,
        },
      ]);
    };
    image.src = maybeUrl;
  };

  const markForGrouping = () => {
    if (!selectedId) return;
    setGroupDraftIds((prev) => (prev.includes(selectedId) ? prev : [...prev, selectedId]));
  };

  const unmarkForGrouping = () => {
    if (!selectedId) return;
    setGroupDraftIds((prev) => prev.filter((id) => id !== selectedId));
  };

  const groupMarkedShapes = () => {
    if (groupDraftIds.length < 2) return;
    const groupId = `group-${uuidv4()}`;
    setObjects((prev: any[]) =>
      prev.map((o) => (groupDraftIds.includes(o.id) ? { ...o, groupId } : o)),
    );
    setGroupDraftIds([]);
  };

  const ungroupSelectedShape = () => {
    if (!selectedObject?.groupId) return;
    const selectedGroup = selectedObject.groupId;
    setObjects((prev: any[]) =>
      prev.map((o) => (o.groupId === selectedGroup ? { ...o, groupId: undefined } : o)),
    );
  };

  const moveSelectionLayer = (direction: "front" | "back") => {
    if (!selectedId) return;

    setObjects((prev: any[]) => {
      const selected = prev.find((o) => o.id === selectedId);
      if (!selected) return prev;

      const targetIds = selected.groupId
        ? prev.filter((o) => o.groupId === selected.groupId).map((o) => o.id)
        : [selectedId];

      const moving = prev.filter((o) => targetIds.includes(o.id));
      const rest = prev.filter((o) => !targetIds.includes(o.id));

      return direction === "front" ? [...rest, ...moving] : [...moving, ...rest];
    });
  };

  useEffect(() => {
    const stage = currentStage.current;
    const container = stage?.container();
    if (!container) return;

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer?.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const url = URL.createObjectURL(file);
      const rect = container.getBoundingClientRect();
      const pointerX = (event.clientX - rect.left - stagePos.x) / scale;
      const pointerY = (event.clientY - rect.top - stagePos.y) / scale;

      setObjects((prev: any[]) => [
        ...prev,
        {
          id: `image-${uuidv4()}`,
          type: "image",
          x: pointerX,
          y: pointerY,
          width: 180,
          height: 140,
          src: url,
          draggable: true,
        },
      ]);
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);

    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
    };
  }, [scale, stagePos, setObjects]);

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || ""))
        return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Helper to save history before an action
      const saveHistory = () => {
        setHistory((prev) => [...prev, [...objects]]);
        setRedoStack([]); // Clear redo on new action
      };

      switch (key) {
        // --- DELETE ---
        case "backspace":
        case "delete":
          if (selectedId) {
            saveHistory();
            setObjects((prev: typeof objects) => prev.filter((obj: any) => obj.id !== selectedId));
            setSelectedId(null);
          }
          break;

        // --- COPY (Ctrl + C) ---
        case "c":
          if (isCtrl && selectedId) {
            e.preventDefault();
            const target = objects.find((o) => o.id === selectedId);
            setClipboard({ ...target });
          }
          break;

        // --- SAVE (Ctrl + S) ---
        case "s":
          if (isCtrl) {
            e.preventDefault();
            onManualSave();
          }
          break;

        // --- Layer order ---
        case "]":
          if (isCtrl) {
            e.preventDefault();
            moveSelectionLayer("front");
          }
          break;
        case "[":
          if (isCtrl) {
            e.preventDefault();
            moveSelectionLayer("back");
          }
          break;

        // --- PASTE (Ctrl + V) ---
        case "v":
          if (isCtrl && clipboard) {
            e.preventDefault();
            saveHistory();
            const newId = `${clipboard.type}-${uuidv4()}`;
            const newObj = {
              ...clipboard,
              id: newId,
              x: clipboard.x + 20,
              y: clipboard.y + 20,
            };
            setObjects((prev: typeof objects) => [...prev, newObj]);
            setSelectedId(newId);
          }
          break;

        // --- UNDO (Ctrl + Z) ---
        case "z":
          if (isCtrl && !e.shiftKey) {
            e.preventDefault();
            if (history.length > 0) {
              const previous = history[history.length - 1];
              setRedoStack((prev) => [...prev, [...objects]]);
              setObjects(previous);
              setHistory((prev) => prev.slice(0, -1));
            }
          }
          // --- REDO (Ctrl + Shift + Z) ---
          else if (isCtrl && e.shiftKey) {
            e.preventDefault();
            if (redoStack.length > 0) {
              const next = redoStack[redoStack.length - 1];
              setHistory((prev) => [...prev, [...objects]]);
              setObjects(next);
              setRedoStack((prev) => prev.slice(0, -1));
            }
          }
          break;

        // --- DUPLICATE (Ctrl + D) ---
        case "d":
          if (isCtrl && selectedId) {
            e.preventDefault();
            saveHistory();
            const target = objects.find((o: any) => o.id === selectedId);
            if (target) {
              const newId = `${target.type}-${uuidv4()}`;
              setObjects((prev: typeof objects) => [
                ...prev,
                { ...target, id: newId, x: target.x + 20, y: target.y + 20 },
              ]);
              setSelectedId(newId);
            }
          }
          break;

        // --- UTILS ---
        case "l": // Lock
          setCanvasBoard((prev: any) => ({ ...prev, scaleLock: !prev.scaleLock }));
          break;

        case "0": // Reset Zoom
          if (isCtrl) {
            e.preventDefault();
            setScale(1);
            setStagePos({ x: 0, y: 0 });
          }
          break;

        // --- movements ---
        case "arrowleft":
          e.preventDefault();
          if (isCtrl) {
            // implement speeded movement left
          }
          if (selectedId) {
            const target = objects.find((o) => o.id === selectedId);
            target.x = target.x - 2;
          }
          break;
        case "arrowright":
          e.preventDefault();
          if (isCtrl) {
            // implement speeded movement left
          }
          if (selectedId) {
            const target = objects.find((o) => o.id === selectedId);
            target.x = target.x + 2;
          }
          break;
        case "arrowup": 
          e.preventDefault();
          if (isCtrl) {
            // implement speeded movement left
          }
          if (selectedId) {
            const target = objects.find((o) => o.id === selectedId);
            target.y = target.y - 2;
          }
          break;
          case "arrowdown": 
          e.preventDefault();
          if (isCtrl) {
            // implement speeded movement left
          }
          if (selectedId) {
            const target = objects.find((o) => o.id === selectedId);
            target.y = target.y + 2;
          }
          break;
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [selectedId, objects, clipboard, history, redoStack, onManualSave]);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className="w-full h-full block"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleCanvasDrop}
      >
        <Stage
          ref={currentStage}
          width={size.width}
          height={size.height}
          scaleX={scale}
          scaleY={scale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={activeTool === "draw" ? false : !CanvasBoard?.scaleLock}
          style={{ cursor: activeTool === "draw" ? "crosshair" : "default" }}
          onMouseDown={(e) => {
            if (activeTool === "draw") {
              if (e.evt.button !== 0) return;
              e.evt.preventDefault();
              startDrawing();
              return;
            }

            if (e.evt.button === 1) setIsPanning(true);
          }}
          onTouchStart={() => {
            if (activeTool !== "draw") return;
            startDrawing();
          }}
          onMouseUp={() => {
            setIsPanning(false);
            if (activeTool === "draw") {
              finishDrawing();
            }
          }}
          onTouchEnd={() => {
            if (activeTool === "draw") {
              finishDrawing();
            }
          }}
          onMouseLeave={() => {
            if (activeTool === "draw") {
              finishDrawing();
            }
          }}
          onWheel={(e) => {
            if (CanvasBoard?.scaleLock) return;
            e.evt.preventDefault();
            const stage = currentStage.current!;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition()!;
            const mousePointTo = {
              x: (pointer.x - stage.x()) / oldScale,
              y: (pointer.y - stage.y()) / oldScale,
            };
            const newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
            setScale(newScale);
            setStagePos({
              x: pointer.x - mousePointTo.x * newScale,
              y: pointer.y - mousePointTo.y * newScale,
            });
          }}
          onClick={handleStageClick}
          onMouseMove={(e) => {
            if (activeTool === "draw") {
              const leftButtonDown = (e.evt.buttons & 1) === 1;

              if (leftButtonDown && !isDrawingRef.current) {
                startDrawing();
              }

              if (!leftButtonDown && isDrawingRef.current) {
                finishDrawing();
                return;
              }

              appendDrawingPoint();
              return;
            }

            const stage = e.target.getStage();
            const pointer = stage?.getPointerPosition();
            if (!pointer) return;

            const x = (pointer.x - stagePos.x) / scale;
            const y = (pointer.y - stagePos.y) / scale;

            setCursorPos({ x, y });
          }}
          onTouchMove={() => {
            if (activeTool === "draw") {
              appendDrawingPoint();
            }
          }}
        >
          <Layer>
            <Rect
              x={-stagePos.x / scale}
              y={-stagePos.y / scale}
              width={size.width / scale}
              height={size.height / scale}
              fill={canvasBackground}
              listening={false}
            />
            {objects.map((obj) => (
              <ShapeRenderer
                key={obj.id}
                id={obj.id}
                onSelect={setSelectedId}
                isInteractionEnabled={activeTool !== "draw"}
                updateObj={updateObj}
                onDragEnd={(id: string, x: number, y: number) =>
                  updateObj(id, { x, y })
                }
              />
            ))}
            {activeTool !== "draw" && (
              <Transformer
                ref={trRef}
                borderStroke="#3b82f6"
                anchorFill="#fff"
                anchorStroke="#3b82f6"
                anchorSize={8}
              />
            )}

            {CanvasBoard?.pendingShape && activeTool !== "draw" && (
              <Rect
                x={cursorPos.x - 50}
                y={cursorPos.y - 50}
                width={100}
                height={100}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth={1}
                dash={[5, 5]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuSub>
          <ContextMenuSubTrigger>Canvas Background</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            {CANVAS_BACKGROUND_PRESETS.map((preset) => (
              <ContextMenuItem key={preset.value} onClick={() => setCanvasBackground(preset.value)}>
                <div
                  className="w-4 h-4 rounded-full mr-2 border border-border"
                  style={{ backgroundColor: preset.value }}
                />
                {preset.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        {selectedId ? (
          <>
            <ContextMenuItem onClick={() => addCanvasItem("image")}>Add Image</ContextMenuItem>
            <ContextMenuItem onClick={addImageFromUrl}>Add Image From URL</ContextMenuItem>
            <ContextMenuItem onClick={() => addCanvasItem("sprite")}>Add Sprite</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                const obj = objects.find((o) => o.id === selectedId);
                if (obj) {
                  setHistory((prev) => [...prev, [...objects]]);
                  setRedoStack([]);
                  setObjects((prev: any[]) => [
                    ...prev,
                    {
                      ...obj,
                      id: `${obj.type}-${uuidv4()}`,
                      x: obj.x + 20,
                      y: obj.y + 20,
                    },
                  ]);
                }
              }}
            >
              <Copy className="w-4 h-4 mr-2" /> Duplicate
            </ContextMenuItem>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <PaintRoller className="w-4 h-4 mr-2" /> Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-32">
                {["#3b82f6", "#ef4444", "#22c55e", "#000000"].map((c) => (
                  <ContextMenuItem
                    key={c}
                    onClick={() => updateObj(selectedId, { fill: c })}
                  >
                    <div
                      className="w-4 h-4 rounded-full mr-2 border border-border"
                      style={{ backgroundColor: c }}
                    />{" "}
                    {c}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Wand2 className="w-4 h-4 mr-2" /> Filters
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  onClick={() =>
                    updateObj(selectedId, {
                      blur: !selectedObject?.blur,
                      blurValue: 10,
                    })
                  }
                >
                  {selectedObject?.blur ? "Remove Blur" : "Add Blur"}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    updateObj(selectedId, {
                      grayscale: !selectedObject?.grayscale,
                    })
                  }
                >
                  {selectedObject?.grayscale ? "Remove Grayscale" : "Grayscale"}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    updateObj(selectedId, { invert: !selectedObject?.invert })
                  }
                >
                  Invert Colors
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Zap className="w-4 h-4 mr-2" /> Animations
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  onClick={() => updateObj(selectedId, { animation: "none" })}
                >
                  None
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => updateObj(selectedId, { animation: "spin" })}
                >
                  Spinning
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => updateObj(selectedId, { animation: "pulse" })}
                >
                  Pulse
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => moveSelectionLayer("front")}>Bring To Front</ContextMenuItem>
            <ContextMenuItem onClick={() => moveSelectionLayer("back")}>Send To Back</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={markForGrouping}>Mark For Group</ContextMenuItem>
            <ContextMenuItem onClick={unmarkForGrouping}>Unmark From Group</ContextMenuItem>
            {groupDraftIds.length >= 2 && (
              <ContextMenuItem onClick={groupMarkedShapes}>Create Group ({groupDraftIds.length})</ContextMenuItem>
            )}
            {!!selectedObject?.groupId && (
              <ContextMenuItem onClick={ungroupSelectedShape}>Ungroup</ContextMenuItem>
            )}
            {!!selectedObject && selectedObject.type === "sprite" && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>Sprite</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem onClick={() => updateObj(selectedObject.id, { animation: "idle" })}>Set Idle</ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedObject.id, {
                        animation: "punch",
                        punchNonce: Date.now(),
                        onAnimationDone: () => updateObj(selectedObject.id, { animation: "idle" }),
                      })
                    }
                  >
                    Punch Once
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => updateObj(selectedObject.id, { frameRate: (selectedObject.frameRate || 7) + 1 })}>Increase FPS</ContextMenuItem>
                  <ContextMenuItem onClick={() => updateObj(selectedObject.id, { frameRate: Math.max(1, (selectedObject.frameRate || 7) - 1) })}>Decrease FPS</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
            {isSelectedMedia && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>Media</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem onClick={openMediaPicker}>Load/Replace Image</ContextMenuItem>
                  <ContextMenuItem onClick={replaceSelectedMediaFromUrl}>Replace From URL</ContextMenuItem>
                  <ContextMenuItem onClick={() => rotateSelectedMedia(-90)}>Rotate -90°</ContextMenuItem>
                  <ContextMenuItem onClick={() => rotateSelectedMedia(90)}>Rotate +90°</ContextMenuItem>
                  <ContextMenuItem onClick={() => flipSelectedMedia("x")}>Flip Horizontal</ContextMenuItem>
                  <ContextMenuItem onClick={() => flipSelectedMedia("y")}>Flip Vertical</ContextMenuItem>
                  <ContextMenuItem onClick={resetSelectedMediaTransform}>Reset Transform</ContextMenuItem>
                  <ContextMenuItem onClick={exportSelectedMediaPng}>Save Selected as PNG</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
            {!!selectedObject && selectedObject.type === "text" && (
              <>
                <ContextMenuItem
                  onClick={() => {
                    const nextText = window.prompt("Edit text", selectedObject.text || "") ?? selectedObject.text;
                    updateObj(selectedObject.id, { text: nextText });
                  }}
                >
                  Edit Text
                </ContextMenuItem>
                <ContextMenuItem onClick={() => updateObj(selectedObject.id, { fontSize: (selectedObject.fontSize || 20) + 2 })}>Increase Font</ContextMenuItem>
                <ContextMenuItem onClick={() => updateObj(selectedObject.id, { fontSize: Math.max(10, (selectedObject.fontSize || 20) - 2) })}>Decrease Font</ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    updateObj(selectedObject.id, {
                      fontStyle: selectedObject.fontStyle === "bold" ? "normal" : "bold",
                    })
                  }
                >
                  Toggle Bold
                </ContextMenuItem>
              </>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => {
                setHistory((prev) => [...prev, [...objects]]);
                setRedoStack([]);
                setObjects((prev: any[]) => prev.filter((o) => o.id !== selectedId));
                setSelectedId(null);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onClick={() => addCanvasItem("text")}>Add Text</ContextMenuItem>
            <ContextMenuItem onClick={() => addCanvasItem("wedge")}>Add Wedge</ContextMenuItem>
            <ContextMenuItem onClick={() => addCanvasItem("image")}>Add Image</ContextMenuItem>
            <ContextMenuItem onClick={addImageFromUrl}>Add Image From URL</ContextMenuItem>
            <ContextMenuItem onClick={() => addCanvasItem("sprite")}>Add Sprite</ContextMenuItem>
            <ContextMenuSeparator />
            {groupDraftIds.length >= 2 && (
              <ContextMenuItem onClick={groupMarkedShapes}>Create Group ({groupDraftIds.length})</ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                const stage = currentStage.current;
                if (!stage) return;

                const link = document.createElement('a');
                link.href = stage.toDataURL({ pixelRatio: 2 });
                const drawingName = drawings.find((d) => d.id === currentDrawingId)?.name || 'canvas';
                link.download = `${drawingName}-${Date.now()}.png`;
                link.click();
              }}
            >
              Export Canvas
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
      <input
        ref={mediaFileRef}
        type="file"
        accept="image/*"
        onChange={handleMediaFileChange}
        className="hidden"
      />
    </ContextMenu>
  );
}

const CanvasBoard = () => {
  const objects = useCanvasStore((state) => state.objects);
  const setObjects = useCanvasStore((state) => state.setObjects);
  const loadedDrawingIdRef = useRef<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>("select");
  const [drawTool, setDrawTool] = useState<DrawTool>("brush");
  const [drawColor, setDrawColor] = useState("#111827");
  const [drawSize, setDrawSize] = useState(3);
  const [drawStyle, setDrawStyle] = useState<BrushStyle>("solid");
  const { CanvasBoard, setCanvasBoard } = useCanvasState() as any;
  const { drawings, currentDrawingId, setCurrentDrawingId, updateCurrentDrawing } = useDrawings();

  // Initialize persistence
  const { syncToYjs } = useCanvasPersistence(setObjects as any);

  // Watch for drawing changes and load objects
  useEffect(() => {
    if (!currentDrawingId) {
      loadedDrawingIdRef.current = null;
      return;
    }

    if (loadedDrawingIdRef.current === currentDrawingId) {
      return;
    }

    const currentDrawing = drawings.find((d) => d.id === currentDrawingId);
    if (!currentDrawing) {
      return;
    }

    // Load drawing content only when switching drawings, not on every drawings update.
    const uniqueObjects = Array.from(
      new Map(currentDrawing.objects.map((obj: any) => [obj.id, obj])).values(),
    ) as any[];
    setObjects(uniqueObjects);
    loadedDrawingIdRef.current = currentDrawingId;
  }, [currentDrawingId, drawings, setObjects]);

  // Separate effect to persist drawing changes (don't call during render)
  useEffect(() => {
    if (currentDrawingId && objects.length > 0) {
      const timer = setTimeout(() => {
        updateCurrentDrawing(objects);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [objects, currentDrawingId]);

  const handleManualSave = () => {
    if (!currentDrawingId) return;
    updateCurrentDrawing(objects);
  };

  return (
    <>
      <div className="relative w-full h-full overflow-hidden bg-background">
        <Canvas
          objects={objects}
          setObjects={setObjects}
          drawings={drawings}
          currentDrawingId={currentDrawingId}
          activeTool={activeTool}
          drawTool={drawTool}
          drawColor={drawColor}
          drawSize={drawSize}
          drawStyle={drawStyle}
          onManualSave={handleManualSave}
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
        <Controller
          activeTool={activeTool}
          onSelectTool={(tool) => {
            setActiveTool(tool);
            if (tool === "draw") {
              setCanvasBoard((prev: any) => ({ ...prev, pendingShape: null }));
            }
          }}
          onAddShape={(type) => {
            setActiveTool("select");
            setCanvasBoard((prev: any) => ({ ...prev, pendingShape: type }));
          }}
        />
        
        <div className="fixed top-4 right-4 bg-background px-3 py-2 rounded border border-border z-50 shadow-sm flex items-center gap-3">
          {/* Editing label */}
          {currentDrawingId && (
            <div className="flex items-center gap-2 pr-3 border-r border-border">
              <p className="text-xs text-sidebar-foreground/60">Editing:</p>
              <p className="text-sm font-semibold text-sidebar-foreground max-w-37.5 truncate">
                {drawings.find((d) => d.id === currentDrawingId)?.name || "Untitled"}
              </p>
            </div>
          )}
          {/* Lock button */}
          <button
            onClick={() =>
              setCanvasBoard((prev: any) => ({
                ...prev,
                scaleLock: !prev.scaleLock,
              }))
            }
          >
            {(useCanvasState() as any)?.CanvasBoard?.scaleLock ? (
              <Lock className="w-4 h-4 text-blue-500" />
            ) : (
              <LockOpen className="w-4 h-4" />
            )}
          </button>
        </div>
        <AutoSaveIndicator />
      </div>
    </>
  );
};

const Page = () => {
  return (
    <>
      <CanvasBoard />
    </>
  );
};

export default Page;
