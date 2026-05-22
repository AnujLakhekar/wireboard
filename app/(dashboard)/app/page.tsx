"use client";
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import { useMutation, useQuery } from "convex/react";

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
  Image,
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

const spriteCodeBlockSample = `function SpriteBehavior(sprite, frame, time) {
  const radius = 100;
  const angle = (time / 3000) * Math.PI * 2;

  const x = sprite.startX + Math.cos(angle) * radius;
  const y = sprite.startY + Math.sin(angle) * radius;

  sprite.moveTo(x, y);
}`;

// Compress image before upload
const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.75,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to compress image"));
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

const Exporter = () => {
  return <></>;
};
// Export canvas as PNG
const exportCanvasAsPNG = (stageRef: any, drawingName: string = "canvas") => {
  if (!stageRef?.current) return;
  try {
    const dataURL = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${drawingName}-${Date.now()}.png`;
    link.click();
  } catch (error) {
    console.error("Failed to export canvas:", error);
  }
};

type ToolMode = "select" | "draw";
type BrushStyle = "solid" | "dashed" | "dotted";
type DrawTool = "brush" | "eraser";

const CANVAS_BACKGROUND_PRESETS = [
  { label: "White", value: "#ffffff" },
  { label: "blue", value: "blue" },
  { label: "green", value: "lightgreen" },
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

  const shapeTools = [
    { id: "rect", name: "Rectangle", icon: Square },
    { id: "circle", name: "Circle", icon: CircleIcon },
    { id: "arrow", name: "Arrow", icon: ArrowRightFromLine },
    { id: "star", name: "Star", icon: StarIcon },
  ];

  return (
    <div
      ref={dropdownRef}
      className="fixed bottom-4 left-1/2 z-40 w-[16vw] -translate-x-1/2"
    >
      <Card className="overflow-visible rounded-2xl border border-muted/70 bg-background backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTool("select")}
              className={`grid size-10 place-items-center rounded-xl border transition-all ${activeTool === "select" ? "border-destructive/70 bg-destructive text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)]" : "border-zinc-700/70 bg-background text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"}`}
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
                className="flex h-10 items-center gap-2 rounded-xl border border-muted/70 bg-muted px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-muted hover:bg-muted"
                aria-label="Shapes"
              >
                <Square className="h-4 w-4" />
                Shapes
              </button>

              {openDropdown === "shapes" && (
                <div className="absolute bottom-full left-0 mb-2 min-w-44 overflow-hidden rounded-xl border border-muted/80 bg-muted p-1 shadow-[0_16px_40px_rgba(0,0,0,0.55)] text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
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
              className={`flex h-10 items-center gap-2 rounded-xl border border-muted/70 px-3 text-xs font-medium text-muted-foreground transition-colors  ${activeTool == "draw" ? "bg-destructive hover:border-zinc-600 hover:bg-destructive" : "bg-muted hover:border-zinc-600 hover:bg-muted"} "} `}
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

  const colors = [
    "#111827",
    "#ef4444",
    "#2563eb",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
  ];

  return (
    <Card className="fixed bottom-25 left-1/2 z-70 w-[min(95vw,46rem)] -translate-x-1/2 rounded-2xl border border-muted/70 bg-background/90  backdrop-blur-xl">
      <CardContent>
        <div className="flex flex-wrap items-center gap-2.5">
          <Tabs
            value={drawTool}
            onValueChange={(value: string) =>
              onDrawToolChange(value as DrawTool)
            }
            className="min-w-40"
          >
            <TabsList className="grid h-8 w-full grid-cols-2 rounded-lg border border-muted bg-background/80">
              <TabsTrigger value="brush">Brush</TabsTrigger>
              <TabsTrigger value="eraser">Eraser</TabsTrigger>
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

          <div className="ml-auto flex min-w-42 items-center gap-2 rounded-lg border border-muted bg-background/80 px-2 py-1.5">
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
            <Badge
              variant="outline"
              className="h-6 border-zinc-700 bg-zinc-950 px-2 text-[10px] text-zinc-200"
            >
              {size}px
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {(["solid", "dashed", "dotted"] as BrushStyle[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onStyleChange(option)}
                className={`rounded-md border px-2.5 py-1 text-[10px] font-medium capitalize transition-colors ${style === option ? "border-muted-foreground bg-foreground text-background" : "border-muted bg-background text-foreground hover:bg-muted"}`}
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

const CanvasImageShape = ({
  obj,
  commonProps,
}: {
  obj: any;
  commonProps: any;
}) => {
  const [image, status] = useImage(obj.src || "");
  const [shimmerOffset, setShimmerOffset] = React.useState(0);

  React.useEffect(() => {
    if (status !== "loading") return;

    const interval = setInterval(() => {
      setShimmerOffset((prev) => (prev + 20) % 400);
    }, 30);

    return () => clearInterval(interval);
  }, [status]);

  if (!image) {
    if (status === "loading") {
      return (
        <KonvaGroup {...commonProps}>
          {/* Background Rect */}
          <Rect
            width={obj.width || 120}
            height={obj.height || 120}
            fill="#f0f0f0"
            stroke="#e5e7eb"
            cornerRadius={6}
          />
          {/* Shimmer overlay */}
          <Rect
            width={obj.width || 120}
            height={obj.height || 120}
            fill={`url(#shimmer-${shimmerOffset})`}
            opacity={0.6}
            cornerRadius={6}
          />
          <Text
            text="Loading..."
            fontSize={12}
            fill="#9ca3af"
            align="center"
            verticalAlign="middle"
            width={obj.width || 120}
            height={obj.height || 120}
          />
        </KonvaGroup>
      );
    }

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

const CanvasSpriteShape = ({
  obj,
  commonProps,
}: {
  obj: any;
  commonProps: any;
}) => {
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

// --- Sprite Script Editor Modal ---
const SpriteScriptEditor = ({
  isOpen,
  onClose,
  spriteObj,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  spriteObj: any;
  onSave: (scriptCode: string) => void;
}) => {
  const [code, setCode] = useState(spriteObj?.script || "");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"script" | "guide">("script");
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "vs">("vs-dark");

  useEffect(() => {
    if (isOpen) {
      setCode(spriteObj?.script || "");
      setError("");
      setTab("script");
    }
  }, [isOpen, spriteObj?.id, spriteObj?.script]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setEditorTheme(root.classList.contains("dark") ? "vs-dark" : "vs");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const handleSave = () => {
    setError("");
    try {
      // Validate syntax by attempting to create a function
      new Function("sprite", "frame", "time", code);
      onSave(code);
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid script syntax");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl border-zinc-700 bg-zinc-900 p-0 text-zinc-100 sm:max-w-4xl"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-zinc-700 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl flex items-center gap-3 text-zinc-100">
            <Code className="w-6 h-6 text-blue-400" />
            Sprite Script Editor
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 mt-2">
            Real-time script execution for game-like sprite behavior
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "script" | "guide")}
          className="flex max-h-[70vh] flex-col overflow-hidden"
        >
          <TabsList className="shrink-0 w-full justify-start bg-zinc-950 border-b border-zinc-700 rounded-none h-auto p-0">
            <TabsTrigger
              value="script"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 px-4 py-2"
            >
              <Code className="w-4 h-4 mr-2" /> Script Code
            </TabsTrigger>
            <TabsTrigger
              value="guide"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 px-4 py-2"
            >
              <Pencil className="w-4 h-4 mr-2" /> Quick Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="script"
            className="flex flex-1 flex-col gap-4 overflow-hidden p-4 mt-0"
          >
            <div className="flex-1 flex flex-col gap-2 min-h-0">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Script Code (executed every frame)
              </label>
              <div className="h-85 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
                <Editor
                  language="javascript"
                  value={code}
                  theme={editorTheme}
                  onChange={(value) => {
                    setCode(value ?? "");
                    setError("");
                  }}
                  options={{
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily:
                      "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    lineNumbers: "on",
                    roundedSelection: false,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: "on",
                    padding: { top: 12, bottom: 12 },
                    smoothScrolling: true,
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-950/50 border border-red-700/50 rounded-lg text-xs text-red-200 font-mono">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  Syntax Error
                </div>
                {error}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="guide"
            className="flex-1 overflow-y-auto p-4 mt-0"
          >
            <div className="space-y-4 text-sm text-zinc-300">
              <div>
                <h4 className="font-semibold text-zinc-100 mb-2 flex items-center gap-2">
                  <span className="text-blue-400">▸</span> Sprite API
                </h4>
                <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-3 font-mono text-xs space-y-1 text-zinc-400">
                  <div>
                    <span className="text-emerald-400">sprite.move</span>(dx,
                    dy) - Relative movement
                  </div>
                  <div>
                    <span className="text-emerald-400">sprite.moveTo</span>(x,
                    y) - Absolute position
                  </div>
                  <div>
                    <span className="text-emerald-400">sprite.rotate</span>
                    (angle) - Add rotation
                  </div>
                  <div>
                    <span className="text-emerald-400">sprite.setVelocity</span>
                    (vx, vy) - Continuous movement
                  </div>
                  <div>
                    <span className="text-emerald-400">
                      sprite.setAnimation
                    </span>
                    (name) - Change animation
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-100 mb-2 flex items-center gap-2">
                  <span className="text-blue-400">▸</span> Available Variables
                </h4>
                <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-3 font-mono text-xs space-y-1 text-zinc-400">
                  <div>
                    <span className="text-amber-400">frame</span> - Frame
                    counter (~60fps)
                  </div>
                  <div>
                    <span className="text-amber-400">time</span> - Elapsed ms
                    since script start
                  </div>
                  <div>
                    <span className="text-amber-400">sprite</span> - Current
                    sprite object
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] text-zinc-400">
                  <span>sprite-script.js</span>
                  <span className="uppercase tracking-wide">JavaScript</span>
                </div>
                <div className="h-55">
                  <Editor
                    language="javascript"
                    value={spriteCodeBlockSample}
                    theme={editorTheme}
                    options={{
                      automaticLayout: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      readOnly: true,
                      fontSize: 13,
                      fontFamily:
                        "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      lineNumbers: "on",
                      roundedSelection: false,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: "on",
                      padding: { top: 10, bottom: 10 },
                    }}
                  />
                </div>
              </div>
              <div className="bg-blue-950/30 border border-blue-700/30 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  Tip: Use Math functions like Math.sin(), Math.cos(),
                  Math.random() for advanced behavior
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="shrink-0 border-t border-zinc-700 bg-zinc-950 p-4 flex gap-2 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6 bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-zinc-100 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-6 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium"
          >
            <Check className="w-4 h-4 mr-2" />
            Save Script
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Sprite Management Modal ---
const SpriteManager = ({
  isOpen,
  onClose,
  spriteObj,
  onSpriteUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  spriteObj: any;
  onSpriteUpdate: (updates: any) => void;
}) => {
  const [spriteUrl, setSpriteUrl] = useState(spriteObj?.src || "");
  const spriteInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.genStorage.generateUploadUrl);
  const getStorageUrl = useMutation(api.genStorage.getStorageUrl);

  useEffect(() => {
    if (isOpen) {
      setSpriteUrl(spriteObj?.src || "");
    }
  }, [isOpen, spriteObj?.id, spriteObj?.src]);

  const handleSpriteFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Failed to upload sprite");
      const { storageId } = await response.json();

      // Get the proper Convex storage URL
      const spriteImageUrl = await getStorageUrl({ storageId });
      if (!spriteImageUrl) throw new Error("Failed to resolve sprite URL");
      setSpriteUrl(spriteImageUrl);
      onSpriteUpdate({ src: spriteImageUrl });
    } catch (err) {
      console.error("Sprite upload error:", err);
    }
  };

  const handleUrlChange = () => {
    if (spriteUrl) {
      onSpriteUpdate({ src: spriteUrl });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md border-zinc-700 bg-zinc-900 text-zinc-100"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-zinc-700 pb-3">
          <DialogTitle className="text-lg flex items-center gap-2 text-zinc-100">
            <Pencil className="w-5 h-5 text-purple-400" />
            Manage Sprite
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Sprite Image
            </label>
            <div className="space-y-2">
              <Button
                onClick={() => spriteInputRef.current?.click()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Sprite Image
              </Button>
              <input
                ref={spriteInputRef}
                type="file"
                accept="image/*"
                onChange={handleSpriteFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-xs text-zinc-500">or</span>
            </div>
            <Separator className="bg-zinc-700" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-2 block">
              Sprite URL
            </label>
            <div className="flex gap-2">
              <Input
                value={spriteUrl}
                onChange={(e) => setSpriteUrl(e.target.value)}
                placeholder="https://example.com/sprite.png"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs"
              />
              <Button
                onClick={handleUrlChange}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white px-3"
              >
                Load
              </Button>
            </div>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-lg">
            <p className="text-xs text-zinc-400">
              <strong>Tip:</strong> Use sprite sheets for animations. Sprites
              work best with PNG images.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 justify-end border-t border-zinc-700 bg-zinc-950">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-4 bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-zinc-100 text-sm"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Shape Component (Handles Individual Animations and Filters) ---
const ShapeRenderer = React.memo(
  ({ id, onSelect, onDragEnd, updateObj, isInteractionEnabled }: any) => {
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
            onSelect(
              obj.id,
              Boolean(e.evt?.shiftKey || e.evt?.ctrlKey || e.evt?.metaKey),
            );
          }
        : undefined,
      onDragEnd: isInteractionEnabled
        ? (e: any) => onDragEnd(obj.id, e.target.x(), e.target.y())
        : undefined,
      onMouseEnter: isInteractionEnabled
        ? () => {
            document.body.style.cursor =
              obj.type === "circle" ? "pointer" : "move";
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
          globalCompositeOperation={
            obj.globalCompositeOperation || "source-over"
          }
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
            const nextText =
              window.prompt("Edit text", obj.text || "") ?? obj.text;
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
    if (obj.type === "image")
      return <CanvasImageShape obj={obj} commonProps={commonProps} />;
    if (obj.type === "sprite")
      return <CanvasSpriteShape obj={obj} commonProps={commonProps} />;
    return null;
  },
);

// --- Canvas Component ---
function Canvas({
  objects,
  setObjects,
  drawings,
  currentDrawingId,
  setCurrentDrawingId,
  createDrawing,
  renameDrawing,
  deleteDrawing,
  activeTool,
  drawColor,
  drawSize,
  drawStyle,
  drawTool,
  onManualSave,
  onShortcutToolSelect,
  onShortcutDrawToolChange,
  onShortcutAddShape,
}: {
  objects: any[];
  setObjects: any;
  drawings: any[];
  currentDrawingId: string | null;
  setCurrentDrawingId: (id: string | null) => void;
  createDrawing: (name: string) => string;
  renameDrawing: (id: string, newName: string) => void;
  deleteDrawing: (id: string) => void;
  activeTool: ToolMode;
  drawColor: string;
  drawSize: number;
  drawStyle: BrushStyle;
  drawTool: DrawTool;
  onManualSave: () => void;
  onShortcutToolSelect: (tool: ToolMode) => void;
  onShortcutDrawToolChange: (tool: DrawTool) => void;
  onShortcutAddShape: (type: string) => void;
}) {
  // UI State from Zustand
  const scale = useCanvasUIStore((state) => state.scale);
  const setScale = useCanvasUIStore((state) => state.setScale);
  const stagePos = useCanvasUIStore((state) => state.stagePos);
  const setStagePos = useCanvasUIStore((state) => state.setStagePos);
  const selectedIds = useCanvasUIStore((state) => state.selectedIds);
  const setSelectedIds = useCanvasUIStore((state) => state.setSelectedIds);
  const groupDraftIds = useCanvasUIStore((state) => state.groupDraftIds);
  const setGroupDraftIds = useCanvasUIStore((state) => state.setGroupDraftIds);
  const isPanning = useCanvasUIStore((state) => state.isPanning);
  const setIsPanning = useCanvasUIStore((state) => state.setIsPanning);
  const clipboard = useCanvasUIStore((state) => state.clipboard);
  const setClipboard = useCanvasUIStore((state) => state.setClipboard);
  const redoStack = useCanvasUIStore((state) => state.redoStack);
  const setRedoStack = useCanvasUIStore((state) => state.setRedoStack);
  const cursorPos = useCanvasUIStore((state) => state.cursorPos);
  const setCursorPos = useCanvasUIStore((state) => state.setCursorPos);
  const isWorkspacePanelCollapsed = useCanvasUIStore(
    (state) => state.isWorkspacePanelCollapsed,
  );
  const setIsWorkspacePanelCollapsed = useCanvasUIStore(
    (state) => state.setIsWorkspacePanelCollapsed,
  );
  const layerRenameId = useCanvasUIStore((state) => state.layerRenameId);
  const setLayerRenameId = useCanvasUIStore((state) => state.setLayerRenameId);
  const layerRenameValue = useCanvasUIStore((state) => state.layerRenameValue);
  const setLayerRenameValue = useCanvasUIStore(
    (state) => state.setLayerRenameValue,
  );
  const scriptEditorOpen = useCanvasUIStore((state) => state.scriptEditorOpen);
  const setScriptEditorOpen = useCanvasUIStore(
    (state) => state.setScriptEditorOpen,
  );
  const spriteManagerOpen = useCanvasUIStore(
    (state) => state.spriteManagerOpen,
  );
  const setSpriteManagerOpen = useCanvasUIStore(
    (state) => state.setSpriteManagerOpen,
  );
  const selectedSpriteForScript = useCanvasUIStore(
    (state) => state.selectedSpriteForScript,
  );
  const setSelectedSpriteForScript = useCanvasUIStore(
    (state) => state.setSelectedSpriteForScript,
  );
  const selectedSpriteForManager = useCanvasUIStore(
    (state) => state.selectedSpriteForManager,
  );
  const setSelectedSpriteForManager = useCanvasUIStore(
    (state) => state.setSelectedSpriteForManager,
  );
  const canvasBackground = useCanvasUIStore((state) => state.canvasBackground);
  const setCanvasBackground = useCanvasUIStore(
    (state) => state.setCanvasBackground,
  );

  // Local state only (non-UI preferences)
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [history, setHistory] = useState<any[]>([]);

  const trRef = useRef<Konva.Transformer>(null);
  const currentStage = useRef<Konva.Stage>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeIdRef = useRef<string | null>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const addImageFileRef = useRef<HTMLInputElement>(null);
  const mediaTargetIdRef = useRef<string | null>(null);
  const router = useRouter();
  const { CanvasBoard, setCanvasBoard } = useCanvasState() as any;

  // Sprite script refs
  const spriteScriptTimersRef = useRef<Map<string, number>>(new Map());
  const spriteStartTimeRef = useRef<Map<string, number>>(new Map());
  const selectedId = selectedIds[0] ?? null;
  const { currentCanvasBackground, setCurrentCanvasBackground } =
    useCanvasStore();

  const setSelectedId = (id: string | null) => {
    setSelectedIds(id ? [id] : []);
  };

  useEffect(() => {
    setCanvasBackground(currentCanvasBackground);
  }, [currentCanvasBackground]);

  const handleSelectObject = (id: string, additive = false) => {
    if (!additive) {
      setSelectedIds([id]);
      return;
    }

    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((selected) => selected !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelection);
  };

  const getSelectionTargetIds = (source: any[]) => {
    if (selectedIds.length > 1) return selectedIds;

    const primary = source.find((o) => o.id === selectedIds[0]);
    if (primary?.groupId) {
      return source
        .filter((o) => o.groupId === primary.groupId)
        .map((o) => o.id);
    }

    return selectedIds;
  };

  const groupSelection = () => {
    if (selectedIds.length < 2) return;
    const groupId = `group-${uuidv4()}`;
    setObjects((prev: any[]) =>
      prev.map((o) => (selectedIds.includes(o.id) ? { ...o, groupId } : o)),
    );
  };

  const ungroupSelection = () => {
    const groups = new Set(
      objects
        .filter((obj) => selectedIds.includes(obj.id) && obj.groupId)
        .map((obj) => obj.groupId),
    );
    if (groups.size === 0) return;

    setObjects((prev: any[]) =>
      prev.map((obj) =>
        groups.has(obj.groupId) ? { ...obj, groupId: undefined } : obj,
      ),
    );
  };

  const toggleLayerVisibility = (id: string) => {
    const target = objects.find((obj) => obj.id === id);
    if (!target) return;
    updateObj(id, { visible: target.visible === false ? true : false });
  };

  const toggleLayerLock = (id: string) => {
    const target = objects.find((obj) => obj.id === id);
    if (!target) return;
    const locked = target.draggable === false;
    updateObj(id, {
      draggable: locked ? true : false,
      listening: locked ? true : false,
    });
  };

  const commitLayerRename = () => {
    if (!layerRenameId) return;
    const name = layerRenameValue.trim();
    if (!name) return;
    updateObj(layerRenameId, { name });
    setLayerRenameId(null);
    setLayerRenameValue("");
  };

  useEffect(() => {
    if (currentDrawingId) {
      router.push(`?canvas=${currentDrawingId}`);
    }
  }, [currentDrawingId]);

  useEffect(() => {
    const updateSize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (trRef.current && selectedIds.length > 0) {
      const nodes = selectedIds
        .map((id) => currentStage.current?.findOne("#" + id))
        .filter(Boolean) as Konva.Node[];

      trRef.current.nodes(nodes);
      trRef.current.getLayer()?.batchDraw();
    } else {
      trRef.current?.nodes([]);
    }
  }, [selectedIds, objects]);

  useEffect(() => {
    isDrawingRef.current = false;
    currentStrokeIdRef.current = null;
  }, [currentDrawingId]);

  // Sprite script execution effect
  useEffect(() => {
    let rafId: number | null = null;

    const executeFrame = () => {
      const now = Date.now();

      objects.forEach((obj) => {
        if (obj.type !== "sprite" || !obj.script) return;

        // Initialize start time for this sprite
        if (!spriteStartTimeRef.current.has(obj.id)) {
          spriteStartTimeRef.current.set(obj.id, now);
        }

        const startTime = spriteStartTimeRef.current.get(obj.id)!;
        const elapsed = now - startTime;

        try {
          // Create sprite API context
          const spriteAPI = {
            x: obj.x || 0,
            y: obj.y || 0,
            rotation: obj.rotation || 0,
            startX: obj.startX !== undefined ? obj.startX : obj.x || 0,
            startY: obj.startY !== undefined ? obj.startY : obj.y || 0,
            getX: () => obj.x || 0,
            getY: () => obj.y || 0,
            move: (dx: number, dy: number) => {
              updateObj(obj.id, { x: (obj.x || 0) + dx, y: (obj.y || 0) + dy });
            },
            moveTo: (x: number, y: number) => {
              updateObj(obj.id, { x, y });
            },
            rotate: (angle: number) => {
              updateObj(obj.id, { rotation: (obj.rotation || 0) + angle });
            },
            setRotation: (angle: number) => {
              updateObj(obj.id, { rotation: angle });
            },
            setAnimation: (name: string) => {
              updateObj(obj.id, { animation: name });
            },
            setVelocity: (vx: number, vy: number) => {
              updateObj(obj.id, { velocityX: vx, velocityY: vy });
            },
            getVelocity: () => ({
              x: obj.velocityX || 0,
              y: obj.velocityY || 0,
            }),
          };

          // Execute user script with sprite API, frame count, and time
          const frame = Math.floor(elapsed / 16.67); // ~60fps reference
          const time = elapsed;

          new Function("sprite", "frame", "time", obj.script)(
            spriteAPI,
            frame,
            time,
          );

          // Apply velocity if present
          if (obj.velocityX || obj.velocityY) {
            updateObj(obj.id, {
              x: (obj.x || 0) + (obj.velocityX || 0),
              y: (obj.y || 0) + (obj.velocityY || 0),
            });
          }
        } catch (err) {
          console.error(`Script error in sprite ${obj.id}:`, err);
        }
      });

      rafId = requestAnimationFrame(executeFrame);
    };

    rafId = requestAnimationFrame(executeFrame);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [objects]);

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
      setSelectedIds([]);
      trRef.current?.nodes([]);
    }
  }, [activeTool]);

  useEffect(() => {
    const stage = currentStage.current;
    if (!stage) return;
    stage.container().style.backgroundColor = canvasBackground;
  }, [canvasBackground]);

  const getWorldPointer = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    return {
      x: (pointer.x - stagePos.x) / scale,
      y: (pointer.y - stagePos.y) / scale,
    };
  };

  const startDrawing = (stage: Konva.Stage) => {
    const pointer = getWorldPointer(stage);
    if (!pointer) return;

    isDrawingRef.current = true;
    const strokeId = `line-${uuidv4()}`;
    const points = [pointer.x, pointer.y];
    currentStrokeIdRef.current = strokeId;

    setObjects((prev: any[]) => [
      ...prev,
      {
        id: strokeId,
        type: "line",
        tool: drawTool,
        points,
        stroke: drawTool === "eraser" ? "#000000" : drawColor,
        strokeWidth: drawSize,
        dash: brushStyleToDash(drawStyle),
        tension: 0.5,
        lineCap: "round",
        lineJoin: "round",
        globalCompositeOperation:
          drawTool === "eraser" ? "destination-out" : "source-over",
        draggable: false,
        listening: false,
        perfectDrawEnabled: false,
      },
    ]);
  };

  const continueDrawing = (stage: Konva.Stage) => {
    const pointer = getWorldPointer(stage);
    if (!pointer) return;

    setCursorPos(pointer);

    if (!isDrawingRef.current || !currentStrokeIdRef.current) return;

    setObjects((prev: any[]) =>
      prev.map((obj) => {
        if (obj.id !== currentStrokeIdRef.current) return obj;

        const points = (obj.points || []).concat([pointer.x, pointer.y]);
        return {
          ...obj,
          points,
        };
      }),
    );
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    if (currentStrokeIdRef.current) {
      updateObj(currentStrokeIdRef.current, {
        perfectDrawEnabled: true,
      });
    }
    currentStrokeIdRef.current = null;
  };

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool === "draw") return;

    if (e.target === e.target.getStage()) setSelectedIds([]);

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
  const isSelectedMedia =
    selectedObject?.type === "image" || selectedObject?.type === "sprite";
  const layersTopFirst = [...objects]
    .map((obj, index) => ({ obj, index }))
    .reverse();
  const currentDrawing =
    drawings.find((d) => d.id === currentDrawingId) || null;

  const openMediaPicker = () => {
    if (!selectedObject || !isSelectedMedia) return;
    mediaTargetIdRef.current = selectedObject.id;
    mediaFileRef.current?.click();
  };

  const handleMediaFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    const targetId = mediaTargetIdRef.current;
    if (!file || !targetId) return;

    try {
      console.log(`Media file size: ${(file.size / 1024).toFixed(2)} KB`);

      // Compress before upload
      const compressedBlob = await compressImage(file, 1920, 0.75);
      console.log(
        `Compressed size: ${(compressedBlob.size / 1024).toFixed(2)} KB`,
      );

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: compressedBlob,
      });

      if (!response.ok) throw new Error("Failed to upload image");
      const { storageId } = await response.json();

      // Get the proper Convex storage URL
      const imageUrl = await getStorageUrl({ storageId });
      if (!imageUrl) throw new Error("Failed to resolve image URL");
      const resolvedImageUrl = imageUrl;

      // Create image to get dimensions
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

        updateObj(targetId, {
          src: resolvedImageUrl,
          storageId,
          width: Math.round(image.width * ratio),
          height: Math.round(image.height * ratio),
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        });
      };
      image.src = resolvedImageUrl;

      if (!user?._id) throw new Error("User not authenticated");
      await sendImage({ storageId, author: user._id });
    } catch (err) {
      console.error("Media file upload error:", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      event.target.value = "";
    }
  };

  const addImageFromUrlViaPrompt = () => {
    const source = window.prompt("Paste image URL");
    if (!source) return;

    let normalizedSource = source.trim();
    try {
      normalizedSource = new URL(normalizedSource).toString();
    } catch {
      toast.error("Please enter a valid URL.");
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
      toast.error("Could not load image from this URL.");
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
      toast.error("Please enter a valid URL.");
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
      toast.error("Could not load image from this URL.");
    };

    image.src = normalizedSource;
  };

  const rotateSelectedMedia = (delta: number) => {
    if (!selectedObject || !isSelectedMedia) return;
    updateObj(selectedObject.id, {
      rotation: (selectedObject.rotation || 0) + delta,
    });
  };

  const flipSelectedMedia = (axis: "x" | "y") => {
    if (!selectedObject || !isSelectedMedia) return;
    if (axis === "x") {
      updateObj(selectedObject.id, {
        scaleX: (selectedObject.scaleX || 1) * -1,
      });
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
          idle: [
            2, 2, 70, 119, 71, 2, 74, 119, 146, 2, 81, 119, 226, 2, 76, 119,
          ],
          punch: [2, 138, 74, 122, 76, 138, 84, 122, 346, 138, 120, 122],
        },
        draggable: true,
      },
    ]);
  };

  const addImageFromUrl = (
    src: string,
    pointer?: { x: number; y: number },
    storageId?: string,
  ) => {
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

      const x = pointer
        ? (pointer.x - stagePos.x) / scale
        : cursorPos.x || canvasWidth / 2;
      const y = pointer
        ? (pointer.y - stagePos.y) / scale
        : cursorPos.y || canvasHeight / 2;

      setObjects((prev: any[]) => [
        ...prev,
        {
          id: `image-${uuidv4()}`,
          type: "image",
          x,
          y,
          width: Math.round(image.width * ratio),
          height: Math.round(image.height * ratio),
          src,
          storageId,
          draggable: true,
        },
      ]);
    };
    image.src = src;
  };

  const openImageUploadPicker = () => {
    addImageFileRef.current?.click();
  };

  const generateUploadUrl = useMutation(api.genStorage.generateUploadUrl);
  const sendImage = useMutation(api.genStorage.sendImage);
  const getStorageUrl = useMutation(api.genStorage.getStorageUrl);
  const deleteStorageFile = useMutation(api.genStorage.deleteStorageFile);
  const user = useQuery(api.users.viewer);

  const handleAddImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    try {
      console.log(`Original file size: ${(file.size / 1024).toFixed(2)} KB`);

      // Compress before upload
      const compressedBlob = await compressImage(file, 1920, 0.75);
      console.log(
        `Compressed size: ${(compressedBlob.size / 1024).toFixed(2)} KB`,
      );

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: compressedBlob,
      });

      if (!response.ok) throw new Error("Failed to upload image");
      const { storageId } = await response.json();

      if (!user?._id) throw new Error("User not authenticated");
      await sendImage({ storageId, author: user._id });

      const imageUrl = await getStorageUrl({ storageId });
      if (!imageUrl) throw new Error("Failed to resolve image URL");
      const resolvedImageUrl = imageUrl;
      addImageFromUrl(resolvedImageUrl, undefined, storageId);
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      event.target.value = "";
    }
  };

  const handleCanvasDrop = async (event: React.DragEvent<HTMLDivElement>) => {
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
      try {
        console.log(
          `Dropped file size: ${(droppedFile.size / 1024).toFixed(2)} KB`,
        );

        // Compress before upload
        const compressedBlob = await compressImage(droppedFile, 1920, 0.75);
        console.log(
          `Compressed size: ${(compressedBlob.size / 1024).toFixed(2)} KB`,
        );

        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/webp" },
          body: compressedBlob,
        });

        if (!response.ok) throw new Error("Failed to upload image");
        const { storageId } = await response.json();

        if (!user?._id) throw new Error("User not authenticated");
        await sendImage({ storageId, author: user._id });

        const imageUrl = await getStorageUrl({ storageId });
        if (!imageUrl) throw new Error("Failed to resolve image URL");
        const resolvedImageUrl = imageUrl;
        addImageFromUrl(resolvedImageUrl, pointer, storageId);
      } catch (err) {
          console.error("Drop upload error:", err);
          toast.error("Failed to upload image. Please try again.");
        }
      return;
    }

    const uri =
      event.dataTransfer.getData("text/uri-list") ||
      event.dataTransfer.getData("text/plain");
    if (!uri) return;

    const maybeUrl = uri.trim();
    if (!/^https?:\/\//i.test(maybeUrl)) return;

    addImageFromUrl(maybeUrl, pointer);
  };

  const markForGrouping = () => {
    if (selectedIds.length === 0) return;
    const merged = new Set([...groupDraftIds, ...selectedIds]);
    setGroupDraftIds(Array.from(merged));
  };

  const unmarkForGrouping = () => {
    if (selectedIds.length === 0) return;
    const filtered = groupDraftIds.filter((id) => !selectedIds.includes(id));
    setGroupDraftIds(filtered);
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
      prev.map((o) =>
        o.groupId === selectedGroup ? { ...o, groupId: undefined } : o,
      ),
    );
  };

  const moveSelectionLayer = (
    direction: "front" | "back" | "forward" | "backward",
  ) => {
    if (selectedIds.length === 0) return;

    setObjects((prev: any[]) => {
      const targetIds = getSelectionTargetIds(prev);
      if (targetIds.length === 0) return prev;

      const moving = prev.filter((o) => targetIds.includes(o.id));
      const rest = prev.filter((o) => !targetIds.includes(o.id));

      if (direction === "forward" || direction === "backward") {
        const next = [...prev];
        if (direction === "forward") {
          for (let i = next.length - 2; i >= 0; i -= 1) {
            if (
              targetIds.includes(next[i].id) &&
              !targetIds.includes(next[i + 1].id)
            ) {
              [next[i], next[i + 1]] = [next[i + 1], next[i]];
            }
          }
        } else {
          for (let i = 1; i < next.length; i += 1) {
            if (
              targetIds.includes(next[i].id) &&
              !targetIds.includes(next[i - 1].id)
            ) {
              [next[i], next[i - 1]] = [next[i - 1], next[i]];
            }
          }
        }
        return next;
      }

      return direction === "front"
        ? [...rest, ...moving]
        : [...moving, ...rest];
    });
  };

  const duplicateSelection = () => {
    if (selectedIds.length === 0) return;
    const targets = objects.filter((obj: any) => selectedIds.includes(obj.id));
    const duplicated = targets.map((target) => ({
      ...target,
      id: `${target.type}-${uuidv4()}`,
      x: (target.x || 0) + 20,
      y: (target.y || 0) + 20,
    }));
    setObjects((prev: typeof objects) => [...prev, ...duplicated]);
    setSelectedIds(duplicated.map((obj) => obj.id));
  };

  const deleteSelection = () => {
    if (selectedIds.length === 0) return;

    // Find image objects with storageId and request storage deletion
    const imagesToDelete = objects.filter(
      (o: any) => selectedIds.includes(o.id) && o.type === "image" && o.storageId,
    );

    if (imagesToDelete.length > 0) {
      Promise.allSettled(
        imagesToDelete.map((img) =>
          deleteStorageFile({ storageId: img.storageId }).catch((e: any) =>
            console.error("Failed deleting storage for image:", e),
          ),
        ),
      ).then(() => {
        // Fire-and-forget cleanup finished (or failed) — proceed to remove from canvas
      });
    }

    setObjects((prev: any[]) => prev.filter((o) => !selectedIds.includes(o.id)));
    setSelectedIds([]);
  };

  const copySelectionToClipboard = () => {
    if (selectedIds.length === 0) return;
    const targets = objects.filter((o) => selectedIds.includes(o.id));
    setClipboard(targets.map((obj) => ({ ...obj })));
  };

  const applyFillToSelection = (fill: string) => {
    if (selectedIds.length === 0) return;
    setObjects((prev: any[]) =>
      prev.map((obj) =>
        selectedIds.includes(obj.id) ? { ...obj, fill } : obj,
      ),
    );
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
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Helper to save history before an action
      const saveHistory = () => {
        setHistory((prev) => [...prev, [...objects]]);
        setRedoStack([]); // Clear redo on new action
      };

      // Tool shortcuts (no modifiers)
      if (!isCtrl) {
        if (key === "v") {
          e.preventDefault();
          onShortcutToolSelect("select");
          return;
        }
        if (key === "b") {
          e.preventDefault();
          onShortcutDrawToolChange("brush");
          return;
        }
        if (key === "e") {
          e.preventDefault();
          onShortcutDrawToolChange("eraser");
          return;
        }
        if (key === "r") {
          e.preventDefault();
          onShortcutAddShape("rect");
          return;
        }
        if (key === "o") {
          e.preventDefault();
          onShortcutAddShape("circle");
          return;
        }
        if (key === "a") {
          e.preventDefault();
          onShortcutAddShape("arrow");
          return;
        }
        if (key === "q") {
          e.preventDefault();
          onShortcutAddShape("star");
          return;
        }

        if (key === "j") {
          e.preventDefault();
          setIsWorkspacePanelCollapsed(!isWorkspacePanelCollapsed);
        }

        if (key === "escape") {
          e.preventDefault();
          setSelectedIds([]);
          setGroupDraftIds([]);
          return;
        }
      }

      switch (key) {
        // --- DELETE ---
        case "backspace":
        case "delete":
          if (selectedIds.length > 0) {
            saveHistory();
            setObjects((prev: typeof objects) =>
              prev.filter((obj: any) => !selectedIds.includes(obj.id)),
            );
            setSelectedIds([]);
          }
          break;

        // --- SELECT ALL (Ctrl + A) ---
        case "a":
          if (isCtrl) {
            e.preventDefault();
            setSelectedIds(objects.map((obj) => obj.id));
          }
          break;

        // --- GROUP / UNGROUP ---
        case "g":
          if (!isCtrl) break;
          e.preventDefault();
          if (isShift) {
            const groups = new Set(
              objects
                .filter((obj) => selectedIds.includes(obj.id) && obj.groupId)
                .map((obj) => obj.groupId),
            );
            if (groups.size > 0) {
              saveHistory();
              setObjects((prev: any[]) =>
                prev.map((obj) =>
                  groups.has(obj.groupId)
                    ? { ...obj, groupId: undefined }
                    : obj,
                ),
              );
            }
          } else if (selectedIds.length >= 2) {
            saveHistory();
            const groupId = `group-${uuidv4()}`;
            setObjects((prev: any[]) =>
              prev.map((obj) =>
                selectedIds.includes(obj.id) ? { ...obj, groupId } : obj,
              ),
            );
          }
          break;
        case "h": // Mark for layer
          if (isCtrl) return;
          e.preventDefault();
          setIsWorkspacePanelCollapsed(!isWorkspacePanelCollapsed);
          break;

        // --- COPY (Ctrl + C) ---
        case "c":
          if (isCtrl && selectedIds.length > 0) {
            e.preventDefault();
            const targets = objects.filter((o) => selectedIds.includes(o.id));
            setClipboard(targets.map((obj) => ({ ...obj })));
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
            const pasted = clipboard.map((item) => ({
              ...item,
              id: `${item.type}-${uuidv4()}`,
              x: (item.x || 0) + 20,
              y: (item.y || 0) + 20,
            }));
            setObjects((prev: typeof objects) => [...prev, ...pasted]);
            setSelectedIds(pasted.map((obj) => obj.id));
          }
          break;

        // --- UNDO (Ctrl + Z) ---
        case "z":
          if (isCtrl && !e.shiftKey) {
            e.preventDefault();
            if (history.length > 0) {
              const previous = history[history.length - 1];
              setRedoStack([...redoStack, [...objects]]);
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
              setRedoStack(redoStack.slice(0, -1));
            }
          }
          break;

        // --- DUPLICATE (Ctrl + D) ---
        case "d":
          if (isCtrl && selectedIds.length > 0) {
            e.preventDefault();
            saveHistory();
            const targets = objects.filter((obj: any) =>
              selectedIds.includes(obj.id),
            );
            const duplicated = targets.map((target) => ({
              ...target,
              id: `${target.type}-${uuidv4()}`,
              x: (target.x || 0) + 20,
              y: (target.y || 0) + 20,
            }));
            setObjects((prev: typeof objects) => [...prev, ...duplicated]);
            setSelectedIds(duplicated.map((obj) => obj.id));
          }
          break;

        // --- UTILS ---
        case "l": // Lock
          setCanvasBoard((prev: any) => ({
            ...prev,
            scaleLock: !prev.scaleLock,
          }));
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
          if (selectedIds.length > 0) {
            const step = isCtrl ? 10 : 2;
            setObjects((prev: any[]) =>
              prev.map((obj) =>
                selectedIds.includes(obj.id)
                  ? { ...obj, x: (obj.x || 0) - step }
                  : obj,
              ),
            );
          }
          break;
        case "arrowright":
          e.preventDefault();
          if (selectedIds.length > 0) {
            const step = isCtrl ? 10 : 2;
            setObjects((prev: any[]) =>
              prev.map((obj) =>
                selectedIds.includes(obj.id)
                  ? { ...obj, x: (obj.x || 0) + step }
                  : obj,
              ),
            );
          }
          break;
        case "arrowup":
          e.preventDefault();
          if (selectedIds.length > 0) {
            const step = isCtrl ? 10 : 2;
            setObjects((prev: any[]) =>
              prev.map((obj) =>
                selectedIds.includes(obj.id)
                  ? { ...obj, y: (obj.y || 0) - step }
                  : obj,
              ),
            );
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (selectedIds.length > 0) {
            const step = isCtrl ? 10 : 2;
            setObjects((prev: any[]) =>
              prev.map((obj) =>
                selectedIds.includes(obj.id)
                  ? { ...obj, y: (obj.y || 0) + step }
                  : obj,
              ),
            );
          }
          break;
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [
    selectedIds,
    objects,
    clipboard,
    history,
    redoStack,
    onManualSave,
    onShortcutAddShape,
    onShortcutDrawToolChange,
    onShortcutToolSelect,
    setCanvasBoard,
  ]);

  useGSAP(() => {
    gsap.fromTo(
      ".layer",
      {
        opacity: 0,
        y: -10,
      },
      {
        opacity: 1,
        y: 0,
        stagger: 0.5,
      },
    );
  }, [currentDrawingId]);

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
          style={{
            cursor: activeTool === "draw" ? "crosshair" : "default",
            touchAction: "none",
          }}
          onMouseDown={(e) => {
            if (activeTool === "draw") {
              e.evt.preventDefault();
              const stage = e.target.getStage();
              if (stage) startDrawing(stage);
              return;
            }
          }}
          onMouseUp={() => {
            if (activeTool === "draw") stopDrawing();
          }}
          onMouseLeave={() => {
            if (activeTool === "draw") stopDrawing();
          }}
          onTouchStart={(e) => {
            if (activeTool === "draw") {
              e.evt.preventDefault();
              const stage = e.target.getStage();
              if (stage) startDrawing(stage);
            }
          }}
          onTouchMove={(e) => {
            if (activeTool !== "draw") return;
            e.evt.preventDefault();
            const stage = e.target.getStage();
            if (stage) continueDrawing(stage);
          }}
          onTouchEnd={() => {
            if (activeTool === "draw") stopDrawing();
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
            if (!stage) return;

            if (activeTool === "draw") {
              e.evt.preventDefault();
              continueDrawing(stage);
              return;
            }

            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            setCursorPos({
              x: (pointer.x - stagePos.x) / scale,
              y: (pointer.y - stagePos.y) / scale,
            });
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
                onSelect={handleSelectObject}
                isInteractionEnabled={activeTool !== "draw"}
                updateObj={updateObj}
                onDragEnd={(id: string, x: number, y: number) =>
                  updateObj(id, { x, y })
                }
              />
            ))}

            <Transformer
              ref={trRef}
              borderStroke="#3b82f6"
              anchorFill="#fff"
              anchorStroke="#3b82f6"
              anchorSize={8}
            />

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

      <Card
        className={`absolute right-4 top-20 z-40 border border-muted-foreground bg-background text-foreground backdrop-blur-xl transition-all duration-200 ${isWorkspacePanelCollapsed ? "w-10 h-10" : "w-[20rem]"}`}
      >
        <CardHeader className="space-y-1 pb-2">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                {!isWorkspacePanelCollapsed && "Layers"}
              </CardTitle>
              {!isWorkspacePanelCollapsed && (
                <CardDescription className="text-xs text-foreground">
                  Manage layers, grouping, and order.
                </CardDescription>
              )}
            </div>
            <div
              className={
                !isWorkspacePanelCollapsed ? "" : "fixed top-1.5 left-1.5 "
              }
              onClick={() =>
                setIsWorkspacePanelCollapsed(!isWorkspacePanelCollapsed)
              }
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={"h-7 w-7 p-1" + ""}
                aria-label={
                  isWorkspacePanelCollapsed
                    ? "Expand workspace panel"
                    : "Collapse workspace panel"
                }
              >
                <PanelLeftIcon />
              </Button>
            </div>
          </div>
        </CardHeader>
        {!isWorkspacePanelCollapsed && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs "
                  onClick={groupSelection}
                  disabled={selectedIds.length < 2}
                >
                  <Group className="mr-1.5 h-3.5 w-3.5" /> Group
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs"
                  onClick={ungroupSelection}
                  disabled={selectedIds.length === 0}
                >
                  <Ungroup className="mr-1.5 h-3.5 w-3.5" /> Ungroup
                </Button>
              </div>

              <Separator className="bg-muted" />

              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {layersTopFirst.length === 0 && (
                  <div className="rounded-md border border-dashed border-muted px-2 py-3 text-center text-xs text-foreground">
                    No layers yet in this canvas.
                  </div>
                )}

                {layersTopFirst.map(({ obj, index }) => {
                  const isSelected = selectedIds.includes(obj.id);
                  const isEditing = layerRenameId === obj.id;
                  const defaultName = `${obj.type?.[0]?.toUpperCase() || "L"}${obj.type?.slice(1) || "ayer"} ${objects.length - index}`;
                  const layerName = obj.name || defaultName;

                  return (
                    <div
                      key={obj.id}
                      className={`layer rounded-lg border px-2 py-1.5 ${isSelected ? "border-destructive/50 bg-destructive/10" : "border-muted bg-background/60"}`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={layerRenameValue}
                            onChange={(e) =>
                              setLayerRenameValue(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitLayerRename();
                              if (e.key === "Escape") {
                                setLayerRenameId(null);
                                setLayerRenameValue("");
                              }
                            }}
                            className="h-7 border-muted bg-background text-xs"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={commitLayerRename}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setLayerRenameId(null);
                              setLayerRenameValue("");
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="min-w-0 flex-1 truncate text-left text-xs"
                            onClick={(e) =>
                              handleSelectObject(
                                obj.id,
                                Boolean(e.shiftKey || e.ctrlKey || e.metaKey),
                              )
                            }
                          >
                            {layerName}
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => toggleLayerVisibility(obj.id)}
                          >
                            {obj.visible === false ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => toggleLayerLock(obj.id)}
                          >
                            {obj.draggable === false ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <LockOpen className="h-3.5 w-3.5" />
                            )}
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setLayerRenameId(obj.id);
                              setLayerRenameValue(layerName);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {obj.type === "sprite" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-purple-400 hover:bg-purple-500/20"
                              onClick={() => {
                                setSelectedSpriteForManager(obj);
                                setSpriteManagerOpen(true);
                              }}
                              title="Change sprite image"
                            >
                              <Code className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <ContextMenuContent className="w-72 rounded-xl border-muted bg-background/95 p-1.5 text-foreground ">
        <ContextMenuSub>
          <ContextMenuSubTrigger className="rounded-md px-2 py-1.5 text-xs">
            <PaintRoller className="mr-2 h-4 w-4" /> Background
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 rounded-xl border-muted bg-background p-1.5 text-foreground">
            {CANVAS_BACKGROUND_PRESETS.map((preset) => (
              <ContextMenuItem
                key={preset.value}
                onClick={() => setCanvasBackground(preset.value)}
                className="rounded-md px-2 py-1.5 text-xs"
              >
                <div
                  className="mr-2 h-4 w-4 rounded-full border border-muted-foreground"
                  style={{ backgroundColor: preset.value }}
                />
                {preset.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="rounded-md px-2 py-1.5 text-xs">
            <Plus className="mr-2 h-4 w-4" /> Insert
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 rounded-xl border-muted bg-background p-1.5 text-foreground">
            <ContextMenuItem
              onClick={() => addCanvasItem("text")}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              Add Text
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => addCanvasItem("wedge")}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              Add Wedge
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => addCanvasItem("image")}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              Add Image
            </ContextMenuItem>
            <ContextMenuItem
              onClick={addImageFromUrlViaPrompt}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              Add Image From URL
            </ContextMenuItem>
            <ContextMenuItem
              onClick={openImageUploadPicker}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              Upload Image
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => addCanvasItem("sprite")}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              Add Sprite
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {selectedIds.length > 0 ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={copySelectionToClipboard}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Selection
            </ContextMenuItem>
            <ContextMenuItem
              onClick={duplicateSelection}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              <Copy className="mr-2 h-4 w-4" /> Duplicate Selection
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="rounded-md px-2 py-1.5 text-xs">
                <PaintRoller className="mr-2 h-4 w-4" /> Fill
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-36 rounded-xl border-zinc-800 bg-zinc-950 p-1.5 text-zinc-100">
                {["#3b82f6", "#ef4444", "#22c55e", "#000000"].map((c) => (
                  <ContextMenuItem
                    key={c}
                    onClick={() => applyFillToSelection(c)}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    <div
                      className="mr-2 h-4 w-4 rounded-full border border-zinc-700"
                      style={{ backgroundColor: c }}
                    />
                    {c}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger className="rounded-md px-2 py-1.5 text-xs">
                <Layers className="mr-2 h-4 w-4" /> Order
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40 rounded-xl border-zinc-800 bg-zinc-950 p-1.5 text-zinc-100">
                <ContextMenuItem
                  onClick={() => moveSelectionLayer("front")}
                  className="rounded-md px-2 py-1.5 text-xs"
                >
                  <BringToFront className="mr-2 h-4 w-4" /> Bring To Front
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => moveSelectionLayer("forward")}
                  className="rounded-md px-2 py-1.5 text-xs"
                >
                  <MoveUp className="mr-2 h-4 w-4" /> Bring Forward
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => moveSelectionLayer("backward")}
                  className="rounded-md px-2 py-1.5 text-xs"
                >
                  <MoveDown className="mr-2 h-4 w-4" /> Send Backward
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => moveSelectionLayer("back")}
                  className="rounded-md px-2 py-1.5 text-xs"
                >
                  <SendToBack className="mr-2 h-4 w-4" /> Send To Back
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem
              onClick={groupSelection}
              className="rounded-md px-2 py-1.5 text-xs"
              disabled={selectedIds.length < 2}
            >
              <Group className="mr-2 h-4 w-4" /> Group Selection
            </ContextMenuItem>
            <ContextMenuItem
              onClick={ungroupSelection}
              className="rounded-md px-2 py-1.5 text-xs"
            >
              <Ungroup className="mr-2 h-4 w-4" /> Ungroup
            </ContextMenuItem>

            {selectedIds.length === 1 && (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="rounded-md px-2 py-1.5 text-xs">
                  <Wand2 className="mr-2 h-4 w-4" /> Filters
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-44 rounded-xl border-zinc-800 bg-zinc-950 p-1.5 text-zinc-100">
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedId!, {
                        blur: !selectedObject?.blur,
                        blurValue: 10,
                      })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    {selectedObject?.blur ? "Remove Blur" : "Add Blur"}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedId!, {
                        grayscale: !selectedObject?.grayscale,
                      })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    {selectedObject?.grayscale
                      ? "Remove Grayscale"
                      : "Grayscale"}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedId!, {
                        invert: !selectedObject?.invert,
                      })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Invert Colors
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {selectedIds.length === 1 && (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="rounded-md px-2 py-1.5 text-xs">
                  <Zap className="mr-2 h-4 w-4" /> Animation
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-40 rounded-xl border-zinc-800 bg-zinc-950 p-1.5 text-zinc-100">
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedId!, { animation: "none" })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    None
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedId!, { animation: "spin" })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Spinning
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedId!, { animation: "pulse" })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Pulse
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {selectedIds.length === 1 &&
              !!selectedObject &&
              selectedObject.type === "sprite" && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger className="rounded-md px-2 py-1.5 text-xs">
                    Sprite
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-40 rounded-xl border-zinc-800 bg-zinc-950 p-1.5 text-zinc-100">
                    <ContextMenuItem
                      onClick={() => {
                        setSelectedSpriteForScript(selectedObject);
                        setScriptEditorOpen(true);
                      }}
                      className="rounded-md px-2 py-1.5 text-xs"
                    >
                      <Code className="mr-2 h-4 w-4" /> Edit Script
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => {
                        setSelectedSpriteForManager(selectedObject);
                        setSpriteManagerOpen(true);
                      }}
                      className="rounded-md px-2 py-1.5 text-xs"
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Change Sprite
                    </ContextMenuItem>
                    <ContextMenuSeparator className="bg-zinc-700 my-1" />
                    <ContextMenuItem
                      onClick={() =>
                        updateObj(selectedObject.id, { animation: "idle" })
                      }
                      className="rounded-md px-2 py-1.5 text-xs"
                    >
                      Set Idle
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        updateObj(selectedObject.id, {
                          animation: "punch",
                          punchNonce: Date.now(),
                          onAnimationDone: () =>
                            updateObj(selectedObject.id, { animation: "idle" }),
                        })
                      }
                      className="rounded-md px-2 py-1.5 text-xs"
                    >
                      Punch Once
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        updateObj(selectedObject.id, {
                          frameRate: (selectedObject.frameRate || 7) + 1,
                        })
                      }
                      className="rounded-md px-2 py-1.5 text-xs"
                    >
                      Increase FPS
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        updateObj(selectedObject.id, {
                          frameRate: Math.max(
                            1,
                            (selectedObject.frameRate || 7) - 1,
                          ),
                        })
                      }
                      className="rounded-md px-2 py-1.5 text-xs"
                    >
                      Decrease FPS
                    </ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}

            {selectedIds.length === 1 && isSelectedMedia && (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="rounded-md px-2 py-1.5 text-xs">
                  Media
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-44 rounded-xl border-zinc-800 bg-zinc-950 p-1.5 text-zinc-100">
                  <ContextMenuItem
                    onClick={openMediaPicker}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Load/Replace Image
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={replaceSelectedMediaFromUrl}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Replace From URL
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => rotateSelectedMedia(-90)}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Rotate -90°
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => rotateSelectedMedia(90)}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Rotate +90°
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => flipSelectedMedia("x")}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Flip Horizontal
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => flipSelectedMedia("y")}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Flip Vertical
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={resetSelectedMediaTransform}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Reset Transform
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={exportSelectedMediaPng}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Save Selected as PNG
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {selectedIds.length === 1 &&
              !!selectedObject &&
              selectedObject.type === "text" && (
                <>
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedObject.id, {
                        fontSize: (selectedObject.fontSize || 20) + 2,
                      })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Increase Font
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedObject.id, {
                        fontSize: Math.max(
                          10,
                          (selectedObject.fontSize || 20) - 2,
                        ),
                      })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Decrease Font
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      updateObj(selectedObject.id, {
                        fontStyle:
                          selectedObject.fontStyle === "bold"
                            ? "normal"
                            : "bold",
                      })
                    }
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Toggle Bold
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      const nextText =
                        window.prompt("Edit text", selectedObject.text || "") ??
                        selectedObject.text;
                      updateObj(selectedObject.id, { text: nextText });
                    }}
                    className="rounded-md px-2 py-1.5 text-xs"
                  >
                    Edit Text
                  </ContextMenuItem>
                </>
              )}

            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={deleteSelection}
              className="rounded-md px-2 py-1.5 text-xs text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selection
            </ContextMenuItem>
          </>
        ) : (
          <>
            {groupDraftIds.length >= 2 && (
              <ContextMenuItem
                onClick={groupMarkedShapes}
                className="rounded-md px-2 py-1.5 text-xs"
              >
                Create Group ({groupDraftIds.length})
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              className="rounded-md px-2 py-1.5 text-xs"
              onClick={() => {
                const stage = currentStage.current;
                if (!stage) return;

                const link = document.createElement("a");
                link.href = stage.toDataURL({ pixelRatio: 2 });
                const drawingName =
                  drawings.find((d) => d.id === currentDrawingId)?.name ||
                  "canvas";
                link.download = `${drawingName}-${Date.now()}.png`;
                link.click();
              }}
            >
              Export Canvas
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
      <SpriteScriptEditor
        isOpen={scriptEditorOpen}
        onClose={() => {
          setScriptEditorOpen(false);
          setSelectedSpriteForScript(null);
        }}
        spriteObj={selectedSpriteForScript}
        onSave={(scriptCode) => {
          if (selectedSpriteForScript) {
            updateObj(selectedSpriteForScript.id, { script: scriptCode });
            // Reset script execution timer for this sprite
            spriteScriptTimersRef.current.delete(selectedSpriteForScript.id);
            spriteStartTimeRef.current.delete(selectedSpriteForScript.id);
          }
        }}
      />
      <SpriteManager
        isOpen={spriteManagerOpen}
        onClose={() => {
          setSpriteManagerOpen(false);
          setSelectedSpriteForManager(null);
        }}
        spriteObj={selectedSpriteForManager}
        onSpriteUpdate={(updates) => {
          if (selectedSpriteForManager) {
            updateObj(selectedSpriteForManager.id, updates);
          }
        }}
      />
      <input
        ref={mediaFileRef}
        type="file"
        accept="image/*"
        onChange={handleMediaFileChange}
        className="hidden"
      />
      <input
        ref={addImageFileRef}
        type="file"
        accept="image/*"
        onChange={handleAddImageFileChange}
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

  const {
    drawings,
    currentDrawingId,
    setCurrentDrawingId,
    createDrawing,
    renameDrawing,
    deleteDrawing,
    updateCurrentDrawing,
    isAuthLoading,
  } = useDrawings();
  const searchParams = useSearchParams();
  const canvasIdFromUrl = searchParams.get("canvas");

  // Initialize persistence
  const { syncToYjs } = useCanvasPersistence(setObjects as any);

  useEffect(() => {
    if (!canvasIdFromUrl || drawings.length === 0) return;
    if (currentDrawingId === canvasIdFromUrl) return;

    const matchingDrawing = drawings.find(
      (drawing) => drawing.id === canvasIdFromUrl,
    );
    if (matchingDrawing) {
      setCurrentDrawingId(canvasIdFromUrl);
    }
  }, [canvasIdFromUrl, drawings, currentDrawingId, setCurrentDrawingId]);

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

  const [IsLockPanelHdden, setLockPanelHideen] = useState(false);

  const user = useQuery(api.users.viewer);

  useEffect(() => {
    console.log("Current user:", user);
  }, [user]);

  return (
    <>
      {isAuthLoading && <CanvasSkeleton />}
      <div
        className={`relative w-full h-full overflow-hidden bg-background ${isAuthLoading ? "hidden" : ""}`}
      >
        <Canvas
          objects={objects}
          setObjects={setObjects}
          drawings={drawings}
          currentDrawingId={currentDrawingId}
          setCurrentDrawingId={setCurrentDrawingId}
          createDrawing={createDrawing}
          renameDrawing={renameDrawing}
          deleteDrawing={deleteDrawing}
          activeTool={activeTool}
          drawTool={drawTool}
          drawColor={drawColor}
          drawSize={drawSize}
          drawStyle={drawStyle}
          onManualSave={handleManualSave}
          onShortcutToolSelect={(tool) => {
            setActiveTool(tool);
            if (tool === "draw") {
              setCanvasBoard((prev: any) => ({ ...prev, pendingShape: null }));
            }
          }}
          onShortcutDrawToolChange={(tool) => {
            setDrawTool(tool);
            setActiveTool("draw");
            setCanvasBoard((prev: any) => ({ ...prev, pendingShape: null }));
          }}
          onShortcutAddShape={(type) => {
            setActiveTool("select");
            setCanvasBoard((prev: any) => ({ ...prev, pendingShape: type }));
          }}
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

        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-2xl p-2">
          <button
            type="button"
            onClick={() =>
              setCanvasBoard((prev: any) => ({
                ...prev,
                scaleLock: !prev.scaleLock,
              }))
            }
            className="grid size-9 place-items-center rounded-xl border border-muted bg-background/80 text-zinc-200 transition-colors hover:bg-muted"
            aria-label="Toggle canvas lock"
          >
            {(useCanvasState() as any)?.CanvasBoard?.scaleLock ? (
              <Lock className="h-4 w-4 text-cyan-400" />
            ) : (
              <LockOpen className="h-4 w-4" />
            )}
          </button>

          {user ? (
            <ProfileMenu
              ImageSrc={user.image || ""}
              Name={user.name || ""}
              Email={user.email || ""}
            />
          ) : (
            <a
              href="/login"
              className="grid h-9 items-center rounded-xl border border-muted bg-background/80 px-3 text-sm text-zinc-200 transition-colors hover:bg-muted"
            >
              Log in
            </a>
          )}
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
