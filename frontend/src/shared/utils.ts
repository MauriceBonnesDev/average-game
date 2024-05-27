// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformError(error: any): string {
  if (JSON.stringify(error).includes("user rejected action")) {
    return "Transaktion abgebrochen";
  }

  if (JSON.stringify(error).includes("MinimumTimePassed")) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arr = JSON.stringify(error).match(
      /MinimumTimePassed\((\d+), (\d+), (\d+)\)/
    );

    const startBlock = Number(arr![1]);
    const currentBlock = Number(arr![2]);
    const requiredBlocks = Number(arr![3]);
    return (
      "Die Aktion darf noch nicht durchgeführt werden, warte noch " +
      (requiredBlocks - (currentBlock - startBlock)) +
      (requiredBlocks - (currentBlock - startBlock) > 1
        ? " Blöcke"
        : " Block") +
      " ab. Es müssen mindestens " +
      requiredBlocks +
      " Blöcke vergehen."
    );
  }

  if (JSON.stringify(error).includes("RevealTimeOver")) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arr = JSON.stringify(error).match(
      /RevealTimeOver\((\d+), (\d+), (\d+)\)/
    );

    const startBlock = Number(arr![1]);
    const currentBlock = Number(arr![2]);

    return (
      "Deine Revealzeit ist seit " +
      (currentBlock - startBlock) +
      (currentBlock - startBlock > 1 ? " Blöcken" : "Block") +
      " vorbei!"
    );
  }

  if (JSON.stringify(error).includes("RevealTimeNotStarted")) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arr = JSON.stringify(error).match(
      /RevealTimeNotStarted\((\d+), (\d+), (\d+)\)/
    );

    const startBlock = Number(arr![1]);
    const currentBlock = Number(arr![2]);
    const timeToReveal = Number(arr![3]);

    console.log(startBlock);
    console.log(currentBlock);
    console.log(timeToReveal);
    return (
      "Deine Revealzeit hat noch nicht angefangen, warte noch " +
      (startBlock - currentBlock) +
      " Blöcke ab. Du hast dann " +
      timeToReveal +
      " Blöcke Zeit zu revealen."
    );
  }

  if (JSON.stringify(error).includes("Es wurde kein Gewinner gefunden")) {
    return "Es wurde kein Gewinner gefunden!";
  }

  if (error.reason) {
    return error.reason;
  }

  return "Unbekannter Fehler";
}
