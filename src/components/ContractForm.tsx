import { useState } from 'react';
import { ContractData, DocumentKind, PropertyType } from '../types/contract';
import {
  addressLineFromViaCep,
  fetchViaCep,
  maskCep,
  maskCnpj,
  maskCpf,
  maskRg,
  onlyDigits,
} from '../lib/brasilFormat';
import { DocValidationHint, PercentInputWrap } from './BrFormControls';
import PaymentFormSection from './PaymentFormSection';

interface Props {
  data: ContractData;
  onChange: (data: ContractData) => void;
  onGenerate: () => void;
}

const propertyTypeLabels: Record<PropertyType, string> = {
  terreno: 'Terreno',
  casa: 'Casa Residencial',
  kitnet: 'Kitnet',
  apartamento: 'Apartamento',
  comercial: 'Imóvel Comercial',
  moto: 'Moto',
  carro: 'Carro',
};

function Field({
  label,
  children,
  half,
}: {
  label: string;
  children: React.ReactNode;
  half?: boolean;
}) {
  return (
    <div className={half ? 'flex-1 min-w-[140px]' : 'w-full'}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
        {title}
      </h3>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';

const selectCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';

function clone(data: ContractData): ContractData {
  return JSON.parse(JSON.stringify(data)) as ContractData;
}

export default function ContractForm({ data, onChange, onGenerate }: Props) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);

  const set = (path: string, value: string) => {
    const keys = path.split('.');
    const updated = clone(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ref: any = updated;
    for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
    ref[keys[keys.length - 1]] = value;
    onChange(updated);
  };

  const merge = (fn: (draft: ContractData) => void) => {
    const updated = clone(data);
    fn(updated);
    onChange(updated);
  };

  const setDocumentKind = (who: 'seller' | 'buyer', kind: DocumentKind) => {
    const updated = clone(data);
    updated[who].documentKind = kind;
    updated[who].cpf = '';
    onChange(updated);
  };

  const setWitnessDocumentKind = (index: 0 | 1, kind: DocumentKind) => {
    const updated = clone(data);
    updated.witnesses[index].documentKind = kind;
    updated.witnesses[index].cpf = '';
    onChange(updated);
  };

  const handleCepBlur = async () => {
    const d = onlyDigits(data.propertyCep);
    setCepMessage(null);
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetchViaCep(d);
      if (!r) {
        setCepMessage('CEP não encontrado.');
        return;
      }
      const updated = clone(data);
      updated.propertyCep = maskCep(d);
      const line = addressLineFromViaCep(r);
      if (line) updated.propertyAddress = line;
      if (r.localidade) updated.propertyCity = r.localidade;
      if (r.uf) updated.propertyState = r.uf.toUpperCase();
      onChange(updated);
    } catch {
      setCepMessage('Não foi possível consultar o CEP. Tente de novo.');
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Dados do Contrato</h2>

      <Section title="Imóvel">
        <Field label="Tipo de Imóvel">
          <select
            className={selectCls}
            value={data.propertyType}
            onChange={(e) => set('propertyType', e.target.value)}
          >
            {(Object.keys(propertyTypeLabels) as PropertyType[]).map((k) => (
              <option key={k} value={k}>
                {propertyTypeLabels[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="CEP">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            className={inputCls}
            placeholder="00000-000"
            value={data.propertyCep}
            onChange={(e) => set('propertyCep', maskCep(e.target.value))}
            onBlur={handleCepBlur}
            aria-busy={cepLoading}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            {cepLoading
              ? 'Consultando ViaCEP…'
              : 'Ao sair do campo com 8 dígitos, o endereço é preenchido automaticamente (ViaCEP).'}
          </p>
          {cepMessage && (
            <p className="text-xs text-amber-700 mt-1" role="status">
              {cepMessage}
            </p>
          )}
        </Field>
        <Field label="Endereço do Imóvel">
          <input
            type="text"
            className={inputCls}
            placeholder="Rua, número, bairro"
            value={data.propertyAddress}
            onChange={(e) => set('propertyAddress', e.target.value)}
          />
        </Field>
        <div className="flex gap-3 w-full flex-wrap">
          <Field label="Cidade" half>
            <input
              type="text"
              className={inputCls}
              placeholder="Cidade"
              value={data.propertyCity}
              onChange={(e) => set('propertyCity', e.target.value)}
            />
          </Field>
          <Field label="Estado (UF)" half>
            <input
              type="text"
              className={inputCls}
              placeholder="UF"
              maxLength={2}
              value={data.propertyState}
              onChange={(e) => set('propertyState', e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Área (m²)" half>
            <input
              type="number"
              min={0}
              step="any"
              className={inputCls}
              placeholder="Ex: 250"
              value={data.propertyArea}
              onChange={(e) => set('propertyArea', e.target.value)}
            />
          </Field>
          <Field label="Matrícula / Registro" half>
            <input
              type="text"
              className={inputCls}
              placeholder="Nº matrícula"
              value={data.registryNumber}
              onChange={(e) => set('registryNumber', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Valor e Pagamento">
        <PaymentFormSection
          data={data}
          set={set}
          merge={merge}
          propertyType={data.propertyType}
        />
      </Section>

      <Section title="Vendedor">
        <Field label="Documento">
          <select
            className={selectCls}
            value={data.seller.documentKind}
            onChange={(e) => setDocumentKind('seller', e.target.value as DocumentKind)}
          >
            <option value="cpf">CPF (pessoa física)</option>
            <option value="cnpj">CNPJ (pessoa jurídica)</option>
          </select>
        </Field>
        <Field label={data.seller.documentKind === 'cpf' ? 'Nome completo' : 'Razão social'}>
          <input
            type="text"
            className={inputCls}
            placeholder={
              data.seller.documentKind === 'cpf' ? 'Nome do vendedor' : 'Nome da empresa'
            }
            value={data.seller.name}
            onChange={(e) => set('seller.name', e.target.value)}
          />
        </Field>
        <div className="flex gap-3 w-full flex-wrap">
          <Field label={data.seller.documentKind === 'cpf' ? 'CPF' : 'CNPJ'} half>
            <input
              type="text"
              inputMode="numeric"
              className={inputCls}
              placeholder={data.seller.documentKind === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              value={data.seller.cpf}
              onChange={(e) =>
                set(
                  'seller.cpf',
                  data.seller.documentKind === 'cpf'
                    ? maskCpf(e.target.value)
                    : maskCnpj(e.target.value)
                )
              }
            />
            <DocValidationHint value={data.seller.cpf} kind={data.seller.documentKind} />
          </Field>
          <Field label="RG / IE (se aplicável)" half>
            <input
              type="text"
              inputMode="text"
              className={inputCls}
              placeholder="00.000.000-0"
              value={data.seller.rg}
              onChange={(e) => set('seller.rg', maskRg(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Endereço Completo">
          <input
            type="text"
            className={inputCls}
            placeholder="Endereço do vendedor"
            value={data.seller.address}
            onChange={(e) => set('seller.address', e.target.value)}
          />
        </Field>
        <div className="flex gap-3 w-full flex-wrap">
          <Field label="Cidade" half>
            <input
              type="text"
              className={inputCls}
              placeholder="Cidade"
              value={data.seller.city}
              onChange={(e) => set('seller.city', e.target.value)}
            />
          </Field>
          <Field label="Estado (UF)" half>
            <input
              type="text"
              className={inputCls}
              placeholder="UF"
              maxLength={2}
              value={data.seller.state}
              onChange={(e) => set('seller.state', e.target.value.toUpperCase())}
            />
          </Field>
        </div>
      </Section>

      <Section title="Comprador">
        <Field label="Documento">
          <select
            className={selectCls}
            value={data.buyer.documentKind}
            onChange={(e) => setDocumentKind('buyer', e.target.value as DocumentKind)}
          >
            <option value="cpf">CPF (pessoa física)</option>
            <option value="cnpj">CNPJ (pessoa jurídica)</option>
          </select>
        </Field>
        <Field label={data.buyer.documentKind === 'cpf' ? 'Nome completo' : 'Razão social'}>
          <input
            type="text"
            className={inputCls}
            placeholder={
              data.buyer.documentKind === 'cpf' ? 'Nome do comprador' : 'Nome da empresa'
            }
            value={data.buyer.name}
            onChange={(e) => set('buyer.name', e.target.value)}
          />
        </Field>
        <div className="flex gap-3 w-full flex-wrap">
          <Field label={data.buyer.documentKind === 'cpf' ? 'CPF' : 'CNPJ'} half>
            <input
              type="text"
              inputMode="numeric"
              className={inputCls}
              placeholder={data.buyer.documentKind === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              value={data.buyer.cpf}
              onChange={(e) =>
                set(
                  'buyer.cpf',
                  data.buyer.documentKind === 'cpf'
                    ? maskCpf(e.target.value)
                    : maskCnpj(e.target.value)
                )
              }
            />
            <DocValidationHint value={data.buyer.cpf} kind={data.buyer.documentKind} />
          </Field>
          <Field label="RG / IE (se aplicável)" half>
            <input
              type="text"
              className={inputCls}
              placeholder="00.000.000-0"
              value={data.buyer.rg}
              onChange={(e) => set('buyer.rg', maskRg(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Endereço Completo">
          <input
            type="text"
            className={inputCls}
            placeholder="Endereço do comprador"
            value={data.buyer.address}
            onChange={(e) => set('buyer.address', e.target.value)}
          />
        </Field>
        <div className="flex gap-3 w-full flex-wrap">
          <Field label="Cidade" half>
            <input
              type="text"
              className={inputCls}
              placeholder="Cidade"
              value={data.buyer.city}
              onChange={(e) => set('buyer.city', e.target.value)}
            />
          </Field>
          <Field label="Estado (UF)" half>
            <input
              type="text"
              className={inputCls}
              placeholder="UF"
              maxLength={2}
              value={data.buyer.state}
              onChange={(e) => set('buyer.state', e.target.value.toUpperCase())}
            />
          </Field>
        </div>
      </Section>

      <Section title="Cláusulas de Penalidade e Rescisão">
        <Field label="Multa por rescisão">
          <PercentInputWrap
            className={inputCls}
            value={data.penaltyPercentage}
            onChange={(v) => set('penaltyPercentage', v)}
            placeholder="0"
          />
        </Field>
        <Field label="Falecimento do Comprador — Obrigação passa para:">
          <select
            className={selectCls}
            value={data.buyerDeathClause}
            onChange={(e) => set('buyerDeathClause', e.target.value)}
          >
            <option value="herdeiros">Herdeiros legais do comprador</option>
            <option value="vendedor">Contrato rescindido — devolução ao vendedor</option>
            <option value="outro">Outro (especificar)</option>
          </select>
        </Field>
        {data.buyerDeathClause === 'outro' && (
          <Field label="Especificar — Falecimento do Comprador">
            <textarea
              className={`${inputCls} resize-y min-h-[72px]`}
              placeholder="Descreva a cláusula"
              value={data.buyerDeathCustom}
              onChange={(e) => set('buyerDeathCustom', e.target.value)}
            />
          </Field>
        )}
        <Field label="Falecimento do Vendedor — Obrigação passa para:">
          <select
            className={selectCls}
            value={data.sellerDeathClause}
            onChange={(e) => set('sellerDeathClause', e.target.value)}
          >
            <option value="herdeiros_comprador">Herdeiros do vendedor honram o contrato</option>
            <option value="devolucao">Contrato rescindido — valores devolvidos ao comprador</option>
            <option value="outro">Outro (especificar)</option>
          </select>
        </Field>
        {data.sellerDeathClause === 'outro' && (
          <Field label="Especificar — Falecimento do Vendedor">
            <textarea
              className={`${inputCls} resize-y min-h-[72px]`}
              placeholder="Descreva a cláusula"
              value={data.sellerDeathCustom}
              onChange={(e) => set('sellerDeathCustom', e.target.value)}
            />
          </Field>
        )}
      </Section>

      <Section title="Testemunhas">
        {([0, 1] as const).map((i) => (
          <div key={i} className="flex flex-col gap-3 w-full border-b border-gray-50 pb-4 last:border-0 last:pb-0">
            <div className="flex gap-3 w-full flex-wrap">
              <Field label="Documento" half>
                <select
                  className={selectCls}
                  value={data.witnesses[i].documentKind}
                  onChange={(e) =>
                    setWitnessDocumentKind(i, e.target.value as DocumentKind)
                  }
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-3 w-full flex-wrap">
              <Field label={`Testemunha ${i + 1} — Nome`} half>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Nome completo ou razão social"
                  value={data.witnesses[i].name}
                  onChange={(e) => {
                    const updated = clone(data);
                    updated.witnesses[i].name = e.target.value;
                    onChange(updated);
                  }}
                />
              </Field>
              <Field label={data.witnesses[i].documentKind === 'cpf' ? 'CPF' : 'CNPJ'} half>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder={
                    data.witnesses[i].documentKind === 'cpf'
                      ? '000.000.000-00'
                      : '00.000.000/0000-00'
                  }
                  value={data.witnesses[i].cpf}
                  onChange={(e) => {
                    const updated = clone(data);
                    const raw = e.target.value;
                    updated.witnesses[i].cpf =
                      updated.witnesses[i].documentKind === 'cpf'
                        ? maskCpf(raw)
                        : maskCnpj(raw);
                    onChange(updated);
                  }}
                />
                <DocValidationHint
                  value={data.witnesses[i].cpf}
                  kind={data.witnesses[i].documentKind}
                />
              </Field>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Local e Data de Assinatura">
        <div className="flex gap-3 w-full flex-wrap">
          <Field label="Cidade" half>
            <input
              type="text"
              className={inputCls}
              placeholder="Cidade da assinatura"
              value={data.signatureCity}
              onChange={(e) => set('signatureCity', e.target.value)}
            />
          </Field>
          <Field label="Data" half>
            <input
              type="date"
              className={inputCls}
              value={data.signatureDate}
              onChange={(e) => set('signatureDate', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Observações Adicionais (opcional)">
        <Field label="Observações">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Cláusulas adicionais, notas..."
            value={data.additionalNotes}
            onChange={(e) => set('additionalNotes', e.target.value)}
          />
        </Field>
      </Section>

      <button
        type="button"
        onClick={onGenerate}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-sm tracking-wide"
      >
        Gerar Contrato em PDF
      </button>
    </div>
  );
}
