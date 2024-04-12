import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import NumberPicker from "../numberPicker/NumberPicker";
import type { AverageGameModule_AverageGameFactory as TAverageGameFactory } from "../../../types/ethers-contracts/AverageGameModule_AverageGameFactory";
import { parseEther } from "ethers";
import { EventLog } from "ethers";

export type GameSettings = {
  contractAddress: string;
  gameMaster: string;
  name: string;
  maxPlayers: number;
  betAmount: number;
  gameFee: number;
};

type CreateGameProps = {
  contractAddress: string;
  factoryContract: TAverageGameFactory | null;
};

export type CreateGameRef = {
  close: () => void;
  createGame: () => void;
};

const CreateGame = forwardRef<CreateGameRef, CreateGameProps>(
  ({ contractAddress, factoryContract }, ref) => {
    const [gameSettings, setGameSettings] = useState<GameSettings>({
      contractAddress,
      gameMaster: "",
      name: "",
      maxPlayers: 0,
      betAmount: 0,
      gameFee: 0,
    });

    useImperativeHandle(ref, () => {
      return {
        close() {
          setGameSettings({
            contractAddress,
            gameMaster: "",
            name: "",
            maxPlayers: 0,
            betAmount: 0,
            gameFee: 0,
          });
        },
        createGame() {
          createGame();
        },
      };
    });

    const createGame = async () => {
      if (factoryContract) {
        try {
          const transactionResponse = await factoryContract.createAverageGame(
            contractAddress,
            gameSettings.name,
            gameSettings.maxPlayers,
            parseEther(gameSettings.betAmount.toString()),
            parseEther(
              ((gameSettings.gameFee / 100) * gameSettings.betAmount).toString()
            )
          );
          const test = await transactionResponse.wait();
          const eventLog = test?.logs[1] as EventLog;
          const address = eventLog.args[1];
          console.log("Spiel erfolgreich erstellt", address);
        } catch (error) {
          console.error("Fehler beim Erstellen des Spiels:", error);
        }
      }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setGameSettings((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    };
    return (
      <>
        <label htmlFor="name">Spielname</label>
        <input
          type="text"
          id="name"
          name="name"
          value={gameSettings.name}
          onChange={handleInputChange}
        />
        <label htmlFor="maxPlayers">Max Players:</label>
        <input
          type="number"
          id="maxPlayers"
          name="maxPlayers"
          value={gameSettings.maxPlayers}
          onChange={handleInputChange}
        />
        <NumberPicker
          min={0}
          max={1000}
          label="Einsatz"
          name="betAmount"
          value={gameSettings.betAmount}
          onChange={handleInputChange}
        />
        <NumberPicker
          min={0}
          max={100}
          label="Gebühren"
          name="gameFee"
          value={gameSettings.gameFee}
          onChange={handleInputChange}
        />
      </>
    );
  }
);

export default CreateGame;
