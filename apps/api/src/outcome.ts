export type Outcome<Value, Failure extends string> =
  | { ok: true; value: Value }
  | { ok: false; failure: Failure };

export const succeed = <Value>(value: Value) => {
  const outcome = { ok: true, value } as const;

  return outcome;
};

export const fail = <Failure extends string>(failure: Failure) => {
  const outcome = { ok: false, failure } as const;

  return outcome;
};
