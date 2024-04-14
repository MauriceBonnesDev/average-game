import classes from "./GamesPage.module.scss";
import Card from "../../components/card/Card";
import addresses from "../../../../backend/ignition/deployments/chain-31337/deployed_addresses.json"; // Change to 11155111 for the Sepolia Testnet, now running on localhost
import { useWeb3Context } from "../../components/Web3Provider";
import { useEffect, useMemo, useRef, useState } from "react";
import { AverageGameModule_AverageGameFactory__factory as AverageGameFactory } from "../../../types/ethers-contracts/factories/AverageGameModule_AverageGameFactory__factory";
import { AverageGameModule_AverageGame__factory as AverageGame } from "../../../types/ethers-contracts/factories/AverageGameModule_AverageGame__factory";
import type { AverageGameModule_AverageGameFactory as TAverageGameFactory } from "../../../types/ethers-contracts/AverageGameModule_AverageGameFactory";
import type { AverageGameModule_AverageGame as TAverageGame } from "../../../types/ethers-contracts/AverageGameModule_AverageGame";
import { formatEther } from "ethers";
import Modal, { DialogRef } from "../../components/modal/Modal";
import CreateGame, {
  CreateGameRef,
} from "../../components/createGame/CreateGame";
import { Swiper, SwiperSlide } from "swiper/react";
import { Grid, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/grid";
import "../../index.scss";
import Button from "../../components/button/Button";
import { AverageGameInstance } from "../../shared/types";

//TODO: Join Game screen, undeutlich, da geheimnis genau unter dem Text "Wähle eine Zahl zwischen 0 und 1000"
//TODO: Outsource creation of event handlers into a separate useEffect to only run on initial render -> later on only whenever a new game is created
const GamesPage = () => {
  const { wallet } = useWeb3Context();
  const dialog = useRef<DialogRef>(null);
  const createGameRef = useRef<CreateGameRef>(null);
  const [factoryContract, setFactoryContract] =
    useState<TAverageGameFactory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFocusedGame, setCurrentFocusedGame] = useState<number | null>(
    null
  );

  const [averageGameInstances, setAverageGameInstances] = useState<
    AverageGameInstance[]
  >([]);
  const isMounted = useRef(true);

  useEffect(() => {
    if (wallet) {
      const gameFactory = AverageGameFactory.connect(
        addresses["AverageGameModule#AverageGameFactory"],
        wallet
      );

      setFactoryContract(gameFactory);
    }
  }, [wallet]);

  useMemo(() => {
    if (factoryContract) {
      const createGameInstances = async (
        games: TAverageGame[]
      ): Promise<AverageGameInstance[]> => {
        return await Promise.all(
          games.map(async (game) => {
            const id = Number(await game.id());
            return {
              id,
              name: await game.name(),
              entryPrice: formatEther(await game.betAmount()),
              totalPlayers: Number(await game.totalPlayers()),
              maxPlayers: Number(await game.maxPlayers()),
              contract: game,
              address: await factoryContract.getGameProxyAt(id),
              collateral: formatEther(await game.collateralAmount()),
              gameFee: formatEther(await game.gameFee()),
              players: await game.getPlayers(),
              gameState: Number(await game.state()),
              gameMaster: await game.gameMaster(),
              winner: await game.winner(),
              rewardClaimed: await game.rewardClaimed(),
            };
          })
        );
      };

      const fetchGames = async () => {
        console.log("Fetch Games");
        try {
          isMounted.current = false;
          const gameProxies = await factoryContract.getGameProxies();
          const games = gameProxies.map((proxy) =>
            AverageGame.connect(proxy, wallet)
          );

          const gameInstances: AverageGameInstance[] =
            await createGameInstances(games);

          setAverageGameInstances(gameInstances);
        } catch (error) {
          console.error("Error fetching games data:", error);
        }
      };

      const fetchSingleGame = async (id: number) => {
        console.log("Fetch single game");
        try {
          const gameProxies = await factoryContract.getGameProxies();
          console.log(wallet?.address);
          const games = gameProxies.map((proxy) =>
            AverageGame.connect(proxy, wallet)
          );

          const gameInstance: AverageGameInstance[] = await createGameInstances(
            [games[id]]
          );

          setAverageGameInstances((prevInstances) => {
            console.log("setAverageGameInstances!!!!");
            const newInstances = prevInstances.filter(
              (instances) => instances.id !== id
            );
            console.log(newInstances, gameInstance);
            return [...newInstances, ...gameInstance].sort(
              (a, b) => a.id - b.id
            );
          });

          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching single game data:", error);
        }
      };
      fetchGames();

      const onGameChanged = (gameId: number, proxyAddress: string) => {
        console.log("Game #", gameId, "created at", proxyAddress);
        fetchSingleGame(gameId);
      };

      factoryContract.on(
        factoryContract.filters["GameCreated(uint256,address)"],
        (gameId, proxyAddress) => onGameChanged(Number(gameId), proxyAddress)
      );

      for (let i = 0; i < averageGameInstances.length; i++) {
        const averageGame = averageGameInstances[i];
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
      }

      return () => {
        factoryContract.off(
          factoryContract.filters["GameCreated(uint256,address)"]
        );

        for (let i = 0; i < averageGameInstances.length; i++) {
          const { contract } = averageGameInstances[i];
          contract.off(
            contract.filters["PlayerJoined(uint256,address,uint256)"]
          );
          contract.off(
            contract.filters[
              "PlayerRevealedGuess(uint256,address,uint256,string,uint8)"
            ]
          );
          contract.off(contract.filters["BettingRoundClosed(uint256)"]);
          contract.off(contract.filters["GameEnded(uint256)"]);
          contract.off(
            contract.filters["PrizeAwarded(uint256,address,uint256,uint256)"]
          );
        }
      };
    }
  }, [factoryContract, wallet]);

  const openModal = () => {
    dialog.current?.open();
  };

  const createGame = () => {
    if (createGameRef.current) {
      createGameRef.current.createGame();
    }
  };

  const handleCreateGameClose = () => {
    if (createGameRef.current) {
      createGameRef.current.close();
    }
  };

  const sortGameInstances = (
    a: AverageGameInstance,
    b: AverageGameInstance
  ) => {
    if (a.id % 2 === 0 && b.id % 2 !== 0) {
      return -1;
    } else if (a.id % 2 !== 0 && b.id % 2 === 0) {
      return 1;
    } else {
      return 0;
    }
  };

  return (
    <>
      <Modal
        title="Spiel erstellen"
        submitText="Erstellen"
        disclaimer="Hier kommt nochmal ein kurzer Disclaimer hin, was zu beachten ist
          beim Erstellen eines Spiels"
        onClick={createGame}
        onClose={handleCreateGameClose}
        ref={dialog}
      >
        <CreateGame
          ref={createGameRef}
          factoryContract={factoryContract}
          contractAddress={addresses["AverageGameModule#AverageGame"]}
        />
      </Modal>
      {averageGameInstances.length > 0 && (
        <div className={classes.container}>
          <div className="swiper-button-prev"></div>
          <Swiper
            className={classes.swiper}
            modules={[Grid, Pagination, Navigation]}
            slidesPerView={3}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            }}
            spaceBetween={100}
            grid={{ rows: 2, fill: "row" }}
          >
            <span className={classes.createGame}>
              <Button style="grey" onClick={openModal}>
                <i className={`fas fa-plus ${classes.icon}`}></i>
              </Button>
            </span>
            {averageGameInstances.sort(sortGameInstances).map((game) => {
              return (
                <SwiperSlide key={game.id}>
                  <Card
                    gameInstance={game}
                    connectedAccount={wallet!.address}
                    isLoading={isLoading}
                    currentFocusedGame={currentFocusedGame}
                    setCurrentFocusedGame={setCurrentFocusedGame}
                    setIsLoading={setIsLoading}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
          <div className="swiper-button-next"></div>
        </div>
      )}
    </>
  );
};

export default GamesPage;
