import { httpRequest } from "./httpClient";
import { ParentChildDto, ParentChildrenPaginatedDto } from "../types/parent";

type ParentChildrenResponse = ParentChildDto[] | ParentChildrenPaginatedDto;

export async function getParentChildren(): Promise<ParentChildDto[]> {
  const response = await httpRequest<ParentChildrenResponse>("/api/v1/parent/me/children/", {
    method: "GET"
  });

  if (Array.isArray(response)) {
    return response;
  }

  return response.results ?? [];
}
