import { CODE_ALPHABET, CODE_LENGTH } from "@craftsman-bakery/contracts";

export const generateCode = () => {
  const randomValues = crypto.getRandomValues(new Uint32Array(CODE_LENGTH));
  const code = Array.from(
    randomValues,
    (value) => CODE_ALPHABET[value % CODE_ALPHABET.length],
  ).join("");

  return code;
};
