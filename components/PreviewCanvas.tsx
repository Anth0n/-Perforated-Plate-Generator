import React, { useRef, useEffect, useState } from 'react';
import { Dot, PlateConfig, ViewState, Theme, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';

interface PreviewCanvasProps {
  dots: Dot[];
  config: PlateConfig;
  theme: Theme;
  language: Language;
  className?: string;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ dots, config, theme, language, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const t = TRANSLATIONS[language];

  // Initial center logic
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = (clientWidth - 80) / config.width;
      const scaleY = (clientHeight - 80) / config.height;
      const fitScale = Math.min(scaleX, scaleY, 5); 

      setView({
        scale: fitScale > 0 ? fitScale : 1,
        offsetX: (clientWidth - config.width * (fitScale > 0 ? fitScale : 1)) / 2,
        offsetY: (clientHeight - config.height * (fitScale > 0 ? fitScale : 1)) / 2
      });
    }
  }, [config.width, config.height]); 

  // Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { clientWidth, clientHeight } = containerRef.current;
    
    if (canvas.width !== clientWidth * dpr || canvas.height !== clientHeight * dpr) {
        canvas.width = clientWidth * dpr;
        canvas.height = clientHeight * dpr;
    }
    
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.scale(dpr, dpr);
    canvas.style.width = `${clientWidth}px`;
    canvas.style.height = `${clientHeight}px`;

    // Define colors based on theme
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0f172a' : '#f8fafc'; // slate-900 : slate-50
    const plateColor = isDark ? '#334155' : '#cbd5e1'; // slate-700 : slate-300
    const holeColor = isDark ? '#000000' : '#0f172a'; // black : slate-900
    const borderColor = isDark ? '#475569' : '#64748b'; // slate-600 : slate-500
    const shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)';

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, clientWidth, clientHeight);

    ctx.save();
    ctx.translate(view.offsetX, view.offsetY);
    ctx.scale(view.scale, view.scale);

    // 1. Draw Plate Metal Background
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 20 / view.scale;
    ctx.shadowOffsetY = 10 / view.scale;
    
    ctx.fillStyle = plateColor; 
    ctx.fillRect(0, 0, config.width, config.height);
    
    ctx.shadowColor = 'transparent'; 

    // 2. Draw Holes
    ctx.fillStyle = holeColor; 
    
    // Viewport Culling
    const visibleMinX = -view.offsetX / view.scale;
    const visibleMinY = -view.offsetY / view.scale;
    const visibleMaxX = (clientWidth - view.offsetX) / view.scale;
    const visibleMaxY = (clientHeight - view.offsetY) / view.scale;

    const maxR = config.maxHoleSize / 2;
    const padMinX = visibleMinX - maxR;
    const padMaxX = visibleMaxX + maxR;
    const padMinY = visibleMinY - maxR;
    const padMaxY = visibleMaxY + maxR;

    ctx.beginPath();
    
    for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        if (dot.y > padMaxY) break; 
        if (dot.y < padMinY) continue;
        if (dot.x < padMinX || dot.x > padMaxX) continue;

        ctx.moveTo(dot.x + dot.r, dot.y);
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    }
    ctx.fill();

    // 3. Draw Border Line
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1 / view.scale; 
    ctx.strokeRect(0, 0, config.width, config.height);

    ctx.restore();

  }, [dots, config, view, theme]);

  // Event Handlers
  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = -e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(50, view.scale * (1 + zoomFactor)));
    setView(prev => ({
        ...prev,
        scale: newScale
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - view.offsetX, y: e.clientY - view.offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setView(prev => ({
        ...prev,
        offsetX: e.clientX - dragStart.x,
        offsetY: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom Controls
  const zoomIn = () => setView(p => ({ ...p, scale: p.scale * 1.2 }));
  const zoomOut = () => setView(p => ({ ...p, scale: p.scale / 1.2 }));
  const resetView = () => {
     if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const fitScale = Math.min((clientWidth - 80) / config.width, (clientHeight - 80) / config.height, 5);
      setView({
        scale: fitScale,
        offsetX: (clientWidth - config.width * fitScale) / 2,
        offsetY: (clientHeight - config.height * fitScale) / 2
      });
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-900 cursor-grab ${isDragging ? 'cursor-grabbing' : ''} ${className}`}>
      
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm rounded-full px-4 py-2 flex items-center gap-4 z-10 transition-colors">
        <button onClick={zoomOut} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors" title={t.zoomOut}>
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-12 text-center">
          {Math.round(view.scale * 100)}%
        </span>
        <button onClick={zoomIn} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors" title={t.zoomIn}>
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button onClick={resetView} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors" title={t.fitScreen}>
          <Maximize className="w-5 h-5" />
        </button>
      </div>
      
      <div className="absolute top-4 left-4 z-10 text-xs font-mono text-slate-400 dark:text-slate-500 pointer-events-none select-none">
        <div className="flex items-center gap-1"><Move className="w-3 h-3"/> {t.dragPan}</div>
        <div>{t.scrollZoom}</div>
      </div>

      <div ref={containerRef} className="w-full h-full">
          <canvas
            ref={canvasRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block touch-none"
          />
      </div>
    </div>
  );
};

export default PreviewCanvas;