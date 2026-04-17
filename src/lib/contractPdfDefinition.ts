import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ContractData, DocumentKind } from '../types/contract';
import { buildPaymentClauseText } from './paymentDescription';
import {
  buyerDeathText,
  docLabel,
  formatDateBr,
  propertyLabel,
  sellerDeathText,
} from './contractClauseTexts';

function sectionTitle(text: string): Content {
  return {
    text,
    bold: true,
    fontSize: 10,
    characterSpacing: 0.4,
    margin: [0, 10, 0, 4],
  };
}

function sigPlaceholder(kind: DocumentKind): string {
  return kind === 'cpf' ? '___.___.___-__' : '__.___.___/____-__';
}

function signatureCell(
  label: string,
  name: string,
  doc: string,
  kind: DocumentKind
): Content {
  const d = docLabel(kind);
  return {
    stack: [
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 220,
            y2: 0,
            lineWidth: 0.75,
            lineColor: '#1a1a1a',
          },
        ],
        margin: [0, 18, 0, 6],
      },
      { text: label, bold: true, fontSize: 9, alignment: 'center' },
      { text: name || '___________________________', fontSize: 9, alignment: 'center' },
      {
        text: `${d}: ${doc || sigPlaceholder(kind)}`,
        fontSize: 8.5,
        color: '#555555',
        alignment: 'center',
      },
    ],
    margin: [6, 0, 6, 14],
  };
}

/** Definição de documento A4 para pdfmake — paginação automática, sem sobreposição. */
export function buildContractPdfDefinition(data: ContractData): TDocumentDefinitions {
  const prop = propertyLabel(data.propertyType);
  const penaltyPct = data.penaltyPercentage || '___';
  const paymentParagraph = buildPaymentClauseText(data);

  const content: Content[] = [
    {
      text: 'CONTRATO DE COMPRA E VENDA DE IMÓVEL',
      style: 'title',
      alignment: 'center',
      margin: [0, 0, 0, 6],
    },
    {
      text: [
        prop,
        ' — ',
        data.propertyAddress || '___________________________',
        ', ',
        data.propertyCity || '___________',
        '/',
        data.propertyState || '__',
        ...(data.propertyCep ? [' — CEP ', data.propertyCep] : []),
      ],
      fontSize: 9,
      color: '#555555',
      alignment: 'center',
      margin: [0, 0, 0, 14],
    },
    {
      text: [
        'As partes abaixo qualificadas celebram o presente ',
        { text: 'Contrato de Compra e Venda', bold: true },
        ', que se rege pelas cláusulas e condições a seguir:',
      ],
      margin: [0, 0, 0, 8],
    },

    sectionTitle('I. DAS PARTES'),
    {
      text: [
        { text: 'VENDEDOR: ', bold: true },
        data.seller.name || '___________________________',
        ', ',
        docLabel(data.seller.documentKind),
        ' ',
        data.seller.cpf || '________________',
        ', RG/IE ',
        data.seller.rg || '________',
        ', residente em ',
        data.seller.address || '___________________________',
        ', ',
        data.seller.city || '___________',
        '/',
        data.seller.state || '__',
        '.',
      ],
      margin: [0, 0, 0, 6],
    },
    {
      text: [
        { text: 'COMPRADOR: ', bold: true },
        data.buyer.name || '___________________________',
        ', ',
        docLabel(data.buyer.documentKind),
        ' ',
        data.buyer.cpf || '________________',
        ', RG/IE ',
        data.buyer.rg || '________',
        ', residente em ',
        data.buyer.address || '___________________________',
        ', ',
        data.buyer.city || '___________',
        '/',
        data.buyer.state || '__',
        '.',
      ],
      margin: [0, 0, 0, 8],
    },

    sectionTitle('II. DO OBJETO'),
    {
      text: [
        'O VENDEDOR vende ao COMPRADOR o imóvel do tipo ',
        { text: prop, bold: true },
        ', localizado à ',
        data.propertyAddress || '___________________________',
        ', ',
        data.propertyCity || '___________',
        '/',
        data.propertyState || '__',
        ', com área de ',
        ...(data.propertyArea
          ? [{ text: String(data.propertyArea), bold: true }, ' m²']
          : ['______ m²']),
        ', matriculado sob n.º ',
        data.registryNumber || '______',
        ' no Cartório de Registro de Imóveis competente.',
      ],
      margin: [0, 0, 0, 8],
    },

    sectionTitle('III. DO VALOR E FORMA DE PAGAMENTO'),
    {
      text: [
        'O imóvel é vendido pelo valor total de ',
        { text: data.totalValue || 'R$ ___________', bold: true },
        '. ',
        paymentParagraph,
      ],
      margin: [0, 0, 0, 8],
    },

    sectionTitle('IV. DA RESCISÃO E MULTA'),
    {
      text: [
        'Em caso de rescisão unilateral injustificada por qualquer das partes, a parte inadimplente pagará à outra multa equivalente a ',
        { text: `${penaltyPct}% (por cento)`, bold: true },
        ' sobre o valor total do contrato. Em caso de rescisão por mútuo acordo, as partes firmarão distrato, sem incidência de multa.',
      ],
      margin: [0, 0, 0, 8],
    },

    sectionTitle('V. DO FALECIMENTO DO COMPRADOR'),
    {
      text: [
        'Em caso de falecimento do COMPRADOR antes da conclusão deste contrato, ',
        buyerDeathText(data),
        '.',
      ],
      margin: [0, 0, 0, 8],
    },

    sectionTitle('VI. DO FALECIMENTO DO VENDEDOR'),
    {
      text: [
        'Em caso de falecimento do VENDEDOR antes da conclusão deste contrato, ',
        sellerDeathText(data),
        '.',
      ],
      margin: [0, 0, 0, 8],
    },

    sectionTitle('VII. DISPOSIÇÕES GERAIS'),
    {
      text: 'Este contrato é celebrado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores. A posse definitiva do imóvel será transferida ao COMPRADOR somente após a quitação integral do valor contratado e a lavratura da escritura pública. As despesas cartorárias e de transferência correm por conta do COMPRADOR, salvo acordo em contrário.',
      margin: [0, 0, 0, 6],
    },
  ];

  if (data.additionalNotes?.trim()) {
    content.push({
      text: [{ text: 'Observações: ', italics: true }, { text: data.additionalNotes, italics: true }],
      margin: [0, 4, 0, 8],
    });
  } else {
    content.push({ text: '', margin: [0, 0, 0, 4] });
  }

  content.push(
    {
      text: [
        'Fica eleito o foro da Comarca de ',
        data.signatureCity || '___________',
        ' para dirimir quaisquer litígios decorrentes deste instrumento.',
      ],
      margin: [0, 8, 0, 12],
    },
    {
      text: `${data.signatureCity || '___________'}, ${formatDateBr(data.signatureDate)}`,
      alignment: 'center',
      fontSize: 10,
      margin: [0, 0, 0, 16],
    },
    {
      layout: 'noBorders',
      table: {
        widths: ['*', '*'],
        body: [
          [
            signatureCell('VENDEDOR', data.seller.name, data.seller.cpf, data.seller.documentKind),
            signatureCell(
              'COMPRADOR',
              data.buyer.name,
              data.buyer.cpf,
              data.buyer.documentKind
            ),
          ],
          [
            signatureCell(
              'TESTEMUNHA 1',
              data.witnesses[0].name,
              data.witnesses[0].cpf,
              data.witnesses[0].documentKind
            ),
            signatureCell(
              'TESTEMUNHA 2',
              data.witnesses[1].name,
              data.witnesses[1].cpf,
              data.witnesses[1].documentKind
            ),
          ],
        ],
      },
    }
  );

  return {
    pageSize: 'A4',
    pageMargins: [54, 54, 54, 54],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10.5,
      lineHeight: 1.45,
      alignment: 'justify',
    },
    styles: {
      title: {
        fontSize: 13,
        bold: true,
        characterSpacing: 0.6,
      },
    },
    content,
  };
}
