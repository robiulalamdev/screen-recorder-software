import { useRef, useState, useEffect, useCallback } from "react";

export type DrawTool = "pen" | "highlighter" | "arrow" | "rectangle" | "circle" | "text";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  tool: DrawTool;
  points: Point[];
  color: string;
  size: number;
  endPoint?: Point;
  text?: string;
}

interface CanvasDrawingProps {
  tool: DrawTool | null;
  color: string;
  brushSize: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function CanvasDrawing({
  tool,
  color,
  brushSize,
  onUndo,
  onRedo,
}: CanvasDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  const getPoint = useCallback((e: React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawStroke = (stroke: Stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.tool === "highlighter") {
        ctx.globalAlpha = 0.3;
      }

      switch (stroke.tool) {
        case "pen":
        case "highlighter": {
          if (stroke.points.length < 2) break;
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
          break;
        }
        case "arrow": {
          if (stroke.points.length < 1 || !stroke.endPoint) break;
          const start = stroke.points[0];
          const end = stroke.endPoint;
          const headLen = Math.max(15, stroke.size * 3);
          const angle = Math.atan2(end.y - start.y, end.x - start.x);

          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle - Math.PI / 6),
            end.y - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle + Math.PI / 6),
            end.y - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          break;
        }
        case "rectangle": {
          if (stroke.points.length < 1 || !stroke.endPoint) break;
          const s = stroke.points[0];
          const e = stroke.endPoint;
          ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
          break;
        }
        case "circle": {
          if (stroke.points.length < 1 || !stroke.endPoint) break;
          const sc = stroke.points[0];
          const ec = stroke.endPoint;
          const rx = Math.abs(ec.x - sc.x) / 2;
          const ry = Math.abs(ec.y - sc.y) / 2;
          const cx = sc.x + (ec.x - sc.x) / 2;
          const cy = sc.y + (ec.y - sc.y) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case "text": {
          if (stroke.points.length < 1 || !stroke.text) break;
          ctx.font = `${stroke.size * 4}px sans-serif`;
          ctx.fillStyle = stroke.color;
          ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
          break;
        }
      }
      ctx.globalAlpha = 1;
    };

    strokes.forEach(drawStroke);
    if (currentStroke) drawStroke(currentStroke);
  }, [strokes, currentStroke]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!tool) return;
      const point = getPoint(e);

      if (tool === "text") {
        const text = prompt("Enter text:");
        if (text) {
          const stroke: Stroke = { tool, points: [point], color, size: brushSize, text };
          setStrokes((prev) => [...prev, stroke]);
          setRedoStack([]);
        }
        return;
      }

      setIsDrawing(true);
      setCurrentStroke({
        tool,
        points: [point],
        color,
        size: brushSize,
        endPoint: point,
      });
    },
    [tool, color, brushSize, getPoint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !currentStroke) return;
      const point = getPoint(e);

      if (tool === "pen" || tool === "highlighter") {
        setCurrentStroke((prev) =>
          prev ? { ...prev, points: [...prev.points, point] } : null
        );
      } else {
        setCurrentStroke((prev) =>
          prev ? { ...prev, endPoint: point } : null
        );
      }
    },
    [isDrawing, currentStroke, tool, getPoint]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentStroke) return;
    setStrokes((prev) => [...prev, currentStroke]);
    setRedoStack([]);
    setCurrentStroke(null);
    setIsDrawing(false);
  }, [isDrawing, currentStroke]);

  const handleUndoLocal = useCallback(() => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
    onUndo();
  }, [strokes, onUndo]);

  const handleRedoLocal = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes((prev) => [...prev, last]);
    onRedo();
  }, [redoStack, onRedo]);

  // Expose undo/redo to parent
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.__canvasUndo = handleUndoLocal;
    w.__canvasRedo = handleRedoLocal;
  }, [handleUndoLocal, handleRedoLocal]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 z-40"
      style={{
        cursor: tool
          ? tool === "text"
            ? "text"
            : "crosshair"
          : "default",
        pointerEvents: tool ? "auto" : "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
