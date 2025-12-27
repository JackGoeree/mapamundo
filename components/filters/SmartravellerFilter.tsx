import NumberFilter from "./NumberFilter";

type SmartravellerFilterProps = {
  smartraveller: number | null;
  setSmartraveller: (val: number | null) => void;
};

export default function SmartravellerFilter({
  smartraveller: smartraveller,
  setSmartraveller: setSmartraveller,
}: SmartravellerFilterProps) {
  return (
    <NumberFilter
      label="Smartraveller"
      value={smartraveller}
      setValue={setSmartraveller}
      min={1}
      max={5}
      operator="<"
    />
  );
}
