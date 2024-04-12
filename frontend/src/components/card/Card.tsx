import { useRef } from "react";
import ethLogo from "../../assets/eth.svg";
import { AverageGameInstance } from "../../pages/games/GamesPage";
import Button from "../button/Button";
import JoinGame, { JoinGameRef } from "../joinGame/JoinGame";
import Modal, { DialogRef } from "../modal/Modal";
import classes from "./Card.module.scss";

type CardProps = {
  gameInstance: AverageGameInstance;
};

const Card = ({ gameInstance }: CardProps) => {
  const { id, name, entryPrice, totalPlayers, maxPlayers } = gameInstance;
  const betAmount = parseFloat(entryPrice);
  const pricePool = totalPlayers * betAmount;
  const dialog = useRef<DialogRef>(null);
  const joinGameRef = useRef<JoinGameRef>(null);

  const joinGame = () => {
    if (joinGameRef.current) {
      joinGameRef.current.joinGame();
    }
  };

  const handleJoinGameClose = () => {
    if (joinGameRef.current) {
      joinGameRef.current.close();
    }
  };

  const openModal = () => {
    dialog.current?.open();
  };

  return (
    <>
      <Modal
        title="Join Game"
        disclaimer="Wähle eine Zahl zwischen 0 und 1000"
        submitText="Join"
        onClick={joinGame}
        onClose={handleJoinGameClose}
        ref={dialog}
      >
        <JoinGame ref={joinGameRef} gameInstance={gameInstance} />
      </Modal>
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
            <Button onClick={openModal} size="small">
              Join
            </Button>
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
