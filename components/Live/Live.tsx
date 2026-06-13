"use client";

import { useMyPresence, useOthers } from "@liveblocks/react";
import React, { useEffect } from "react";
import { SmoothCursor } from "./xursor";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useLiveStore } from "@/store/useLiveStroe";

const Live = () => {
  const others = useOthers();
  const [myPresence, updateMyPresence] = useMyPresence();
  const user = useQuery(api.users.viewer);
  const { setOthers } = useLiveStore();

  useEffect(() => {
    if (user) {
      updateMyPresence({
        color: myPresence?.color ?? "",
        name: user.name,
        cursor: myPresence?.cursor ?? null,
        img: user.image || "",
      });
    }
  }, [user, myPresence?.color, myPresence?.cursor, updateMyPresence]);

  // Use global listeners so we don't need an overlay element that blocks pointer events.
  React.useEffect(() => {
    const onMove = (event: MouseEvent) => {
      updateMyPresence({
        cursor: { x: event.clientX, y: event.clientY },
        color: myPresence?.color ?? "",
        name: myPresence?.name ?? "",
        });
    };

    const onOut = (event: MouseEvent) => {
      // When leaving the window, relatedTarget is null in many browsers
      // (or when moving to no element). Use that to clear cursor.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - relatedTarget exists on MouseEvent in browsers
      if ((event as any).relatedTarget === null) {
        updateMyPresence({
          cursor: null,
          color: myPresence?.color ?? "",
          name: myPresence?.name ?? "",
        });
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onOut);
    };
  }, [myPresence, updateMyPresence]);

  
  useEffect(() => {
    setOthers(others as any[]);
  }, [others]);


  return (
    <div>
      {others.map((user, index) => {
        const cursor = user.presence.cursor as
          | { x?: unknown; y?: unknown }
          | null
          | undefined;
        const color =
          typeof user.presence.color === "string" ? user.presence.color : "";
        const name =
          typeof user.presence.name === "string" ? user.presence.name : "";
        const hasCoords =
          !!cursor &&
          typeof cursor.x === "number" &&
          typeof cursor.y === "number";
        return hasCoords ? (
          <SmoothCursor
            key={index}
            x={cursor.x as number}
            y={cursor.y as number}
            color={color}
            name={name}
          />
        ) : null;
      })}
    </div>
  );
};

export default Live;
