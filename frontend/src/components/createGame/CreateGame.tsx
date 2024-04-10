import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import { GameSettings } from "../modal/Modal";
import NumberPicker from "../numberPicker/NumberPicker";
import type { AverageGameModule_AverageGameFactory as TAverageGameFactory } from "../../../types/ethers-contracts/AverageGameModule_AverageGameFactory";
import { parseEther } from "ethers";

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

    // TODO: Kann durch die aktuell connectete Wallet ersetzt werden, sobald die Average Game Factory überarbeitet wurde
    const owner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    const createGame = async () => {
      if (factoryContract) {
        try {
          const transactionResponse = await factoryContract.createAverageGame(
            contractAddress,
            owner,
            gameSettings.name,
            gameSettings.maxPlayers,
            gameSettings.betAmount,
            gameSettings.gameFee.toString()
          );
          await transactionResponse.wait();
          console.log("Spiel erfolgreich erstellt");
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
        <label htmlFor="gameFee">Gebühren:</label>
        <input
          type="number"
          id="gameFee"
          name="gameFee"
          value={gameSettings.gameFee}
          onChange={handleInputChange}
        />
      </>
    );
  }
);

export default CreateGame;
