"use client";

import React, { useState } from "react";
import { Stage, Layer, Rect, Circle, Text } from "react-konva";
import { useEditorStore, CANVAS_PRESETS } from "../(store)/useEditor"; // Double check this path
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Layout, Palette, FilePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Layers, Monitor } from "lucide-react";

// Local color choices for quick canvas background initialization
const BG_COLOR_OPTIONS = [
  { name: "Pure White", value: "#ffffff" },
  { name: "Studio Gray", value: "#f3f4f6" },
  { name: "Dark Mode", value: "#111827" },
  { name: "Cream", value: "#fdfbf7" },
];

export function CanvasNewPageDialog() {
  const { setPageSize, applyPreset, setCanvasBg } = useEditorStore();

  // Local state to capture user choices before initializing the artboard
  const [selectedPreset, setSelectedPreset] = useState<string>("instagram_post");
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [chosenBg, setChosenBg] = useState<string>("#ffffff");

  // Handle automatic width/height scaling changes when a user changes presets
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
    
    console.log("Canvas initialized:", {
      width: customWidth,
      height: customHeight,
      bgColor: chosenBg,
      preset: selectedPreset,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-xs">
          <Plus className="h-3.5 w-3.5" />
          New Canvas
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white border border-gray-200">
        <form onSubmit={handleCreateCanvas} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FilePlus className="h-4 w-4 text-gray-500" />
              New art
            </DialogTitle>

          </DialogHeader>

          {/* 1. Layout Preset Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Layout className="h-3 w-3" /> Size Preset
            </Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-full h-9 text-xs border-gray-200 bg-white">
                <SelectValue placeholder="Choose Artboard Dimension Preset" />
              </SelectTrigger>
              <SelectContent>
                {CANVAS_PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name} className="text-xs">
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Precision Manual Metric Overrides */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="canvas-width" className="text-xs font-semibold text-gray-500 font-mono">
                Width (px)
              </Label>
              <Input
                id="canvas-width"
                type="number"
                disabled={selectedPreset !== "custom"}
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value) || 100)}
                className="h-9 text-xs border-gray-200 focus-visible:ring-1 focus-visible:ring-gray-400 disabled:opacity-60 disabled:bg-gray-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="canvas-height" className="text-xs font-semibold text-gray-500 font-mono">
                Height (px)
              </Label>
              <Input
                id="canvas-height"
                type="number"
                disabled={selectedPreset !== "custom"}
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value) || 100)}
                className="h-9 text-xs border-gray-200 focus-visible:ring-1 focus-visible:ring-gray-400 disabled:opacity-60 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* 3. Base Background Tone Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Palette className="h-3 w-3" /> Canvas Background Color
            </Label>
            <div className="flex gap-2 items-center">
              {BG_COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  onClick={() => setChosenBg(color.value)}
                  className={`w-7 h-7 rounded-full border transition-all duration-150 ${
                    chosenBg === color.value 
                      ? "ring-2 ring-gray-900 ring-offset-2 scale-105 border-transparent" 
                      : "border-gray-200 hover:scale-105"
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
                  className="h-7 text-[11px] text-center font-mono uppercase border-gray-200 px-2"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <DialogFooter className="pt-2 flex gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs border-gray-200">
                Cancel
              </Button>
            </DialogClose>
            
            <DialogClose asChild>
              <Button type="submit" size="sm" className="h-9 text-xs bg-gray-900 hover:bg-gray-800 text-white">
                Generate Stage
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditorHeaderBar() {
  const { stages, activeStageId, setActiveStage, pageSize } = useEditorStore();

  // Find the metadata of the currently selected stage
  const activeStage = stages.find((s) => s.id === activeStageId);

  return (
    <header className="h-14 w-full bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-40 select-none">
      
      {/* Left Section: Active Project Stage Navigation */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Workspace
          </span>
        </div>

        {stages.length > 0 ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="stage-selector" className="text-xs text-gray-500 font-medium">
              Active Page:
            </Label>
            <Select
              value={activeStageId || ""}
              onValueChange={(value) => setActiveStage(value)}
            >
              <SelectTrigger id="stage-selector" className="w-44 h-8 text-xs border-gray-200 bg-gray-50/50 font-medium">
                <SelectValue placeholder="No stages active" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id} className="text-xs">
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">No pages initialized yet</span>
        )}
      </div>

      {/* Center Section: Live Coordinate/Resolution Readout */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-md text-[11px] font-mono text-gray-500">
        <Monitor className="h-3 w-3 text-gray-400" />
        <span>Canvas Bounds:</span>
        <span className="font-bold text-gray-700">
          {activeStage ? activeStage.width : pageSize.width}px
        </span>
        <span>×</span>
        <span className="font-bold text-gray-700">
          {activeStage ? activeStage.height : pageSize.height}px
        </span>
      </div>

      {/* Right Section: Core Initialization Actions */}
      <div className="flex items-center gap-3">
        {/* The Dialog button component we built earlier */}
        <CanvasNewPageDialog />
      </div>
    </header>
  );
}



const Editor = () => {
  const { pageSize, canvasBg } = useEditorStore();

  return (
    <div className="flex-1 h-full bg-[#f3f4f6] overflow-auto relative flex flex-col items-center justify-center p-12 custom-grid-background">
      
      {/* Top Action Header Bar inside the viewport area */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur p-1.5 rounded-lg border border-gray-200">
        <CanvasNewPageDialog />
      </div>

      {/* Konva Viewport Boundary Container: 
        Matches the layout bounds configured in the Zustand schema exactly.
      */}
      <div 
        className="border border-gray-300/80 rounded-sm overflow-hidden bg-white"
        style={{ width: `${pageSize.width}px`, height: `${pageSize.height}px` }}
      >
        <Stage width={pageSize.width} height={pageSize.height}>
          <Layer>
            {/* Base Background Fill Rect */}
            <Rect
              x={0}
              y={0}
              width={pageSize.width}
              height={pageSize.height}
              fill={canvasBg}
            />

            {/* Placeholder Vector Graphic to test interactive layer rendering */}
            <Circle x={pageSize.width / 2} y={pageSize.height / 2} radius={60} fill="#3b82f6" draggable />
            
            <Text
              text="Drag Me or Use the Top-Right Action to Resize Artboard Stage"
              x={40}
              y={40}
              fontSize={14}
              fontFamily="sans-serif"
              fill={canvasBg === "#111827" ? "#9ca3af" : "#4b5563"}
              draggable
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Editor;