import type { ChangeEvent } from 'react';
import type { ContractData, PaymentMode, PropertyType } from '../types/contract';
import { isVehicleProperty } from '../lib/paymentDescription';
import {
  formatMoneyBrlFromDigits,
  moneyDigitsFromFormatted,
} from '../lib/brasilFormat';
import {
  centsToMoneyString,
  firstInstallmentSacReais,
  installmentPriceReais,
  moneyStringToReais,
  moneyToCents,
  reaisToMoneyString,
} from '../lib/paymentCalculations';

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';

const readonlyMoneyCls = `${inputCls} bg-slate-50 text-slate-800 cursor-not-allowed`;

const selectCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';

function RateSuffix({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        className={`${inputCls} pr-10`}
        value={value}
        onChange={(e) => {
          const t = e.target.value.replace(',', '.');
          if (t === '') {
            onChange('');
            return;
          }
          if (!/^\d*\.?\d*$/.test(t)) return;
          onChange(t);
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
        %
      </span>
    </div>
  );
}

interface Props {
  data: ContractData;
  set: (path: string, value: string) => void;
  merge: (fn: (draft: ContractData) => void) => void;
  propertyType: PropertyType;
}

function moneyProps(
  data: ContractData,
  path: string,
  set: (path: string, value: string) => void
) {
  const keys = path.split('.');
  let cur: unknown = data;
  for (const k of keys) cur = (cur as Record<string, unknown>)[k];
  return {
    value: (cur as string) ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      set(path, formatMoneyBrlFromDigits(moneyDigitsFromFormatted(e.target.value))),
  };
}

function recalcFinancedAmount(d: ContractData): void {
  const total = moneyToCents(d.totalValue);
  const entrada = moneyToCents(d.paymentFinancing.downPayment);
  const fin = total >= entrada ? total - entrada : 0n;
  d.paymentFinancing.financedAmount = fin > 0n ? centsToMoneyString(fin) : '';
}

function recalcFinancingInstallment(d: ContractData): void {
  const pv = moneyStringToReais(d.paymentFinancing.financedAmount);
  const monthsRaw = parseInt(d.paymentFinancing.prazoMeses, 10);
  const months = Number.isFinite(monthsRaw) && monthsRaw > 0 ? monthsRaw : 1;
  const raw = d.paymentFinancing.taxaJurosAa.replace(',', '.');
  const taxa = parseFloat(raw);
  const annual = Number.isFinite(taxa) ? taxa : 0;
  const sys = d.paymentFinancing.amortizationSystem;
  let reais = 0;
  if (sys === 'sac') reais = firstInstallmentSacReais(pv, months, annual);
  else reais = installmentPriceReais(pv, months, annual);
  d.paymentFinancing.valorParcela = reais > 0 ? reaisToMoneyString(reais) : '';
}

function syncFinancingBlock(d: ContractData): void {
  recalcFinancedAmount(d);
  recalcFinancingInstallment(d);
}

function syncCashWithTotal(d: ContractData): void {
  d.paymentCash.amount = d.totalValue;
}

function syncSellerParcelFromTotal(d: ContractData): void {
  const total = moneyToCents(d.totalValue);
  const ent = moneyToCents(d.paymentSellerInstallments.entrada);
  const n = parseInt(d.paymentSellerInstallments.numeroParcelas, 10);
  if (!Number.isFinite(n) || n < 1) {
    d.paymentSellerInstallments.valorParcela = '';
    return;
  }
  const rest = total - ent;
  if (rest <= 0n) {
    d.paymentSellerInstallments.valorParcela = '';
    return;
  }
  const per = rest / BigInt(n);
  d.paymentSellerInstallments.valorParcela = centsToMoneyString(per);
}

function syncTotalFromSellerParcel(d: ContractData): void {
  const ent = moneyToCents(d.paymentSellerInstallments.entrada);
  const n = parseInt(d.paymentSellerInstallments.numeroParcelas, 10);
  const parcela = moneyToCents(d.paymentSellerInstallments.valorParcela);
  if (!Number.isFinite(n) || n < 1 || parcela <= 0n) return;
  const totalC = ent + parcela * BigInt(n);
  d.totalValue = centsToMoneyString(totalC);
  if (d.paymentMode === 'a_vista') syncCashWithTotal(d);
}

export default function PaymentFormSection({ data, set, merge, propertyType }: Props) {
  const isVehicle = isVehicleProperty(propertyType);
  const mode = data.paymentMode;

  const handleTotalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = formatMoneyBrlFromDigits(moneyDigitsFromFormatted(e.target.value));
    merge((d) => {
      d.totalValue = v;
      if (d.paymentMode === 'a_vista') syncCashWithTotal(d);
      if (d.paymentMode === 'financiamento') syncFinancingBlock(d);
      if (d.paymentMode === 'parcelamento') syncSellerParcelFromTotal(d);
    });
  };

  const handlePaymentModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as PaymentMode;
    merge((d) => {
      d.paymentMode = next;
      if (next === 'a_vista') syncCashWithTotal(d);
      if (next === 'financiamento') syncFinancingBlock(d);
      if (next === 'parcelamento') syncSellerParcelFromTotal(d);
    });
  };

  return (
    <>
      <div className="w-full">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Valor total do negócio
        </label>
        <input
          type="text"
          inputMode="numeric"
          className={inputCls}
          placeholder="R$ 0,00"
          value={data.totalValue}
          onChange={handleTotalChange}
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Valor em Real (R$). Os demais campos de pagamento são calculados a partir dele.
        </p>
      </div>

      <div className="w-full">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Forma de pagamento
        </label>
        <select
          className={selectCls}
          value={mode}
          onChange={handlePaymentModeChange}
        >
          <option value="a_vista">À vista</option>
          <option value="financiamento">Financiamento (banco / financeira)</option>
          <option value="parcelamento">Parcelamento com o vendedor</option>
        </select>
      </div>

      {mode === 'a_vista' && (
        <div className="w-full rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-2">
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong>À vista:</strong> o valor quitado é o <strong>mesmo valor total</strong> acima —
            não é necessário informar outro montante.
          </p>
          {data.totalValue ? (
            <p className="text-sm font-medium text-gray-900">
              Valor à vista: {data.paymentCash.amount || data.totalValue}
            </p>
          ) : null}
        </div>
      )}

      {mode === 'financiamento' && (
        <div className="w-full rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-900">Financiamento bancário</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            {isVehicle
              ? 'Entrada e prazo definem o valor financiado (total − entrada) e a parcela mensal (taxa nominal a.a.).'
              : 'Idem crédito imobiliário: valor financiado automático; parcela calculada (Price ou 1ª parcela SAC).'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Instituição financeira / banco
              </label>
              <input
                type="text"
                className={inputCls}
                placeholder="Ex: Banco X S.A."
                value={data.paymentFinancing.institution}
                onChange={(e) => set('paymentFinancing.institution', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Entrada
              </label>
              <input
                type="text"
                inputMode="numeric"
                className={inputCls}
                {...moneyProps(data, 'paymentFinancing.downPayment', (_path, val) =>
                  merge((d) => {
                    d.paymentFinancing.downPayment = val;
                    syncFinancingBlock(d);
                  })
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Valor financiado (automático)
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                className={readonlyMoneyCls}
                value={data.paymentFinancing.financedAmount}
                title="Total do negócio menos a entrada"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Prazo (meses)
              </label>
              <input
                type="number"
                min={1}
                className={inputCls}
                placeholder="Ex: 360"
                value={data.paymentFinancing.prazoMeses}
                onChange={(e) =>
                  merge((d) => {
                    d.paymentFinancing.prazoMeses = e.target.value;
                    recalcFinancingInstallment(d);
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Taxa de juros (ao ano)
              </label>
              <RateSuffix
                value={data.paymentFinancing.taxaJurosAa}
                onChange={(v) =>
                  merge((d) => {
                    d.paymentFinancing.taxaJurosAa = v;
                    recalcFinancingInstallment(d);
                  })
                }
                placeholder="Ex: 10,5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Sistema de amortização
              </label>
              <select
                className={selectCls}
                value={data.paymentFinancing.amortizationSystem}
                onChange={(e) =>
                  merge((d) => {
                    d.paymentFinancing.amortizationSystem = e.target.value as '' | 'price' | 'sac';
                    recalcFinancingInstallment(d);
                  })
                }
              >
                <option value="">Tabela Price (padrão)</option>
                <option value="price">Tabela Price</option>
                <option value="sac">SAC (1ª parcela)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Valor da parcela (calculado)
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                className={readonlyMoneyCls}
                value={data.paymentFinancing.valorParcela}
                title={
                  data.paymentFinancing.amortizationSystem === 'sac'
                    ? 'Primeira prestação SAC (aprox.)'
                    : 'Prestação constante (Price)'
                }
              />
              <p className="text-[11px] text-gray-500 mt-1">
                {data.paymentFinancing.amortizationSystem === 'sac'
                  ? 'SAC: exibida a 1ª parcela (amortização + juros sobre o saldo inicial).'
                  : 'Price: prestação fixa. Com taxa 0%, divide o financiado pelo prazo.'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                CET (ao ano)
              </label>
              <RateSuffix
                value={data.paymentFinancing.cetAa}
                onChange={(v) => set('paymentFinancing.cetAa', v)}
                placeholder="Opcional"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Nº contrato de crédito / referência
              </label>
              <input
                type="text"
                className={inputCls}
                placeholder="Opcional"
                value={data.paymentFinancing.numeroContratoCredito}
                onChange={(e) => set('paymentFinancing.numeroContratoCredito', e.target.value)}
              />
            </div>

            {!isVehicle && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Uso de FGTS (imóvel)
                </label>
                <select
                  className={selectCls}
                  value={data.paymentFinancing.usesFgts}
                  onChange={(e) =>
                    set('paymentFinancing.usesFgts', e.target.value as 'nao' | 'sim')
                  }
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Seguro prestamista
              </label>
              <select
                className={selectCls}
                value={data.paymentFinancing.seguroPrestamista}
                onChange={(e) =>
                  set('paymentFinancing.seguroPrestamista', e.target.value as 'nao' | 'sim')
                }
              >
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {isVehicle
                  ? 'Gravame / alienação fiduciária / observações'
                  : 'Alienação fiduciária / hipoteca / observações'}
              </label>
              <textarea
                className={`${inputCls} resize-y min-h-[72px]`}
                placeholder={
                  isVehicle
                    ? 'Ex: gravame no veículo, registro no DETRAN...'
                    : 'Ex: registro na matrícula, constituição de hipoteca...'
                }
                value={data.paymentFinancing.guaranteeObservations}
                onChange={(e) => set('paymentFinancing.guaranteeObservations', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'parcelamento' && (
        <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
          <p className="text-xs font-semibold text-emerald-900">Parcelamento direto com o vendedor</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Informe o <strong>valor total</strong> acima, a <strong>entrada</strong> e o{' '}
            <strong>número de parcelas</strong>: o valor de cada parcela é calculado. Se preferir,
            defina o <strong>valor da parcela</strong> e a quantidade — o{' '}
            <strong>valor total</strong> é atualizado (entrada + parcelas × valor).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Entrada
              </label>
              <input
                type="text"
                inputMode="numeric"
                className={inputCls}
                {...moneyProps(data, 'paymentSellerInstallments.entrada', (_path, val) =>
                  merge((d) => {
                    d.paymentSellerInstallments.entrada = val;
                    syncSellerParcelFromTotal(d);
                  })
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Número de parcelas
              </label>
              <input
                type="number"
                min={1}
                className={inputCls}
                placeholder="Ex: 12"
                value={data.paymentSellerInstallments.numeroParcelas}
                onChange={(e) =>
                  merge((d) => {
                    d.paymentSellerInstallments.numeroParcelas = e.target.value;
                    syncSellerParcelFromTotal(d);
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Valor de cada parcela
              </label>
              <input
                type="text"
                inputMode="numeric"
                className={inputCls}
                {...moneyProps(data, 'paymentSellerInstallments.valorParcela', (_path, val) =>
                  merge((d) => {
                    d.paymentSellerInstallments.valorParcela = val;
                    syncTotalFromSellerParcel(d);
                  })
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Primeiro vencimento
              </label>
              <input
                type="date"
                className={inputCls}
                value={data.paymentSellerInstallments.primeiroVencimento}
                onChange={(e) =>
                  set('paymentSellerInstallments.primeiroVencimento', e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Dia de vencimento (demais parcelas)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                className={inputCls}
                placeholder="Ex: 10"
                value={data.paymentSellerInstallments.diaVencimento}
                onChange={(e) => set('paymentSellerInstallments.diaVencimento', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Periodicidade
              </label>
              <select
                className={selectCls}
                value={data.paymentSellerInstallments.periodicidade}
                onChange={(e) =>
                  set(
                    'paymentSellerInstallments.periodicidade',
                    e.target.value as 'mensal' | 'bimestral' | 'trimestral'
                  )
                }
              >
                <option value="mensal">Mensal</option>
                <option value="bimestral">Bimestral</option>
                <option value="trimestral">Trimestral</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Observações (juros, índice de correção, etc.)
              </label>
              <textarea
                className={`${inputCls} resize-y min-h-[72px]`}
                placeholder="Opcional"
                value={data.paymentSellerInstallments.observations}
                onChange={(e) =>
                  set('paymentSellerInstallments.observations', e.target.value)
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
