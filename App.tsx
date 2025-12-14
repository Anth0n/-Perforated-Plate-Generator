import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlateConfig, Dot, Language, Theme } from './types';
import Sidebar from './components/Sidebar';
import PreviewCanvas from './components/PreviewCanvas';
import { TRANSLATIONS } from './constants';

const DEFAULT_CONFIG: PlateConfig = {
  width: 500, // 50cm
  height: 500, // 50cm
  spacing: 8, // 8mm pitch
  minHoleSize: 1, // 1mm
  maxHoleSize: 6, // 6mm
  margin: 10,
  inverted: false,
  threshold: 128,
  shape: 'circle',
};

const App: React.FC = () => {
  const [config, setConfig] = useState<PlateConfig>(DEFAULT_CONFIG);
  const [dots, setDots] = useState<Dot[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Global Settings
  const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese
  const [theme, setTheme] = useState<Theme>('light');

  const t = TRANSLATIONS[language];
  
  // Hidden canvas for image processing
  const processCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const processIdRef = useRef(0); 

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Processing Logic
  const processImage = useCallback(() => {
    if (!processCanvasRef.current || !imageSrc) return;
    
    const currentProcessId = ++processIdRef.current;
    
    setProcessing(true);
    setProgress(0);
    
    const img = imageRef.current;
    if (img.src !== imageSrc) {
        img.src = imageSrc;
    }

    img.onload = () => {
        if (processIdRef.current !== currentProcessId) return;

        const canvas = processCanvasRef.current!;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) return;

        const effW = Math.max(0, config.width - (config.margin * 2));
        const effH = Math.max(0, config.height - (config.margin * 2));
        
        if (effW <= 0 || effH <= 0) {
            setDots([]);
            setProcessing(false);
            return;
        }

        const cols = Math.floor(effW / config.spacing);
        const rows = Math.floor(effH / config.spacing);
        
        canvas.width = cols;
        canvas.height = rows;
        
        ctx.imageSmoothingEnabled = true; 
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, cols, rows);

        const imageData = ctx.getImageData(0, 0, cols, rows);
        const data = imageData.data;
        
        const newDots: Dot[] = [];
        const radiusRange = (config.maxHoleSize - config.minHoleSize) / 2;
        const minRad = config.minHoleSize / 2;
        
        let y = 0;
        const CHUNK_TIME_MS = 12;

        const processChunk = () => {
            if (processIdRef.current !== currentProcessId) return;

            const startTime = performance.now();

            while (y < rows) {
                if (performance.now() - startTime > CHUNK_TIME_MS) {
                    setProgress(Math.round((y / rows) * 100));
                    requestAnimationFrame(processChunk);
                    return;
                }

                for (let x = 0; x < cols; x++) {
                    const idx = (y * cols + x) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];

                    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                    let norm = luminance / 255;
                    
                    if (config.inverted) {
                        norm = 1 - norm;
                    }
                    
                    const sizeFactor = 1 - norm;
                    const radius = minRad + (sizeFactor * radiusRange);

                    const physX = config.margin + (x * config.spacing) + (config.spacing / 2);
                    const physY = config.margin + (y * config.spacing) + (config.spacing / 2);

                    if (radius > 0.1) {
                        newDots.push({ x: physX, y: physY, r: radius });
                    }
                }
                y++;
            }

            setDots(newDots);
            setProcessing(false);
            setProgress(100);
        };

        processChunk();
    };

    if (img.complete) {
        img.onload(new Event('load'));
    }

  }, [imageSrc, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (imageSrc) {
            processImage();
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [processImage, imageSrc, config]);

  // Export SVG with detailed filename
  const handleExport = () => {
    if (dots.length === 0) return;
    
    const finalWidth = config.width;
    const finalHeight = config.height;

    const svgContent = `
<svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="${finalWidth}mm" 
    height="${finalHeight}mm" 
    viewBox="0 0 ${finalWidth} ${finalHeight}"
>
    <!-- Created with PerfoMate -->
    <rect x="0" y="0" width="${finalWidth}" height="${finalHeight}" fill="none" stroke="black" stroke-width="0.5" />
    <g fill="black">
        ${dots.map(d => `<circle cx="${(d.x).toFixed(2)}" cy="${(d.y).toFixed(2)}" r="${(d.r).toFixed(2)}" />`).join('')}
    </g>
</svg>`.trim();

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Filename: plate_{W}x{H}_p{spacing}_d{min}-{max}_{timestamp}.svg
    const timestamp = Math.floor(Date.now() / 1000);
    const filename = `plate_${config.width}x${config.height}_p${config.spacing}_d${config.minHoleSize}-${config.maxHoleSize}_${timestamp}.svg`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex h-screen w-screen flex-col md:flex-row overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'}`}>
      
      <canvas ref={processCanvasRef} className="hidden" />

      <Sidebar 
        config={config} 
        setConfig={setConfig} 
        onImageUpload={handleImageUpload}
        onExport={handleExport}
        processing={processing}
        dotCount={dots.length}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />

      <div className="flex-1 relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        {!imageSrc ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center pointer-events-none">
                <div className="w-24 h-24 border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center mb-4">
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-700 rounded-full mx-1"></div>
                    <div className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-full mx-1"></div>
                    <div className="w-4 h-4 bg-slate-300 dark:bg-slate-700 rounded-full mx-1"></div>
                </div>
                <h2 className="text-2xl font-bold mb-2">{t.readyTitle}</h2>
                <p>{t.readyDesc}</p>
            </div>
        ) : null}
        
        <PreviewCanvas dots={dots} config={config} theme={theme} language={language} />
        
        {processing && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-opacity">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 border border-slate-100 dark:border-slate-700">
                     <div className="relative w-16 h-16">
                         <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-700 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                     </div>
                     <div className="text-center">
                         <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{t.generating}</h3>
                         <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{progress}%</p>
                     </div>
                     <div className="w-48 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-100 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                     </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;