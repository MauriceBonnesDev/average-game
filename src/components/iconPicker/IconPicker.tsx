import classes from "./IconPicker.module.scss";
import cards from "../../assets/cards.png";
import casinoChip from "../../assets/casinoChip.png";
import coin from "../../assets/coin.png";
import crown from "../../assets/crown.png";
import diamond from "../../assets/diamond.png";
import medal from "../../assets/medal.png";
import rocket from "../../assets/rocket.png";
import shamrock from "../../assets/shamrock.png";
import star from "../../assets/star.png";
import { GameIcon } from "../../shared/types";
import SelectIcon from "../selectIcon/SelectIcon";
import { useEffect, useState } from "react";

type IconPickerProps = {
  icon: GameIcon | null;
  setIcon: (icon: GameIcon) => void;
  error?: string;
};

const IconPicker = ({ icon, setIcon, error }: IconPickerProps) => {
  const [selected, setSelected] = useState<GameIcon | null>(null);

  useEffect(() => {
    if (!icon) {
      setSelected(null);
    }
  }, [icon]);

  return (
    <div className={classes.container}>
      <label>Icon aussuchen</label>
      <div className={classes.grid}>
        <SelectIcon
          icon={GameIcon.Cards}
          src={cards}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
        <SelectIcon
          icon={GameIcon.CasinoChip}
          src={casinoChip}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
        <SelectIcon
          icon={GameIcon.Coin}
          src={coin}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
        <SelectIcon
          icon={GameIcon.Crown}
          src={crown}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
        <SelectIcon
          icon={GameIcon.Diamond}
          src={diamond}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
        <SelectIcon
          icon={GameIcon.Medal}
          src={medal}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
        <SelectIcon
          icon={GameIcon.Rocket}
          src={rocket}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
        <SelectIcon
          icon={GameIcon.Shamrock}
          src={shamrock}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
        <SelectIcon
          icon={GameIcon.Star}
          src={star}
          setIcon={setIcon}
          selected={selected}
          setSelected={setSelected}
        />
      </div>
      <p className={classes.error}>{error ? error : null}</p>
    </div>
  );
};

export default IconPicker;
