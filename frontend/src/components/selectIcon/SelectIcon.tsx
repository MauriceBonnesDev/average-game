import { GameIcon } from "../../shared/types";
import classes from "./SelectIcon.module.scss";

type SelectIconProps = {
  src: string;
  icon: GameIcon;
  selected: GameIcon | null;
  setIcon: (icon: GameIcon) => void;
  setSelected: (
    value: GameIcon | null | ((prevVar: GameIcon | null) => GameIcon | null)
  ) => void;
};

const SelectIcon = ({
  src,
  icon,
  selected,
  setIcon,
  setSelected,
}: SelectIconProps) => {
  const handleOnClick = () => {
    setIcon(icon);
    setSelected((prev: GameIcon | null) => (prev === icon ? null : icon));
  };

  return (
    <div
      className={`${classes.container} ${
        selected === icon ? classes.active : ""
      }`}
      onClick={handleOnClick}
    >
      <i className={`fa-regular fa-circle-check ${classes.checkIt}`}></i>
      <img src={src} />
    </div>
  );
};

export default SelectIcon;
