import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { I18nProvider } from "../shared/i18n/I18nProvider";
import { router } from "./router";
import "./styles.css";

export function App(): JSX.Element {
  return (
    <ThemeProvider>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </ThemeProvider>
  );
}
