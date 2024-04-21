import { ChangeEvent, forwardRef, useImperativeHandle, useState } from "react";
import { parseEther, solidityPackedKeccak256 } from "ethers";
import NumberPicker from "../numberPicker/NumberPicker";
import TextInput from "../textInput/TextInput";
import toast from "react-hot-toast";
import { transformError } from "../../shared/utils";
import { AverageGameInstance } from "../../shared/types";
import { FormikErrors, useFormik } from "formik";

type JoinGameProps = {
  gameInstance: AverageGameInstance;
  setIsLoading: (isLoading: boolean) => void;
  closeModal?: () => void;
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
  ({ gameInstance, setIsLoading, closeModal }, ref) => {
    const [functionToCall, setFunction] = useState<"joinGame" | "revealGuess">(
      "joinGame"
    );
    const { contract, entryPrice, collateral, gameFee } = gameInstance;

    useImperativeHandle(ref, () => {
      return {
        close() {
          formik.resetForm();
        },
        joinGame() {
          setFunction("joinGame");
          formik.handleSubmit();
        },
        revealGuess() {
          setFunction("revealGuess");
          formik.handleSubmit();
        },
      };
    });

    const validate = (values: UserGuessSubmission) => {
      const errors: FormikErrors<UserGuessSubmission> = {};
      if (!values.guess) {
        errors.guess = "Bitte geben Sie einen Tipp ein";
      }

      if (!values.salt) {
        errors.salt = "Bitte geben Sie einen Geheimnis ein";
      }

      return errors;
    };

    const formik = useFormik<UserGuessSubmission>({
      initialValues: {
        guess: 0,
        salt: "",
      },
      validate,
      onSubmit: () => {
        if (functionToCall === "joinGame") {
          joinGame();
        } else {
          revealGuess();
        }

        if (closeModal) {
          closeModal();
        }
      },
    });

    const joinGame = async () => {
      if (contract) {
        try {
          setIsLoading(true);
          const hash = solidityPackedKeccak256(
            ["uint256", "string"],
            [formik.values.guess, formik.values.salt]
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
            formik.values.guess,
            formik.values.salt
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

    const handleSaltChange = (event: ChangeEvent<HTMLInputElement>) => {
      formik.setValues((prevState) => ({
        ...prevState,
        salt: event.target.value,
      }));
    };

    const handleGuessChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (
        Number(event.target.value) <= 1000 &&
        Number(event.target.value) >= 0
      ) {
        formik.setValues((prevState) => ({
          ...prevState,
          guess: Number(event.target.value),
        }));
      }
    };

    const handleStepChange = (name: string, step: number) => {
      formik.setValues((prevState) => {
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
          value={formik.values.salt}
          placeholder="Geheimnis eingeben"
          onBlur={formik.handleBlur}
          error={
            formik.errors.salt && formik.touched.salt
              ? formik.errors.salt
              : undefined
          }
        />
        <NumberPicker
          min={0}
          max={1000}
          label="Guess"
          name="guess"
          value={formik.values.guess}
          onChange={handleGuessChange}
          onStepChange={handleStepChange}
          onBlur={formik.handleBlur}
          error={
            formik.errors.guess && formik.touched.guess
              ? formik.errors.guess
              : undefined
          }
        />
      </>
    );
  }
);

export default JoinGame;
