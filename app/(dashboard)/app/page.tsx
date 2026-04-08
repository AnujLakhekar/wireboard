"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Circle,
  Star,
  Arrow,
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
} from "lucide-react";

import { useCanvasState } from "@/providers/CanvasStateProvider";

// --- Controller Component ---
const Controller = ({ onAddShape }: { onAddShape: (type: string) => void }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tools = [
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
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background p-2 rounded-xl shadow-2xl border border-border flex items-center gap-2 z-[60]" ref={dropdownRef}>
      {tools.map((tool) => (
        <div key={tool.id} className="relative">
          <button
            onClick={() => tool.type === "dropdown" ? setOpenDropdown(openDropdown === tool.id ? null : tool.id) : setOpenDropdown(null)}
            className={`p-2 rounded-lg hover:bg-muted flex flex-col items-center min-w-[50px] transition-colors ${openDropdown === tool.id ? "bg-muted" : ""}`}
          >
            <tool.Icon className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">{tool.name}</span>
          </button>
          {tool.type === "dropdown" && openDropdown === tool.id && (
            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg shadow-xl p-1 min-w-[140px] flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2">
              {tool.options?.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { onAddShape(opt.id); setOpenDropdown(null); }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors text-left"
                >
                  {opt.icon ? <opt.icon className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-50" />}
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

// --- Shape Component (Handles Individual Animations and Filters) ---
const ShapeRenderer = ({ obj, isSelected, onSelect, onDragEnd, updateObj }: any) => {
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
  }, [obj.blur, obj.grayscale, obj.invert, obj.blurValue, obj.fill, obj.width, obj.height]);

  // Handle Animations
  useEffect(() => {
    let anim: Konva.Animation;
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
    return () => anim?.stop();
  }, [obj.animation]);

  const commonProps = {
    ...obj,
    ref: shapeRef,
    onClick: (e: any) => { e.cancelBubble = true; onSelect(obj.id); },
    onDragEnd: (e: any) => onDragEnd(obj.id, e.target.x(), e.target.y()),
    onTransformEnd: (e: any) => {
        const node = shapeRef.current;
        updateObj(obj.id, {
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
        });
    }
  };

  if (obj.type === "rect") return <Rect {...commonProps} />;
  if (obj.type === "circle") return <Circle {...commonProps} />;
  if (obj.type === "star") return <Star {...commonProps} />;
  if (obj.type === "arrow") return <Arrow {...commonProps} points={[0, 0, 50, 50]} stroke={obj.fill} fill={obj.fill} />;
  if (obj.type === "text") return <Text {...commonProps} text="Double click to edit" fontSize={20} />;
  return null;
};

// --- Canvas Component ---
function Canvas({ objects, setObjects }: { objects: any[]; setObjects: any }) {
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  
  const trRef = useRef<Konva.Transformer>(null);
  const currentStage = useRef<Konva.Stage>(null);
  const router = useRouter();
  const { CanvasBoard, setCanvasBoard } = useCanvasState() as any;

  useEffect(() => {
    const updateSize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
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
    setObjects((prev: any[]) => prev.map(o => o.id === id ? { ...o, ...params } : o));
  };

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
    
    if (CanvasBoard?.pendingShape) {
      const type = CanvasBoard.pendingShape;
      const newShape = {
        id: `${type}-${Date.now()}`,
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
        invert: false
      };
      setObjects((prev: any) => [...prev, newShape]);
      setCanvasBoard((prev: any) => ({ ...prev, pendingShape: null }));
    }
  };

  const selectedObject = objects.find(o => o.id === selectedId);

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
          draggable={CanvasBoard?.scaleLock ? false : true}
          onMouseDown={(e) => e.evt.button === 1 && setIsPanning(true)}
          onMouseUp={() => setIsPanning(false)}
          onWheel={(e) => {
            if (CanvasBoard?.scaleLock) return;
            e.evt.preventDefault();
            const stage = currentStage.current!;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition()!;
            const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
            const newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
            setScale(newScale);
            setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
          }}
          onClick={handleStageClick}
          onMouseMove={(e) => {
            const pointer = e.target.getStage()?.getPointerPosition();
            if (pointer) {
                setCursorPos({
                    x: (pointer.x - stagePos.x) / scale,
                    y: (pointer.y - stagePos.y) / scale,
                });
            }
          }}
        >
          <Layer>
            {objects.map((obj) => (
              <ShapeRenderer 
                key={obj.id} 
                obj={obj} 
                onSelect={setSelectedId} 
                updateObj={updateObj}
                onDragEnd={(id: string, x: number, y: number) => updateObj(id, { x, y })}
              />
            ))}
            <Transformer ref={trRef} borderStroke="#3b82f6" anchorFill="#fff" anchorStroke="#3b82f6" anchorSize={8} />
            
            {CanvasBoard?.pendingShape && (
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
            <ContextMenuItem onClick={() => {
                const obj = objects.find(o => o.id === selectedId);
                if (obj) setObjects([...objects, { ...obj, id: `${obj.type}-${Date.now()}`, x: obj.x + 20, y: obj.y + 20 }]);
            }}>
              <Copy className="w-4 h-4 mr-2" /> Duplicate
            </ContextMenuItem>
            
            <ContextMenuSub>
              <ContextMenuSubTrigger><PaintRoller className="w-4 h-4 mr-2" /> Color</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-32">
                {["#3b82f6", "#ef4444", "#22c55e", "#000000"].map(c => (
                  <ContextMenuItem key={c} onClick={() => updateObj(selectedId, { fill: c })}>
                    <div className="w-4 h-4 rounded-full mr-2 border border-border" style={{ backgroundColor: c }} /> {c}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger><Wand2 className="w-4 h-4 mr-2" /> Filters</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => updateObj(selectedId, { blur: !selectedObject?.blur, blurValue: 10 })}>
                  {selectedObject?.blur ? "Remove Blur" : "Add Blur"}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => updateObj(selectedId, { grayscale: !selectedObject?.grayscale })}>
                  {selectedObject?.grayscale ? "Remove Grayscale" : "Grayscale"}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => updateObj(selectedId, { invert: !selectedObject?.invert })}>
                  Invert Colors
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger><Zap className="w-4 h-4 mr-2" /> Animations</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => updateObj(selectedId, { animation: "none" })}>None</ContextMenuItem>
                <ContextMenuItem onClick={() => updateObj(selectedId, { animation: "spin" })}>Spinning</ContextMenuItem>
                <ContextMenuItem onClick={() => updateObj(selectedId, { animation: "pulse" })}>Pulse</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={() => setObjects(objects.filter(o => o.id !== selectedId))}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </ContextMenuItem>
          </>
        ) : (
          <ContextMenuItem>Export Canvas (PNG)</ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

const Page = () => {
  const [objects, setObjects] = useState<any[]>([]);
  const { setCanvasBoard } = useCanvasState() as any;

  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      <Canvas objects={objects} setObjects={setObjects} />
      <Controller onAddShape={(type) => setCanvasBoard((prev: any) => ({ ...prev, pendingShape: type }))} />
      <div className="fixed top-4 right-4 bg-background p-2 rounded border border-border z-50 shadow-sm hover:bg-muted transition-colors">
        <button onClick={() => setCanvasBoard((prev: any) => ({ ...prev, scaleLock: !prev.scaleLock }))}>
          {useCanvasState()?.CanvasBoard?.scaleLock ? <Lock className="w-4 h-4 text-blue-500" /> : <LockOpen className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default Page;