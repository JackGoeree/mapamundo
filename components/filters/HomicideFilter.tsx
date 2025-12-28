import NumberFilter from "./NumberFilter";

type HomicideFilterProps = {
  homicideRate: number | null;
  setHomicideRate: (val: number | null) => void;
};

export default function HomicideFilter({
  homicideRate,
  setHomicideRate,
}: HomicideFilterProps) {
  return (
    <NumberFilter
      label="Homicide Rate"
      value={homicideRate}
      setValue={setHomicideRate}
      min={0}
      max={50}
      step={1}
      operator="<"
    />
  );
}
