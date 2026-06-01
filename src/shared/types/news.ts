export interface NewsImageDto {
  id: string;
  image: string;
  image_url?: string;
  created_at?: string;
}

export interface NewsItemDto {
  id: string;
  title: string;
  text: string;
  images: NewsImageDto[];
  views_count: number;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToggleNewsLikeResponse {
  liked: boolean;
}

export interface CreateNewsPayload {
  title: string;
  text: string;
  imageFiles?: File[];
}

export interface UpdateNewsPayload {
  title?: string;
  text?: string;
  imageFiles?: File[];
}
