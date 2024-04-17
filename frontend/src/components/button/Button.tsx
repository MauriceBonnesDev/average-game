import { RotatingLines } from "react-loader-spinner";
import { Size, Style, Color } from "../../shared/types";
import Tooltip from "@mui/material/Tooltip";
import classes from "./Button.module.scss";

type ButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  info?: string;
  size?: Size;
  style?: Style;
  color?: Color;
  onClick?: () => void;
};

const Button = ({
  children,
  disabled,
  isLoading,
  info,
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
      : size === "round"
      ? classes.btnRound
      : classes.btnRoundSmall;

  let btnStyle = "";
  let strokeColor = "";
  if (style === "light") {
    if (color === "purple") {
      btnStyle = classes.btnLightPurple;
      strokeColor = "#beb6fc";
    } else if (color === "orange") {
      btnStyle = classes.btnLightOrange;
      strokeColor = "#ffd246";
    } else if (color === "green") {
      btnStyle = classes.btnLightGreen;
    } else if (color === "turquoise") {
      btnStyle = classes.btnLightTurquoise;
      strokeColor = "#49fff5";
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
    <Tooltip title={info} arrow>
      <span>
        <button
          className={`${classes.btn} ${btnSize} ${btnStyle}`}
          disabled={disabled}
          onClick={onClick}
        >
          {isLoading ? (
            <RotatingLines
              strokeWidth="3"
              width="35"
              animationDuration="1.25"
              strokeColor={strokeColor}
            />
          ) : (
            children
          )}
        </button>
      </span>
    </Tooltip>
  );
};

export default Button;
