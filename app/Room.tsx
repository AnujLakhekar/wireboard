"use client";

import { ReactNode } from "react";
import { RoomProvider } from "@/liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";

function giveColor() {
  const colors = [
    "#FF6633",
    "#FFB399",
    "#FF33FF",
    "#FFFF99",
    "#00B3E6",
    "#E6B333",
    "#3366E6",
    "#999966",
    "#99FF99",
    "#B34D4D",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  return (
    <RoomProvider
      initialPresence={{
        color: giveColor(),
        name: "Anonymous",
        cursor: null,
        objects: [],
        img: "",
      }}
      initialStorage={{
        color: [],
        objects: [],
      }}
      id={roomId}
    >
      <ClientSideSuspense fallback={<div className="w-full h-screen flex justify-center items-center" >Connecting</div>}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
