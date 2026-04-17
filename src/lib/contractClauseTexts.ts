import type { ContractData, DocumentKind, PropertyType } from '../types/contract';

export const propertyTypeLabel: Record<string, string> = {
  terreno: 'Terreno',
  casa: 'Casa Residencial',
  kitnet: 'Kitnet',
  apartamento: 'Apartamento',
  comercial: 'Imóvel Comercial',
  moto: 'Moto',
  carro: 'Carro',
};

export function formatDateBr(dateStr: string) {
  if (!dateStr) return '___/___/______';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function docLabel(kind: DocumentKind) {
  return kind === 'cpf' ? 'CPF' : 'CNPJ';
}

export function buyerDeathText(data: ContractData) {
  if (data.buyerDeathClause === 'herdeiros')
    return 'os herdeiros legais do COMPRADOR assumirão integralmente as obrigações deste contrato, mantendo-o em pleno vigor';
  if (data.buyerDeathClause === 'vendedor')
    return (
      'este contrato ficará automaticamente rescindido, com devolução do imóvel ao VENDEDOR e restituição dos valores pagos ao espólio do COMPRADOR, deduzida a multa de ' +
      data.penaltyPercentage +
      '%'
    );
  return data.buyerDeathCustom || '______________________________';
}

export function sellerDeathText(data: ContractData) {
  if (data.sellerDeathClause === 'herdeiros_comprador')
    return 'os herdeiros do VENDEDOR ficam obrigados a honrar integralmente as condições deste contrato, efetuando a transferência do imóvel nas mesmas condições pactuadas';
  if (data.sellerDeathClause === 'devolucao')
    return 'este contrato ficará automaticamente rescindido, com obrigação dos herdeiros de restituir ao COMPRADOR todos os valores pagos, corrigidos monetariamente, no prazo de 60 (sessenta) dias';
  return data.sellerDeathCustom || '______________________________';
}

export function propertyLabel(pt: PropertyType): string {
  return propertyTypeLabel[pt] || pt;
}
