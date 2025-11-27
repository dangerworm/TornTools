import { createContext, useContext } from "react";
import type { ThemeDefinition, ThemeInput } from "../types/themes";

export interface ThemeSettingsContextModel {
  availableThemes: ThemeDefinition[];
  selectedThemeId: number | null;
  currentTheme: ThemeDefinition;
  applyingTheme: boolean;
  selectTheme: (themeId: number | null) => Promise<void>;
  saveTheme: (theme: ThemeInput) => Promise<ThemeDefinition | null>;
  refreshThemes: () => Promise<void>;
}

export const ThemeSettingsContext =
  createContext<ThemeSettingsContextModel | null>(null);

export const useThemeSettings = () => {
  const context = useContext(ThemeSettingsContext);
  if (!context) {
    throw new Error("useThemeSettings must be used inside ThemeProvider");
  }
  return context;
};

