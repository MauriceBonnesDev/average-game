// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformError(error: any) {
  console.log(error);
  if (JSON.stringify(error).includes("user rejected action")) {
    return "Transaktion abgebrochen";
  }

  if (error.reason) {
    return (error as any).reason;
  }

  return "Unbekannter Fehler";
}
