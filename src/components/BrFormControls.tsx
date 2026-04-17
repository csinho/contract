import type { DocumentKind } from '../types/contract';
import { documentStatus } from '../lib/documentValidation';

const hintCls = 'text-xs mt-1';

export function DocValidationHint({
  value,
  kind,
}: {
  value: string;
  kind: DocumentKind;
}) {
  const s = documentStatus(value, kind);
  if (s === 'empty' || s === 'incomplete') return null;
  return (
    <p
      className={`${hintCls} ${s === 'valid' ? 'text-emerald-600' : 'text-red-600'}`}
      role="status"
    >
      {s === 'valid' ? 'Documento válido' : 'Documento inválido'}
    </p>
  );
}

export function PercentInputWrap({
  id,
  className,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  className: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        className={`${className} pr-9`}
        value={value}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d]/g, '');
          if (t === '') {
            onChange('');
            return;
          }
          const n = Math.min(100, parseInt(t, 10));
          if (Number.isNaN(n)) onChange('');
          else onChange(String(n));
        }}
      />
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
        aria-hidden
      >
        %
      </span>
    </div>
  );
}
