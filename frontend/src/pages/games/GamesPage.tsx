import classes from "./GamesPage.module.scss";
import Card from "../../components/card/Card";
import addresses from "../../../../backend/ignition/deployments/chain-31337/deployed_addresses.json"; // Change to 11155111 for the Sepolia Testnet, now running on localhost
import { useWeb3Context } from "../../components/Web3Provider";
import { useEffect, useRef, useState } from "react";
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

export type AverageGameInstance = {
  id: number;
  name: string;
  entryPrice: string;
  totalPlayers: number;
  maxPlayers: number;
  contract: TAverageGame;
  address: string;
  collateral: string;
  gameFee: string;
};

const GamesPage = () => {
  const { wallet } = useWeb3Context();
  const dialog = useRef<DialogRef>(null);
  const createGameRef = useRef<CreateGameRef>(null);
  const [factoryContract, setFactoryContract] =
    useState<TAverageGameFactory | null>(null);
  const [averageGameContracts, setAverageGameContracts] = useState<
    TAverageGame[]
  >([]);

  const [averageGameInstances, setAverageGameInstances] = useState<
    AverageGameInstance[]
  >([]);

  useEffect(() => {
    const gameFactory = AverageGameFactory.connect(
      addresses["AverageGameModule#AverageGameFactory"],
      wallet
    );

    setFactoryContract(gameFactory);
  }, [wallet]);

  useEffect(() => {
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
            };
          })
        );
      };

      const fetchGames = async () => {
        try {
          const gameProxies = await factoryContract.getGameProxies();
          const games = gameProxies.map((proxy) =>
            AverageGame.connect(proxy, wallet)
          );

          const gameInstanceDetails: AverageGameInstance[] =
            await createGameInstances(games);

          setAverageGameContracts(games);
          setAverageGameInstances(gameInstanceDetails);
        } catch (error) {
          console.error("Error fetching games data:", error);
        }
      };

      fetchGames();

      const onGamesChanged = (gameId: number, proxyAddress: string) => {
        console.log("Game #", gameId, "created at", proxyAddress);
        fetchGames();
      };

      factoryContract.on(
        factoryContract.filters["GameCreated(uint256,address)"],
        (gameId, proxyAddress) => onGamesChanged(Number(gameId), proxyAddress)
      );

      for (let i = 0; i < averageGameContracts.length; i++) {
        averageGameContracts[i].on(
          averageGameContracts[i].filters["PlayerJoined(address,uint256)"],
          (player, gameId) => {
            console.log("Player", player, "joined game", gameId);
            fetchGames();
          }
        );
      }

      return () => {
        factoryContract.off(
          factoryContract.filters["GameCreated(uint256,address)"]
        );

        for (let i = 0; i < averageGameContracts.length; i++) {
          averageGameContracts[i].off(
            averageGameContracts[i].filters["PlayerJoined(address,uint256)"]
          );
        }
      };
    }
  }, [averageGameContracts, factoryContract, wallet]);

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

  // console.log(
  //   averageGameInstances.sort((a, b) => {
  //     // Prüfe die Bedingung für die Hälfte des Arrays
  //     const halfA = a.id % 6 < 3 ? 0 : 1; // 0 für erste Hälfte, 1 für zweite Hälfte
  //     const halfB = b.id % 6 < 3 ? 0 : 1;

  //     if (halfA !== halfB) {
  //       // Wenn sie nicht in der gleichen Hälfte sind, dann sortiere nach der Hälfte
  //       return halfA - halfB;
  //     } else {
  //       // Wenn sie in der gleichen Hälfte sind, dann sortiere nach der ID
  //       return a.id - b.id;
  //     }
  //   })
  // );
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
      <button onClick={openModal}>Create Game</button>
      <div className={classes.container}>
        <div className="swiper-button-prev"></div>
        <Swiper
          modules={[Grid, Pagination, Navigation]}
          slidesPerView={3}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          spaceBetween={100}
          grid={{ rows: 2, fill: "row" }}
        >
          {averageGameInstances.map((game) => {
            return (
              <SwiperSlide key={game.id}>
                <Card gameInstance={game} />
              </SwiperSlide>
            );
          })}
          {/* {averageGameInstances
            .filter(
              (_, index) =>
                index % 6 === 3 || index % 6 === 4 || index % 6 === 5
            )
            .map((game) => {
              return (
                <SwiperSlide key={game.id}>
                  <Card
                    entryPrice={game.entryPrice}
                    id={game.id}
                    maxPlayers={game.maxPlayers}
                    name={game.name}
                    totalPlayers={game.totalPlayers}
                  />
                </SwiperSlide>
              );
            })} */}
        </Swiper>
        <div className="swiper-button-next"></div>
      </div>
    </>
  );
};

export default GamesPage;
