import { httpRequest } from "./httpClient";
import {
  CreateNewsPayload,
  NewsItemDto,
  ToggleNewsLikeResponse,
  UpdateNewsPayload
} from "../types/news";

function buildNewsFormData(payload: CreateNewsPayload | UpdateNewsPayload): FormData {
  const formData = new FormData();

  if (payload.title !== undefined) {
    formData.append("title", payload.title);
  }

  if (payload.text !== undefined) {
    formData.append("text", payload.text);
  }

  for (const file of payload.imageFiles ?? []) {
    formData.append("image_files", file);
  }

  return formData;
}

export async function getNewsList(): Promise<NewsItemDto[]> {
  return httpRequest<NewsItemDto[]>("/api/v1/news/", { method: "GET" });
}

export async function getNewsById(newsId: string): Promise<NewsItemDto> {
  return httpRequest<NewsItemDto>(`/api/v1/news/${newsId}/`, { method: "GET" });
}

export async function createNews(payload: CreateNewsPayload): Promise<NewsItemDto> {
  return httpRequest<NewsItemDto>("/api/v1/news/", {
    method: "POST",
    body: buildNewsFormData(payload)
  });
}

export async function updateNews(newsId: string, payload: UpdateNewsPayload): Promise<NewsItemDto> {
  const hasFiles = (payload.imageFiles?.length ?? 0) > 0;

  if (hasFiles) {
    return httpRequest<NewsItemDto>(`/api/v1/news/${newsId}/`, {
      method: "PATCH",
      body: buildNewsFormData(payload)
    });
  }

  return httpRequest<NewsItemDto>(`/api/v1/news/${newsId}/`, {
    method: "PATCH",
    body: {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.text !== undefined ? { text: payload.text } : {})
    }
  });
}

export async function deleteNews(newsId: string): Promise<void> {
  await httpRequest<void>(`/api/v1/news/${newsId}/`, {
    method: "DELETE"
  });
}

export async function deleteNewsImage(imageId: string): Promise<void> {
  await httpRequest<void>(`/api/v1/news/images/${imageId}/`, {
    method: "DELETE"
  });
}

export async function toggleNewsLike(newsId: string): Promise<ToggleNewsLikeResponse> {
  return httpRequest<ToggleNewsLikeResponse>(`/api/v1/news/${newsId}/like/`, {
    method: "POST"
  });
}
