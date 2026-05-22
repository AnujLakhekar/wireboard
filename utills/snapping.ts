export interface BoxBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnappingResult {
  snappedX: number | null;
  snappedY: number | null;
  guideLines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

const SNAP_THRESHOLD_PX = 8; // Max proximity distance to trigger a snap bond

export const calculateSnappingGuides = (
  draggingLayer: BoxBounds,
  allLayers: BoxBounds[]
): SnappingResult => {
  const result: SnappingResult = { snappedX: null, snappedY: null, guideLines: [] };

  // Filter out the active dragging layer from the global collision matrix
  const targetLayers = allLayers.filter((l) => l.id !== draggingLayer.id);

  // Compute bounding parameters for the moving element
  const dragLeft = draggingLayer.x;
  const dragCenter = draggingLayer.x + draggingLayer.width / 2;
  const dragRight = draggingLayer.x + draggingLayer.width;

  const dragTop = draggingLayer.y;
  const dragMiddle = draggingLayer.y + draggingLayer.height / 2;
  const dragBottom = draggingLayer.y + draggingLayer.height;

  let closestDistX = SNAP_THRESHOLD_PX;
  let closestDistY = SNAP_THRESHOLD_PX;

  for (const target of targetLayers) {
    const tgtLeft = target.x;
    const tgtCenter = target.x + target.width / 2;
    const tgtRight = target.x + target.width;

    const tgtTop = target.y;
    const tgtMiddle = target.y + target.height / 2;
    const tgtBottom = target.y + target.height;


    if (Math.abs(dragLeft - tgtLeft) < closestDistX) {
      closestDistX = Math.abs(dragLeft - tgtLeft);
      result.snappedX = tgtLeft;
      result.guideLines.push({ x1: tgtLeft, y1: Math.min(dragTop, tgtTop), x2: tgtLeft, y2: Math.max(dragBottom, tgtBottom) });
    }
    // Right edge matching
    if (Math.abs(dragRight - tgtRight) < closestDistX) {
      closestDistX = Math.abs(dragRight - tgtRight);
      result.snappedX = tgtRight - draggingLayer.width;
      result.guideLines.push({ x1: tgtRight, y1: Math.min(dragTop, tgtTop), x2: tgtRight, y2: Math.max(dragBottom, tgtBottom) });
    }
    // Absolute Center Alignment (X Axis)
    if (Math.abs(dragCenter - tgtCenter) < closestDistX) {
      closestDistX = Math.abs(dragCenter - tgtCenter);
      result.snappedX = tgtCenter - draggingLayer.width / 2;
      result.guideLines.push({ x1: tgtCenter, y1: Math.min(dragTop, tgtTop), x2: tgtCenter, y2: Math.max(dragBottom, tgtBottom) });
    }

    // --- VERTICAL SNAP CHECKS (Aligning Y Coordinates) ---
    // Top edge matching
    if (Math.abs(dragTop - tgtTop) < closestDistY) {
      closestDistY = Math.abs(dragTop - tgtTop);
      result.snappedY = tgtTop;
      result.guideLines.push({ x1: Math.min(dragLeft, tgtLeft), y1: tgtTop, x2: Math.max(dragRight, tgtRight), y2: tgtTop });
    }
    // Bottom edge matching
    if (Math.abs(dragBottom - tgtBottom) < closestDistY) {
      closestDistY = Math.abs(dragBottom - tgtBottom);
      result.snappedY = tgtBottom - draggingLayer.height;
      result.guideLines.push({ x1: Math.min(dragLeft, tgtLeft), y1: tgtBottom, x2: Math.max(dragRight, tgtRight), y2: tgtBottom });
    }
    // Center Middle Alignment (Y Axis)
    if (Math.abs(dragMiddle - tgtMiddle) < closestDistY) {
      closestDistY = Math.abs(dragMiddle - tgtMiddle);
      result.snappedY = tgtMiddle - draggingLayer.height / 2;
      result.guideLines.push({ x1: Math.min(dragLeft, tgtLeft), y1: tgtMiddle, x2: Math.max(dragRight, tgtRight), y2: tgtMiddle });
    }
  }

  return result;
};