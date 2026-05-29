import { Locale } from "../../../shared/i18n/translations";

export const enrollmentValidationTexts: Record<
  Locale,
  {
    invalidPhone: string;
  }
> = {
  ua: {
    invalidPhone: "Введено невірний номер телефону"
  },
  de: {
    invalidPhone: "Ungueltige Telefonnummer eingegeben"
  }
};
