export type NotSupported = Error & {
  type: "notSupported";
  variableName: string;
  variableValue: unknown;
};
export function notSupported(
  variableName: string,
  variableValue: unknown,
  error: Error
): NotSupported {
  if (!error.message) error.message = `value: ${variableValue} is not supported to ${variableName}.`
  return Object.assign(error, {
    variableName,
    variableValue,
    type: "notSupported" as const,
  });
}

export type MissingValue = Error & {
  type: "missingValue";
  variableName: string;
};
export function missingValue(variableName: string, error: Error): MissingValue {
  if (!error.message) error.message = `${variableName} is missing.`
  return Object.assign(error, {
    variableName,
    type: "missingValue" as const,
  });
}

export type UnexpectedError = Error & {
  type: "unexpectedError";
};
export function unexpectedError(error: Error): UnexpectedError {
  if (!error.message) error.message = `Unexepected error occurs.`
  return Object.assign(error, {
    type: "unexpectedError" as const,
  });
}