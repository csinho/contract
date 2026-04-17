export type PropertyType =
  | 'terreno'
  | 'casa'
  | 'kitnet'
  | 'apartamento'
  | 'comercial'
  | 'moto'
  | 'carro';

/** CPF (pessoa física) ou CNPJ (pessoa jurídica) */
export type DocumentKind = 'cpf' | 'cnpj';

/** Forma principal de quitação do preço */
export type PaymentMode = 'a_vista' | 'financiamento' | 'parcelamento';

export interface Person {
  documentKind: DocumentKind;
  name: string;
  /** CPF ou CNPJ mascarado, conforme documentKind */
  cpf: string;
  rg: string;
  address: string;
  city: string;
  state: string;
}

export interface Witness {
  documentKind: DocumentKind;
  name: string;
  cpf: string;
}

/** À vista: valor pago de uma vez */
export interface PaymentCashDetails {
  amount: string;
}

/**
 * Financiamento com instituição financeira (imóvel, veículo, etc.).
 * Campos alinhados a contratos típicos de crédito imobiliário / CDC veículos no Brasil.
 */
export interface PaymentFinancingDetails {
  institution: string;
  /** Entrada / sinal pago ou a pagar */
  downPayment: string;
  /** Valor líquido financiado */
  financedAmount: string;
  prazoMeses: string;
  /** Taxa de juros nominal anual (%) */
  taxaJurosAa: string;
  amortizationSystem: '' | 'price' | 'sac';
  /** Prestação mensal prevista */
  valorParcela: string;
  /** CET anual (%) — custo efetivo total */
  cetAa: string;
  /** Nº do contrato de crédito / cédula */
  numeroContratoCredito: string;
  /** FGTS: relevante principalmente para imóvel */
  usesFgts: 'nao' | 'sim';
  seguroPrestamista: 'nao' | 'sim';
  /** Observações sobre alienação fiduciária / hipoteca / gravame */
  guaranteeObservations: string;
}

/**
 * Parcelamento direto com o vendedor (sem banco).
 */
export interface PaymentSellerInstallmentsDetails {
  entrada: string;
  numeroParcelas: string;
  valorParcela: string;
  primeiroVencimento: string;
  /** Dia fixo do mês para demais parcelas (1–31) */
  diaVencimento: string;
  periodicidade: 'mensal' | 'bimestral' | 'trimestral';
  observations: string;
}

export interface ContractData {
  propertyType: PropertyType;
  propertyCep: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyArea: string;
  registryNumber: string;
  totalValue: string;
  paymentMode: PaymentMode;
  paymentCash: PaymentCashDetails;
  paymentFinancing: PaymentFinancingDetails;
  paymentSellerInstallments: PaymentSellerInstallmentsDetails;
  signatureCity: string;
  signatureDate: string;
  seller: Person;
  buyer: Person;
  witnesses: [Witness, Witness];
  penaltyPercentage: string;
  buyerDeathClause: 'herdeiros' | 'vendedor' | 'outro';
  buyerDeathCustom: string;
  sellerDeathClause: 'herdeiros_comprador' | 'devolucao' | 'outro';
  sellerDeathCustom: string;
  additionalNotes: string;
}

export const emptyPaymentCash: PaymentCashDetails = {
  amount: '',
};

export const emptyPaymentFinancing: PaymentFinancingDetails = {
  institution: '',
  downPayment: '',
  financedAmount: '',
  prazoMeses: '',
  taxaJurosAa: '',
  amortizationSystem: '',
  valorParcela: '',
  cetAa: '',
  numeroContratoCredito: '',
  usesFgts: 'nao',
  seguroPrestamista: 'nao',
  guaranteeObservations: '',
};

export const emptyPaymentSellerInstallments: PaymentSellerInstallmentsDetails = {
  entrada: '',
  numeroParcelas: '',
  valorParcela: '',
  primeiroVencimento: '',
  diaVencimento: '',
  periodicidade: 'mensal',
  observations: '',
};

export const emptyContractData: ContractData = {
  propertyType: 'casa',
  propertyCep: '',
  propertyAddress: '',
  propertyCity: '',
  propertyState: '',
  propertyArea: '',
  registryNumber: '',
  totalValue: '',
  paymentMode: 'a_vista',
  paymentCash: { ...emptyPaymentCash },
  paymentFinancing: { ...emptyPaymentFinancing },
  paymentSellerInstallments: { ...emptyPaymentSellerInstallments },
  signatureCity: '',
  signatureDate: '',
  seller: {
    documentKind: 'cpf',
    name: '',
    cpf: '',
    rg: '',
    address: '',
    city: '',
    state: '',
  },
  buyer: {
    documentKind: 'cpf',
    name: '',
    cpf: '',
    rg: '',
    address: '',
    city: '',
    state: '',
  },
  witnesses: [
    { documentKind: 'cpf', name: '', cpf: '' },
    { documentKind: 'cpf', name: '', cpf: '' },
  ],
  penaltyPercentage: '50',
  buyerDeathClause: 'herdeiros',
  buyerDeathCustom: '',
  sellerDeathClause: 'herdeiros_comprador',
  sellerDeathCustom: '',
  additionalNotes: '',
};
