import classes from "./NumberPicker.module.scss";
import { ChangeEvent } from "react";

type NumberPickerProps = {
  label: string;
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onIncrement: (name: string, step: number) => void;
  onDecrement: (name: string, step: number) => void;
};

const NumberPicker = ({
  label,
  name,
  value,
  min,
  max,
  step = 1,
  onChange,
  onDecrement,
  onIncrement,
}: NumberPickerProps) => {
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
  };

  return (
    <div className={classes.numberPicker}>
      <label htmlFor={label}>{label}</label>
      <div className={classes.inputContainer}>
        <span onClick={() => onDecrement(name, value - step)}>
          <i className="fas fa-minus"></i>
        </span>
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
        <span onClick={() => onIncrement(name, value + step)}>
          <i className="fas fa-plus"></i>
        </span>
      </div>
    </div>
  );
};

export default NumberPicker;
