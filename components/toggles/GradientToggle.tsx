import { MetricKey } from "../Enums";

type GradientToggleProps = {
  label: string;
  value: MetricKey;
  activeMetricKey: MetricKey;
  setActiveMetricKey: (key: MetricKey) => void;
};

export default function GradientToggle({
  label,
  value,
  activeMetricKey,
  setActiveMetricKey,
}: GradientToggleProps) {
  return (
    <label style={{ display: "block", marginBottom: 4 }}>
      <input
        type="radio"
        checked={activeMetricKey === value}
        onChange={() => setActiveMetricKey(value)}
      />{" "}
      {label}
    </label>
  );
}
