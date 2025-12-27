import NumberFilter from "./NumberFilter";

type HdiFilterProps = {
  hdi: number | null;
  setHdi: (val: number | null) => void;
};

export default function HdiFilter({ hdi, setHdi }: HdiFilterProps) {
  return (
    <NumberFilter
      label="HDI"
      value={hdi}
      setValue={setHdi}
      min={0}
      max={1}
      step={0.01}
      operator=">"
    />
  );
}
