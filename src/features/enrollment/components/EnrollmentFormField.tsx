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
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  );
}
