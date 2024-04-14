import crown from "../../assets/crown.png";
import { useEffect, useRef, useState } from "react";
import ethLogo from "../../assets/eth.svg";
import {
  AverageGameInstance,
  GameState,
  RevealState,
} from "../../pages/games/GamesPage";
import Button, { Color } from "../button/Button";
import JoinGame, { JoinGameRef } from "../joinGame/JoinGame";
import Modal, { DialogRef } from "../modal/Modal";
import classes from "./Card.module.scss";
import toast from "react-hot-toast";
import PhaseProgress from "../phaseProgress/PhaseProgress";

type CardProps = {
  gameInstance: AverageGameInstance;
  connectedAccount: string;
  isLoading: boolean;
  currentFocusedGame: number | null;
  setCurrentFocusedGame: (id: number) => void;
  setIsLoading: (isLoading: boolean) => void;
};

export function transformError(error: unknown) {
  const errorMessage = String(error);
  const message = errorMessage.slice(
    errorMessage.indexOf('"') + 1,
    errorMessage.indexOf("(") - 2
  );

  return message;
}
const Card = ({
  gameInstance,
  connectedAccount,
  isLoading,
  currentFocusedGame,
  setCurrentFocusedGame,
  setIsLoading,
}: CardProps) => {
  const { id, name, entryPrice, totalPlayers, maxPlayers } = gameInstance;
  const betAmount = parseFloat(entryPrice);
  const pricePool = totalPlayers * betAmount;
  const dialog = useRef<DialogRef>(null);
  const joinGameRef = useRef<JoinGameRef>(null);
  const gameMasterConnected = connectedAccount === gameInstance.gameMaster;
  const playerJoined = gameInstance.players.includes(connectedAccount);
  const [playerRevealed, setPlayerRevealed] = useState(false);
  const isWinner = gameInstance.winner === connectedAccount;
  const rewardClaimed = gameInstance.rewardClaimed;
  console.log(gameInstance.rewardClaimed);

  useEffect(() => {
    const getPlayerRevealedState = async () => {
      gameInstance.contract
        .getPlayerRevealedState(connectedAccount)
        .then((state) => {
          setPlayerRevealed(
            Number(state) === RevealState.Revealed ||
              Number(state) === RevealState.Invalid
          );
        });
    };
    getPlayerRevealedState();
  }, [connectedAccount, gameInstance.contract]);

  let cardColor = classes.cardPurple;

  let footerColor = classes.cardFooterPurple;

  let color: Color = "purple";

  if (gameMasterConnected) {
    cardColor = classes.cardTurquoise;
    footerColor = classes.cardFooterTurquoise;
    color = "turquoise";
  } else if (
    playerJoined &&
    !gameMasterConnected &&
    gameInstance.gameState === GameState.CommitPhase
  ) {
    cardColor = classes.cardGreen;
    footerColor = classes.cardFooterGreen;
    color = "green";
  } else if (
    gameInstance.gameState === GameState.RevealPhase ||
    gameInstance.gameState === GameState.Ended
  ) {
    cardColor = classes.cardOrange;
    footerColor = classes.cardFooterOrange;
    color = "orange";
  }

  const nextPhase = async () => {
    const phase = gameInstance.gameState;
    try {
      if (phase === GameState.CommitPhase) {
        await gameInstance.contract.closeBettingRound();
      } else if (phase === GameState.RevealPhase) {
        console.log("End Game");
        await gameInstance.contract.endGame();
      }
    } catch (error) {
      toast.error(transformError(error), { id: "error" });
    }
  };

  const claimReward = async () => {
    try {
      await gameInstance.contract.withdrawPricepool(connectedAccount);
    } catch (error) {
      toast.error(transformError(error), { id: "error" });
    }
  };

  const joinGame = () => {
    if (joinGameRef.current) {
      setCurrentFocusedGame(gameInstance.id);
      joinGameRef.current.joinGame();
    }
  };

  const revealGuess = () => {
    if (joinGameRef.current) {
      joinGameRef.current.revealGuess();
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
      {gameInstance.gameState === GameState.CommitPhase ? (
        <Modal
          title="Join Game"
          disclaimer="Wähle eine Zahl zwischen 0 und 1000"
          submitText="Join"
          onClick={joinGame}
          onClose={handleJoinGameClose}
          ref={dialog}
        >
          <JoinGame
            ref={joinGameRef}
            setIsLoading={setIsLoading}
            gameInstance={gameInstance}
          />
        </Modal>
      ) : (
        <Modal
          title="Veröffentliche deinen Tipp!"
          disclaimer="Wähle genau die Zahl und das Geheimnis was du vorher gewählt hast."
          submitText="Reveal"
          onClick={revealGuess}
          onClose={handleJoinGameClose}
          ref={dialog}
        >
          <JoinGame
            ref={joinGameRef}
            setIsLoading={setIsLoading}
            gameInstance={gameInstance}
          />
        </Modal>
      )}
      <div className={`${classes.card} ${cardColor}`}>
        {gameInstance.gameState === GameState.Ended &&
          (!isWinner || rewardClaimed) && (
            <div className={classes.disableCard}></div>
          )}
        {isWinner && <img className={classes.crown} src={crown} />}
        {/* <div className={classes.phaseProgressContainer}>
          <PhaseProgress />
        </div> */}
        <div className={classes.cardBody}>
          <h5>Get Started</h5>
          <h3>
            {name} #{id}
          </h3>
          <p>Trete bei und vervielfache dein Cash!</p>
        </div>
        <div className={`${classes.cardFooter} ${footerColor}`}>
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
            {connectedAccount === gameInstance.gameMaster ? (
              <Button
                color={color}
                style="light"
                onClick={nextPhase}
                size="small"
              >
                {gameInstance.gameState === GameState.CommitPhase
                  ? "Start Reveal"
                  : "End Game"}
              </Button>
            ) : gameInstance.gameState === GameState.CommitPhase ? (
              <Button
                color={color}
                disabled={playerJoined || isLoading}
                style="light"
                onClick={openModal}
                size="small"
              >
                {playerJoined
                  ? "Joined"
                  : isLoading && currentFocusedGame === gameInstance.id
                  ? "Loading..."
                  : "Join"}
              </Button>
            ) : gameInstance.gameState === GameState.RevealPhase ? (
              <Button
                color={color}
                disabled={playerRevealed}
                style="light"
                onClick={openModal}
                size="small"
              >
                {playerRevealed ? "Revealed" : "Reveal"}
              </Button>
            ) : gameInstance.gameState === GameState.Ended && isWinner ? (
              <Button
                color={color}
                disabled={rewardClaimed}
                style="light"
                onClick={claimReward}
                size="small"
              >
                {rewardClaimed ? "Reward claimed" : "Claim Reward"}
              </Button>
            ) : (
              <Button
                color={color}
                disabled
                style="light"
                onClick={claimReward}
                size="small"
              >
                Lost
              </Button>
            )}
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
