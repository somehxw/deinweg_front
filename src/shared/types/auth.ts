export interface PasswordSetupConfirmDto {
  token: string;
  password: string;
}

export interface PasswordSetupConfirmResponseDto {
  ok: boolean;
}
