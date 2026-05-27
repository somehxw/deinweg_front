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
