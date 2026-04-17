import type { ContractData, PaymentMode, PropertyType } from '../types/contract';

export function isVehicleProperty(pt: PropertyType): boolean {
  return pt === 'carro' || pt === 'moto';
}

function nonEmpty(s: string | undefined): boolean {
  return Boolean(s && String(s).trim());
}

const periodicidadeLabel: Record<string, string> = {
  mensal: 'mensal',
  bimestral: 'bimestral',
  trimestral: 'trimestral',
};

/** Texto corrido para a cláusula de pagamento no contrato */
export function buildPaymentClauseText(data: ContractData): string {
  const mode: PaymentMode = data.paymentMode;
  const total = data.totalValue || 'valor total ajustado';

  if (mode === 'a_vista') {
    const v = data.paymentCash.amount || '___________';
    return (
      `Pagamento à vista, no valor de ${v}, em moeda corrente nacional, ` +
      `na forma e prazo acordados entre as partes na assinatura deste instrumento, ` +
      `referente ao valor total de ${total}.`
    );
  }

  if (mode === 'financiamento') {
    const f = data.paymentFinancing;
    const parts: string[] = [];
    parts.push('Pagamento mediante financiamento bancário ou com instituição financeira.');
    if (nonEmpty(f.institution)) parts.push(`Instituição credora: ${f.institution}.`);
    if (nonEmpty(f.downPayment)) parts.push(`Entrada (sinal/entrada): ${f.downPayment}.`);
    if (nonEmpty(f.financedAmount)) parts.push(`Valor financiado / liberado: ${f.financedAmount}.`);
    if (nonEmpty(f.prazoMeses)) parts.push(`Prazo de amortização: ${f.prazoMeses} meses.`);
    if (nonEmpty(f.taxaJurosAa))
      parts.push(`Taxa de juros (referencial): ${f.taxaJurosAa}% ao ano.`);
    if (f.amortizationSystem === 'price') parts.push('Sistema de amortização: Tabela Price.');
    if (f.amortizationSystem === 'sac') parts.push('Sistema de amortização: SAC.');
    if (nonEmpty(f.valorParcela))
      parts.push(`Valor previsto da prestação mensal: ${f.valorParcela}.`);
    if (nonEmpty(f.cetAa))
      parts.push(`CET — Custo Efetivo Total (referência): ${f.cetAa}% ao ano.`);
    if (nonEmpty(f.numeroContratoCredito))
      parts.push(`Contrato de crédito / referência: ${f.numeroContratoCredito}.`);
    if (f.usesFgts === 'sim' && !isVehicleProperty(data.propertyType))
      parts.push('Com utilização de FGTS, nos termos da legislação vigente, quando aplicável.');
    if (f.seguroPrestamista === 'sim')
      parts.push('Inclui seguro prestamista / proteção financeira, conforme proposta da instituição.');
    if (nonEmpty(f.guaranteeObservations)) parts.push(f.guaranteeObservations);
    parts.push(
      `O valor total do negócio é de ${total}. As partes declaram ciência de que encargos, tarifas, ` +
        `impostos e seguros podem integrar o fluxo do financiamento, conforme contrato firmado junto ao credor.`
    );
    return parts.join(' ');
  }

  const p = data.paymentSellerInstallments;
  const bits: string[] = [];
  bits.push('Pagamento parcelado diretamente ao VENDEDOR, sem intermediação bancária neste instrumento.');
  if (nonEmpty(p.entrada)) bits.push(`Entrada: ${p.entrada}.`);
  if (nonEmpty(p.numeroParcelas) && nonEmpty(p.valorParcela)) {
    bits.push(
      `Saldo dividido em ${p.numeroParcelas} parcelas de ${p.valorParcela} cada.`
    );
  } else if (nonEmpty(p.valorParcela)) {
    bits.push(`Valor de cada parcela: ${p.valorParcela}.`);
  }
  if (nonEmpty(p.primeiroVencimento))
    bits.push(`Data do primeiro vencimento: ${formatBrDate(p.primeiroVencimento)}.`);
  if (nonEmpty(p.diaVencimento))
    bits.push(`Demais vencimentos no dia ${p.diaVencimento} de cada mês.`);
  if (p.periodicidade && p.periodicidade !== 'mensal') {
    bits.push(`Periodicidade: ${periodicidadeLabel[p.periodicidade] ?? p.periodicidade}.`);
  }
  if (nonEmpty(p.observations)) bits.push(p.observations);
  bits.push(`Valor total do negócio: ${total}.`);
  return bits.join(' ');
}

function formatBrDate(iso: string): string {
  if (!iso) return iso;
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
