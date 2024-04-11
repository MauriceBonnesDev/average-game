import chevronUp from "../../assets/chevron-up.svg";
import chevronDown from "../../assets/chevron-down.svg";
import classes from "./NumberPicker.module.scss";
import { ChangeEvent } from "react";

type NumberPickerProps = {
  label: string;
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const NumberPicker = ({
  label,
  name,
  value,
  min,
  max,
  step = "0.1",
  onChange,
}: NumberPickerProps) => {
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
    console.log(value);
    onChange(event);
  };
  return (
    <div className={classes.numberPicker}>
      <img src={chevronUp} />
      <div className={classes.inputContainer}>
        <label htmlFor={label}>{label}</label>
        <input
          name={name}
          id={name}
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={onInputChange}
        />
      </div>
      <img src={chevronDown} />
    </div>
  );
};

export default NumberPicker;
