import { validate as validateCpf } from 'gerador-validador-cpf';
import { validate as validateCnpj } from 'gerador-validador-cnpj';
import type { DocumentKind } from '../types/contract';
import { onlyDigits } from './brasilFormat';

export function isValidDocument(value: string, kind: DocumentKind): boolean {
  const d = onlyDigits(value);
  if (kind === 'cpf') {
    if (d.length !== 11) return false;
    return validateCpf(value);
  }
  if (d.length !== 14) return false;
  return validateCnpj(value);
}

export function documentStatus(
  value: string,
  kind: DocumentKind
): 'empty' | 'incomplete' | 'valid' | 'invalid' {
  const d = onlyDigits(value);
  const need = kind === 'cpf' ? 11 : 14;
  if (d.length === 0) return 'empty';
  if (d.length < need) return 'incomplete';
  return isValidDocument(value, kind) ? 'valid' : 'invalid';
}

export function isValidCpfLoose(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  return validateCpf(value);
}
