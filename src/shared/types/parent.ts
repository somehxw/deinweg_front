export interface ParentChildDto {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  birth_date?: string;
}

export interface ParentChildrenPaginatedDto {
  results: ParentChildDto[];
}

export interface ParentLessonDto {
  id: string;
  starts_at: string;
  student_id?: string;
  week_day?: string | null;
  status?: string;
  topic?: string;
  room?: string;
  class_name?: string;
}
