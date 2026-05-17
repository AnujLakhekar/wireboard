'use client'

import React, { useEffect, useState } from 'react'
import { MdAddPhotoAlternate, MdDashboard, MdTextFields, MdCategory, MdBrush, MdCloudUpload } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from '../(store)/useEditor';
import { LayersIcon } from 'lucide-react';

const ToolsSideBar = () => {
  const [activeToolIndex, setActiveToolIndex] = useState(2); // Photos active by default

  const tools = [
    {
      name: 'templates',
      label: 'Templates',
      icon: MdDashboard,
    },
    {
      name: 'text',
      label: 'Text',
      icon: MdTextFields,
    },
    {
      name: 'photos',
      label: 'Photos',
      icon: MdAddPhotoAlternate,
    },
    {
      name: 'elements',
      label: 'Elements',
      icon: MdCategory,
    },
    {
      name: 'draw',
      label: 'Draw',
      icon: MdBrush,
    },
    {
      name: 'upload',
      label: 'Upload',
      icon: MdCloudUpload,
    },
    {
      name: 'layers',
      label: 'Layers',
      icon: LayersIcon,
    },
  ];

  const { setSelectedTool } = useEditorStore();

  useEffect(() => {
    setSelectedTool(tools[activeToolIndex].name);
  }, [activeToolIndex]);

  return (
    <aside className="flex flex-col h-full bg-background border-r border-border p-2 gap-2 select-none">
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-1.5">
          {tools.map((tool, index) => {
            const IconComponent = tool.icon;
            const isActive = index === activeToolIndex;

            return (
              <Tooltip key={tool.name}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveToolIndex(index)}
                    className={`h-10 w-10 transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <IconComponent className="h-5 w-5 pointer-events-none" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className="border border-border bg-popover text-popover-foreground font-medium text-xs px-2.5 py-1"
                >
                  {tool.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </aside>
  )
}

export default ToolsSideBar;