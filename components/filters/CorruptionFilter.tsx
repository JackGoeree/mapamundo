import NumberFilter from "./NumberFilter";

type CorruptionFilterProps = {
  corruption: number | null;
  setCorruption: (val: number | null) => void;
};

export default function CorruptionFilter({
  corruption: corruption,
  setCorruption: setCorruption,
}: CorruptionFilterProps) {
  return (
    <NumberFilter
      label="Corruption"
      value={corruption}
      setValue={setCorruption}
      min={0}
      max={99}
      operator=">"
    />
  );
}
