export interface EnrollmentCreatedEventData {
  id: string;
  status: string;
  parent_email: string;
  parent_first_name: string;
  parent_last_name: string;
  student_first_name: string;
  student_last_name: string;
  created_at: string;
}

export interface EnrollmentCreatedEventMessage {
  event: "enrollment.created";
  data: EnrollmentCreatedEventData;
}

