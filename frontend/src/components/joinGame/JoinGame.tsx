import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import { AverageGameInstance } from "../../pages/games/GamesPage";
import { parseEther, solidityPackedKeccak256 } from "ethers";
import NumberPicker from "../numberPicker/NumberPicker";

type JoinGameProps = {
  gameInstance: AverageGameInstance;
};

export type JoinGameRef = {
  close: () => void;
  joinGame: () => void;
};

type UserGuessSubmission = {
  guess: number;
  salt: string;
};

const JoinGame = forwardRef<JoinGameRef, JoinGameProps>(
  ({ gameInstance }, ref) => {
    const [userInput, setUserInput] = useState<UserGuessSubmission>({
      guess: 0,
      salt: "",
    });
    const { contract, entryPrice, collateral, gameFee } = gameInstance;

    const joinGame = async () => {
      if (contract) {
        try {
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
      };
    });

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setUserInput((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    };

    return (
      <>
        <p>Mein Guess: {userInput.guess}</p>
        <p>Mein Salt: {userInput.salt}</p>
        <NumberPicker
          min={0}
          max={1000}
          label="Guess"
          name="guess"
          value={userInput.guess}
          onChange={handleInputChange}
        />
        <label htmlFor="salt">Salt</label>
        <input
          type="text"
          id="salt"
          name="salt"
          value={userInput.salt}
          onChange={handleInputChange}
        />
      </>
    );
  }
);

export default JoinGame;
