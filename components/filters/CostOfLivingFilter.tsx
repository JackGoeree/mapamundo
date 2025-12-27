import NumberFilter from "./NumberFilter";

type CostOfLivingFilterProps = {
  costOfLiving: number | null;
  setCostOfLiving: (val: number | null) => void;
};

export default function CostOfLivingFilter({
  costOfLiving: cost,
  setCostOfLiving: setCost,
}: CostOfLivingFilterProps) {
  return (
    <NumberFilter
      label="Cost of Living"
      value={cost}
      setValue={setCost}
      min={0}
      max={5000}
      step={50}
      operator="<"
    />
  );
}
