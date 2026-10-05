import React, { useState, useMemo } from 'react';
import {
  Play,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';

export const SandboxedPreviewModal: React.FC = () => {
  const { files, activeProject } = useProjectStore();
  const [deviceWidth, setDeviceWidth] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [reloadKey, setReloadKey] = useState(0);

  // Compile bundled HTML
  const bundledHtml = useMemo(() => {
    const htmlFile = files.find((f) => f.path.toLowerCase().endsWith('.html')) || files.find((f) => f.path.toLowerCase() === 'index.html');
    const cssFile = files.find((f) => f.path.toLowerCase().endsWith('.css'));
    const jsFile = files.find((f) => f.path.toLowerCase().endsWith('.js'));

    let htmlContent = htmlFile?.content || `<!DOCTYPE html><html><body><h1>No HTML file found</h1><p>Ask your bots to create index.html in the Memory Box.</p></body></html>`;

    // Inject CSS if available
    if (cssFile && cssFile.content) {
      const styleTag = `<style>\n${cssFile.content}\n</style>`;
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
      } else {
        htmlContent = `${styleTag}\n${htmlContent}`;
      }
    }

    // Inject JS if available
    if (jsFile && jsFile.content) {
      const scriptTag = `<script>\n${jsFile.content}\n</script>`;
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        htmlContent = `${htmlContent}\n${scriptTag}`;
      }
    }

    return htmlContent;
  }, [files]);

  const widthClasses = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 flex flex-col h-[calc(100vh-80px)]">
      {/* Top Preview Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 mb-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wide font-mono">
            Sandboxed Live Preview
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Isolated Sandbox (No Host Storage Access)
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDeviceWidth('desktop')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              deviceWidth === 'desktop'
                ? 'bg-slate-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Desktop</span>
          </button>
          <button
            onClick={() => setDeviceWidth('tablet')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              deviceWidth === 'tablet'
                ? 'bg-slate-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet view (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Tablet</span>
          </button>
          <button
            onClick={() => setDeviceWidth('mobile')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              deviceWidth === 'mobile'
                ? 'bg-slate-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile view (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Mobile</span>
          </button>
        </div>

        {/* Reload Preview button */}
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center p-2 overflow-hidden shadow-2xl relative">
        <div
          className={`h-full ${widthClasses[deviceWidth]} transition-all duration-300 bg-white rounded-xl overflow-hidden shadow-xl`}
        >
          <iframe
            key={reloadKey}
            title="Sandboxed Application Preview"
            srcDoc={bundledHtml}
            // Strict sandbox: allow scripts, NO allow-same-origin (protects host keys and storage)
            sandbox="allow-scripts"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
