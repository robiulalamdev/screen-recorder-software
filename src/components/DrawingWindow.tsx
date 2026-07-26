import React, { useRef, useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

export default function DrawingWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [enabled, setEnabled] = useState(false); // Controls if we accept input
  const [color, setColor] = useState("#ef4444");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Listen for mode changes from toolbar
    const unlistenMode = listen<boolean>("set-drawing-mode", (e) => setEnabled(e.payload));
    const unlistenTool = listen<{ tool: "pen" | "eraser"; color?: string }>("set-drawing-tool", (e) => {
      setTool(e.payload.tool);
      if (e.payload.color) setColor(e.payload.color);
    });
    const unlistenClear = listen("clear-drawing", () => clearCanvas());

    return () => {
      unlistenMode.then((f) => f());
      unlistenTool.then((f) => f());
      unlistenClear.then((f) => f());
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!enabled) return;
    setIsDrawing(true);
    lastPos.current = getCoordinates(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !enabled || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const currentPos = getCoordinates(e);
    if (!currentPos) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
    }
    
    ctx.stroke();
    lastPos.current = currentPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          width: "100%",
          height: "100%",
          cursor: enabled ? "crosshair" : "default",
          pointerEvents: enabled ? "auto" : "none",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}
