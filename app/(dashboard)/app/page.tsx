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

// --- Shape Component (Handles Individual Animations and Filters) ---
const ShapeRenderer = ({
  obj,
  isSelected,
  onSelect,
  onDragEnd,
  updateObj,
  isInteractionEnabled,
}: any) => {
  const shapeRef = useRef<any>(null);

  // Apply Filters
  useEffect(() => {
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
    obj.blur,
    obj.grayscale,
    obj.invert,
    obj.blurValue,
    obj.fill,
    obj.width,
    obj.height,
  ]);

  // Handle Animations
  useEffect(() => {
    let anim: Konva.Animation | undefined;
    if (obj.animation === "spin") {
      anim = new Konva.Animation((frame) => {
        if (shapeRef.current) shapeRef.current.rotation(frame!.time * 0.1);
      }, shapeRef.current.getLayer());
      anim.start();
    } else if (obj.animation === "pulse") {
      anim = new Konva.Animation((frame) => {
        if (shapeRef.current) {
          const scale = 1 + Math.sin(frame!.time * 0.005) * 0.1;
          shapeRef.current.scale({ x: scale, y: scale });
        }
      }, shapeRef.current.getLayer());
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [obj.animation]);

  const commonProps = {
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
    onTransformEnd: isInteractionEnabled
      ? () => {
          const node = shapeRef.current;
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
        lineCap="round"
        lineJoin="round"
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
    return <Text {...commonProps} text="Double click to edit" fontSize={20} />;
  return null;
};

// --- Canvas Component ---
function Canvas({
  objects,
  setObjects,
  drawings,
  currentDrawingId,
  activeTool,
}: {
  objects: any[];
  setObjects: any;
  drawings: any[];
  currentDrawingId: string | null;
  activeTool: ToolMode;
}) {
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingLineId, setDrawingLineId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [clipboard, setClipboard] = useState<any>(null);
  const [redoStack, setRedoStack] = useState<any[]>([]); // For RedoF
  const trRef = useRef<Konva.Transformer>(null);
  const currentStage = useRef<Konva.Stage>(null);
  const router = useRouter();
  const { CanvasBoard, setCanvasBoard } = useCanvasState() as any;

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
    setCanvasBoard((prev: any) => ({ ...prev, objects, scale, stagePos }));
  }, [objects, scale, stagePos, setCanvasBoard]);

  const updateObj = (id: string, params: any) => {
    setObjects((prev: any[]) =>
      prev.map((o) => (o.id === id ? { ...o, ...params } : o)),
    );
  };

  useEffect(() => {
    setCanvasBoard((prev: any) => ({ ...prev, currentStage }));
  }, [currentStage]);

  useEffect(() => {
    if (activeTool === "draw") {
      setSelectedId(null);
      trRef.current?.nodes([]);
    }
  }, [activeTool]);

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

  const selectedObject = objects.find((o) => o.id === selectedId);

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
  }, [selectedId, objects, clipboard, history, redoStack]);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full block">
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
            const stage = e.target.getStage();
            if (!stage) return;

            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            if (activeTool === "draw") {
              if (e.evt.button !== 0) return;

              const x = (pointer.x - stagePos.x) / scale;
              const y = (pointer.y - stagePos.y) / scale;
              const lineId = `line-${uuidv4()}`;

              setObjects((prev: any[]) => [
                ...prev,
                {
                  id: lineId,
                  type: "line",
                  points: [x, y, x, y],
                  stroke: "#111827",
                  strokeWidth: 3,
                  draggable: true,
                  listening: true,
                },
              ]);

              setDrawingLineId(lineId);
              setIsDrawing(true);
              return;
            }

            if (e.evt.button === 1) setIsPanning(true);
          }}
          onMouseUp={() => {
            setIsPanning(false);
            if (activeTool === "draw") {
              setIsDrawing(false);
              setDrawingLineId(null);
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
            const stage = e.target.getStage();
            const pointer = stage?.getPointerPosition();
            if (pointer) {
              const x = (pointer.x - stagePos.x) / scale;
              const y = (pointer.y - stagePos.y) / scale;

              setCursorPos({ x, y });

              if (activeTool === "draw" && isDrawing && drawingLineId) {
                setObjects((prev: any[]) =>
                  prev.map((obj) => {
                    if (obj.id !== drawingLineId) return obj;
                    return { ...obj, points: [...obj.points, x, y] };
                  }),
                );
              }
            }
          }}
        >
          <Layer>
            {objects.map((obj) => (
              <ShapeRenderer
                key={obj.id}
                obj={obj}
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
        {selectedId ? (
          <>
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
          <ContextMenuItem
            onClick={() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                const drawingName = drawings.find((d) => d.id === currentDrawingId)?.name || 'canvas';
                link.download = `${drawingName}-${Date.now()}.png`;
                link.click();
              }
            }}
          >
            Export Canvas (PNG)
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

const CanvasBoard = () => {
  const [objects, setObjects] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<ToolMode>("select");
  const { CanvasBoard, setCanvasBoard } = useCanvasState() as any;
  const { drawings, currentDrawingId, setCurrentDrawingId, updateCurrentDrawing } = useDrawings();

  // Initialize persistence
  const { syncToYjs } = useCanvasPersistence(setObjects);

  // Watch for drawing changes and load objects
  useEffect(() => {
    if (currentDrawingId) {
      const currentDrawing = drawings.find((d) => d.id === currentDrawingId);
      if (currentDrawing) {
        // Filter out duplicates by ID when loading
        const uniqueObjects = Array.from(
          new Map(currentDrawing.objects.map((obj: any) => [obj.id, obj])).values()
        );
        setObjects(uniqueObjects);
      }
    }
  }, [currentDrawingId, drawings]);

  // Separate effect to persist drawing changes (don't call during render)
  useEffect(() => {
    if (currentDrawingId && objects.length > 0) {
      const timer = setTimeout(() => {
        updateCurrentDrawing(objects);
      }, 200); // Aggressive debounce for quick saves - 200ms
      return () => clearTimeout(timer);
    }
  }, [objects, currentDrawingId]);

  // Wrap setObjects (persisting handled in separate effect to avoid loops)
  const updateObjectsAndPersist = (newObjectsOrFn: any) => {
    setObjects((prev) => {
      return typeof newObjectsOrFn === "function" ? newObjectsOrFn(prev) : newObjectsOrFn;
    });
  };

  return (
    <>
      <div className="w-screen h-screen overflow-hidden bg-background">
        <Canvas
          objects={objects}
          setObjects={updateObjectsAndPersist}
          drawings={drawings}
          currentDrawingId={currentDrawingId}
          activeTool={activeTool}
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
