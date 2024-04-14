export function transformError(error: unknown) {
  const errorMessage = String(error);
  const message = errorMessage.slice(
    errorMessage.indexOf('"') + 1,
    errorMessage.indexOf("(") - 2
  );

  return message;
}
