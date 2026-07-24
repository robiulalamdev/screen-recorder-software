import { useRef, useState, useEffect, useCallback } from "react";

type Shape = "circle" | "rounded" | "square";

interface CameraOverlayProps {
  visible: boolean;
  shape: Shape;
  onShapeChange: (shape: Shape) => void;
  onToggle: () => void;
}

export default function CameraOverlay({
  visible,
  shape,
  onShapeChange,
  onToggle,
}: CameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState(160);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    if (visible && !stream) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 640, height: 480 } })
        .then((s) => {
          if (cancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {
          // Camera not available
        });
    }
    return () => {
      cancelled = true;
      if (stream && !visible) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    };
  }, [visible]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      posStart.current = { ...position };
    },
    [position]
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({ x: posStart.current.x + dx, y: posStart.current.y + dy });
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handleResizeMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizing) return;
      const dx = e.clientX - dragStart.current.x;
      const newSize = Math.max(80, Math.min(400, size + dx));
      setSize(newSize);
    },
    [isResizing, size]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      const handleMove = (e: MouseEvent) => {
        if (isDragging) {
          const dx = e.clientX - dragStart.current.x;
          const dy = e.clientY - dragStart.current.y;
          setPosition({ x: posStart.current.x + dx, y: posStart.current.y + dy });
        }
        if (isResizing) {
          const dx = e.clientX - dragStart.current.x;
          const newSize = Math.max(80, Math.min(400, size + dx));
          setSize(newSize);
        }
      };
      const handleUp = () => {
        setIsDragging(false);
        setIsResizing(false);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }
  }, [isDragging, isResizing, size]);

  if (!visible) return null;

  const borderRadius =
    shape === "circle" ? "50%" : shape === "rounded" ? "16px" : "4px";

  return (
    <div
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="relative cursor-move overflow-hidden border-2 border-zinc-600"
        style={{
          width: size,
          height: size,
          borderRadius,
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ borderRadius }}
        />

        {/* Controls overlay */}
        <div className="absolute top-1 right-1 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-5 h-5 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Shape selector */}
        <div className="absolute bottom-1 left-1 flex gap-1">
          {(["circle", "rounded", "square"] as Shape[]).map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                onShapeChange(s);
              }}
              className={`w-5 h-5 flex items-center justify-center ${
                shape === s ? "bg-white/30" : "bg-black/30 hover:bg-black/50"
              }`}
              style={{
                borderRadius: s === "circle" ? "50%" : s === "rounded" ? "4px" : "2px",
              }}
            >
              <div
                className="w-2.5 h-2.5 border border-white"
                style={{
                  borderRadius: s === "circle" ? "50%" : s === "rounded" ? "2px" : "0",
                }}
              />
            </button>
          ))}
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
          onMouseMove={handleResizeMove}
          onMouseUp={handleResizeEnd}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-50">
            <path d="M21 15v6h-6" /><path d="m21 21-7.5-7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
