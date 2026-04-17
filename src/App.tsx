import { useLayoutEffect, useRef, useState } from 'react';
import { FileText, Eye, X } from 'lucide-react';
import ContractForm from './components/ContractForm';
import ContractPreview from './components/ContractPreview';
import { ContractData, emptyContractData } from './types/contract';

const PREVIEW_PAD = 24;

function ScaledContractPreview({
  data,
  viewportHeight,
}: {
  data: ContractData;
  viewportHeight: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: 0.35, w: 794, h: 1123 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const update = () => {
      const cw = Math.max(1, container.clientWidth - PREVIEW_PAD);
      const ch = Math.max(1, container.clientHeight - PREVIEW_PAD);
      const w = content.offsetWidth;
      const h = content.offsetHeight;
      if (!w || !h) return;
      const scale = Math.min(cw / w, ch / h, 1) * 0.98;
      setLayout((prev) => {
        if (
          Math.abs(prev.scale - scale) < 0.001 &&
          prev.w === w &&
          prev.h === h
        ) {
          return prev;
        }
        return { scale, w, h };
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, [data]);

  const { scale, w, h } = layout;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden bg-gray-100 flex items-center justify-center p-3"
      style={{ height: viewportHeight }}
    >
      <div
        className="rounded-sm shadow-md ring-1 ring-black/5 bg-white"
        style={{
          width: w * scale,
          height: h * scale,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <ContractPreview ref={contentRef} data={data} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<ContractData>(emptyContractData);
  const [showPreview, setShowPreview] = useState(false);
  const handleGenerate = () => {
    setShowPreview(true);
  };

  const handleExportPdf = async () => {
    const { downloadContractPdf } = await import('./lib/generateContractPdf');
    downloadContractPdf(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              Contratos Imobiliários
            </h1>
            <p className="text-xs text-gray-400">Gerador de Contrato de Compra e Venda</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <ContractForm data={data} onChange={setData} onGenerate={handleGenerate} />
        </div>

        <div className="hidden lg:block sticky top-24">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <Eye size={15} />
                Pré-visualização
              </div>
              <span className="text-xs text-gray-400">Ao vivo</span>
            </div>
            <ScaledContractPreview data={data} viewportHeight="min(72vh, 1200px)" />
          </div>
        </div>
      </main>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white sm:rounded-2xl shadow-2xl flex flex-col w-full h-[100dvh] sm:h-auto sm:max-w-4xl sm:max-h-[95vh]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Contrato Gerado</h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Baixar PDF
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-hidden flex-1 bg-gray-100">
              <ScaledContractPreview
                data={data}
                viewportHeight="calc(100dvh - 108px)"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
