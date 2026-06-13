"use client";

import * as React from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import useSettings from "../../store/useSettings";

export default function SettingsSheet({ children }: { children?: React.ReactNode }) {
  const { save, tools, performance, set, reset } = useSettings();

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="sm">
            <SettingsIcon className="size-4 mr-2" /> Settings
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Configure autosave, tools, and canvas performance options.</SheetDescription>
        </SheetHeader>

        <div className="p-4 flex flex-col gap-4">
          <div>
            <Label>Auto save</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                id="autoSaveSheet"
                type="checkbox"
                checked={save.autoSave}
                onChange={(e) => set({ save: { ...save, autoSave: e.target.checked } } as any)}
              />
              <Label htmlFor="autoSaveSheet">Enable auto save</Label>
            </div>
            <div className="mt-2">
              <Label>Interval (s)</Label>
              <Input type="number" min={1} value={save.autoSaveInterval} onChange={(e) => set({ save: { ...save, autoSaveInterval: Number(e.target.value) } } as any)} />
            </div>
          </div>

          <div>
            <Label>Pen</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label>Size</Label>
                <Input type="number" min={1} value={tools.pen.size} onChange={(e) => set({ tools: { ...tools, pen: { ...tools.pen, size: Number(e.target.value) } } } as any)} />
              </div>
              <div>
                <Label>Color</Label>
                <Input type="color" value={tools.pen.color} onChange={(e) => set({ tools: { ...tools, pen: { ...tools.pen, color: e.target.value } } } as any)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Konva / Canvas Performance</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <div>
                <Label>Pixel ratio</Label>
                <Input type="number" step={0.5} min={0.5} value={performance.pixelRatio} onChange={(e) => set({ performance: { ...performance, pixelRatio: Number(e.target.value) } } as any)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={performance.useLayerListeningFalse} onChange={(e) => set({ performance: { ...performance, useLayerListeningFalse: e.target.checked } } as any)} />
                  <span>Use layer.listening(false) where possible</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={performance.dragLayerOptimization} onChange={(e) => set({ performance: { ...performance, dragLayerOptimization: e.target.checked } } as any)} />
                  <span>Use dedicated drag layer for dragging shapes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={performance.cacheShapes} onChange={(e) => set({ performance: { ...performance, cacheShapes: e.target.checked } } as any)} />
                  <span>Enable shape.cache() for complex shapes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={performance.perfectDrawEnabled} onChange={(e) => set({ performance: { ...performance, perfectDrawEnabled: e.target.checked } } as any)} />
                  <span>Enable perfect drawing (may be slower)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter>
          <div className="flex w-full items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { reset(); }}>Reset</Button>
              <SheetClose asChild>
                <Button>Save & Close</Button>
              </SheetClose>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
