import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

let fontsReady = false;

/** Registra fontes Roboto (necessário no browser antes de createPdf). */
export function ensurePdfMakeFonts(): void {
  if (fontsReady) return;
  // vfs_fonts exporta o mapa de arquivos; pdfmake 0.3 usa addVirtualFileSystem
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfMake as any).addVirtualFileSystem(pdfFonts);
  fontsReady = true;
}

export { pdfMake };
