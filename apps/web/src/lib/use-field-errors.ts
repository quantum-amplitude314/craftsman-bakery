import { useState } from "react";

export const useFieldErrors = <Field extends string>(hints: Record<Field, string>) => {
  const [invalidFields, setInvalidFields] = useState<Field[]>([]);
  const errorOf = (field: Field) => (invalidFields.includes(field) ? hints[field] : undefined);
  const clearError = (field: Field) => {
    if (invalidFields.includes(field)) setInvalidFields(invalidFields.filter((f) => f !== field));
  };
  const ariaOf = (field: Field) =>
    errorOf(field)
      ? { "aria-invalid": true, "aria-describedby": `${field}-error` }
      : { "aria-invalid": undefined, "aria-describedby": undefined };
  const fieldErrors = { setInvalidFields, errorOf, clearError, ariaOf };

  return fieldErrors;
};

/** After the errors render, so the first invalid field has its `aria-invalid`. */
export const focusFirstInvalid = (form: HTMLFormElement) =>
  requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
