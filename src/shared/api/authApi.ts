import { httpRequest } from "./httpClient";
import {
  PasswordSetupConfirmDto,
  PasswordSetupConfirmResponseDto
} from "../types/auth";
import { JwtCreateDto, JwtCreateResponseDto } from "../types/jwt";

export function createJwt(payload: JwtCreateDto): Promise<JwtCreateResponseDto> {
  return httpRequest<JwtCreateResponseDto>("/api/v1/auth/jwt/create/", {
    method: "POST",
    body: payload
  });
}

export function confirmPasswordSetup(
  payload: PasswordSetupConfirmDto
): Promise<PasswordSetupConfirmResponseDto> {
  return httpRequest<PasswordSetupConfirmResponseDto>(
    "/api/v1/auth/password-setup/confirm/",
    {
      method: "POST",
      body: payload
    }
  );
}
