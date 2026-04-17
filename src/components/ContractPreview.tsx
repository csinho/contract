import { forwardRef } from 'react';
import { ContractData, DocumentKind } from '../types/contract';
import { buildPaymentClauseText } from '../lib/paymentDescription';
import {
  buyerDeathText,
  docLabel,
  formatDateBr,
  propertyLabel,
  sellerDeathText,
} from '../lib/contractClauseTexts';

interface Props {
  data: ContractData;
}

const ContractPreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const prop = propertyLabel(data.propertyType);
  const penaltyPct = data.penaltyPercentage || '___';

  return (
    <div
      ref={ref}
      id="contract-print"
      className="bg-white font-serif text-gray-900"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '18mm 20mm',
        fontSize: '10.5pt',
        lineHeight: '1.55',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '14pt' }}>
        <div
          style={{
            fontSize: '13pt',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderBottom: '1.5px solid #1a1a1a',
            paddingBottom: '6pt',
            marginBottom: '4pt',
          }}
        >
          Contrato de Compra e Venda de Imóvel
        </div>
        <div style={{ fontSize: '9pt', color: '#555' }}>
          {prop} &mdash; {data.propertyAddress || '___________________________'},{' '}
          {data.propertyCity || '___________'}/{data.propertyState || '__'}
          {data.propertyCep ? (
            <>
              {' '}
              &mdash; CEP {data.propertyCep}
            </>
          ) : null}
        </div>
      </div>

      <p style={{ marginBottom: '8pt' }}>
        As partes abaixo qualificadas celebram o presente <strong>Contrato de Compra e Venda</strong>,
        que se rege pelas cláusulas e condições a seguir:
      </p>

      <SectionTitle>I. Das Partes</SectionTitle>
      <p style={{ marginBottom: '4pt' }}>
        <strong>VENDEDOR:</strong> {data.seller.name || '___________________________'},{' '}
        {docLabel(data.seller.documentKind)} {data.seller.cpf || '________________'}, RG/IE{' '}
        {data.seller.rg || '________'}, residente em {data.seller.address || '___________________________'}
        , {data.seller.city || '___________'}/{data.seller.state || '__'}.
      </p>
      <p style={{ marginBottom: '8pt' }}>
        <strong>COMPRADOR:</strong> {data.buyer.name || '___________________________'},{' '}
        {docLabel(data.buyer.documentKind)} {data.buyer.cpf || '________________'}, RG/IE{' '}
        {data.buyer.rg || '________'}, residente em {data.buyer.address || '___________________________'}
        , {data.buyer.city || '___________'}/{data.buyer.state || '__'}.
      </p>

      <SectionTitle>II. Do Objeto</SectionTitle>
      <p style={{ marginBottom: '8pt' }}>
        O VENDEDOR vende ao COMPRADOR o imóvel do tipo <strong>{prop}</strong>, localizado à{' '}
        {data.propertyAddress || '___________________________'}, {data.propertyCity || '___________'}/
        {data.propertyState || '__'}, com área de{' '}
        {data.propertyArea ? <strong>{data.propertyArea}</strong> : '______'} m²,{' '}
        matriculado sob n.º {data.registryNumber || '______'} no Cartório de Registro de Imóveis
        competente.
      </p>

      <SectionTitle>III. Do Valor e Forma de Pagamento</SectionTitle>
      <p style={{ marginBottom: '8pt' }}>
        O imóvel é vendido pelo valor total de <strong>{data.totalValue || 'R$ ___________'}</strong>.
        {' '}
        {buildPaymentClauseText(data)}
      </p>

      <SectionTitle>IV. Da Rescisão e Multa</SectionTitle>
      <p style={{ marginBottom: '8pt' }}>
        Em caso de rescisão unilateral injustificada por qualquer das partes, a parte inadimplente
        pagará à outra multa equivalente a <strong>{penaltyPct}% (por cento)</strong> sobre o valor
        total do contrato. Em caso de rescisão por mútuo acordo, as partes firmarão distrato, sem
        incidência de multa.
      </p>

      <SectionTitle>V. Do Falecimento do Comprador</SectionTitle>
      <p style={{ marginBottom: '8pt' }}>
        Em caso de falecimento do COMPRADOR antes da conclusão deste contrato,{' '}
        {buyerDeathText(data)}.
      </p>

      <SectionTitle>VI. Do Falecimento do Vendedor</SectionTitle>
      <p style={{ marginBottom: '8pt' }}>
        Em caso de falecimento do VENDEDOR antes da conclusão deste contrato,{' '}
        {sellerDeathText(data)}.
      </p>

      <SectionTitle>VII. Disposições Gerais</SectionTitle>
      <p style={{ marginBottom: '4pt' }}>
        Este contrato é celebrado em caráter irrevogável e irretratável, obrigando as partes e seus
        sucessores. A posse definitiva do imóvel será transferida ao COMPRADOR somente após a
        quitação integral do valor contratado e a lavratura da escritura pública. As despesas
        cartorárias e de transferência correm por conta do COMPRADOR, salvo acordo em contrário.
      </p>
      {data.additionalNotes && (
        <p style={{ marginTop: '4pt', marginBottom: '4pt', fontStyle: 'italic' }}>
          Observações: {data.additionalNotes}
        </p>
      )}

      <p style={{ marginTop: '8pt', marginBottom: '16pt' }}>
        Fica eleito o foro da Comarca de{' '}
        {data.signatureCity || '___________'} para dirimir quaisquer litígios decorrentes deste
        instrumento.
      </p>

      <p style={{ textAlign: 'center', marginBottom: '20pt', fontSize: '10pt' }}>
        {data.signatureCity || '___________'}, {formatDateBr(data.signatureDate)}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20pt 32pt',
          marginTop: '8pt',
        }}
      >
        <SignatureBlock
          label="VENDEDOR"
          name={data.seller.name}
          doc={data.seller.cpf}
          documentKind={data.seller.documentKind}
        />
        <SignatureBlock
          label="COMPRADOR"
          name={data.buyer.name}
          doc={data.buyer.cpf}
          documentKind={data.buyer.documentKind}
        />
        <SignatureBlock
          label="TESTEMUNHA 1"
          name={data.witnesses[0].name}
          doc={data.witnesses[0].cpf}
          documentKind={data.witnesses[0].documentKind}
        />
        <SignatureBlock
          label="TESTEMUNHA 2"
          name={data.witnesses[1].name}
          doc={data.witnesses[1].cpf}
          documentKind={data.witnesses[1].documentKind}
        />
      </div>
    </div>
  );
});

ContractPreview.displayName = 'ContractPreview';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontWeight: 700,
        marginBottom: '4pt',
        marginTop: '2pt',
        fontSize: '10pt',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </p>
  );
}

function SignatureBlock({
  label,
  name,
  doc,
  documentKind,
}: {
  label: string;
  name: string;
  doc: string;
  documentKind: DocumentKind;
}) {
  const d = docLabel(documentKind);
  const placeholder = documentKind === 'cpf' ? '___.___.___-__' : '__.___.___/____-__';
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          borderTop: '1px solid #1a1a1a',
          paddingTop: '4pt',
          marginTop: '22pt',
        }}
      />
      <div style={{ fontWeight: 700, fontSize: '9pt', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '9pt', color: '#333' }}>{name || '___________________________'}</div>
      <div style={{ fontSize: '8.5pt', color: '#555' }}>
        {d}: {doc || placeholder}
      </div>
    </div>
  );
}

export default ContractPreview;
