import classes from "./Button.module.scss";
type Size = "small" | "medium" | "large";
type Style = "light" | "dark";
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
      : classes.btnLarge;

  const btnStyle = style === "dark" ? classes.btnDark : classes.btnLight;

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
