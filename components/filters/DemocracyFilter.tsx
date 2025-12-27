import NumberFilter from "./NumberFilter";

type DemocracyFilterProps = {
  democracy: number | null;
  setDemocracy: (val: number | null) => void;
};

export default function DemocracyFilter({
  democracy,
  setDemocracy,
}: DemocracyFilterProps) {
  return (
    <NumberFilter
      label="Democracy Index"
      value={democracy}
      setValue={setDemocracy}
      min={0}
      max={10}
      step={0.2}
      operator=">"
    />
  );
}
