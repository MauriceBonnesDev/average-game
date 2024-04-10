import classes from "./Button.module.scss";
type Size = "small" | "medium" | "large";
type ButtonProps = {
  children: React.ReactNode;
  size?: Size;
  onClick?: () => void;
};

const Button = ({ children, size, onClick }: ButtonProps) => {
  const btnSize =
    size === "small"
      ? classes.btnSmall
      : size === "medium"
      ? classes.btnMedium
      : classes.btnLarge;

  return (
    <button className={`${classes.btn} ${btnSize}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
