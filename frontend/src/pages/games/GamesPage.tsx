import classes from "./GamesPage.module.scss";
import Card from "../../components/card/Card";
import addresses from "../../../../backend/ignition/deployments/chain-11155111/deployed_addresses.json"; // Change to 11155111 for the Sepolia Testnet and 31337 for the Hardhat Network
import { useEffect, useRef, useState } from "react";
import { AverageGameModule_AverageGameFactory__factory as AverageGameFactory } from "../../../types/ethers-contracts/factories/AverageGameModule_AverageGameFactory__factory";
import { AverageGameModule_AverageGame__factory as AverageGame } from "../../../types/ethers-contracts/factories/AverageGameModule_AverageGame__factory";
import type { AverageGameModule_AverageGameFactory as TAverageGameFactory } from "../../../types/ethers-contracts/AverageGameModule_AverageGameFactory";
import type {
  AverageGameModule_AverageGame as TAverageGame,
  AverageGame as AvgGame,
} from "../../../types/ethers-contracts/AverageGameModule_AverageGame";
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
import { useWeb3Context } from "../../hooks/useWeb3Context";
import useEventListening from "../../hooks/useEventListening";

//TODO: Join Game screen, undeutlich, da geheimnis genau unter dem Text "Wähle eine Zahl zwischen 0 und 1000"
//TODO: Collateral removed from payout, since that makes room for malicious behaviour by players -> Check if that fits now!
//TODO: Next Phase Button oben rechts neben Ausrufezeichen
//TODO: Claim Feed Button unten von Ended oder auch oben rechts
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
  const { setGameId } = useEventListening(
    averageGameInstances,
    fetchSingleGame,
    wallet
  );

  useEffect(() => {
    if (wallet) {
      const gameFactory = AverageGameFactory.connect(
        addresses["AverageGameFactoryModule#AverageGameFactory"],
        wallet
      );

      setFactoryContract(gameFactory);
    }
  }, [wallet]);

  const fetchGames = async () => {
    try {
      isMounted.current = false;
      const gameProxies = await factoryContract!.getGameProxies();
      const games = gameProxies.map((proxy) =>
        AverageGame.connect(proxy, wallet)
      );

      const gameInstances: AverageGameInstance[] = await createGameInstances(
        games
      );
      setGameId(-1);
      setAverageGameInstances(gameInstances);
    } catch (error) {
      console.error("Error fetching games data:", error);
    }
  };

  async function fetchSingleGame(id: number) {
    console.log("Fetch single game");
    try {
      const gameProxies = await factoryContract!.getGameProxies();
      console.log("Wallet:", wallet);
      const games = gameProxies.map((proxy) =>
        AverageGame.connect(proxy, wallet)
      );

      const gameInstance: AverageGameInstance[] = await createGameInstances([
        games[id],
      ]);

      setAverageGameInstances((prevInstances) => {
        console.log("setAverageGameInstances!!!!");
        const newInstances = prevInstances.filter(
          (instances) => instances.id !== id
        );
        return [...newInstances, ...gameInstance].sort((a, b) => a.id - b.id);
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching single game data:", error);
    }
  }
  const averageGameInstanceMapper = (
    contract: TAverageGame,
    gameInstance: AvgGame.AverageGameInstanceStructOutput
  ): AverageGameInstance => {
    const [
      id,
      name,
      entryPrice,
      totalPlayers,
      maxPlayers,
      contractAddress,
      collateral,
      gameFee,
      players,
      gameState,
      gameMaster,
      winner,
      rewardClaimed,
      feeClaimed,
      icon,
    ] = gameInstance;

    return {
      id: Number(id),
      name,
      entryPrice: formatEther(entryPrice),
      totalPlayers: Number(totalPlayers),
      maxPlayers: Number(maxPlayers),
      contract,
      address: contractAddress,
      collateral: formatEther(collateral),
      gameFee: formatEther(gameFee),
      players,
      gameState: Number(gameState),
      gameMaster,
      winner,
      rewardClaimed,
      feeClaimed,
      icon: Number(icon),
    };
  };

  const createGameInstances = async (
    games: TAverageGame[]
  ): Promise<AverageGameInstance[]> => {
    return await Promise.all(
      games.map(async (game) => {
        const gameInstance = await game.getAverageGameInstance();
        return averageGameInstanceMapper(game, gameInstance);
      })
    );
  };

  useEffect(() => {
    if (factoryContract && wallet) {
      fetchGames();

      const onGameChanged = (gameCount: number, proxyAddress: string) => {
        console.log("Game #", gameCount, "created at", proxyAddress);
        fetchGames();
        setGameId(gameCount - 1);
      };

      factoryContract.on(
        factoryContract.filters["GameCreated(uint256,address)"],
        (id, proxyAddress) => onGameChanged(Number(id), proxyAddress)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryContract, wallet]);

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      factoryContract?.off(
        factoryContract.filters["GameCreated(uint256,address)"]
      );

      averageGameInstances.forEach(({ contract }) => {
        contract.off(contract.filters["PlayerJoined(uint256,address,uint256)"]);
        contract.off(
          contract.filters[
            "PlayerRevealedGuess(uint256,address,uint256,string,uint8)"
          ]
        );
        contract.off(contract.filters["FeeCollected(uint256,address,uint256)"]);
        contract.off(contract.filters["StartRevealPhase(uint256)"]);
        contract.off(
          contract.filters["PlayerRefunded(uint256,address,uint256)"]
        );
        contract.off(contract.filters["GameEnded(uint256)"]);
        contract.off(
          contract.filters["CollateralShareDeposited(uint256,address,uint256)"]
        );
        contract.off(
          contract.filters["PrizeAwarded(uint256,address,uint256,uint256)"]
        );
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

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

  return wallet ? (
    <>
      <Modal
        title="Create Game"
        submitText="Start Game"
        disclaimer="" // Hier kommt nochmal ein kurzer Disclaimer hin, was zu beachten ist beim Erstellen eines Spiels
        onClick={createGame}
        onClose={handleCreateGameClose}
        ref={dialog}
      >
        <CreateGame
          ref={createGameRef}
          factoryContract={factoryContract}
          contractAddress={addresses["AverageGameModule#AverageGame"]}
          closeModal={dialog.current?.close}
        />
      </Modal>
      <div className={classes.container}>
        <div className={`swiper-button-prev ${classes.swiperButtonPrev}`}></div>
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
            <Button style="grey" size="round" onClick={openModal}>
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
        <div className={`swiper-button-next ${classes.swiperButtonNext}`}></div>
      </div>
    </>
  ) : (
    <h2>Mit Wallet verbinden um Inhalte zusehen</h2>
  );
};

export default GamesPage;
