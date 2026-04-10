"use client";

import { Geist, Geist_Mono } from "next/font/google"
import "../../globals.css"

import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DrawingsProvider } from "@/providers/DrawingsProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} h-screen flex antialiased`}
    >
      <DrawingsProvider>
        <SidebarProvider>
          {/* LEFT SIDE */}
          <AppSidebar />

          {/* RIGHT SIDE */}
          <main className="flex-1 p-4">
            <SidebarTrigger />
            {children}
          </main>
        </SidebarProvider>
      </DrawingsProvider>
    </div>
  )
}