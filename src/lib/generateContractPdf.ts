import type { ContractData } from '../types/contract';
import { buildContractPdfDefinition } from './contractPdfDefinition';
import { ensurePdfMakeFonts, pdfMake } from './pdfmakeInit';

const DEFAULT_NAME = 'contrato-compra-venda.pdf';

export function downloadContractPdf(data: ContractData, filename: string = DEFAULT_NAME): void {
  ensurePdfMakeFonts();
  const doc = buildContractPdfDefinition(data);
  pdfMake.createPdf(doc).download(filename);
}

/** Abre o PDF numa nova aba (visualizar antes de imprimir pelo leitor de PDF). */
export function openContractPdf(data: ContractData): void {
  ensurePdfMakeFonts();
  const doc = buildContractPdfDefinition(data);
  pdfMake.createPdf(doc).open();
}
