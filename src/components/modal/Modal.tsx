import React, { FormEvent, useImperativeHandle, useRef } from "react";
import classes from "./Modal.module.scss";
import closeIcon from "../../assets/close.svg";
import { createPortal } from "react-dom";
import Button from "../button/Button";

type ModalProps = {
  title: string;
  disclaimer: string;
  submitText: string;
  children: React.ReactNode;
  onClose: () => void;
  onClick: () => void;
};

export type DialogRef = {
  open: () => void;
  close: () => void;
};

const Modal = React.forwardRef<DialogRef, ModalProps>(
  ({ onClick, onClose, title, disclaimer, submitText, children }, ref) => {
    const dialog = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => {
      return {
        open() {
          dialog.current?.showModal();
        },
        close() {
          dialog.current?.close();
        },
      };
    });

    const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
      const { target } = event;
      if (target === dialog.current) {
        dialog.current?.close();
      }
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onClick();
    };

    return createPortal(
      <dialog
        ref={dialog}
        onClick={onBackdropClick}
        className={classes.modal}
        onClose={onClose}
      >
        <div id={classes.modalBody}>
          <span className={classes.closeBtn}>
            <Button
              style="light"
              color="red"
              onClick={() => dialog.current?.close()}
            >
              <img src={closeIcon} />
            </Button>
          </span>
          <h2>{title}</h2>
          <p>{disclaimer}</p>
          <form className={classes.modalForm} onSubmit={onSubmit}>
            {children}

            <span className={classes.submitButton}>
              <Button size="large" style="dark" color="green" type="submit">
                {submitText}
              </Button>
            </span>
          </form>
        </div>
      </dialog>,
      document.getElementById("modal") as HTMLDivElement
    );
  }
);

export default Modal;