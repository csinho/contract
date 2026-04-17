import { formatMoneyBrlFromDigits, onlyDigits } from './brasilFormat';

export function moneyToCents(formatted: string): bigint {
  return BigInt(onlyDigits(formatted) || '0');
}

export function centsToMoneyString(cents: bigint): string {
  if (cents <= 0n) return '';
  return formatMoneyBrlFromDigits(cents.toString());
}

/** Converte string R$ para reais (número) com cuidado de precisão */
export function moneyStringToReais(formatted: string): number {
  return Number(moneyToCents(formatted)) / 100;
}

/**
 * Prestação constante — Tabela Price (taxa nominal anual, juros compostos mensais).
 */
export function installmentPriceReais(
  principalReais: number,
  months: number,
  annualNominalPercent: number
): number {
  const n = Math.max(1, Math.floor(months));
  if (principalReais <= 0 || !Number.isFinite(principalReais)) return 0;
  const i = annualNominalPercent / 100 / 12;
  if (i < 1e-15) return principalReais / n;
  const pow = Math.pow(1 + i, n);
  return (principalReais * i * pow) / (pow - 1);
}

/**
 * 1ª prestação SAC (amortização constante + juros sobre saldo devedor inicial).
 */
export function firstInstallmentSacReais(
  principalReais: number,
  months: number,
  annualNominalPercent: number
): number {
  const n = Math.max(1, Math.floor(months));
  if (principalReais <= 0 || !Number.isFinite(principalReais)) return 0;
  const i = annualNominalPercent / 100 / 12;
  const amort = principalReais / n;
  return amort + principalReais * i;
}

export function reaisToMoneyString(reais: number): string {
  if (!Number.isFinite(reais) || reais <= 0) return '';
  const cents = BigInt(Math.round(reais * 100));
  return centsToMoneyString(cents);
}
