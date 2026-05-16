"use client";
import React, { useEffect, useState } from "react";
import { useEditorStore } from "../(store)/useEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, SlidersHorizontal, Sliders, Check } from "lucide-react";

interface FilterState {
  color: string | null;
  orientation: string | null;
}

const PhotosPanel = () => {
  const { selectedTool } = useEditorStore();
  const [images, setImages] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>({
    color: null,
    orientation: null,
  });

  // Centralized POST Fetch Engine
  const fetchUnsplashPhotos = async (query: string, currentFilters: FilterState) => {
    if (selectedTool !== "photos") return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/unplash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: query,
          filters: {
            color: currentFilters.color,
            orientation: currentFilters.orientation,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to pull matching dataset");
      
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger automatically on tool load or when filters alter
  useEffect(() => {
    if (selectedTool === "photos") {
      fetchUnsplashPhotos(searchQuery, filters);
    }
  }, [selectedTool, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUnsplashPhotos(searchQuery, filters);
  };

  const updateFilter = (type: keyof FilterState, value: string | null) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
  };

  function handlePhotoSelect(photo: any) {
    // addLayers([photo]);
    console.log("Selected photo added to layers:", photo);
  }

  return (
    <div className="w-80 h-full bg-white flex flex-col border-r border-gray-200 select-none">
      {/* Header Info */}
      <div className="py-3 px-4 flex items-center justify-between border-b border-gray-100">
        <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Library</span>
        <p className="text-gray-400 text-xs">
          via <span className="text-gray-900 font-semibold">Unsplash</span>
        </p>
      </div>

      {/* Control Panel Layer: Search & Filters */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-1.5 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search graphics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8.5 text-xs bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-gray-400"
            />
          </div>
          <Button type="submit" size="sm" className="h-8.5 text-xs px-2.5 bg-gray-900 hover:bg-gray-800">
            Find
          </Button>
        </form>

        <div className="flex gap-1.5 items-center w-full">
          {/* Orientation Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1 border-gray-200 gap-1 text-gray-600">
                <SlidersHorizontal className="h-3 w-3" />
                {filters.orientation ? `${filters.orientation}` : "Layout"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 text-xs">
              <DropdownMenuItem onClick={() => updateFilter("orientation", null)} className="flex items-center justify-between">
                All Orientations {!filters.orientation && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter("orientation", "landscape")} className="flex items-center justify-between">
                Landscape {filters.orientation === "landscape" && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter("orientation", "portrait")} className="flex items-center justify-between">
                Portrait {filters.orientation === "portrait" && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter("orientation", "squarish")} className="flex items-center justify-between">
                Square {filters.orientation === "squarish" && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Color Tone Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1 border-gray-200 gap-1 text-gray-600">
                <Sliders className="h-3 w-3" />
                {filters.color ? `${filters.color}` : "Color"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem onClick={() => updateFilter("color", null)} className="flex items-center justify-between">
                Any Color {!filters.color && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
              {["black_and_white", "black", "white", "yellow", "orange", "red", "purple", "magenta", "green", "teal", "blue"].map((c) => (
                <DropdownMenuItem key={c} onClick={() => updateFilter("color", c)} className="flex items-center justify-between capitalize">
                  {c.replace(/_/g, " ")} {filters.color === c && <Check className="h-3 w-3" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Gallery Layer */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center pt-8 gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
            <p className="text-gray-400 text-xs">Sifting library data...</p>
          </div>
        )}

        {!loading && images && images.length > 0 && (
          <div className="columns-2 gap-2.5 [column-fill:_balance] box-border">
            {images.map((img) => (
              <div 
                key={img.id} 
                className="break-inside-avoid mb-2.5 cursor-pointer group relative overflow-hidden rounded-md shadow-sm border border-gray-100 transition-all duration-200"
                onClick={() => handlePhotoSelect(img)}
              >
                {/* Visual Asset Container */}
                <img
                  src={img.urls.small}
                  alt={img.alt_description || "Unsplash Stock Target"}
                  className="w-full h-auto object-cover block transition-transform duration-300 group-hover:scale-102"
                />
                
                {/* Interactive Meta Layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end p-2 pointer-events-none">
                  <div className="flex items-center gap-1.5 w-full pointer-events-auto">
                    {img.user?.profile_image?.small && (
                      <img 
                        src={img.user.profile_image.small} 
                        alt={img.user.name} 
                        className="w-4 h-4 rounded-full border border-white/30 object-cover"
                      />
                    )}
                    <a 
                      href={img.user?.links?.html} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-white/90 font-medium truncate hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {img.user?.name || "Creator"}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && images && images.length === 0 && (
          <p className="text-center text-gray-400 text-xs mt-8">No graphics match your query criteria.</p>
        )}
      </div>
    </div>
  );
};

const SelectedToolPanel = () => {
  const { selectedTool } = useEditorStore();
  return <>{selectedTool === "photos" && <PhotosPanel />}</>;
};

export default SelectedToolPanel;