import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import NumberPicker from "../numberPicker/NumberPicker";
import type { AverageGameModule_AverageGameFactory as TAverageGameFactory } from "../../../types/ethers-contracts/AverageGameModule_AverageGameFactory";
import { parseEther } from "ethers";
import { EventLog } from "ethers";
import TextInput from "../textInput/TextInput";
import classes from "./CreateGame.module.scss";
import { GameSettings } from "../../shared/types";
import IconPicker from "../iconPicker/IconPicker";

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
      icon: 0,
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
            icon: 0,
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
            ),
            gameSettings.icon
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

    const handleMaxPlayersChange = (name: string, step: number) => {
      setGameSettings((prevState) => {
        let value = Number(prevState.maxPlayers);
        value += step;
        if (value < 0) {
          value = 0;
        }

        return {
          ...prevState,
          [name]: value,
        };
      });
    };

    const handleBetAmountChange = (name: string, step: number) => {
      setGameSettings((prevState) => {
        let value = Number(prevState.betAmount);
        value += step;
        if (value < 0) {
          value = 0;
        }

        return {
          ...prevState,
          [name]: value,
        };
      });
    };

    const handleGameFeeChange = (name: string, step: number) => {
      setGameSettings((prevState) => {
        let value = Number(prevState.gameFee);
        if (value < 100 || step < 0) {
          value += step;
        }
        if (value < 0) {
          value = 0;
        }

        return {
          ...prevState,
          [name]: value,
        };
      });
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (
        Number(event.target.value) >= 0 && event.target.name === "gameFee"
          ? Number(event.target.value) <= 100
          : true
      ) {
        setGameSettings((prevState) => ({
          ...prevState,
          [event.target.name]: Number(event.target.value),
        }));
      }
    };

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
      setGameSettings((prevState) => ({
        ...prevState,
        [event.target.name]: event.target.value,
      }));
    };

    const handleSetIcon = (icon: number) => {
      setGameSettings((prevState) => ({
        ...prevState,
        icon,
      }));
    };

    return (
      <div className={classes.content}>
        <TextInput
          name="name"
          label="Wähle einen Namen fürs Spiel"
          placeholder="Spielname"
          onChange={handleNameChange}
          value={gameSettings.name}
        />
        <div className={classes.contentBottom}>
          <div className={classes.numberInputs}>
            <NumberPicker
              label="Max Players"
              name="maxPlayers"
              value={gameSettings.maxPlayers}
              onChange={handleInputChange}
              onStepChange={handleMaxPlayersChange}
            />
            <NumberPicker
              label="Einsatz"
              name="betAmount"
              step={0.01}
              value={gameSettings.betAmount}
              onChange={handleInputChange}
              onStepChange={handleBetAmountChange}
            />
            <NumberPicker
              min={0}
              max={100}
              label="Gebühren"
              name="gameFee"
              value={gameSettings.gameFee}
              onChange={handleInputChange}
              onStepChange={handleGameFeeChange}
            />
          </div>
          <IconPicker setIcon={handleSetIcon} />
        </div>
      </div>
    );
  }
);

export default CreateGame;
