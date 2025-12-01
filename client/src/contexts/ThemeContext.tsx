import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  createTheme,
  type PaletteMode,
} from "@mui/material";
import { ThemeSettingsContext, type ThemeSettingsContextModel } from "../hooks/useThemeSettings";
import { useUser } from "../hooks/useUser";
import {
  fetchThemes,
  postThemeDefinition,
  postUserThemeSelection,
} from "../lib/dotnetapi";
import type { ThemeDefinition, ThemeInput } from "../types/themes";

const LOCAL_STORAGE_SELECTED_THEME_ID = "torntools:theme:selected:v1";

const baseThemes: ThemeDefinition[] = [
  {
    id: 0,
    name: "Default Light",
    mode: "light",
    primaryColor: "#1976d2",
    secondaryColor: "#9c27b0",
    userId: null,
  },
  {
    id: -1,
    name: "Default Dark",
    mode: "dark",
    primaryColor: "#90caf9",
    secondaryColor: "#ce93d8",
    userId: null,
  },
];

const createMuiThemeFromDefinition = (definition: ThemeDefinition) =>
  createTheme({
    palette: {
      mode: definition.mode as PaletteMode,
      primary: {
        main: definition.primaryColor,
      },
      secondary: {
        main: definition.secondaryColor,
      },
    },
    typography: {
      fontFamily: `"Roboto", system-ui, Avenir, Helvetica, Arial, sans-serif`,
    },
  });

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { dotNetUserDetails, updateDotNetUserDetails } = useUser();
  const [availableThemes, setAvailableThemes] = useState<ThemeDefinition[]>(
    baseThemes
  );
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_SELECTED_THEME_ID);
    return stored ? Number(stored) : baseThemes[0].id;
  });
  const [applyingTheme, setApplyingTheme] = useState(false);

  const resolvedTheme = useMemo(() => {
    const existing = availableThemes.find((t) => t.id === selectedThemeId);
    return existing ?? availableThemes[0] ?? baseThemes[0];
  }, [availableThemes, selectedThemeId]);

  const muiTheme = useMemo(
    () => createMuiThemeFromDefinition(resolvedTheme),
    [resolvedTheme]
  );

  const refreshThemes = useCallback(async () => {
    setApplyingTheme(true);
    try {
      const themes = await fetchThemes(dotNetUserDetails?.id);
      if (themes.length) {
        setAvailableThemes(themes);
      } else {
        setAvailableThemes(baseThemes);
      }

      const preferredThemeId =
        dotNetUserDetails?.preferredThemeId ?? selectedThemeId;
      const preferredTheme = themes.find((t) => t.id === preferredThemeId);
      const fallbackTheme =
        themes.find((t) => t.name.toLowerCase().includes("light")) ??
        themes[0] ??
        baseThemes[0];
      const nextTheme = preferredTheme ?? fallbackTheme;
      setSelectedThemeId(nextTheme.id);
      localStorage.setItem(
        LOCAL_STORAGE_SELECTED_THEME_ID,
        nextTheme.id.toString()
      );
    } catch (e) {
      console.error("Failed to refresh themes", e);
      setAvailableThemes(baseThemes);
    } finally {
      setApplyingTheme(false);
    }
  }, [dotNetUserDetails?.id, dotNetUserDetails?.preferredThemeId, selectedThemeId]);

  useEffect(() => {
    void refreshThemes();
  }, [refreshThemes]);

  useEffect(() => {
    if (dotNetUserDetails?.preferredThemeId) {
      setSelectedThemeId(dotNetUserDetails.preferredThemeId);
      localStorage.setItem(
        LOCAL_STORAGE_SELECTED_THEME_ID,
        dotNetUserDetails.preferredThemeId.toString()
      );
    }
    if (!dotNetUserDetails && selectedThemeId === null) {
      setSelectedThemeId(baseThemes[0].id);
    }
  }, [dotNetUserDetails, selectedThemeId]);

  const selectTheme = useCallback(
    async (themeId: number | null) => {
      const targetTheme =
        availableThemes.find((t) => t.id === themeId) ?? availableThemes[0];
      setSelectedThemeId(targetTheme?.id ?? null);
      if (targetTheme?.id !== undefined && targetTheme?.id !== null) {
        localStorage.setItem(
          LOCAL_STORAGE_SELECTED_THEME_ID,
          targetTheme.id.toString()
        );
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SELECTED_THEME_ID);
      }

      if (dotNetUserDetails?.id && targetTheme?.id) {
        try {
          const updatedUser = await postUserThemeSelection(
            dotNetUserDetails.id,
            targetTheme.id
          );
          if (updatedUser) {
            updateDotNetUserDetails(updatedUser);
          }
        } catch (error) {
          console.error("Failed to persist theme selection", error);
        }
      }
    },
    [availableThemes, dotNetUserDetails?.id, updateDotNetUserDetails]
  );

  const saveTheme = useCallback(
    async (themeInput: ThemeInput): Promise<ThemeDefinition | null> => {
      if (!dotNetUserDetails?.id) {
        console.warn("Cannot save a custom theme without signing in");
        return null;
      }
      try {
        const themeToSave: ThemeInput = {
          ...themeInput,
          userId: themeInput.userId ?? dotNetUserDetails.id,
        };
        const saved = await postThemeDefinition(themeToSave);
        if (saved) {
          setAvailableThemes((prev) => {
            const others = prev.filter((t) => t.id !== saved.id);
            return [...others, saved].sort((a, b) => a.name.localeCompare(b.name));
          });
          await selectTheme(saved.id);
        }
        return saved;
      } catch (error) {
        console.error("Failed to save theme", error);
        return null;
      }
    },
    [dotNetUserDetails?.id, selectTheme]
  );

  const contextValue = useMemo(
    () => ({
      availableThemes,
      selectedThemeId,
      currentTheme: resolvedTheme,
      applyingTheme,
      selectTheme,
      saveTheme,
      refreshThemes,
    } as ThemeSettingsContextModel),
    [
      availableThemes,
      selectedThemeId,
      resolvedTheme,
      applyingTheme,
      selectTheme,
      saveTheme,
      refreshThemes,
    ]
  );

  return (
    <ThemeSettingsContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeSettingsContext.Provider>
  );
};

