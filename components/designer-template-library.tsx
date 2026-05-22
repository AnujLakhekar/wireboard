"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowUpRight, LayoutGrid, Search, Sparkles, Wand2 } from "lucide-react";

export type DesignerTemplateLayout =
  | "hero"
  | "split"
  | "editorial"
  | "product"
  | "social"
  | "portfolio"
  | "presentation"
  | "newsletter";

export type TemplateLayerBlueprint = {
  type: "rect" | "circle" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  align?: "left" | "center" | "right";
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
};

export type DesignerTemplate = {
  id: string;
  title: string;
  category: string;
  description: string;
  layout: DesignerTemplateLayout;
  canvas: { width: number; height: number };
  canvasBackground: string;
  background: string;
  accent: string;
  secondaryAccent: string;
  layers: TemplateLayerBlueprint[];
};

const categories = [
  "Brand",
  "Campaign",
  "Editorial",
  "Product",
  "Portfolio",
  "Social",
  "Presentation",
  "Newsletter",
  "Event",
  "Launch",
];

const layouts: DesignerTemplateLayout[] = [
  "hero",
  "split",
  "editorial",
  "product",
  "social",
  "portfolio",
  "presentation",
  "newsletter",
];

const canvases = [
  { width: 1080, height: 1350 },
  { width: 1080, height: 1080 },
  { width: 1200, height: 1500 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1080, height: 1920 },
];

const backgrounds = [
  "linear-gradient(135deg, #0f172a 0%, #111827 45%, #1f2937 100%)",
  "linear-gradient(135deg, #fff7ed 0%, #ffedd5 42%, #fed7aa 100%)",
  "linear-gradient(135deg, #eff6ff 0%, #dbeafe 40%, #bfdbfe 100%)",
  "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 45%, #fbcfe8 100%)",
  "linear-gradient(135deg, #ecfeff 0%, #cffafe 45%, #a5f3fc 100%)",
  "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 45%, #cbd5e1 100%)",
];

const canvasBackgrounds = [
  "#0f172a",
  "#111827",
  "#1e293b",
  "#f8fafc",
  "#fef3c7",
  "#eff6ff",
  "#fdf2f8",
  "#ecfeff",
];

const accents = [
  "#f97316",
  "#14b8a6",
  "#2563eb",
  "#d946ef",
  "#f43f5e",
  "#84cc16",
  "#8b5cf6",
  "#eab308",
];

const titleWords = [
  "Aurora",
  "Orbit",
  "Pulse",
  "Canvas",
  "Vivid",
  "Drift",
  "Signal",
  "Frame",
  "Current",
  "Vector",
];

const subWords = [
  "Studio",
  "Spotlight",
  "Narrative",
  "Launch",
  "Motion",
  "Edition",
  "Grid",
  "Series",
  "Index",
  "Rhythm",
];

function buildTemplateLayers(templateIndex: number, canvasWidth: number, canvasHeight: number, accent: string, secondaryAccent: string, layout: DesignerTemplateLayout): TemplateLayerBlueprint[] {
  const padX = Math.round(canvasWidth * 0.08);
  const padY = Math.round(canvasHeight * 0.08);
  const titleWidth = Math.round(canvasWidth * 0.54);
  const imageWidth = Math.round(canvasWidth * 0.34);
  const imageHeight = Math.round(canvasHeight * 0.48);
  const seedOffset = templateIndex % 12;

  const sharedTitle = titleWords[templateIndex % titleWords.length];
  const sharedSub = subWords[templateIndex % subWords.length];

  if (layout === "product") {
    return [
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.06),
        y: Math.round(canvasHeight * 0.06),
        width: Math.round(canvasWidth * 0.88),
        height: Math.round(canvasHeight * 0.88),
        fill: "rgba(255,255,255,0.14)",
        stroke: "rgba(255,255,255,0.22)",
        strokeWidth: 2,
      },
      {
        type: "rect",
        x: padX,
        y: padY,
        width: Math.round(canvasWidth * 0.42),
        height: Math.round(canvasHeight * 0.18),
        fill: accent,
      },
      {
        type: "text",
        x: padX,
        y: Math.round(canvasHeight * 0.26),
        width: titleWidth,
        height: Math.round(canvasHeight * 0.18),
        text: `${sharedTitle} ${templateIndex + 1}`,
        fontSize: Math.round(canvasHeight * 0.07),
        fontFamily: "Inter, sans-serif",
        fontWeight: "800",
        fill: "#f8fafc",
      },
      {
        type: "text",
        x: padX,
        y: Math.round(canvasHeight * 0.43),
        width: Math.round(canvasWidth * 0.46),
        height: Math.round(canvasHeight * 0.09),
        text: `${sharedSub} showcase with bold packaging language and premium contrast.`,
        fontSize: Math.round(canvasHeight * 0.025),
        fontFamily: "Inter, sans-serif",
        fontWeight: "500",
        fill: "rgba(248,250,252,0.82)",
      },
      {
        type: "rect",
        x: padX,
        y: Math.round(canvasHeight * 0.56),
        width: Math.round(canvasWidth * 0.18),
        height: Math.round(canvasHeight * 0.065),
        fill: secondaryAccent,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.54),
        y: Math.round(canvasHeight * 0.17),
        width: imageWidth,
        height: imageHeight,
        fill: "rgba(255,255,255,0.18)",
        stroke: "rgba(255,255,255,0.26)",
        strokeWidth: 2,
      },
    ];
  }

  if (layout === "social") {
    return [
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.05),
        y: Math.round(canvasHeight * 0.05),
        width: Math.round(canvasWidth * 0.9),
        height: Math.round(canvasHeight * 0.9),
        fill: "rgba(255,255,255,0.16)",
        stroke: "rgba(255,255,255,0.24)",
        strokeWidth: 2,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.1),
        y: Math.round(canvasHeight * 0.1),
        width: Math.round(canvasWidth * 0.8),
        height: Math.round(canvasHeight * 0.44),
        fill: accent,
      },
      {
        type: "circle",
        x: Math.round(canvasWidth * 0.78),
        y: Math.round(canvasHeight * 0.18),
        width: Math.round(canvasWidth * 0.12),
        height: Math.round(canvasWidth * 0.12),
        fill: secondaryAccent,
      },
      {
        type: "text",
        x: Math.round(canvasWidth * 0.12),
        y: Math.round(canvasHeight * 0.61),
        width: Math.round(canvasWidth * 0.72),
        height: Math.round(canvasHeight * 0.13),
        text: `${sharedTitle} ${templateIndex + 1}`,
        fontSize: Math.round(canvasHeight * 0.055),
        fontFamily: "Inter, sans-serif",
        fontWeight: "800",
        fill: "#0f172a",
      },
      {
        type: "text",
        x: Math.round(canvasWidth * 0.12),
        y: Math.round(canvasHeight * 0.74),
        width: Math.round(canvasWidth * 0.7),
        height: Math.round(canvasHeight * 0.1),
        text: `${sharedSub} story layout with a clean social-first rhythm.`,
        fontSize: Math.round(canvasHeight * 0.022),
        fontFamily: "Inter, sans-serif",
        fontWeight: "500",
        fill: "rgba(15,23,42,0.78)",
      },
    ];
  }

  if (layout === "portfolio") {
    return [
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.05),
        y: Math.round(canvasHeight * 0.05),
        width: Math.round(canvasWidth * 0.9),
        height: Math.round(canvasHeight * 0.9),
        fill: "rgba(255,255,255,0.12)",
        stroke: "rgba(255,255,255,0.18)",
        strokeWidth: 2,
      },
      {
        type: "text",
        x: padX,
        y: padY,
        width: Math.round(canvasWidth * 0.48),
        height: Math.round(canvasHeight * 0.15),
        text: `${sharedTitle} ${templateIndex + 1}`,
        fontSize: Math.round(canvasHeight * 0.065),
        fontFamily: "Inter, sans-serif",
        fontWeight: "800",
        fill: "#0f172a",
      },
      {
        type: "text",
        x: padX,
        y: Math.round(canvasHeight * 0.22),
        width: Math.round(canvasWidth * 0.42),
        height: Math.round(canvasHeight * 0.1),
        text: `${sharedSub} case study framing with curated project tiles.`,
        fontSize: Math.round(canvasHeight * 0.022),
        fontFamily: "Inter, sans-serif",
        fontWeight: "500",
        fill: "rgba(15,23,42,0.7)",
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.54),
        y: Math.round(canvasHeight * 0.15),
        width: Math.round(canvasWidth * 0.34),
        height: Math.round(canvasHeight * 0.25),
        fill: accent,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.54),
        y: Math.round(canvasHeight * 0.45),
        width: Math.round(canvasWidth * 0.18),
        height: Math.round(canvasHeight * 0.18),
        fill: secondaryAccent,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.74),
        y: Math.round(canvasHeight * 0.45),
        width: Math.round(canvasWidth * 0.14),
        height: Math.round(canvasHeight * 0.28),
        fill: "rgba(255,255,255,0.6)",
      },
    ];
  }

  if (layout === "presentation") {
    return [
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.07),
        y: Math.round(canvasHeight * 0.07),
        width: Math.round(canvasWidth * 0.86),
        height: Math.round(canvasHeight * 0.86),
        fill: "rgba(255,255,255,0.12)",
        stroke: "rgba(255,255,255,0.22)",
        strokeWidth: 2,
      },
      {
        type: "rect",
        x: padX,
        y: padY,
        width: Math.round(canvasWidth * 0.2),
        height: Math.round(canvasHeight * 0.04),
        fill: accent,
      },
      {
        type: "text",
        x: padX,
        y: Math.round(canvasHeight * 0.18),
        width: Math.round(canvasWidth * 0.5),
        height: Math.round(canvasHeight * 0.18),
        text: `${sharedTitle} ${templateIndex + 1}`,
        fontSize: Math.round(canvasHeight * 0.06),
        fontFamily: "Inter, sans-serif",
        fontWeight: "900",
        fill: "#111827",
      },
      {
        type: "text",
        x: padX,
        y: Math.round(canvasHeight * 0.36),
        width: Math.round(canvasWidth * 0.4),
        height: Math.round(canvasHeight * 0.12),
        text: `${sharedSub} keynote slides with layered content blocks and confident spacing.`,
        fontSize: Math.round(canvasHeight * 0.025),
        fontFamily: "Inter, sans-serif",
        fontWeight: "500",
        fill: "rgba(17,24,39,0.72)",
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.58),
        y: Math.round(canvasHeight * 0.18),
        width: Math.round(canvasWidth * 0.28),
        height: Math.round(canvasHeight * 0.42),
        fill: secondaryAccent,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.62),
        y: Math.round(canvasHeight * 0.67),
        width: Math.round(canvasWidth * 0.2),
        height: Math.round(canvasHeight * 0.08),
        fill: accent,
      },
    ];
  }

  if (layout === "newsletter") {
    return [
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.05),
        y: Math.round(canvasHeight * 0.05),
        width: Math.round(canvasWidth * 0.9),
        height: Math.round(canvasHeight * 0.9),
        fill: "rgba(255,255,255,0.12)",
        stroke: "rgba(255,255,255,0.2)",
        strokeWidth: 2,
      },
      {
        type: "text",
        x: padX,
        y: padY,
        width: Math.round(canvasWidth * 0.42),
        height: Math.round(canvasHeight * 0.12),
        text: `${sharedTitle} ${templateIndex + 1}`,
        fontSize: Math.round(canvasHeight * 0.06),
        fontFamily: "Inter, sans-serif",
        fontWeight: "900",
        fill: "#0f172a",
      },
      {
        type: "text",
        x: padX,
        y: Math.round(canvasHeight * 0.2),
        width: Math.round(canvasWidth * 0.38),
        height: Math.round(canvasHeight * 0.08),
        text: `${sharedSub} digest for launches, updates, and reader-friendly cadence.`,
        fontSize: Math.round(canvasHeight * 0.022),
        fontFamily: "Inter, sans-serif",
        fontWeight: "500",
        fill: "rgba(15,23,42,0.74)",
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.58),
        y: Math.round(canvasHeight * 0.16),
        width: Math.round(canvasWidth * 0.28),
        height: Math.round(canvasHeight * 0.58),
        fill: accent,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.58),
        y: Math.round(canvasHeight * 0.78),
        width: Math.round(canvasWidth * 0.16),
        height: Math.round(canvasHeight * 0.07),
        fill: secondaryAccent,
      },
    ];
  }

  if (layout === "editorial") {
    return [
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.06),
        y: Math.round(canvasHeight * 0.06),
        width: Math.round(canvasWidth * 0.88),
        height: Math.round(canvasHeight * 0.88),
        fill: "rgba(255,255,255,0.12)",
        stroke: "rgba(255,255,255,0.18)",
        strokeWidth: 2,
      },
      {
        type: "text",
        x: padX,
        y: padY,
        width: Math.round(canvasWidth * 0.52),
        height: Math.round(canvasHeight * 0.18),
        text: `${sharedTitle} ${templateIndex + 1}`,
        fontSize: Math.round(canvasHeight * 0.068),
        fontFamily: "Inter, sans-serif",
        fontWeight: "900",
        fill: "#f8fafc",
      },
      {
        type: "text",
        x: padX,
        y: Math.round(canvasHeight * 0.24),
        width: Math.round(canvasWidth * 0.44),
        height: Math.round(canvasHeight * 0.09),
        text: `${sharedSub} magazine composition with balanced editorial pacing.`,
        fontSize: Math.round(canvasHeight * 0.024),
        fontFamily: "Inter, sans-serif",
        fontWeight: "500",
        fill: "rgba(248,250,252,0.82)",
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.56),
        y: Math.round(canvasHeight * 0.16),
        width: Math.round(canvasWidth * 0.32),
        height: Math.round(canvasHeight * 0.2),
        fill: accent,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.56),
        y: Math.round(canvasHeight * 0.39),
        width: Math.round(canvasWidth * 0.16),
        height: Math.round(canvasHeight * 0.18),
        fill: secondaryAccent,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.74),
        y: Math.round(canvasHeight * 0.39),
        width: Math.round(canvasWidth * 0.14),
        height: Math.round(canvasHeight * 0.28),
        fill: "rgba(255,255,255,0.55)",
      },
      {
        type: "circle",
        x: Math.round(canvasWidth * 0.82),
        y: Math.round(canvasHeight * 0.72),
        width: Math.round(canvasWidth * 0.08),
        height: Math.round(canvasWidth * 0.08),
        fill: "rgba(255,255,255,0.85)",
      },
    ];
  }

  if (layout === "split") {
    return [
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.05),
        y: Math.round(canvasHeight * 0.05),
        width: Math.round(canvasWidth * 0.9),
        height: Math.round(canvasHeight * 0.9),
        fill: "rgba(255,255,255,0.12)",
        stroke: "rgba(255,255,255,0.2)",
        strokeWidth: 2,
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.08 + seedOffset * 4),
        y: Math.round(canvasHeight * 0.16),
        width: Math.round(canvasWidth * 0.38),
        height: Math.round(canvasHeight * 0.58),
        fill: accent,
      },
      {
        type: "text",
        x: Math.round(canvasWidth * 0.52),
        y: Math.round(canvasHeight * 0.16),
        width: Math.round(canvasWidth * 0.36),
        height: Math.round(canvasHeight * 0.18),
        text: `${sharedTitle} ${templateIndex + 1}`,
        fontSize: Math.round(canvasHeight * 0.058),
        fontFamily: "Inter, sans-serif",
        fontWeight: "900",
        fill: "#0f172a",
      },
      {
        type: "text",
        x: Math.round(canvasWidth * 0.52),
        y: Math.round(canvasHeight * 0.36),
        width: Math.round(canvasWidth * 0.32),
        height: Math.round(canvasHeight * 0.12),
        text: `${sharedSub} split layout for brand storytelling and quick readability.`,
        fontSize: Math.round(canvasHeight * 0.024),
        fontFamily: "Inter, sans-serif",
        fontWeight: "500",
        fill: "rgba(15,23,42,0.74)",
      },
      {
        type: "rect",
        x: Math.round(canvasWidth * 0.52),
        y: Math.round(canvasHeight * 0.56),
        width: Math.round(canvasWidth * 0.18),
        height: Math.round(canvasHeight * 0.075),
        fill: secondaryAccent,
      },
    ];
  }

  return [
    {
      type: "rect",
      x: Math.round(canvasWidth * 0.05),
      y: Math.round(canvasHeight * 0.05),
      width: Math.round(canvasWidth * 0.9),
      height: Math.round(canvasHeight * 0.9),
      fill: "rgba(255,255,255,0.12)",
      stroke: "rgba(255,255,255,0.2)",
      strokeWidth: 2,
    },
    {
      type: "rect",
      x: padX,
      y: padY,
      width: Math.round(canvasWidth * 0.2),
      height: Math.round(canvasHeight * 0.04),
      fill: accent,
    },
    {
      type: "text",
      x: padX,
      y: Math.round(canvasHeight * 0.18),
      width: Math.round(canvasWidth * 0.5),
      height: Math.round(canvasHeight * 0.18),
      text: `${sharedTitle} ${templateIndex + 1}`,
      fontSize: Math.round(canvasHeight * 0.062),
      fontFamily: "Inter, sans-serif",
      fontWeight: "900",
      fill: "#0f172a",
    },
    {
      type: "text",
      x: padX,
      y: Math.round(canvasHeight * 0.36),
      width: Math.round(canvasWidth * 0.38),
      height: Math.round(canvasHeight * 0.09),
      text: `${sharedSub} system with balanced structure and reusable hierarchy.`,
      fontSize: Math.round(canvasHeight * 0.024),
      fontFamily: "Inter, sans-serif",
      fontWeight: "500",
      fill: "rgba(15,23,42,0.74)",
    },
    {
      type: "rect",
      x: Math.round(canvasWidth * 0.58),
      y: Math.round(canvasHeight * 0.16),
      width: Math.round(canvasWidth * 0.28),
      height: Math.round(canvasHeight * 0.42),
      fill: secondaryAccent,
    },
    {
      type: "rect",
      x: Math.round(canvasWidth * 0.62),
      y: Math.round(canvasHeight * 0.67),
      width: Math.round(canvasWidth * 0.2),
      height: Math.round(canvasHeight * 0.08),
      fill: accent,
    },
  ];
}

export const DESIGNER_TEMPLATES: DesignerTemplate[] = Array.from({ length: 120 }, (_, index) => {
  const category = categories[index % categories.length];
  const layout = layouts[index % layouts.length];
  const canvas = canvases[index % canvases.length];
  const background = backgrounds[index % backgrounds.length];
  const canvasBackground = canvasBackgrounds[index % canvasBackgrounds.length];
  const accent = accents[index % accents.length];
  const secondaryAccent = accents[(index + 3) % accents.length];

  return {
    id: `designer-template-${index + 1}`,
    title: `${titleWords[index % titleWords.length]} ${category} ${String(index + 1).padStart(3, "0")}`,
    category,
    description: `${layout} composition built for ${category.toLowerCase()} layouts, quick reuse, and canvas-ready import.`,
    layout,
    canvas,
    canvasBackground,
    background,
    accent,
    secondaryAccent,
    layers: buildTemplateLayers(index, canvas.width, canvas.height, accent, secondaryAccent, layout),
  };
});

export function materializeTemplateLayers(template: DesignerTemplate) {
  return template.layers.map((layer, index) => ({
    ...layer,
    id: `${template.id}-layer-${index + 1}`,
    zIndex: index + 1,
  }));
}

type DesignerTemplateLibraryProps = {
  templates?: DesignerTemplate[];
  onSelectTemplate: (template: DesignerTemplate) => void;
  className?: string;
};

function LayoutPreview({ template }: { template: DesignerTemplate }) {
  const { layout, accent, secondaryAccent, background } = template;

  const frameClass =
    layout === "presentation"
      ? "aspect-[16/10]"
      : layout === "social"
        ? "aspect-[4/5]"
        : "aspect-[4/3]";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_16px_50px_rgba(15,23,42,0.16)]",
        frameClass,
      )}
      style={{ background }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_34%)]" />

      {layout === "hero" && (
        <>
          <div className="absolute left-[10%] top-[13%] h-[8%] w-[38%] rounded-full bg-white/75" />
          <div className="absolute left-[10%] top-[26%] h-[15%] w-[48%] rounded-[2rem] bg-black/50" />
          <div className="absolute left-[10%] top-[46%] h-[7%] w-[28%] rounded-full bg-white/60" />
          <div className="absolute right-[10%] top-[17%] h-[58%] w-[28%] rounded-[2rem] border border-white/25 bg-white/14 backdrop-blur-sm" />
          <div className="absolute right-[15%] bottom-[12%] h-[10%] w-[18%] rounded-full" style={{ backgroundColor: secondaryAccent }} />
        </>
      )}

      {layout === "split" && (
        <>
          <div className="absolute left-[8%] top-[15%] h-[62%] w-[42%] rounded-[1.75rem] bg-white/40" />
          <div className="absolute right-[8%] top-[18%] h-[15%] w-[30%] rounded-full bg-black/20" />
          <div className="absolute right-[8%] top-[39%] h-[18%] w-[28%] rounded-[1.5rem] bg-white/70" />
          <div className="absolute right-[18%] bottom-[14%] h-[10%] w-[22%] rounded-full" style={{ backgroundColor: accent }} />
        </>
      )}

      {layout === "editorial" && (
        <>
          <div className="absolute left-[8%] top-[10%] h-[11%] w-[36%] rounded-full bg-white/82" />
          <div className="absolute left-[8%] top-[26%] h-[18%] w-[42%] rounded-[2rem] bg-black/40" />
          <div className="absolute right-[8%] top-[18%] h-[22%] w-[28%] rounded-[1.5rem] bg-white/36" />
          <div className="absolute right-[12%] bottom-[18%] h-[30%] w-[16%] rounded-[1.5rem] bg-white/76" />
        </>
      )}

      {layout === "product" && (
        <>
          <div className="absolute left-[9%] top-[11%] h-[12%] w-[28%] rounded-full bg-white/85" />
          <div className="absolute left-[9%] top-[28%] h-[22%] w-[34%] rounded-[2rem] bg-black/18" />
          <div className="absolute right-[8%] top-[18%] h-[44%] w-[32%] rounded-[2rem] border border-white/25 bg-white/12" />
          <div className="absolute left-[9%] bottom-[14%] h-[10%] w-[18%] rounded-full" style={{ backgroundColor: secondaryAccent }} />
        </>
      )}

      {layout === "social" && (
        <>
          <div className="absolute left-[10%] top-[10%] h-[46%] w-[80%] rounded-[2rem] bg-white/35" />
          <div className="absolute right-[10%] top-[14%] h-[12%] w-[12%] rounded-full" style={{ backgroundColor: secondaryAccent }} />
          <div className="absolute left-[10%] bottom-[22%] h-[12%] w-[50%] rounded-full bg-black/35" />
          <div className="absolute left-[10%] bottom-[11%] h-[8%] w-[36%] rounded-full bg-white/60" />
        </>
      )}

      {layout === "portfolio" && (
        <>
          <div className="absolute left-[9%] top-[12%] h-[14%] w-[32%] rounded-full bg-white/82" />
          <div className="absolute left-[9%] top-[30%] h-[38%] w-[34%] rounded-[1.75rem] bg-black/28" />
          <div className="absolute right-[10%] top-[16%] h-[24%] w-[22%] rounded-[1.5rem] bg-white/48" />
          <div className="absolute right-[10%] bottom-[14%] h-[16%] w-[26%] rounded-[1.5rem]" style={{ backgroundColor: accent }} />
        </>
      )}

      {layout === "presentation" && (
        <>
          <div className="absolute left-[8%] top-[10%] h-[8%] w-[18%] rounded-full bg-white/76" />
          <div className="absolute left-[8%] top-[22%] h-[17%] w-[42%] rounded-[2rem] bg-black/18" />
          <div className="absolute right-[9%] top-[16%] h-[42%] w-[30%] rounded-[1.75rem] bg-white/34" />
          <div className="absolute right-[14%] bottom-[12%] h-[8%] w-[18%] rounded-full" style={{ backgroundColor: secondaryAccent }} />
        </>
      )}

      {layout === "newsletter" && (
        <>
          <div className="absolute left-[8%] top-[11%] h-[12%] w-[36%] rounded-full bg-white/82" />
          <div className="absolute left-[8%] top-[29%] h-[10%] w-[30%] rounded-full bg-black/18" />
          <div className="absolute right-[8%] top-[16%] h-[52%] w-[30%] rounded-[2rem]" style={{ backgroundColor: accent }} />
          <div className="absolute left-[8%] bottom-[14%] h-[9%] w-[22%] rounded-full" style={{ backgroundColor: secondaryAccent }} />
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/20 to-transparent" />
    </div>
  );
}

function TemplateCard({
  template,
  onSelectTemplate,
}: {
  template: DesignerTemplate;
  onSelectTemplate: (template: DesignerTemplate) => void;
}) {
  return (
    <article className="group rounded-3xl border border-border/60 bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <LayoutPreview template={template} />

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] uppercase tracking-wider">
              {template.category}
            </Badge>
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {template.layout}
            </span>
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-foreground">{template.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{template.description}</p>
          <p className="mt-2 text-[11px] font-medium text-muted-foreground">
            {template.canvas.width} × {template.canvas.height}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-full px-3 text-xs shadow-none"
          onClick={() => onSelectTemplate(template)}
        >
          Use
          <ArrowUpRight className="ml-1 size-3.5" />
        </Button>
      </div>
    </article>
  );
}

export function DesignerTemplateLibrary({
  templates = DESIGNER_TEMPLATES,
  onSelectTemplate,
  className,
}: DesignerTemplateLibraryProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categoriesList = useMemo(
    () => ["All", ...Array.from(new Set(templates.map((template) => template.category)))],
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesCategory = activeCategory === "All" || template.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        template.title.toLowerCase().includes(normalizedQuery) ||
        template.description.toLowerCase().includes(normalizedQuery) ||
        template.layout.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, templates]);

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      <div className="border-b border-border/50 bg-linear-to-b from-background to-background/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Wand2 className="size-3" />
              120 templates
            </div>
            <h2 className="mt-3 text-sm font-semibold text-foreground">Designer template library</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Import a ready-made layout to the canvas or use this library as a preview source in the main board.
            </p>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground">
            <LayoutGrid className="size-5" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates, categories, or layouts"
            className="h-10 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categoriesList.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredTemplates.length}</span> templates
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            ready to import
          </div>
        </div>

        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelectTemplate={onSelectTemplate}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
            <p className="text-sm font-medium text-foreground">No templates found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search term or category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
