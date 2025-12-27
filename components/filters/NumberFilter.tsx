import { useState, useEffect } from 'react';

type NumberFilterProps = {
  label: string;
  value: number | null;
  setValue: (val: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  operator?: '>' | '<'; // optional: operator for display/logic
};

export default function NumberFilter({
  label,
  value,
  setValue,
  min = 0,
  max = 99,
  step = 1,
  operator = '>',
}: NumberFilterProps) {
  const [enabled, setEnabled] = useState(false);

  // Clear parent value when unchecked
  useEffect(() => {
    if (!enabled) {
      setValue(null);
    }
  }, [enabled, setValue]);

  return (
    <><label style={{ display: 'block', marginBottom: 4 }}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={e => setEnabled(e.target.checked)} />{' '}
      {label} {operator}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={e => setValue(parseFloat(e.target.value) || null)}
        disabled={!enabled}
        style={{ marginLeft: 4, width: 60, textAlign: 'right' }} />
    </label></>
  );
}
