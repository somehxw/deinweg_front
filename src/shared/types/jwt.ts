export interface JwtCreateDto {
  email: string;
  password: string;
}

export interface JwtCreateResponseDto {
  access: string;
  refresh: string;
}
