import { Stage } from "konva/lib/Stage";
import { jsPDF } from "jspdf";

interface ExportOptions {
  format: "png" | "jpeg" | "pdf";
  quality?: number; // Valid from 0.0 to 1.0 for JPEGs
}

export const exportCanvasWorkspace = async (
  stageNode: Stage | null,
  options: ExportOptions
) => {
  if (!stageNode) {
    console.error("Export canceled: Active Konva stage node reference missing.");
    return;
  }

  const { format, quality = 1.0 } = options;

  // 1. Force the Transformer overlay rings to hide before taking the snapshot
  const transformers = stageNode.find("Transformer");
  transformers.forEach((t) => t.hide());

  // 2. Generate a pixel-dense data URL string directly from the Konva rendering layout context
  // pixelRatio: 2 increases output sharpness for high-res printing layouts
  const dataUrl = stageNode.toDataURL({
    mimeType: format === "jpeg" ? "image/jpeg" : "image/png",
    quality: format === "jpeg" ? quality : undefined,
    pixelRatio: 2, 
  });

  // Restore transformer visibility immediately after stripping the binary context string
  transformers.forEach((t) => t.show());

  // 3. Document Streaming Router Matrix
  if (format === "png" || format === "jpeg") {
    // Standard programmatic anchor down-stream trigger download pipeline
    const downloadAnchor = document.createElement("a");
    downloadAnchor.download = `wireboard-export-${Date.now()}.${format}`;
    downloadAnchor.href = dataUrl;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  } 
  
  else if (format === "pdf") {
    // Get exact viewport pixel space configuration bounding dimensions
    const stageWidth = stageNode.width();
    const stageHeight = stageNode.height();

    // Initialize the jsPDF layout orientation relative to canvas geometric aspect ratios
    const orientation = stageWidth > stageHeight ? "landscape" : "portrait";
    const pdfDoc = new jsPDF({
      orientation: orientation,
      unit: "px",
      format: [stageWidth, stageHeight],
    });

    // Inject the raw snapshot text buffer directly as an internal vector layer page image payload
    pdfDoc.addImage(dataUrl, "PNG", 0, 0, stageWidth, stageHeight);
    
    // Write download save promise down to hardware disk
    pdfDoc.save(`wireboard-document-${Date.now()}.pdf`);
  }
};