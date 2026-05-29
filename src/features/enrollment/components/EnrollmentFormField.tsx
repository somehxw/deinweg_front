interface EnrollmentFormFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  type?: "text" | "email" | "date";
  className?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  onChange: (value: string) => void;
}

export function EnrollmentFormField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  className,
  required = true,
  placeholder,
  inputMode
}: EnrollmentFormFieldProps): JSX.Element {
  return (
    <label className={`field ${className ?? ""}`.trim()} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        className={error ? "field-input-error" : undefined}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={error ? "true" : "false"}
        onChange={(event) => onChange(event.target.value)}
      />
      <small
        className={`error-text field-error-text${error ? "" : " is-empty"}`}
        aria-hidden={error ? "false" : "true"}
      >
        {error ?? "\u00A0"}
      </small>
    </label>
  );
}
