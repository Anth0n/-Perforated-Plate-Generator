import React from 'react';
import { PlateConfig, Language, Theme } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Download, RefreshCw, Grid, Settings2, Sliders, Moon, Sun, Globe } from 'lucide-react';

interface SidebarProps {
  config: PlateConfig;
  setConfig: React.Dispatch<React.SetStateAction<PlateConfig>>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  processing: boolean;
  dotCount: number;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
    <div className="relative group">
      <input
        type="number"
        value={value}
        onChange={(e) => {
             // Enforce validation here as well as rendering
             let val = Number(e.target.value);
             if (max && val > max) val = max;
             onChange(val);
        }}
        min={min}
        max={max}
        step={step}
        className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-bold text-slate-900 dark:text-white transition-all placeholder-slate-400 shadow-sm"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold bg-white dark:bg-slate-800 pl-1">mm</span>
      </div>
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({
  config,
  setConfig,
  onImageUpload,
  onExport,
  processing,
  dotCount,
  language,
  setLanguage,
  theme,
  setTheme
}) => {
  const t = TRANSLATIONS[language];

  const handleChange = (key: keyof PlateConfig, value: number | boolean) => {
    // Limit width/height to 3 digits (max 999)
    if ((key === 'width' || key === 'height') && typeof value === 'number') {
        if (value > 999) value = 999;
    }
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full md:w-80 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full overflow-y-auto flex flex-col shadow-xl z-20 transition-colors duration-300">
      
      {/* Header */}
      <div className="p-6 bg-slate-900 dark:bg-black text-white flex justify-between items-start">
        <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
            <Grid className="w-6 h-6 text-blue-400" />
            {t.appTitle}
            </h1>
            <p className="text-slate-400 text-xs mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Switch Language"
            >
                <Globe className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Switch Theme"
            >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-8">
        
        {/* Upload Section */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4" /> {t.uploadTitle}
          </label>
          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-colors bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t.uploadPlaceholder}</span>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            <Settings2 className="w-4 h-4" /> {t.dimensionsTitle}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <NumberInput 
                label={t.width} 
                value={config.width} 
                max={999} 
                onChange={(v) => handleChange('width', v)} 
            />
            <NumberInput 
                label={t.height} 
                value={config.height} 
                max={999}
                onChange={(v) => handleChange('height', v)} 
            />
          </div>
          
          <NumberInput 
            label={t.margin} 
            value={config.margin} 
            onChange={(v) => handleChange('margin', v)} 
          />
        </div>

        {/* Pattern Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            <Sliders className="w-4 h-4" /> {t.patternTitle}
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
            <label className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
              <span>{t.spacing}</span>
              <span className="text-blue-600 dark:text-blue-400">{config.spacing} mm</span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={config.spacing}
              onChange={(e) => handleChange('spacing', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <NumberInput 
                label={t.minHole} 
                value={config.minHoleSize} 
                step={0.1}
                min={0}
                onChange={(v) => handleChange('minHoleSize', v)} 
            />
             <NumberInput 
                label={t.maxHole} 
                value={config.maxHoleSize} 
                step={0.1}
                min={0.1}
                onChange={(v) => handleChange('maxHoleSize', v)} 
            />
          </div>

          <div className="flex items-center justify-between py-3 px-1 border-t border-dashed border-slate-200 dark:border-slate-600 mt-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.invert}</label>
            <button
              onClick={() => handleChange('inverted', !config.inverted)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                config.inverted ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  config.inverted ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">{t.statsTitle}</h3>
            <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">{t.totalHoles}:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-200">{dotCount.toLocaleString()}</span>
            </div>
             <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">{t.openArea}:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-200">~{(Math.PI * Math.pow((config.minHoleSize + config.maxHoleSize)/4, 2) * dotCount / (config.width * config.height) * 100).toFixed(1)}%</span>
            </div>
             <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-600">
                <span className="text-slate-600 dark:text-slate-400">{t.finalSize}:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                    {Math.round(config.width)} x {Math.round(config.height)} mm
                </span>
            </div>
        </div>

      </div>

      <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onExport}
          disabled={processing || dotCount === 0}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:dark:bg-slate-700 disabled:dark:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-sm active:scale-[0.98]"
        >
          {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {t.export}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;