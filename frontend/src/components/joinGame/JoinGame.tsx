import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import { parseEther, solidityPackedKeccak256 } from "ethers";
import NumberPicker from "../numberPicker/NumberPicker";
import TextInput from "../textInput/TextInput";
import toast from "react-hot-toast";
import { transformError } from "../../shared/utils";
import { AverageGameInstance } from "../../shared/types";

type JoinGameProps = {
  gameInstance: AverageGameInstance;
  setIsLoading: (isLoading: boolean) => void;
};

export type JoinGameRef = {
  close: () => void;
  joinGame: () => void;
  revealGuess: () => void;
};

type UserGuessSubmission = {
  guess: number;
  salt: string;
};

const JoinGame = forwardRef<JoinGameRef, JoinGameProps>(
  ({ gameInstance, setIsLoading }, ref) => {
    const [userInput, setUserInput] = useState<UserGuessSubmission>({
      guess: 0,
      salt: "",
    });
    const { contract, entryPrice, collateral, gameFee } = gameInstance;

    const joinGame = async () => {
      if (contract) {
        try {
          setIsLoading(true);
          const hash = solidityPackedKeccak256(
            ["uint256", "string"],
            [userInput.guess, userInput.salt]
          );
          const transactionResponse = await contract.joinGame(hash, {
            value:
              parseEther(entryPrice) +
              parseEther(collateral) +
              parseEther(gameFee),
          });
          await transactionResponse.wait();
          console.log("Spiel erfolgreich beigetreten");
        } catch (error) {
          console.error("Fehler beim Beitreten des Spiels", error);
          toast.error(transformError(error), { id: "error" });
          setIsLoading(false);
        }
      }
    };

    const revealGuess = async () => {
      if (contract) {
        try {
          setIsLoading(true);
          const transactionResponse = await contract.revealGuess(
            userInput.guess,
            userInput.salt
          );
          await transactionResponse.wait();
          console.log("Erfolgreich veröffentlicht");
        } catch (error) {
          console.error("Fehler beim Veröffentlichen deines Tipps", error);
          toast.error(transformError(error), { id: "error" });
          setIsLoading(false);
        }
      }
    };

    useImperativeHandle(ref, () => {
      return {
        close() {
          setUserInput({ guess: 0, salt: "" });
        },
        joinGame() {
          joinGame();
        },
        revealGuess() {
          revealGuess();
        },
      };
    });

    const handleSaltChange = (event: ChangeEvent<HTMLInputElement>) => {
      setUserInput((prevState) => ({
        ...prevState,
        salt: event.target.value,
      }));
    };

    const handleGuessChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (
        Number(event.target.value) <= 1000 &&
        Number(event.target.value) >= 0
      ) {
        setUserInput((prevState) => ({
          ...prevState,
          guess: Number(event.target.value),
        }));
      }
    };

    const handleStepChange = (name: string, step: number) => {
      setUserInput((prevState) => {
        let value = Number(prevState.guess);
        if (value < 1000 && value > 0) {
          value += step;
        }
        return {
          ...prevState,
          [name]: value,
        };
      });
    };

    return (
      <>
        <TextInput
          label="Geheimnis"
          name="salt"
          onChange={handleSaltChange}
          value={userInput.salt}
        />
        <NumberPicker
          min={0}
          max={1000}
          label="Guess"
          name="guess"
          value={userInput.guess}
          onChange={handleGuessChange}
          onStepChange={handleStepChange}
        />
      </>
    );
  }
);

export default JoinGame;
