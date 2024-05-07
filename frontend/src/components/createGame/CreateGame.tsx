import { forwardRef, useImperativeHandle } from "react";
import NumberPicker from "../numberPicker/NumberPicker";
import type { AverageGameModule_AverageGameFactory as TAverageGameFactory } from "../../../types/ethers-contracts/AverageGameModule_AverageGameFactory";
import { parseEther } from "ethers";
import { EventLog } from "ethers";
import TextInput from "../textInput/TextInput";
import classes from "./CreateGame.module.scss";
import { GameSettings } from "../../shared/types";
import IconPicker from "../iconPicker/IconPicker";
import { FormikErrors, useFormik } from "formik";
import toast from "react-hot-toast";
import { transformError } from "../../shared/utils";

type CreateGameProps = {
  contractAddress: string;
  factoryContract: TAverageGameFactory | null;
  closeModal?: () => void;
};

export type CreateGameRef = {
  close: () => void;
  createGame: () => void;
};

const CreateGame = forwardRef<CreateGameRef, CreateGameProps>(
  ({ contractAddress, factoryContract, closeModal }, ref) => {
    const validate = (values: GameSettings) => {
      const errors: FormikErrors<GameSettings> = {};
      if (!values.name) {
        errors.name = "Bitte geben Sie einen Namen ein";
      }

      if (values.maxPlayers < 3) {
        errors.maxPlayers = "Mindestens 3 Spieler werden benötigt";
      }

      if (values.betAmount <= 0) {
        errors.betAmount = "Bitte wählen Sie einen Einsatz aus";
      } else if (!isValidDecimal(values.betAmount)) {
        errors.betAmount = "Maximal 3 Dezimalstellen erlaubt";
      }

      if (values.gameFee <= 0) {
        errors.gameFee = "Bitte wählen Sie einen Gebührensatz aus";
      }

      if (values.icon === null) {
        errors.icon = "Bitte wählen Sie ein Icon aus";
      }

      return errors;
    };

    const formik = useFormik<GameSettings>({
      initialValues: {
        contractAddress,
        gameMaster: "",
        name: "",
        maxPlayers: 0,
        betAmount: 0,
        gameFee: 0,
        icon: null,
      },
      validate,
      onSubmit: (values) => {
        console.log(values);
        createGame();
        if (closeModal) {
          closeModal();
        }
      },
    });
    useImperativeHandle(ref, () => {
      return {
        close() {
          formik.resetForm();
        },
        createGame() {
          formik.handleSubmit();
        },
      };
    });

    const createGame = async () => {
      if (factoryContract && formik.values.icon) {
        try {
          const transactionResponse = await factoryContract.createAverageGame(
            formik.values.contractAddress,
            formik.values.name,
            formik.values.maxPlayers,
            parseEther(formik.values.betAmount.toString()),
            parseEther(
              (
                (formik.values.gameFee / 100) *
                formik.values.betAmount
              ).toString()
            ),
            formik.values.icon
          );
          const test = await transactionResponse.wait();
          const eventLog = test?.logs[1] as EventLog;
          const address = eventLog.args[1];
          console.log("Spiel erfolgreich erstellt", address);
        } catch (error) {
          console.error("Fehler beim Erstellen des Spiels:", error);
          toast.error(transformError(error), { id: "error" });
        }
      }
    };

    const handleMaxPlayersChange = (name: string, step: number) => {
      formik.setTouched({
        maxPlayers: true,
        gameFee: formik.touched.gameFee,
        icon: formik.touched.icon,
        betAmount: formik.touched.betAmount,
        name: formik.touched.name,
      });

      formik.setValues((prevState) => {
        let value = Number(prevState.maxPlayers);
        value += step;
        if (value < 0) {
          value = 0;
        }

        if (value < 3) {
          value = 3;
        }

        return {
          ...prevState,
          [name]: value,
        };
      });
    };

    function isValidDecimal(value: number): boolean {
      const strValue = value.toString();
      const decimalPart = strValue.split(".")[1];
      return !decimalPart || decimalPart.length <= 3;
    }

    const handleBetAmountChange = (name: string, step: number) => {
      formik.setTouched(
        {
          ...formik.touched,
          betAmount: true,
        },
        true
      );
      formik.setValues((prevState) => {
        let value = Number(prevState.betAmount);
        value += step;
        if (value < 0) {
          value = 0;
        }

        if (!isValidDecimal(value)) {
          return prevState;
        }

        return {
          ...prevState,
          [name]: value,
        };
      });
    };

    const handleGameFeeChange = (name: string, step: number) => {
      formik.setTouched(
        {
          gameFee: true,
          icon: formik.touched.icon,
          betAmount: formik.touched.betAmount,
          maxPlayers: formik.touched.maxPlayers,
          name: formik.touched.name,
        },
        true
      );
      formik.setValues((prevState) => {
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

    const handleSetIcon = (icon: number) => {
      formik.setTouched(
        {
          icon: true,
          betAmount: formik.touched.betAmount,
          maxPlayers: formik.touched.maxPlayers,
          name: formik.touched.name,
          gameFee: formik.touched.gameFee,
        },
        true
      );
      formik.setValues((prevState) => {
        const newIcon = prevState.icon === icon ? null : icon;
        return {
          ...prevState,
          icon: newIcon,
        };
      });
    };

    return (
      <div className={classes.content}>
        <TextInput
          name="name"
          label="Wähle einen Namen fürs Spiel"
          placeholder="Spielname"
          error={
            formik.errors.name && formik.touched.name
              ? formik.errors.name
              : undefined
          }
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.name}
        />
        <div className={classes.contentBottom}>
          <div className={classes.numberInputs}>
            <NumberPicker
              label="Max Players"
              name="maxPlayers"
              min={3}
              value={formik.values.maxPlayers}
              error={
                formik.errors.maxPlayers && formik.touched.maxPlayers
                  ? formik.errors.maxPlayers
                  : undefined
              }
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              onStepChange={handleMaxPlayersChange}
            />
            <NumberPicker
              label="Einsatz (ETH)"
              name="betAmount"
              step={0.01}
              value={formik.values.betAmount}
              error={
                formik.errors.betAmount && formik.touched.betAmount
                  ? formik.errors.betAmount
                  : undefined
              }
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              onStepChange={handleBetAmountChange}
            />
            <NumberPicker
              min={0}
              max={100}
              label="Gebühren (%)"
              name="gameFee"
              value={formik.values.gameFee}
              error={
                formik.errors.gameFee && formik.touched.gameFee
                  ? formik.errors.gameFee
                  : undefined
              }
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              onStepChange={handleGameFeeChange}
            />
          </div>
          <IconPicker
            error={
              formik.errors.icon && formik.touched.icon
                ? formik.errors.icon
                : undefined
            }
            icon={formik.values.icon}
            setIcon={handleSetIcon}
          />
        </div>
      </div>
    );
  }
);

export default CreateGame;
