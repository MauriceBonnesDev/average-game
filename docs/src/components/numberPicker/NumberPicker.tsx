import classes from "./NumberPicker.module.scss";
import { ChangeEvent } from "react";

type NumberPickerProps = {
  label: string;
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: ChangeEvent<HTMLInputElement>) => void;
  onStepChange: (name: string, step: number) => void;
};

const NumberPicker = ({
  label,
  name,
  value,
  min,
  max,
  step = 1,
  error,
  onChange,
  onBlur,
  onStepChange,
}: NumberPickerProps) => {
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
  };

  return (
    <div className={classes.numberPicker}>
      <label htmlFor={label}>{label}</label>
      <div
        className={`${classes.inputContainer} ${
          error ? classes.inputContainerError : ""
        }`}
      >
        <span
          className={classes.leftButton}
          onClick={() => onStepChange(name, -step)}
        >
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
          onBlur={onBlur}
        />
        <span
          className={classes.rightButton}
          onClick={() => onStepChange(name, step)}
        >
          <i className="fas fa-plus"></i>
        </span>
      </div>
      <p className={classes.error}>{error ? error : null}</p>
    </div>
  );
};

export default NumberPicker;
