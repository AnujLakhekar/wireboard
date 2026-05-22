"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowUpRight, LayoutGrid, Search, Sparkles, Wand2 } from "lucide-react";
import { fetchUnsplashPhotos, type UnsplashPhoto } from "../lib/unsplash-cache";

export type DesignerTemplateLayout =
  | "cover"
  | "editorial"
  | "product"
  | "social"
  | "poster"
  | "presentation";

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
  headingFont?: string;
  bodyFont?: string;
  imageUrl?: string;
  imageAlt?: string;
  layers: TemplateLayerBlueprint[];
};

const categories = ["Brand", "Campaign", "Editorial", "Product", "Portfolio", "Social"];

const layouts: DesignerTemplateLayout[] = [
  "cover",
  "editorial",
  "product",
  "social",
  "poster",
  "presentation",
];

const canvases = [
  { width: 1080, height: 1350 },
  { width: 1080, height: 1080 },
  { width: 1200, height: 1500 },
  { width: 1440, height: 900 },
];

const backgroundGradients = [
  "linear-gradient(135deg, #111827 0%, #1f2937 55%, #374151 100%)",
  "linear-gradient(135deg, #f8fafc 0%, #e5e7eb 45%, #d1d5db 100%)",
  "linear-gradient(135deg, #0f172a 0%, #111827 60%, #1e293b 100%)",
  "linear-gradient(135deg, #fff7ed 0%, #ffedd5 45%, #fdba74 100%)",
  "linear-gradient(135deg, #ecfeff 0%, #cffafe 45%, #a5f3fc 100%)",
  "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 45%, #f9a8d4 100%)",
];

const canvasBackgrounds = ["#111827", "#f8fafc", "#0f172a", "#fff7ed", "#ecfeff", "#fdf2f8"];

const accentColors = ["#facc15", "#22c55e", "#0ea5e9", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#e11d48"];

const fonts = [
  "Inter, sans-serif",
  "Merriweather, serif",
  "Oswald, sans-serif",
  "Cinzel, serif",
  "Space Grotesk, sans-serif",
  "Fira Code, monospace",
  "Playfair Display, serif",
  "Bebas Neue, sans-serif",
];

const titleWords = ["Streetwear", "Trend Report", "Mono", "Product", "Social", "Editorial", "Launch", "Culture", "Motion", "Canvas"];

const subtitleWords = [
  "Bold layouts with strong image focus and clean type.",
  "Simple reference-driven composition for fast campaigns.",
  "Image-led cards built for modern creative boards.",
  "Curated artboard ideas that stay lightweight and readable.",
  "Strong typography and minimal overlays, nothing extra.",
  "A straightforward starting point for new designs.",
];

export const DESIGNER_TEMPLATES: DesignerTemplate[] = Array.from({ length: 24 }, (_, index) => {
  const category = categories[index % categories.length];
  const layout = layouts[index % layouts.length];
  const canvas = canvases[index % canvases.length];
  const accent = accentColors[index % accentColors.length];
  const secondaryAccent = accentColors[(index + 3) % accentColors.length];
  const headingFont = fonts[index % fonts.length];
  const bodyFont = fonts[(index + 2) % fonts.length];
  const title = `${titleWords[index % titleWords.length]} ${String(index + 1).padStart(2, "0")}`;
  const description = subtitleWords[index % subtitleWords.length];

  return {
    id: `template-${index + 1}`,
    title,
    category,
    description,
    layout,
    canvas,
    canvasBackground: canvasBackgrounds[index % canvasBackgrounds.length],
    background: backgroundGradients[index % backgroundGradients.length],
    accent,
    secondaryAccent,
    headingFont,
    bodyFont,
    layers: [
      {
        type: "text",
        x: canvas.width * 0.08,
        y: canvas.height * 0.08,
        width: canvas.width * 0.7,
        height: canvas.height * 0.12,
        text: title.toUpperCase(),
        fontSize: Math.round(canvas.height * 0.07),
        fontFamily: headingFont,
        fontWeight: "900",
        fill: category === "Product" ? "#111827" : "#ffffff",
      },
      {
        type: "text",
        x: canvas.width * 0.08,
        y: canvas.height * 0.22,
        width: canvas.width * 0.52,
        height: canvas.height * 0.08,
        text: description,
        fontSize: Math.round(canvas.height * 0.024),
        fontFamily: bodyFont,
        fontWeight: "500",
        fill: category === "Product" ? "rgba(17,24,39,0.75)" : "rgba(255,255,255,0.82)",
      },
      {
        type: "rect",
        x: canvas.width * 0.08,
        y: canvas.height * 0.84,
        width: canvas.width * 0.22,
        height: canvas.height * 0.055,
        fill: accent,
      },
    ],
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

function TemplateCard({ template, onSelectTemplate }: { template: DesignerTemplate; onSelectTemplate: (template: DesignerTemplate) => void }) {
  return (
    <article className="overflow-hidden rounded-[1.6rem] border border-zinc-800 bg-zinc-950">
      <div className="relative aspect-4/5">
        {template.imageUrl ? (
          <img src={template.imageUrl} alt={template.imageAlt || template.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-zinc-900 to-zinc-700" />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/88 via-black/18 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2 text-white">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">{template.category}</p>
            <h3 className="text-balance text-[1rem] font-black uppercase leading-[0.92] text-white" style={{ fontFamily: template.headingFont || "Inter, sans-serif" }}>
              {template.title}
            </h3>
          </div>

          <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium tracking-[0.18em] text-white/90">#{template.layers.length}</span>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
          <Button type="button" size="sm" className="h-10 rounded-xl bg-lime-400 px-4 text-sm font-semibold text-zinc-950 shadow-none hover:bg-lime-300" onClick={() => onSelectTemplate(template)}>
            Use Template
            <ArrowUpRight className="ml-1 size-3.5" />
          </Button>

          <div className="max-w-[56%] text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/66">{template.layout}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/76" style={{ fontFamily: template.bodyFont || "Inter, sans-serif" }}>
              {template.description}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 text-zinc-100">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="rounded-full bg-zinc-800 px-2 py-0 text-[10px] uppercase tracking-wider text-zinc-100 hover:bg-zinc-800">
            {template.category}
          </Badge>
          <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-400">
            {template.canvas.width} x {template.canvas.height}
          </span>
        </div>
      </div>
    </article>
  );
}

export function DesignerTemplateLibrary({ templates = DESIGNER_TEMPLATES, onSelectTemplate, className }: DesignerTemplateLibraryProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [previewPhotos, setPreviewPhotos] = useState<UnsplashPhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPhotos() {
      setIsLoadingPhotos(true);
      try {
        const data = await fetchUnsplashPhotos({
          search: "",
          filters: { color: null, orientation: null },
          limit: 12,
        });
        if (isMounted) setPreviewPhotos(data);
      } catch {
        if (isMounted) setPreviewPhotos([]);
      } finally {
        if (isMounted) setIsLoadingPhotos(false);
      }
    }

    loadPhotos();
    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedTemplates = useMemo(() => {
    if (previewPhotos.length === 0) return templates;

    return templates.map((template, index) => {
      const photo = previewPhotos[index % previewPhotos.length];
      return {
        ...template,
        imageUrl: photo.urls.regular,
        imageAlt: photo.alt_description || template.title,
      };
    });
  }, [previewPhotos, templates]);

  const categoriesList = useMemo(
    () => ["All", ...Array.from(new Set(resolvedTemplates.map((template) => template.category)))],
    [resolvedTemplates],
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resolvedTemplates.filter((template) => {
      const matchesCategory = activeCategory === "All" || template.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        template.title.toLowerCase().includes(normalizedQuery) ||
        template.description.toLowerCase().includes(normalizedQuery) ||
        template.layout.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, resolvedTemplates]);

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-zinc-950", className)}>
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              <Wand2 className="size-3" />
              {isLoadingPhotos ? "Loading templates" : `${filteredTemplates.length} templates`}
            </div>
            <h2 className="mt-3 text-base font-semibold text-zinc-100">Templates</h2>
          </div>

          <div className="grid size-11 place-items-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400">
            <LayoutGrid className="size-5" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-background bg-accent px-3">
          <Search className="size-4 shrink-0 text-zinc-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search layouts, themes, or mood"
            className="h-11 border-0 bg-transparent px-0 text-sm text-foreground bg-accent outline-none focus:ring-0"
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
                    ? "border-lime-400 bg-lime-400 text-zinc-950"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Showing <span className="font-semibold text-zinc-100">{filteredTemplates.length}</span> templates
          </p>
        </div>

        <div className="grid gap-4 pb-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onSelectTemplate={onSelectTemplate} />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-sm font-medium text-zinc-100">No templates found</p>
            <p className="mt-1 text-xs text-zinc-400">Try a different search term or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
