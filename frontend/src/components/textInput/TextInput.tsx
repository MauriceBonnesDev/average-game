import classes from "./TextInput.module.scss";
import { ChangeEvent } from "react";

type TextInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const TextInput = ({ label, name, value, onChange }: TextInputProps) => {
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
    console.log(value);
    onChange(event);
  };
  return (
    <div className={classes.textInput}>
      <label htmlFor={label}>{label}</label>
      <input
        name={name}
        id={name}
        type="text"
        value={value}
        onChange={onInputChange}
      />
    </div>
  );
};

export default TextInput;
