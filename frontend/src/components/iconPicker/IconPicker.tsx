import classes from "./IconPicker.module.scss";
import cards from "../../assets/test/cards.png";
import casinoChip from "../../assets/test/casinoChip.png";
import coin from "../../assets/test/coin.png";
import crownIcon from "../../assets/test/crownIcon.png";
import diamond from "../../assets/test/diamond.png";
import medal from "../../assets/test/medal.png";
import rocket from "../../assets/test/rocket.png";
import shamrock from "../../assets/test/shamrock.png";
import star from "../../assets/test/star.png";
import { GameIcon } from "../../shared/types";
import { useState } from "react";

type IconPickerProps = { setIcon: (icon: GameIcon) => void };
const IconPicker = ({ setIcon }: IconPickerProps) => {
  const [selected, setSelected] = useState<GameIcon | null>();
  const handleOnClick = (icon: GameIcon) => {
    setIcon(icon);
    setSelected(icon);
  };

  return (
    <div className={classes.container}>
      <label>Icon aussuchen</label>
      <div className={classes.grid}>
        <img
          className={selected === GameIcon.Bar ? classes.active : undefined}
          src={cards}
          onClick={() => handleOnClick(GameIcon.Bar)}
        />
        <img
          className={selected === GameIcon.Bell ? classes.active : undefined}
          src={casinoChip}
          onClick={() => handleOnClick(GameIcon.Bell)}
        />
        <img
          className={selected === GameIcon.Coin ? classes.active : undefined}
          src={coin}
          onClick={() => handleOnClick(GameIcon.Coin)}
        />
        <img
          className={selected === GameIcon.Crown ? classes.active : undefined}
          src={crownIcon}
          onClick={() => handleOnClick(GameIcon.Crown)}
        />
        <img
          className={selected === GameIcon.Diamond ? classes.active : undefined}
          src={diamond}
          onClick={() => handleOnClick(GameIcon.Diamond)}
        />
        <img
          className={
            selected === GameIcon.Horseshoe ? classes.active : undefined
          }
          src={medal}
          onClick={() => handleOnClick(GameIcon.Horseshoe)}
        />
        <img
          className={selected === GameIcon.Seven ? classes.active : undefined}
          src={rocket}
          onClick={() => handleOnClick(GameIcon.Seven)}
        />
        <img
          className={
            selected === GameIcon.Shamrock ? classes.active : undefined
          }
          src={shamrock}
          onClick={() => handleOnClick(GameIcon.Shamrock)}
        />
        <img
          className={selected === GameIcon.Star ? classes.active : undefined}
          src={star}
          onClick={() => handleOnClick(GameIcon.Star)}
        />
      </div>
    </div>
  );
};

export default IconPicker;
