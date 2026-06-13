import React, { useEffect, useRef } from "react";
import { GiArrowCursor } from "react-icons/gi";

interface CursorProps {
  x: number; // Target X from Liveblocks storage/presence
  y: number; // Target Y from Liveblocks storage/presence
  color: string;
  name: string;
}

export const SmoothCursor = ({ x, y, color, name }: CursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  console.log(`Received cursor position: (${x}, ${y}) for user ${name} with color ${color}`);
  
  // Keep track of the actual current visual position of the cursor
  const currentPos = useRef({ x: 0, y: 0 });
  // Keep track of the target position from the network
  const targetPos = useRef({ x: 0, y: 0 });
  // Whether we've initialized the visual position (avoid jumping from 0,0)
  const initialized = useRef(false);

  // Update targets whenever props change from Liveblocks
  useEffect(() => {
    targetPos.current = { x, y };
    if (!initialized.current) {
      currentPos.current = { x, y };
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      initialized.current = true;
    }
  }, [x, y]);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      // Linear Interpolation (Lerp) factor - lower means smoother but slightly more loose
      const ease = 0.15; 
      // Defensive: coerce targets to finite numbers to avoid NaN stopping the loop
      const tx = Number.isFinite(Number(targetPos.current.x)) ? Number(targetPos.current.x) : currentPos.current.x;
      const ty = Number.isFinite(Number(targetPos.current.y)) ? Number(targetPos.current.y) : currentPos.current.y;

      // Calculate the distance and move a percentage of the way there
      const dx = tx - currentPos.current.x;
      const dy = ty - currentPos.current.y;

      // If very close, snap to target to avoid imperceptible micro-movements
      if (Math.abs(dx) + Math.abs(dy) < 0.5) {
        currentPos.current.x = tx;
        currentPos.current.y = ty;
      } else {
        currentPos.current.x += dx * ease;
        currentPos.current.y += dy * ease;
      }

      // Directly manipulate the DOM or use transform for maximum performance
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        willChange: "transform",
        transition: "opacity 0.16s ease",
        transformOrigin: "0 0",
        zIndex: 9999,
      }}
      className="pointer-events-none"
    >
      {/* Visible cursor marker + icon */}
      {/* Fallback color if none provided */}
      {(() => {
        const fill = color || "#ff4d4f";
        return (
          <>
            <GiArrowCursor color={fill} size={18} />
          </>
        );
      })()}

      {/* Label */}
      <div 
        className="absolute left-4 top-4 rounded px-1.5 py-0.5 text-xs text-white"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
};