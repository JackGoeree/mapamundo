import { MapType } from "../Enums";

type MapTypeToggleProps = {
  label: string;
  value: MapType;
  activeMapType: MapType;
  setActiveMapType: (key: MapType) => void;
};

export default function MapTypeToggle({
  label,
  value,
  activeMapType,
  setActiveMapType,
}: MapTypeToggleProps) {
  return (
    <>
      <label>
        <input
          type="radio"
          name="mapType"
          value={value}
          checked={activeMapType === value}
          onChange={() => setActiveMapType(value)}
        />{" "}
        {label}
      </label>
      <br />
    </>
  );
}
