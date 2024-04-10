import ethLogo from "../../assets/eth.svg";
import { AverageGameInstance } from "../../pages/games/GamesPage";
import Button from "../button/Button";
import classes from "./Card.module.scss";

const Card = ({
  name,
  id,
  entryPrice,
  totalPlayers,
  maxPlayers,
}: AverageGameInstance) => {
  const betAmount = parseFloat(entryPrice);
  const pricePool = totalPlayers * betAmount;

  return (
    <>
      <div className={classes.card}>
        <div className={classes.cardBody}>
          <h5>Get Started</h5>
          <h3>
            {name} #{id}
          </h3>
          <p>Trete bei und vervielfache dein Cash!</p>
        </div>
        <div className={classes.cardFooter}>
          <div className={classes.logoPlaceholder}></div>
          <div className={classes.cardInfoRows}>
            <div className={classes.cardInfoRow}>
              <img src={ethLogo} />
              <p className={classes.cardInfoPrice}>{betAmount.toFixed(2)}</p>
              <p className={classes.cardInfoName}>Entry</p>
            </div>
            <div className={classes.cardInfoRow}>
              <img className={classes.cardInfoLogo} src={ethLogo} />
              <p className={classes.cardInfoPrice}>{pricePool.toFixed(2)}</p>
              <p className={classes.cardInfoName}>Pricepool</p>
            </div>
          </div>
          <div className={classes.cardJoinSection}>
            <Button size="small">Join</Button>
            <p className={classes.playerCount}>
              {totalPlayers}/{maxPlayers}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Card;
