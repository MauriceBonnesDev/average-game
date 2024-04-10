import chevronLeft from "../../assets/chevron-left.svg";
import chevronRight from "../../assets/chevron-right.svg";
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

export type AverageGameInstance = {
  id: number;
  name: string;
  entryPrice: string;
  totalPlayers: number;
  maxPlayers: number;
};

const GamesPage = () => {
  const { wallet } = useWeb3Context();
  const dialog = useRef<DialogRef>(null);
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
          games.map(async (game) => ({
            id: Number(await game.id()),
            name: await game.name(),
            entryPrice: formatEther(await game.betAmount()),
            totalPlayers: Number(await game.totalPlayers()),
            maxPlayers: Number(await game.maxPlayers()),
          }))
        );
      };

      const getTotalGames = async () => {
        try {
          const game = await factoryContract.getGameProxyAt(0);
          console.log(game);
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

      getTotalGames();

      const onTotalGamesUpdated = (
        newTotalGames: number,
        proxyAddress: string
      ) => {
        console.log("Game #", newTotalGames, "created at", proxyAddress);
        getTotalGames();
      };

      factoryContract.on(
        factoryContract.filters["GameCreated(uint256,address)"],
        (newTotalGames, proxyAddress) =>
          onTotalGamesUpdated(Number(newTotalGames), proxyAddress)
      );

      return () => {
        factoryContract.off(
          factoryContract.filters["GameCreated(uint256,address)"]
        );
      };
    }
  }, [factoryContract, wallet]);
  const owner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const createGame = async () => {
    if (factoryContract) {
      try {
        const transactionResponse = await factoryContract.createAverageGame(
          addresses["AverageGameModule#AverageGame"],
          owner,
          "Average Game",
          5,
          1,
          10
        );
        await transactionResponse.wait();
        console.log("Spiel erfolgreich erstellt");
      } catch (error) {
        console.error("Fehler beim Erstellen des Spiels:", error);
      }
    }
  };

  const openModal = () => {
    dialog.current?.open();
  };

  return (
    <>
      {
        <Modal
          contractAddress={addresses["AverageGameModule#AverageGame"]}
          onClick={createGame}
          ref={dialog}
        />
      }
      <div className={classes.container}>
        <img src={chevronLeft} />
        <button onClick={openModal}>Create Game</button>
        <div className={classes.cardContainer}>
          {averageGameInstances.map((game) => {
            return (
              <Card
                entryPrice={game.entryPrice}
                id={game.id}
                maxPlayers={game.maxPlayers}
                name={game.name}
                totalPlayers={game.totalPlayers}
                key={game.id}
              />
            );
          })}
        </div>
        <img src={chevronRight} />
      </div>
    </>
  );
};

export default GamesPage;
