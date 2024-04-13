import classes from "./Button.module.scss";
type Size = "small" | "medium" | "large" | "round";
type Style = "light" | "dark" | "grey";
type ButtonProps = {
  children: React.ReactNode;
  size?: Size;
  style?: Style;
  onClick?: () => void;
};

const Button = ({ children, size, style, onClick }: ButtonProps) => {
  const btnSize =
    size === "small"
      ? classes.btnSmall
      : size === "medium"
      ? classes.btnMedium
      : size === "large"
      ? classes.btnLarge
      : classes.btnRound;

  const btnStyle =
    style === "dark"
      ? classes.btnDark
      : style === "grey"
      ? classes.btnGrey
      : classes.btnLight;

  return (
    <button
      className={`${classes.btn} ${btnSize} ${btnStyle}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
