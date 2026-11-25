export function FieldError({ field, message }: { field: string; message: string | undefined }) {
  if (!message) return null;

  return (
    <p id={`${field}-error`} className="text-destructive text-sm">
      {message}
    </p>
  );
}
