import crown from "../../assets/crown.png";
import bar from "../../assets/bar.png";
import bell from "../../assets/bell.png";
import coin from "../../assets/coin.png";
import crownIcon from "../../assets/crownIcon.png";
import diamond from "../../assets/diamond.png";
import horseshoe from "../../assets/horseshoe.png";
import seven from "../../assets/seven.png";
import shamrock from "../../assets/shamrock.png";
import star from "../../assets/star.png";
import { useEffect, useRef, useState } from "react";
import Button from "../button/Button";
import JoinGame, { JoinGameRef } from "../joinGame/JoinGame";
import Modal, { DialogRef } from "../modal/Modal";
import classes from "./Card.module.scss";
import toast from "react-hot-toast";
import {
  AverageGameInstance,
  Color,
  GameState,
  RevealState,
} from "../../shared/types";
import { transformError } from "../../shared/utils";
import CardInfoRow from "./CardInfoRow";

type CardProps = {
  gameInstance: AverageGameInstance;
  connectedAccount: string;
  isLoading: boolean;
  currentFocusedGame: number | null;
  setCurrentFocusedGame: (id: number) => void;
  setIsLoading: (isLoading: boolean) => void;
};

const icons = [
  bar,
  bell,
  coin,
  crownIcon,
  diamond,
  horseshoe,
  seven,
  shamrock,
  star,
];

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
  const feeClaimed = gameInstance.feeClaimed;

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
      setIsLoading(true);
      if (phase === GameState.CommitPhase) {
        await gameInstance.contract.startRevealPhase();
      } else if (phase === GameState.RevealPhase) {
        await gameInstance.contract.endGame();
      } else if (phase === GameState.Ended && !feeClaimed) {
        console.log(connectedAccount, gameInstance.gameMaster);
        await gameInstance.contract.withdrawGameFees();
      }
    } catch (error) {
      toast.error(transformError(error), { id: "error" });
      setIsLoading(false);
    }
  };

  const claimReward = async () => {
    try {
      setIsLoading(true);
      setCurrentFocusedGame(gameInstance.id);
      await gameInstance.contract.withdrawPricepool(connectedAccount);
    } catch (error) {
      toast.error(transformError(error), { id: "error" });
      setIsLoading(false);
    }
  };

  const requestRefund = async () => {
    try {
      setIsLoading(true);
      setCurrentFocusedGame(gameInstance.id);
      await gameInstance.contract.requestRefund();
    } catch (error) {
      toast.error(transformError(error), { id: "error" });
      setIsLoading(false);
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
      setCurrentFocusedGame(gameInstance.id);
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
  const modalTitle =
    gameInstance.gameState === GameState.CommitPhase
      ? "Join Game"
      : "Veröffentliche deinen Tipp!";
  const disclaimer =
    gameInstance.gameState === GameState.CommitPhase
      ? "Wähle eine Zahl zwischen 0 und 1000"
      : "Wähle genau die Zahl und das Geheimnis was du vorher gewählt hast.";
  const submitText =
    gameInstance.gameState === GameState.CommitPhase ? "Join" : "Reveal";
  const onModalClick = () => {
    gameInstance.gameState === GameState.CommitPhase
      ? joinGame()
      : revealGuess();
  };

  return (
    <>
      <Modal
        title={modalTitle}
        disclaimer={disclaimer}
        submitText={submitText}
        onClick={onModalClick}
        onClose={handleJoinGameClose}
        ref={dialog}
      >
        <JoinGame
          ref={joinGameRef}
          setIsLoading={setIsLoading}
          gameInstance={gameInstance}
        />
      </Modal>
      <div className={`${classes.card} ${cardColor}`}>
        {gameInstance.gameState === GameState.Ended &&
          ((!isWinner && !gameMasterConnected) ||
            (isWinner && rewardClaimed) ||
            (gameMasterConnected && feeClaimed)) && (
            <div className={classes.disableCard}></div>
          )}
        {isWinner && <img className={classes.crown} src={crown} />}

        <div
          className={`${classes.refundButton} ${
            gameInstance.gameState === GameState.Ended ? classes.hide : ""
          }`}
        >
          <Button
            color={color}
            style="light"
            size="round-small"
            disabled={isLoading && currentFocusedGame === gameInstance.id}
            isLoading={isLoading && currentFocusedGame === gameInstance.id}
            onClick={requestRefund}
            info="Refund beantragen: Beendet das aktuelle Spiel und zahlt alle Spieler aus!"
          >
            !
          </Button>
        </div>
        <div className={classes.cardBody}>
          <h5>Get Started</h5>
          <h3>
            {name} #{id}
          </h3>
          <p>Trete bei und vervielfache dein Cash!</p>
        </div>
        <div className={`${classes.cardFooter} ${footerColor}`}>
          <div className={classes.logoPlaceholder}>
            <img src={icons[gameInstance.icon]} />
          </div>
          <div className={classes.cardInfoRows}>
            <CardInfoRow amount={betAmount} title="Entry" />
            <CardInfoRow amount={pricePool} title="Pricepool" />
          </div>
          <div className={classes.cardJoinSection}>
            {connectedAccount === gameInstance.gameMaster ? (
              <Button
                color={color}
                style="light"
                disabled={
                  (isLoading && currentFocusedGame === gameInstance.id) ||
                  (gameInstance.gameState === GameState.Ended && feeClaimed)
                }
                isLoading={isLoading && currentFocusedGame === gameInstance.id}
                onClick={nextPhase}
                size="small"
              >
                {gameInstance.gameState === GameState.CommitPhase
                  ? "Start Reveal"
                  : gameInstance.gameState === GameState.RevealPhase
                  ? "End Game"
                  : gameInstance.gameState === GameState.Ended && feeClaimed
                  ? "Game ended"
                  : "Claim Fee"}
              </Button>
            ) : gameInstance.gameState === GameState.CommitPhase ? (
              <Button
                color={color}
                disabled={
                  playerJoined ||
                  (isLoading && currentFocusedGame === gameInstance.id)
                }
                isLoading={isLoading && currentFocusedGame === gameInstance.id}
                style="light"
                onClick={openModal}
                size="small"
              >
                {playerJoined ? "Joined" : "Join"}
              </Button>
            ) : gameInstance.gameState === GameState.RevealPhase ? (
              <Button
                color={color}
                disabled={
                  playerRevealed ||
                  (isLoading && currentFocusedGame === gameInstance.id)
                }
                isLoading={isLoading && currentFocusedGame === gameInstance.id}
                style="light"
                onClick={openModal}
                size="small"
              >
                {playerRevealed ? "Revealed" : "Reveal"}
              </Button>
            ) : gameInstance.gameState === GameState.Ended && isWinner ? (
              <Button
                color={color}
                disabled={
                  rewardClaimed ||
                  (isLoading && currentFocusedGame === gameInstance.id)
                }
                isLoading={isLoading && currentFocusedGame === gameInstance.id}
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
