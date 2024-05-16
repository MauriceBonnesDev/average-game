import cards from "../../assets/cards.png";
import arrowRight from "../../assets/arrowRight.svg";
import closeIcon from "../../assets/close.svg";
import casinoChip from "../../assets/casinoChip.png";
import coin from "../../assets/coin.png";
import crown from "../../assets/crown.png";
import diamond from "../../assets/diamond.png";
import medal from "../../assets/medal.png";
import rocket from "../../assets/rocket.png";
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
import { Box, Tooltip } from "@mui/material";

type CardProps = {
  gameInstance: AverageGameInstance;
  connectedAccount: string;
  isLoading: boolean;
  currentFocusedGame: number | null;
  setCurrentFocusedGame: (id: number) => void;
  setIsLoading: (isLoading: boolean) => void;
};

const icons = [
  cards,
  casinoChip,
  coin,
  crown,
  diamond,
  medal,
  rocket,
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
  const playerIndex = gameInstance.players.indexOf(connectedAccount) + 1;
  const [playerRevealed, setPlayerRevealed] = useState(false);
  const [isPotentialWinner, setIsPotentialWinner] = useState(false);
  const [collateralShare, setCollateralShare] = useState(0);
  const isWinner = gameInstance.winner === connectedAccount;
  const rewardClaimed = gameInstance.rewardClaimed;
  const feeClaimed = gameInstance.feeClaimed;
  const [loadingButton, setLoadingButton] = useState<
    "refund" | "action" | "nextPhase" | "collateralShare" | "gameFee"
  >("action");

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

    const getIsPotentialWinner = async () => {
      const isPotWinner = await gameInstance.contract.getIsPotentialWinner(
        connectedAccount
      );
      setIsPotentialWinner(isPotWinner);
    };

    const getCollateralShare = async () => {
      const share = Number(await gameInstance.contract.collateralShare());
      setCollateralShare(share);
    };

    getPlayerRevealedState();
    getCollateralShare();
    getIsPotentialWinner();
  }, [connectedAccount, gameInstance.contract]);

  let cardColor = classes.cardPurple;

  let footerColor = classes.cardFooterPurple;
  let logoColor = classes.logoPurple;

  let color: Color = "purple";

  if (playerJoined && gameInstance.gameState === GameState.CommitPhase) {
    cardColor = classes.cardGreen;
    footerColor = classes.cardFooterGreen;
    logoColor = classes.logoGreen;
    color = "green";
  } else if (
    gameInstance.gameState === GameState.RevealPhase ||
    gameInstance.gameState === GameState.Ended
  ) {
    cardColor = classes.cardTurquoise;
    footerColor = classes.cardFooterTurquoise;
    logoColor = classes.logoTurquoise;
    color = "turquoise";
  }

  const claimFee = async () => {
    try {
      setIsLoading(true);
      setLoadingButton("gameFee");
      setCurrentFocusedGame(gameInstance.id);
      await gameInstance.contract.withdrawGameFees();
    } catch (error) {
      toast.error(transformError(error), { id: "error" });
      setIsLoading(false);
    }
  };

  const nextPhase = async () => {
    const phase = gameInstance.gameState;
    try {
      setIsLoading(true);
      setLoadingButton("nextPhase");
      setCurrentFocusedGame(gameInstance.id);
      if (phase === GameState.CommitPhase) {
        await gameInstance.contract.startRevealPhase();
      } else if (phase === GameState.RevealPhase) {
        await gameInstance.contract.endGame();
      } else if (phase === GameState.Ended && !feeClaimed) {
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
      setLoadingButton("action");
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
      setLoadingButton("refund");
      setCurrentFocusedGame(gameInstance.id);
      await gameInstance.contract.requestRefund();
    } catch (error) {
      toast.error(transformError(error), { id: "error" });
      setIsLoading(false);
    }
  };

  const withdrawCollateralShare = async () => {
    try {
      setIsLoading(true);
      setLoadingButton("collateralShare");
      setCurrentFocusedGame(gameInstance.id);
      await gameInstance.contract.withdrawCollateralShare();
    } catch (error) {
      toast.error(transformError(error), { id: "error" });
      setIsLoading(false);
    }
  };

  const joinGame = () => {
    if (joinGameRef.current) {
      setCurrentFocusedGame(gameInstance.id);
      setLoadingButton("action");
      joinGameRef.current.joinGame();
    }
  };

  const revealGuess = () => {
    if (joinGameRef.current) {
      setCurrentFocusedGame(gameInstance.id);
      setLoadingButton("action");
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

  const showDisableCard = () => {
    if (gameInstance.gameState !== GameState.Ended) {
      return false;
    }

    const canClaimShare = isPotentialWinner && !isWinner && collateralShare > 0;
    if (
      !isWinner &&
      ((!gameMasterConnected && !canClaimShare) ||
        (gameMasterConnected && feeClaimed && !canClaimShare))
    ) {
      return true;
    }

    if (
      isWinner &&
      ((!gameMasterConnected && rewardClaimed) ||
        (gameMasterConnected && feeClaimed && rewardClaimed))
    ) {
      return true;
    }

    return false;
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
          closeModal={dialog.current?.close}
        />
      </Modal>
      <div className={`${classes.card} ${cardColor}`}>
        {showDisableCard() && <div className={classes.disableCard}></div>}
        {isWinner && <img className={classes.crown} src={crown} />}

        <div
          className={`${classes.refundButton} ${
            gameInstance.gameState !== GameState.CommitPhase || !playerJoined
              ? classes.hide
              : ""
          }`}
        ></div>

        <p className={classes.revealOrder}>
          {gameInstance.gameState === GameState.RevealPhase && playerJoined
            ? `Du musst als ${playerIndex}. veröffentlichen`
            : ""}
        </p>
        <div className={classes.cardBodyContent}>
          <h5>Get Started</h5>
          <Tooltip title={`${name} #${id}`}>
            <div style={{ width: "100%", textWrap: "nowrap" }}>
              <Box component="h3" textOverflow="ellipsis" overflow="hidden">
                {name} #{id}
              </Box>
            </div>
          </Tooltip>
          <p>Trete bei und vervielfache dein Cash!</p>
        </div>
        {gameInstance.gameState === GameState.CommitPhase && playerJoined && (
          <div className={classes.refundButton}>
            <Button
              color={color}
              style="light"
              size="round-small"
              disabled={isLoading && currentFocusedGame === gameInstance.id}
              isLoading={
                isLoading &&
                loadingButton === "refund" &&
                currentFocusedGame === gameInstance.id
              }
              onClick={requestRefund}
              info="Refund beantragen: Du bekommst dein Einsatz und deine Kaution zurück!"
            >
              <img src={closeIcon} />
            </Button>
          </div>
        )}
        <div className={`${classes.cardFooter} ${footerColor}`}>
          <div className={`${classes.logo} ${logoColor}`}>
            <img src={icons[gameInstance.icon]} />
          </div>
          <div className={classes.cardInfoRows}>
            <CardInfoRow amount={betAmount} title="Entry" />
            <CardInfoRow amount={pricePool} title="Pricepool" />
          </div>
          <div className={classes.cardJoinSection}>
            {gameInstance.gameState === GameState.CommitPhase &&
            !playerJoined ? (
              <Button
                color={color}
                disabled={
                  playerJoined ||
                  (isLoading && currentFocusedGame === gameInstance.id)
                }
                isLoading={
                  isLoading &&
                  loadingButton === "action" &&
                  currentFocusedGame === gameInstance.id
                }
                style="light"
                onClick={openModal}
                size="small"
                info="Tritt dem Spiel bei!"
              >
                Join
              </Button>
            ) : gameInstance.gameState === GameState.RevealPhase &&
              !playerRevealed ? (
              <Button
                color={color}
                disabled={
                  !playerJoined ||
                  playerRevealed ||
                  (isLoading && currentFocusedGame === gameInstance.id)
                }
                isLoading={
                  isLoading &&
                  loadingButton === "action" &&
                  currentFocusedGame === gameInstance.id
                }
                style="light"
                onClick={openModal}
                size="small"
              >
                Reveal
              </Button>
            ) : gameInstance.gameState === GameState.Ended &&
              isWinner &&
              !rewardClaimed ? (
              <Button
                color={color}
                disabled={
                  rewardClaimed ||
                  (isLoading && currentFocusedGame === gameInstance.id)
                }
                isLoading={
                  isLoading &&
                  loadingButton === "action" &&
                  currentFocusedGame === gameInstance.id
                }
                style="light"
                onClick={claimReward}
                size="small"
              >
                Claim Reward
              </Button>
            ) : gameInstance.gameState === GameState.Ended &&
              playerRevealed &&
              isPotentialWinner &&
              collateralShare > 0 &&
              !isWinner ? (
              <Button
                color={color}
                disabled={
                  !isPotentialWinner ||
                  (isLoading && currentFocusedGame === gameInstance.id)
                }
                isLoading={
                  isLoading &&
                  loadingButton === "action" &&
                  currentFocusedGame === gameInstance.id
                }
                style="light"
                onClick={withdrawCollateralShare}
                size="small"
                info="Die Kaution von denjenigen, die nicht reavealt haben, wird unter allen Teilnehmern aufgeteilt."
              >
                Claim Share
              </Button>
            ) : connectedAccount === gameInstance.gameMaster &&
              gameInstance.gameState === GameState.Ended &&
              !feeClaimed ? (
              <Button
                color={color}
                style="light"
                disabled={
                  (isLoading && currentFocusedGame === gameInstance.id) ||
                  (gameInstance.gameState === GameState.Ended && feeClaimed)
                }
                isLoading={
                  isLoading &&
                  loadingButton === "gameFee" &&
                  currentFocusedGame === gameInstance.id
                }
                onClick={claimFee}
                size="small"
              >
                Claim Fee
              </Button>
            ) : gameInstance.gameState !== GameState.Ended ? (
              <Button
                color={color}
                style="light"
                size="round-small"
                disabled={isLoading && currentFocusedGame === gameInstance.id}
                isLoading={
                  isLoading &&
                  loadingButton === "nextPhase" &&
                  currentFocusedGame === gameInstance.id
                }
                onClick={nextPhase}
                info="Leitet die nächste Phase ein!"
              >
                <img src={arrowRight} />
              </Button>
            ) : (
              <Button
                color={color}
                disabled={true}
                style="light"
                onClick={claimReward}
                size="small"
              >
                {playerJoined && !isWinner
                  ? "Lost"
                  : isWinner
                  ? "Rewards claimed"
                  : "Ended"}
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
