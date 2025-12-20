import React from 'react';

interface GradientLegendProps {
  min: number;
  max: number;
  steps?: number;
  colorFunc: (value: number) => string; // same color scale as your map
}

const GradientLegend: React.FC<GradientLegendProps> = ({
  min,
  max,
  steps = 5,
  colorFunc
}) => {
  const stepValues = Array.from({ length: steps + 1 }, (_, i) =>
    min + ((max - min) * i) / steps
  );

  return (
    <div style={{ width: '100%', maxWidth: 300 }}>
      <div
        style={{
          background: `linear-gradient(to right, ${stepValues
            .map(colorFunc)
            .join(',')})`,
          height: 20,
          marginBottom: 6
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {stepValues.map((val, i) => (
          <span key={i} style={{ fontSize: 12 }}>
            {val.toFixed(0)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default GradientLegend;
