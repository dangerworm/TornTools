export type ThemeMode = "light" | "dark";

export interface ThemeDefinition {
  id: number;
  name: string;
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  userId: number | null;
}

export interface ThemeInput {
  id?: number;
  name: string;
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  userId?: number | null;
}
