import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import NumberPicker from "../numberPicker/NumberPicker";
import type { AverageGameModule_AverageGameFactory as TAverageGameFactory } from "../../../types/ethers-contracts/AverageGameModule_AverageGameFactory";
import { parseEther } from "ethers";
import { EventLog } from "ethers";
import TextInput from "../textInput/TextInput";
import classes from "./CreateGame.module.scss";
import { GameSettings } from "../../shared/types";

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

    const handleStepChange = (name: string, newValue: number) => {
      setGameSettings((prevState) => ({
        ...prevState,
        [name]: newValue,
      }));
    };

    return (
      <div className={classes.content}>
        <TextInput
          name="name"
          label="Spielname"
          onChange={handleInputChange}
          value={gameSettings.name}
        />
        <div className={classes.numberInputs}>
          <NumberPicker
            label="Max Players"
            name="maxPlayers"
            value={gameSettings.maxPlayers}
            onChange={handleInputChange}
            onIncrement={handleStepChange}
            onDecrement={handleStepChange}
          />
          <NumberPicker
            min={0}
            max={1000}
            label="Einsatz"
            name="betAmount"
            step={0.01}
            value={gameSettings.betAmount}
            onChange={handleInputChange}
            onIncrement={handleStepChange}
            onDecrement={handleStepChange}
          />
          <NumberPicker
            min={0}
            max={100}
            label="Gebühren"
            name="gameFee"
            value={gameSettings.gameFee}
            onChange={handleInputChange}
            onIncrement={handleStepChange}
            onDecrement={handleStepChange}
          />
        </div>
      </div>
    );
  }
);

export default CreateGame;
