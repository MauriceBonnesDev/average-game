import classes from "./Button.module.scss";
type Size = "small" | "medium" | "large" | "round";
type Style = "light" | "dark" | "grey";
export type Color = "purple" | "orange" | "green" | "turquoise" | "grey";
type ButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  size?: Size;
  style?: Style;
  color?: Color;
  onClick?: () => void;
};

const Button = ({
  children,
  disabled,
  size,
  style,
  color,
  onClick,
}: ButtonProps) => {
  const btnSize =
    size === "small"
      ? classes.btnSmall
      : size === "medium"
      ? classes.btnMedium
      : size === "large"
      ? classes.btnLarge
      : classes.btnRound;

  let btnStyle = "";
  if (style === "light") {
    if (color === "purple") {
      btnStyle = classes.btnLightPurple;
    } else if (color === "orange") {
      btnStyle = classes.btnLightOrange;
    } else if (color === "green") {
      btnStyle = classes.btnLightGreen;
    } else if (color === "turquoise") {
      btnStyle = classes.btnLightTurquoise;
    }
  } else if (style === "dark") {
    if (color === "purple") {
      btnStyle = classes.btnDarkPurple;
    } else if (color === "orange") {
      btnStyle = classes.btnDarkOrange;
    } else if (color === "green") {
      btnStyle = classes.btnDarkGreen;
    } else if (color === "turquoise") {
      btnStyle = classes.btnDarkTurquoise;
    }
  } else {
    btnStyle = classes.btnGrey;
  }

  return (
    <button
      className={`${classes.btn} ${btnSize} ${btnStyle}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
