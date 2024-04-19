import { useEffect, useState } from "react";
import { AverageGameInstance } from "../shared/types";

const useEventListening = (
  averageGameInstances: AverageGameInstance[],
  fetchSingleGame: (id: number) => void
) => {
  const [gameId, setGameId] = useState<number | null>(null);

  useEffect(() => {
    averageGameInstances
      .filter((game) => game.id === gameId || gameId === -1)
      .map((averageGame) => {
        averageGame.contract.on(
          averageGame.contract.filters["PlayerJoined(uint256,address,uint256)"],
          (gameId, player, totalPlayers) => {
            console.log(
              "Player",
              player,
              "joined game",
              gameId,
              "as player number",
              totalPlayers
            );
            fetchSingleGame(Number(gameId));
          }
        );
        averageGame.contract.on(
          averageGame.contract.filters[
            "PlayerRevealedGuess(uint256,address,uint256,string,uint8)"
          ],
          (gameId, player, guess, salt, revealState) => {
            console.log(
              "Player",
              player,
              "revealed value",
              guess,
              "with salt",
              salt,
              "and state",
              revealState
            );
            fetchSingleGame(Number(gameId));
          }
        );
        averageGame.contract.on(
          averageGame.contract.filters["FeeCollected(uint256,address,uint256)"],
          (gameId, player, amount) => {
            console.log(
              "Player",
              player,
              "collected fee",
              amount,
              "in game",
              gameId
            );
            fetchSingleGame(Number(gameId));
          }
        );

        averageGame.contract.on(
          averageGame.contract.filters["BettingRoundClosed(uint256)"],
          (gameId) => fetchSingleGame(Number(gameId))
        );

        averageGame.contract.on(
          averageGame.contract.filters["GameEnded(uint256)"],
          (gameId) => fetchSingleGame(Number(gameId))
        );

        averageGame.contract.on(
          averageGame.contract.filters[
            "PrizeAwarded(uint256,address,uint256,uint256)"
          ],
          (gameId) => fetchSingleGame(Number(gameId))
        );
      });
  }, [gameId]);

  return { setGameId };
};

export default useEventListening;
