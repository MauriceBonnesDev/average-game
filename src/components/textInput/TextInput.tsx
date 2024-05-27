import classes from "./TextInput.module.scss";
import { ChangeEvent } from "react";

type TextInputProps = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: ChangeEvent<HTMLInputElement>) => void;
};

const TextInput = ({
  label,
  name,
  value,
  placeholder,
  error,
  onChange,
  onBlur,
}: TextInputProps) => {
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        placeholder={placeholder}
        onChange={onInputChange}
        onBlur={onBlur}
        className={error ? classes.inputError : ""}
      />
      <p className={classes.error}>{error ? error : null}</p>
    </div>
  );
};

export default TextInput;
