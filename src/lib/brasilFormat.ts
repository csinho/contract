/** Apenas dígitos */
export function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

export function maskCpf(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskCnpj(v: string): string {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskCep(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** RG comum (apenas dígitos, máscara flexível) */
export function maskRg(v: string): string {
  const d = onlyDigits(v).slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
}

/**
 * Dígitos digitados são interpretados como centavos (ex.: "1" → R$ 0,01).
 */
export function formatMoneyBrlFromDigits(allDigits: string): string {
  const d = onlyDigits(allDigits);
  if (!d) return '';
  const cents = BigInt(d);
  const intPart = cents / 100n;
  const decPart = cents % 100n;
  const intStr = intPart
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decStr = decPart.toString().padStart(2, '0');
  return `R$ ${intStr},${decStr}`;
}

/** Extrai string de dígitos a partir de valor já formatado em R$ */
export function moneyDigitsFromFormatted(formatted: string): string {
  return onlyDigits(formatted);
}

export interface ViaCepJson {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchViaCep(cep8: string): Promise<ViaCepJson | null> {
  const d = onlyDigits(cep8);
  if (d.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
  if (!res.ok) return null;
  const data = (await res.json()) as ViaCepJson;
  if (data.erro) return null;
  return data;
}

export function addressLineFromViaCep(j: ViaCepJson): string {
  const parts = [j.logradouro, j.bairro].filter(Boolean);
  return parts.join(', ');
}
