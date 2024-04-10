import React, {
  ChangeEvent,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import classes from "./Modal.module.scss";
import { createPortal } from "react-dom";

type ModalProps = {
  contractAddress: string;
  onClick: () => void;
};

export type DialogRef = {
  open: () => void;
};

export type GameSettings = {
  contractAddress: string;
  gameMaster: string;
  name: string;
  maxPlayers: number;
  betAmount: number;
  gameFee: number;
};

const Modal = React.forwardRef<DialogRef, ModalProps>(
  ({ onClick, contractAddress }, ref) => {
    const dialog = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => {
      return {
        open() {
          dialog.current?.showModal();
        },
      };
    });

    const [gameSettings, setGameSettings] = useState<GameSettings>({
      contractAddress,
      gameMaster: "",
      name: "",
      maxPlayers: 0,
      betAmount: 0,
      gameFee: 0,
    });

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setGameSettings((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    };

    const resetGameSettings = () => {
      setGameSettings({
        contractAddress,
        gameMaster: "",
        name: "",
        maxPlayers: 0,
        betAmount: 0,
        gameFee: 0,
      });
    };

    const onModalClick = (event: React.MouseEvent<HTMLDialogElement>) => {
      const { target } = event;
      if (target === dialog.current) {
        dialog.current?.close();
      }
    };

    return createPortal(
      <dialog
        ref={dialog}
        onClick={onModalClick}
        className={classes.resultModal}
        onClose={resetGameSettings}
      >
        <div id={classes.modalBody}>
          <h2>Spiel erstellen</h2>
          <form method="dialog">
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
            <label htmlFor="betAmount">Einsatz:</label>
            <input
              type="number"
              id="betAmount"
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

            <button>Close</button>
          </form>
        </div>
      </dialog>,
      document.getElementById("modal") as HTMLDivElement
    );
  }
);

export default Modal;
