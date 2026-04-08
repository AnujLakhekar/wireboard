"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  ChevronsUpDown,
  Folder,
  Home,
  Moon,
  SlidersHorizontal,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "wireboard-theme";

const platformItems = [
  {
    title: "Playground",
    href: "/",
    icon: Home,
    children: [
      { title: "History", href: "/history" },
      { title: "Starred", href: "/starred" },
      { title: "Settings", href: "/playground/settings" },
    ],
  },
  { title: "Models", href: "/models", icon: Folder },
  { title: "Documentation", href: "/documentation", icon: BookOpen },
  { title: "Settings", href: "/settings", icon: SlidersHorizontal },
];

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", shouldUseDark);
}

export function AppSidebar() {
  const pathname = usePathname();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [compactMode, setCompactMode] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    Playground:
      pathname === "/" ||
      pathname.startsWith("/history") ||
      pathname.startsWith("/starred") ||
      pathname.startsWith("/playground"),
  }));

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as ThemeMode | null;
    const initialTheme = savedTheme ?? "system";
    setThemeMode(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    applyTheme(themeMode);

    if (themeMode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = () => applyTheme("system");

    media.addEventListener("change", handleThemeChange);
    return () => media.removeEventListener("change", handleThemeChange);
  }, [themeMode]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-2.5">
        <button className="flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-sidebar-accent/70">
          <div className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm ring-1 ring-blue-500/60">
            <Folder className="size-4" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">Acme Inc</p>
            <p className="truncate text-xs text-muted-foreground">Enterprise</p>
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-sm">
            Platform
          </SidebarGroupLabel>
          <SidebarMenu>
            {platformItems.map((item) => {
              const isExpanded = openGroups[item.title] ?? false;
              const hasChildren = Boolean(item.children?.length);

              return (
                <SidebarMenuItem key={item.title}>
                  <div className="flex items-center gap-1">
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      asChild
                      className={cn(
                        "flex-1",
                        compactMode ? "h-7 text-xs" : "h-8 text-sm",
                      )}
                    >
                      <Link href={item.href} className="justify-start gap-2.5">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>

                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.title)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.title}`}
                      >
                        <ChevronRight
                          className={cn(
                            "size-4 transition-transform duration-200",
                            isExpanded && "rotate-90",
                          )}
                        />
                      </button>
                    ) : (
                      <ChevronRight className="mr-1 size-4 text-muted-foreground" />
                    )}
                  </div>

                  {hasChildren && isExpanded ? (
                    <SidebarMenuSub>
                      {item.children?.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            isActive={isActive(child.href)}
                            asChild
                          >
                            <Link href={child.href}>{child.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 p-3">
        <div className="flex items-center gap-3 rounded-md px-1 py-1.5">
          <div className="grid size-9 place-items-center rounded-full border border-sidebar-border bg-linear-to-br from-cyan-500 via-fuchsia-500 to-orange-400 text-xs font-bold text-white">
            SH
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">shadcn</p>
            <p className="truncate text-xs text-muted-foreground">
              m@example.com
            </p>
          </div>

          <Menubar className="h-auto border-0 bg-transparent p-0 shadow-none">
            <MenubarMenu>
              <MenubarTrigger className="grid size-8 place-items-center rounded-md border border-transparent p-0 text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent">
                <ChevronsUpDown className="size-4" />
              </MenubarTrigger>
              <MenubarContent align="end" className="w-56">
                <MenubarLabel>Profile</MenubarLabel>
                <MenubarSeparator />
                <MenubarItem>
                  Account settings
                  <MenubarShortcut>⌘,</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>Invite member</MenubarItem>
                <MenubarSeparator />
                <MenubarCheckboxItem
                  checked={compactMode}
                  onCheckedChange={(checked) =>
                    setCompactMode(Boolean(checked))
                  }
                >
                  <div className="flex flex-row justify-start gap-3">
                    <Touchpad className="size-4" /> Compact navigation
                  </div>
                </MenubarCheckboxItem>
                <MenubarSub>
                  <MenubarSubTrigger>
                    {themeMode === "dark" ? (
                      <Moon className="size-4" />
                    ) : (
                      <Sun className="size-4" />
                    )}
                    Theme
                  </MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarRadioGroup
                      value={themeMode}
                      onValueChange={(value) =>
                        setThemeMode(value as ThemeMode)
                      }
                    >
                      <MenubarRadioItem value="light">Light</MenubarRadioItem>
                      <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                      <MenubarRadioItem value="system">System</MenubarRadioItem>
                    </MenubarRadioGroup>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem>Sign out</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
