'use client'

import React, { useEffect, useState } from 'react'
import { MdAddPhotoAlternate, MdDashboard, MdTextFields, MdCategory, MdBrush, MdCloudUpload } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from '../(store)/useEditor';

const ToolsSideBar = () => {
  const [activeToolIndex, setActiveToolIndex] = useState(2); // photos is active by default

  const tools = [
    {
      name: 'templates',
      label: 'Templates',
      icon: MdDashboard,
    },
    {
      name: 'text',
      label: 'Text',
      icon: MdTextFields ,
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
  ];

  const { setSelectedTool } = useEditorStore();

  useEffect(() => {
    setSelectedTool(tools[activeToolIndex].name);
  }, [activeToolIndex]);

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r border-border gap-2 p-2">
      <TooltipProvider>
        <div className="flex flex-col gap-1">
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
                    className="h-10 w-10"
                    title={tool.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {tool.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}

export default ToolsSideBar