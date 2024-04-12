import React, { FormEvent, useImperativeHandle, useRef } from "react";
import classes from "./Modal.module.scss";
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
};

const Modal = React.forwardRef<DialogRef, ModalProps>(
  ({ onClick, onClose, title, disclaimer, submitText, children }, ref) => {
    const dialog = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => {
      return {
        open() {
          dialog.current?.showModal();
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
      dialog.current?.close();
    };

    return createPortal(
      <dialog
        ref={dialog}
        onClick={onBackdropClick}
        className={classes.modal}
        onClose={onClose}
      >
        <div id={classes.modalBody}>
          <button
            className={classes.closeBtn}
            onClick={() => dialog.current?.close()}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <h2>{title}</h2>
          <p>{disclaimer}</p>
          <form onSubmit={onSubmit}>
            {children}

            <Button style="dark">{submitText}</Button>
          </form>
        </div>
      </dialog>,
      document.getElementById("modal") as HTMLDivElement
    );
  }
);

export default Modal;
