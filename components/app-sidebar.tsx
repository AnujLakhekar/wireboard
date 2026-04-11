"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileText,
  ChevronRight,
  Star,
  ChevronsUpDown,
  Moon,
  Sun,
  Touchpad,
} from "lucide-react";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { DrawingsList } from "@/components/drawings-list";
import { AutoSaveInfo } from "@/components/auto-save-info";

type ThemeMode = "light" | "dark" | "system";
const THEME_STORAGE_KEY = "wireboard-theme";

// Helper function from your code
function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", shouldUseDark);
}

const platformItems = [{ title: "Board", href: "/app", icon: FileText }];

export function AppSidebar() {
  const pathname = usePathname();
  const [compactMode, setCompactMode] = useState(false);
  
  // Theme State Logic
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) ?? "system";
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    applyTheme(themeMode);

    if (themeMode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = () => applyTheme("system");
    media.addEventListener("change", handleThemeChange);
    return () => media.removeEventListener("change", handleThemeChange);
  }, [themeMode]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar 
      collapsible="offcanvas" 
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      {/* HEADER: Workspace Switcher */}
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-6 rounded bg-linear-to-br from-cyan-400 to-emerald-400 shadow-lg shadow-emerald-500/20" />
            <span className="text-sm font-semibold text-sidebar-foreground">Wireboard</span>
          </div>
          <button className="rounded p-1 transition-colors hover:bg-sidebar-accent">
            <ChevronRight className="size-4 text-sidebar-foreground/60" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-hide">
        {/* SECTION 1: PLATFORM */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/60">
            Platform
          </SidebarGroupLabel>
          <SidebarMenu>
            {platformItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  className={cn(
                    "transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground",
                    compactMode ? "h-7" : "h-9"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3 px-2">
                    <item.icon className="size-4 opacity-70" />
                    <span className={cn("font-medium", compactMode ? "text-xs" : "text-[13px]")}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* SECTION 2: DRAWINGS */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/60">
            My Drawings
          </SidebarGroupLabel>
          <div className="px-2">
            <DrawingsList />
          </div>
        </SidebarGroup>

        {/* SECTION 3: FAVORITES (Matching reference image) */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="flex cursor-default items-center gap-1 px-2 text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/60">
            Favorites <ChevronRight className="size-3 rotate-90" />
          </SidebarGroupLabel>
          <div className="flex flex-col items-center justify-center py-8 opacity-40">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-dashed border-sidebar-border">
              <Star className="size-4 text-sidebar-foreground/60" />
            </div>
            <p className="text-[12px] font-medium text-sidebar-foreground/60">No favorites</p>
          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER: User Profile & Theme Controls */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 p-2 ring-1 ring-sidebar-border">
          <div className="grid size-8 place-items-center rounded-full border border-sidebar-border bg-linear-to-br from-sidebar-accent to-sidebar text-[10px] font-bold text-sidebar-foreground/80">
            SH
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Localuser</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">storage in use: 0 MB</p>
          </div>

          <Menubar className="h-auto border-0 bg-transparent p-0 shadow-none">
            <MenubarMenu>
              <MenubarTrigger className="grid size-7 place-items-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent">
                <ChevronsUpDown className="size-4" />
              </MenubarTrigger>
              <MenubarContent align="end" className="w-56 border-border bg-popover text-popover-foreground">
                <MenubarLabel className="text-muted-foreground">Profile</MenubarLabel>
                <MenubarSeparator className="bg-border" />
                <MenubarItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                  Account settings <MenubarShortcut className="text-muted-foreground">⌘,</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator className="bg-border" />
                
                <MenubarCheckboxItem
                  checked={compactMode}
                  onCheckedChange={(checked) => setCompactMode(Boolean(checked))}
                  className="cursor-pointer focus:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <Touchpad className="size-4" /> Compact Nav
                  </div>
                </MenubarCheckboxItem>

                <MenubarSub>
                  <MenubarSubTrigger className="cursor-pointer focus:bg-accent">
                    {themeMode === "dark" ? <Moon className="mr-2 size-4" /> : <Sun className="mr-2 size-4" />}
                    Theme
                  </MenubarSubTrigger>
                  <MenubarSubContent className="border-border bg-popover">
                    <MenubarRadioGroup
                      value={themeMode}
                      onValueChange={(v) => setThemeMode(v as ThemeMode)}
                    >
                      <MenubarRadioItem value="light" className="focus:bg-accent">Light</MenubarRadioItem>
                      <MenubarRadioItem value="dark" className="focus:bg-accent">Dark</MenubarRadioItem>
                      <MenubarRadioItem value="system" className="focus:bg-accent">System</MenubarRadioItem>
                    </MenubarRadioGroup>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator className="bg-border" />
                <MenubarItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Sign out</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}