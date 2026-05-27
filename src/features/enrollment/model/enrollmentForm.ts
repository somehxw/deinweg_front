export interface EnrollmentFormValues {
  parentEmail: string;
  parentFirstName: string;
  parentLastName: string;
  phone: string;
  studentFirstName: string;
  studentLastName: string;
  studentBirthDate: string;
  studentEmail: string;
}

export type EnrollmentFormErrors = Partial<Record<keyof EnrollmentFormValues, string>>;
