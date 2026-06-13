"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowUpRight, LayoutGrid, Search, Wand2 } from "lucide-react";
import { fetchUnsplashPhotos, type UnsplashPhoto } from "../lib/unsplash-cache";

export type DesignerTemplateLayout =
  | "cover"
  | "editorial"
  | "product"
  | "social"
  | "poster"
  | "presentation";

export type TemplateLayerBlueprint = {
  id?: string;
  type: "rect" | "circle" | "text" | "image";
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
  opacity?: number;
};

export type DesignerTemplate = {
  id: string;
  title: string;
  category: string;
  description: string;
  layout: DesignerTemplateLayout;
  canvas: { width: number; height: number };
  canvasBackground: string;
  accent: string;
  secondaryAccent: string;
  headingFont?: string;
  bodyFont?: string;
  imageUrl?: string;
  imageAlt?: string;
  layers: TemplateLayerBlueprint[];
};

type DesignerTemplateLibraryProps = {
  templates?: DesignerTemplate[];
  onSelectTemplate: (template: DesignerTemplate) => void;
  className?: string;
};


// Explicitly handcrafted templates to mimic distinct Canva-like design systems
const PREMIUM_DESIGN_TEMPLATES: DesignerTemplate[] = [
  {
    id: "template-editorial-01",
    title: "Minimalist Editorial",
    category: "Editorial",
    description: "High-end look with dramatic whitespace and asymmetric text layout blocks.",
    layout: "editorial",
    canvas: { width: 1200, height: 1500 },
    canvasBackground: "#fcfbf9",
    accent: "#1c1917",
    secondaryAccent: "#78716c",
    headingFont: "Playfair Display, serif",
    bodyFont: "Inter, sans-serif",
    layers: [
      { type: "rect", x: 60, y: 60, width: 1080, height: 1380, stroke: "#1c1917", strokeWidth: 2, opacity: 0.3 },
      { type: "image", x: 450, y: 120, width: 630, height: 800 },
      { type: "text", x: 120, y: 850, width: 800, height: 200, text: "THE NEW ERA", fontSize: 96, fontFamily: "Playfair Display, serif", fontWeight: "900", fill: "#1c1917" },
      { type: "text", x: 120, y: 1080, width: 500, height: 150, text: "A deep dive into intentional layout architecture and modern typography arrangements.", fontSize: 24, fontFamily: "Inter, sans-serif", fontWeight: "400", fill: "#57534e" },
      { type: "rect", x: 120, y: 1280, width: 180, height: 4, fill: "#1c1917" }
    ]
  },
  {
    id: "template-product-showcase",
    title: "Streetwear Drop",
    category: "Product",
    description: "Bold center-cut photo framework with industrial styling lines and accents.",
    layout: "product",
    canvas: { width: 1080, height: 1350 },
    canvasBackground: "#0b0f19",
    accent: "#d4ff3b",
    secondaryAccent: "#38bdf8",
    headingFont: "Oswald, sans-serif",
    bodyFont: "Space Grotesk, sans-serif",
    layers: [
      { type: "text", x: 54, y: 80, width: 972, height: 120, text: "CORE COLLECTION", fontSize: 110, fontFamily: "Oswald, sans-serif", fontWeight: "900", fill: "#ffffff", align: "center" },
      { type: "image", x: 140, y: 240, width: 800, height: 800 },
      { type: "rect", x: 100, y: 200, width: 880, height: 880, stroke: "#d4ff3b", strokeWidth: 3 },
      { type: "circle", x: 850, y: 200, width: 120, height: 120, fill: "#d4ff3b" },
      { type: "text", x: 850, y: 245, width: 120, height: 40, text: "NEW", fontSize: 22, fontFamily: "Space Grotesk, sans-serif", fontWeight: "700", fill: "#0b0f19", align: "center" },
      { type: "text", x: 100, y: 1150, width: 880, height: 80, text: "AVAILABLE NOW / LIMITED QUANTITIES", fontSize: 28, fontFamily: "Space Grotesk, sans-serif", fontWeight: "500", fill: "#94a3b8", align: "center" }
    ]
  },
  {
    id: "template-social-brutalist",
    title: "Brutalist Event Card",
    category: "Social",
    description: "High-contrast, raw grid structures tailored for fast announcements.",
    layout: "social",
    canvas: { width: 1080, height: 1080 },
    canvasBackground: "#facc15",
    accent: "#000000",
    secondaryAccent: "#ffffff",
    headingFont: "Bebas Neue, sans-serif",
    bodyFont: "Fira Code, monospace",
    layers: [
      { type: "rect", x: 40, y: 40, width: 480, height: 900, fill: "#000000" },
      { type: "image", x: 560, y: 40, width: 480, height: 480 },
      { type: "rect", x: 560, y: 560, width: 480, height: 380, fill: "#ffffff", stroke: "#000000", strokeWidth: 4 },
      { type: "text", x: 60, y: 100, width: 440, height: 300, text: "LIVE\nSTREAM", fontSize: 110, fontFamily: "Bebas Neue, sans-serif", fill: "#facc15" },
      { type: "text", x: 600, y: 600, width: 400, height: 300, text: "[LOC] MAIN_STAGE\n[TIME] 22:00_GMT\n[TICKETS] OPEN", fontSize: 24, fontFamily: "Fira Code, monospace", fontWeight: "700", fill: "#000000" }
    ]
  },
  {
    id: "template-magazine-cover",
    title: "Culture Cover Story",
    category: "Campaign",
    description: "Overlapping design where the header typography locks directly in behind or over the photo frame.",
    layout: "cover",
    canvas: { width: 1200, height: 1500 },
    canvasBackground: "#111827",
    accent: "#ef4444",
    secondaryAccent: "#ffffff",
    headingFont: "Cinzel, serif",
    bodyFont: "Inter, sans-serif",
    layers: [
      { type: "image", x: 0, y: 0, width: 1200, height: 1500 },
      { type: "rect", x: 0, y: 0, width: 1200, height: 1500, fill: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%)" },
      { type: "text", x: 0, y: 150, width: 1200, height: 160, text: "METROPOLIS", fontSize: 130, fontFamily: "Cinzel, serif", fontWeight: "900", fill: "#ffffff", align: "center" },
      { type: "text", x: 100, y: 1200, width: 1000, height: 60, text: "THE ARCHITECTURE OF TOMORROW", fontSize: 36, fontFamily: "Inter, sans-serif", fontWeight: "700", fill: "#ef4444", align: "left" },
      { type: "text", x: 100, y: 1280, width: 700, height: 100, text: "Exploring the hidden design ecosystems shaping our physical world spaces.", fontSize: 22, fontFamily: "Inter, sans-serif", fontWeight: "400", fill: "#d1d5db" }
    ]
  }
];

export function materializeTemplateLayers(template: DesignerTemplate) {
  return template.layers.map((layer, index) => ({
    ...layer,
    id: layer.id || `${template.id}-layer-${index + 1}`,
    zIndex: index + 1,
  }));
}

function TemplateCard({ template, onSelectTemplate }: { template: DesignerTemplate; onSelectTemplate: (template: DesignerTemplate) => void }) {
  return (
    <article className="overflow-hidden rounded-[1.6rem] border border-zinc-800 bg-zinc-950 flex flex-col justify-between">
      <div className="relative aspect-4/5 w-full bg-zinc-900">
        {template.imageUrl ? (
          <img src={template.imageUrl} alt={template.imageAlt || template.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-zinc-700 font-mono text-xs">
            [Layout Canvas Blueprint]
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2 text-white">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-lime-400">{template.category}</p>
            <h3 className="text-balance text-[1rem] font-black uppercase leading-tight text-white" style={{ fontFamily: template.headingFont || "Inter, sans-serif" }}>
              {template.title}
            </h3>
          </div>
          <span className="rounded-full bg-zinc-900/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-medium tracking-wider text-zinc-300 border border-zinc-800">
            {template.layers.length} Elements
          </span>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
          <Button 
            type="button" 
            size="sm" 
            className="h-10 rounded-xl bg-lime-400 px-4 text-sm font-semibold text-zinc-950 shadow-none hover:bg-lime-300 shrink-0" 
            onClick={() => onSelectTemplate(template)}
          >
            Use Design
            <ArrowUpRight className="ml-1 size-3.5" />
          </Button>

          <div className="max-w-[56%] text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 font-mono">{template.layout}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-300" style={{ fontFamily: template.bodyFont || "Inter, sans-serif" }}>
              {template.description}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300 border-none">
            {template.layout}
          </Badge>
          <span className="text-[10px] font-mono tracking-tight text-zinc-500">
            {template.canvas.width} × {template.canvas.height} px
          </span>
        </div>
      </div>
    </article>
  );
}

export function DesignerTemplateLibrary({ templates = PREMIUM_DESIGN_TEMPLATES, onSelectTemplate, className }: DesignerTemplateLibraryProps) {
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
          search: "abstract textures architecture",
          filters: { color: null, orientation: null },
          limit: 10,
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

  // Hydrates the specific element structures with real image URLs natively for your canvas
  const resolvedTemplates = useMemo(() => {
    return templates.map((template, index) => {
      const targetPhoto = previewPhotos[index % previewPhotos.length];
      const imageUrl = targetPhoto?.urls?.regular || "";
      const imageAlt = targetPhoto?.alt_description || template.title;

      // Inject image URLs into the layout element mapping dynamically so the canvas app gets it
      const layersWithImages = template.layers.map(layer => {
        if (layer.type === "image") {
          return { ...layer, fill: imageUrl }; // Canvas systems can parse image fills via layout engines
        }
        return layer;
      });

      return {
        ...template,
        imageUrl,
        imageAlt,
        layers: layersWithImages
      };
    });
  }, [previewPhotos, templates]);

  const categoriesList = useMemo(
    () => ["All", ...Array.from(new Set(resolvedTemplates.map((t) => t.category)))],
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
      <div className="border-b border-zinc-900 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              <Wand2 className="size-3 text-lime-400" />
              {isLoadingPhotos ? "Loading Canvas Blueprints..." : `${filteredTemplates.length} Design Engine Archetypes`}
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-zinc-100">Design Studio Blueprint Library</h2>
          </div>

          <div className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400">
            <LayoutGrid className="size-4" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3">
          <Search className="size-4 shrink-0 text-zinc-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search custom layouts, systems, or aspect ratios..."
            className="h-10 border-0 bg-transparent px-0 text-sm text-zinc-200 outline-none focus-visible:ring-0"
          />
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "whitespace-nowrap rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all",
                  active
                    ? "border-lime-400 bg-lime-400 text-zinc-950 font-semibold"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid gap-6 pb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onSelectTemplate={onSelectTemplate} />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <p className="text-sm font-medium text-zinc-300">No layouts matched your system parameters</p>
            <p className="mt-1 text-xs text-zinc-500">Try modifying search tags or change asset filtering arrays.</p>
          </div>
        )}
      </div>
    </div>
  );
}
// Add this alias export to keep your existing imports working perfectly!
export { PREMIUM_DESIGN_TEMPLATES as DESIGNER_TEMPLATES };