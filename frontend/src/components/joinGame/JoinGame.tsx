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
          const transactionResponse = await contract.revealGuess(
            userInput.guess,
            userInput.salt
          );
          await transactionResponse.wait();
          console.log("Erfolgreich veröffentlicht");
        } catch (error) {
          console.error("Fehler beim Veröffentlichen deines Tipps", error);
          toast.error(transformError(error), { id: "error" });
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

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setUserInput((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    };

    const handleStepChange = (name: string, newValue: number) => {
      setUserInput((prevState) => ({
        ...prevState,
        [name]: newValue,
      }));
    };

    return (
      <>
        <TextInput
          label="Geheimnis"
          name="salt"
          onChange={handleInputChange}
          value={userInput.salt}
        />
        <NumberPicker
          min={0}
          max={1000}
          label="Guess"
          name="guess"
          value={userInput.guess}
          onChange={handleInputChange}
          onIncrement={handleStepChange}
          onDecrement={handleStepChange}
        />
      </>
    );
  }
);

export default JoinGame;
