import React from 'react';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type MonthSliderProps = {
  monthIndex: number;
  setMonthIndex: (index: number) => void;
};

export default function MonthSlider({ monthIndex, setMonthIndex }: MonthSliderProps) {
  return (
    <div>
      <input
        id="month-slider"
        type="range"
        min={0}
        max={11}
        step={1}
        value={monthIndex}
        onChange={(e) => setMonthIndex(Number(e.target.value))}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {months.map((m) => (
          <span key={m} style={{ fontSize: '0.75em' }}>{m.slice(0, 3)}</span>
        ))}
      </div>
      <label htmlFor="month-slider">
        Month: {months[monthIndex]}
      </label>
    </div>
  );
}
