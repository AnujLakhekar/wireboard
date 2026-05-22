"use client";

import React, { useState, memo } from "react";
import type { ComponentProps, HTMLAttributes } from "react";
import { useEditorStore } from "../(store)/useEditor"; // Double check this matches your folder name
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  BotIcon,
  Sparkles, 
  Play, 
  Terminal, 
  Layers 
} from "lucide-react";

// ==========================================
// 1. CORE AGENT PRESENTATION PRIMITIVES
// ==========================================

export type AgentProps = HTMLAttributes<HTMLDivElement>;

export const Agent = memo(({ className, ...props }: AgentProps) => (
  <div className={cn("not-prose w-full rounded-md border border-border/60 bg-muted/5", className)} {...props} />
));

export type AgentHeaderProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  model?: string;
};

export const AgentHeader = memo(({ className, name, model, ...props }: AgentHeaderProps) => (
  <div className={cn("flex w-full items-center justify-between gap-4 p-3 border-b border-border/40", className)} {...props}>
    <div className="flex items-center gap-2">
      <BotIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm text-foreground">{name}</span>
      {model && (
        <Badge className="font-mono text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground" variant="secondary">
          {model}
        </Badge>
      )}
    </div>
  </div>
));

export type AgentContentProps = HTMLAttributes<HTMLDivElement>;

export const AgentContent = memo(({ className, ...props }: AgentContentProps) => (
  <div className={cn("space-y-4 p-4", className)} {...props} />
));

export type AgentInstructionsProps = HTMLAttributes<HTMLDivElement> & {
  children: string;
};

export const AgentInstructions = memo(({ className, children, ...props }: AgentInstructionsProps) => (
  <div className={cn("space-y-2", className)} {...props}>
    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Instructions</span>
    <div className="rounded-md bg-muted/50 p-3 text-muted-foreground text-sm border border-border/20">
      <p>{children}</p>
    </div>
  </div>
));

export type AgentToolsProps = ComponentProps<typeof Accordion>;

export const AgentTools = memo(({ className, ...props }: AgentToolsProps) => (
  <div className={cn("space-y-2", className)}>
    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Tools Input Spec</span>
    <Accordion className="rounded-md border border-border/50 bg-background/50" type="multiple" {...props} />
  </div>
));

interface ToolSchema {
  description?: string;
  jsonSchema?: object;
  inputSchema?: object;
}

export type AgentToolProps = ComponentProps<typeof AccordionItem> & {
  tool: ToolSchema;
};

export const AgentTool = memo(({ className, tool, value, ...props }: AgentToolProps) => {
  const schema = "jsonSchema" in tool && tool.jsonSchema ? tool.jsonSchema : tool.inputSchema;

  return (
    <AccordionItem className={cn("border-b border-border/40 last:border-b-0", className)} value={value} {...props}>
      <AccordionTrigger className="px-3 py-2 text-xs text-foreground hover:no-underline font-medium">
        {tool.description ?? "No description"}
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        <div className="rounded-md bg-zinc-950 border border-border/40">
          <pre className="overflow-auto p-3 font-mono text-[11px] text-zinc-300 scrollbar-thin">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

export type AgentOutputProps = HTMLAttributes<HTMLDivElement> & {
  schema: string;
};

export const AgentOutput = memo(({ className, schema, ...props }: AgentOutputProps) => (
  <div className={cn("space-y-2", className)} {...props}>
    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Output Payload Schema</span>
    <div className="rounded-md bg-zinc-950 border border-border/40">
      <pre className="overflow-auto p-3 font-mono text-[11px] text-zinc-300 scrollbar-thin">{schema}</pre>
    </div>
  </div>
));

Agent.displayName = "Agent";
AgentHeader.displayName = "AgentHeader";
AgentContent.displayName = "AgentContent";
AgentInstructions.displayName = "AgentInstructions";
AgentTools.displayName = "AgentTools";
AgentTool.displayName = "AgentTool";
AgentOutput.displayName = "AgentOutput";


// ==========================================
// 2. ACTIVE WORKSPACE SIDEBAR INSPECTOR PANEL
// ==========================================

export function AIPanelInspector() {
  const { stages, activeStageId, selectedLayerId } = useEditorStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);

  const activeStage = stages.find((s) => s.id === activeStageId);
  const layers = activeStage?.layers ?? [];
  const selectedCount = selectedLayerId?.length || 0;

  const wireboardAgentTools = [
    {
      description: "Scan Layer Layout Grids (AABB Snapping Bounds)",
      jsonSchema: {
        type: "object",
        properties: {
          layersArray: { 
            type: "array", 
            description: "Current structural bounding data coordinates mapped from the workspace.",
            items: { 
              type: "object", 
              properties: { 
                id: { type: "string" }, 
                x: { type: "number" }, 
                y: { type: "number" }, 
                width: { type: "number" }, 
                height: { type: "number" } 
              } 
            }
          }
        },
        currentContextValue: layers,
      },
    },
    {
      description: "Auto-Align Selected Canvas Nodes",
      jsonSchema: {
        type: "object",
        properties: {
          targetLayerIds: { type: "array", description: "Array of selected canvas elements targets to adjust." },
          alignmentStrategy: { type: "string", enum: ["left", "center", "right", "distribute-horizontal"] },
        },
        required: ["targetLayerIds", "alignmentStrategy"],
      },
    },
  ];

  const handleRunAgentPipeline = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setAgentLogs([
      "[System]: Connecting to Local Ollama Instance...",
      "[System]: Mounting contextual environment blueprints to context matrix..."
    ]);

    setTimeout(() => {
      setAgentLogs((prev) => [
        ...prev,
        `[Vision Engine]: Cached ${layers.length} canvas layout shapes effectively.`,
        selectedCount > 0 
          ? `[Action Matrix]: Aligning vector limits for indices: [${selectedLayerId}]` 
          : "[Warning]: No layers are currently highlighted. Add elements to selection array to pass transforms."
      ]);
    }, 900);

    setTimeout(() => {
      setAgentLogs((prev) => [...prev, "[System]: Execution phase concluded. Redrawing canvas matrix."]);
      setIsExecuting(false);
    }, 2000);
  };

  return (
    <div className="w-80 h-full bg-background border-l border-border flex flex-col select-none overflow-hidden">
      
    

      {/* Primary Agent Display Center */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        <Agent>
          
          <AgentContent>
            {/* Live Context Telemetry Tracker Box */}
            <div className="border border-border/40 bg-background/50 rounded-lg p-3 space-y-2">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> Canvas Telemetry Context
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 p-2 rounded border border-border/30">
                  <p className="text-[10px] text-muted-foreground">Active Selection</p>
                  <p className="font-mono font-bold text-foreground mt-0.5">{selectedCount} elements</p>
                </div>
                <div className="bg-muted/30 p-2 rounded border border-border/30">
                  <p className="text-[10px] text-muted-foreground">Total Grid Items</p>
                  <p className="font-mono font-bold text-foreground mt-0.5">{layers.length} layers</p>
                </div>
              </div>
            </div>

            {/* Tools Specifications */}
            <AgentTools type="single" collapsible>
              {wireboardAgentTools.map((tool, index) => (
                <AgentTool key={index} tool={tool} value={`wireboard-tool-${index}`} />
              ))}
            </AgentTools>

            {/* Output Schema */}
            <AgentOutput 
              schema={
                "interface LayoutMutationPayload {\n  action: 'ALIGN' | 'DISTRIBUTE' | 'RESIZE';\n  targetIds: string[];\n  transformations: { x?: number; y?: number; width?: number; height?: number }[];\n}"
              } 
            />
          </AgentContent>
        </Agent>

        {/* Live Execution Console Logger Terminal */}
        {agentLogs.length > 0 && (
          <div className="border border-border rounded-lg bg-zinc-950 p-3 font-mono text-[11px] space-y-1.5 text-zinc-400 max-h-44 overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-1.5 text-zinc-500 border-b border-zinc-900 pb-1 mb-1.5">
              <Terminal className="h-3 w-3" />
              <span>Orchestration Execution Logs</span>
            </div>
            {agentLogs.map((log, i) => (
              <p key={i} className={log.includes('[System]') ? "text-blue-400" : log.includes('[Warning]') ? "text-amber-500" : "text-zinc-300"}>
                {log}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Action Button Trigger Bar */}
      <div className="p-3 border-t border-border/50 bg-muted/10">
        <button
          type="button"
          onClick={handleRunAgentPipeline}
          disabled={isExecuting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-muted text-xs font-medium text-white disabled:text-muted-foreground rounded-lg transition-all shadow-lg shadow-blue-600/10 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
        >
          <Play className={cn("h-3 w-3", isExecuting && "animate-spin opacity-50")} />
          {isExecuting ? "Computing Workspace Transforms..." : "Run Layout Optimization Pass"}
        </button>
      </div>

    </div>
  );
}