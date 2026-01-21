import React, { useRef, useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DocumentPreview({
  document,
  selectedHighlightId,
  onHighlightClick,
}) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [hoveredHighlight, setHoveredHighlight] = useState(null);

  // Percentage-based highlight coordinates for X Construction invoice
  const highlights = {
    vendor_name: { left: 6, top: 23.5, width: 25, height: 3, confidence: 98 },
    invoice_no: { left: 62, top: 13.5, width: 32, height: 2, confidence: 99 },
    invoice_date: { left: 62, top: 16, width: 32, height: 2, confidence: 99 },
    bill_to: { left: 51, top: 23.5, width: 28, height: 3, confidence: 97 },
    line_item_0: { left: 7, top: 42.5, width: 86, height: 3.2, confidence: 95 },
    line_item_1: { left: 7, top: 46.2, width: 86, height: 3.2, confidence: 96 },
    line_item_2: { left: 7, top: 49.9, width: 86, height: 3.2, confidence: 94 },
    line_item_3: { left: 7, top: 53.6, width: 86, height: 3.2, confidence: 97 },
    subtotal: { left: 60, top: 57.5, width: 33, height: 2.5, confidence: 99 },
    tax: { left: 60, top: 60.3, width: 33, height: 2.5, confidence: 99 },
    grand_total: {
      left: 60,
      top: 63.1,
      width: 33,
      height: 2.5,
      confidence: 99,
    },
  };

  // Auto-scroll to selected highlight
  useEffect(() => {
    if (selectedHighlightId && containerRef.current && imageRef.current) {
      const highlight = highlights[selectedHighlightId];
      if (highlight) {
        const container = containerRef.current;
        const image = imageRef.current;
        const imageHeight = image.clientHeight;

        // Calculate the absolute position of the highlight center
        const highlightCenterY =
          (highlight.top / 100) * imageHeight +
          ((highlight.height / 100) * imageHeight) / 2;
        const containerHeight = container.clientHeight;

        // Scroll to center the highlight in the viewport
        const scrollTop = highlightCenterY - containerHeight / 2;
        container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
      }
    }
  }, [selectedHighlightId, highlights]);

  return (
    <TooltipProvider>
      <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden h-full">
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700">
            Document Preview
          </span>
          <span className="text-xs text-slate-500">{document?.source}</span>
        </div>

        <div
          ref={containerRef}
          className="overflow-auto h-[calc(100%-40px)] p-4"
        >
          {/* Document Image Container - Responsive */}
          <div
            className="relative bg-white shadow-lg mx-auto"
            style={{ maxWidth: "100%" }}
          >
            {/* Real Document Image */}
            <img
              ref={imageRef}
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695565823d5de6cb79ac9cec/f9b978ce7_5b650276-1deb-4fa5-adee-a0b8b935cb37.png"
              alt="Invoice Document"
              className="w-full h-auto block"
              style={{ userSelect: "none" }}
            />

            {/* Bounding Box Overlays */}
            {Object.entries(highlights).map(([highlightId, highlight]) => {
              const isActive = selectedHighlightId === highlightId;
              const isHovered = hoveredHighlight === highlightId;

              return (
                <Tooltip key={highlightId}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onHighlightClick(highlightId)}
                      onMouseEnter={() => setHoveredHighlight(highlightId)}
                      onMouseLeave={() => setHoveredHighlight(null)}
                      className="absolute transition-all cursor-pointer"
                      style={{
                        left: `${highlight.left}%`,
                        top: `${highlight.top}%`,
                        width: `${highlight.width}%`,
                        height: `${highlight.height}%`,
                        border: isActive
                          ? "2.5px solid #fbbf24"
                          : isHovered
                          ? "1.5px solid rgba(251, 191, 36, 0.6)"
                          : "1px solid rgba(251, 191, 36, 0.1)",
                        backgroundColor: isActive
                          ? "rgba(254, 243, 199, 0.35)"
                          : isHovered
                          ? "rgba(254, 243, 199, 0.15)"
                          : "rgba(254, 243, 199, 0.02)",
                        zIndex: isActive ? 20 : isHovered ? 10 : 1,
                        boxShadow: isActive
                          ? "0 0 0 3px rgba(251, 191, 36, 0.25), 0 4px 12px rgba(251, 191, 36, 0.2)"
                          : "none",
                        animation: isActive
                          ? "pulseHighlight 0.25s ease-out"
                          : "none",
                        pointerEvents: "auto",
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>Extracted by Visual AI</span>
                      <span className="text-emerald-600 font-medium">
                        • {highlight.confidence}%
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <style>{`
          @keyframes pulseHighlight {
            0% { 
              transform: scale(1);
              opacity: 0.8;
            }
            50% { 
              transform: scale(1.03);
              opacity: 1;
            }
            100% { 
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}
