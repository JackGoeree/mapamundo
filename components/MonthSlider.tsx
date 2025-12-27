import React from "react";

const monthIndices = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type MonthSliderProps = {
  monthIndex: number;
  setMonthIndex: (index: number) => void;
};

export default function MonthSlider({
  monthIndex,
  setMonthIndex,
}: MonthSliderProps) {
  return (
    <div>
      <input
        id="month-slider"
        type="range"
        min={0}
        max={11}
        step={1}
        value={monthIndex}
        onChange={(e) => setMonthIndex(Number(e.target.value))}
      />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {monthIndices.map((m) => (
          <span key={m} style={{ fontSize: "0.75em" }}>
            {m}
          </span>
        ))}
      </div>
      <label htmlFor="month-slider">Month: {monthNames[monthIndex]}</label>
    </div>
  );
}
