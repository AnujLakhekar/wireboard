"use client";
import { useKeyboardManager } from "@/utills/useKeyboardManager";
import Editor, { EditorHeaderBar } from "./(components)/(ui)/Editor";
import ObjectController from "./(components)/(ui)/objectController";
import SelectedToolPanel from "./(components)/(ui)/SelectedToolPanel";
import ToolsSideBar from "./(components)/(ui)/ToolsSideBar";
import { useRef } from "react";
import { AIPanelInspector } from "./(components)/(ui)/AIPanelInspector";

export default function DesignerPage() {
  // regitery's
  useKeyboardManager();

  //states
  const stageRef = useRef<any>(null);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Sticky Header Row */}
      <EditorHeaderBar canvasInstanceRef={stageRef} />

      {/* Lower Operational Panel Row */}
      <div className="flex-1 flex overflow-hidden">
        <ToolsSideBar />
        <SelectedToolPanel />
        <Editor canvasInstanceRef={stageRef} />
        <ObjectController />
      </div>
    </div>
  );
}
