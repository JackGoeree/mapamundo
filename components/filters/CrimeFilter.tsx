import NumberFilter from "./NumberFilter";

type CrimeFilterProps = {
  crime: number | null;
  setCrime: (val: number | null) => void;
};

export default function CrimeFilter({ crime, setCrime }: CrimeFilterProps) {
  return (
    <NumberFilter
      label="Crime"
      value={crime}
      setValue={setCrime}
      min={0}
      max={99}
      operator="<"
    />
  );
}
