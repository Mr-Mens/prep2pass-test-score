/** Typical DVSA-style weather list (numbered 1–11), independent mock sheet, not an official form. */
export const WEATHER_SHEET_OPTIONS: readonly { code: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11; label: string }[] = [
  { code: 1, label: "Bright / dry roads" },
  { code: 2, label: "Bright / wet roads" },
  { code: 3, label: "Dull / dry roads" },
  { code: 4, label: "Dull / wet roads" },
  { code: 5, label: "Snowing" },
  { code: 6, label: "Icy" },
  { code: 7, label: "Foggy / mist" },
  { code: 8, label: "Very windy" },
  { code: 9, label: "Dusk / dawn" },
  { code: 10, label: "Darkness" },
  { code: 11, label: "Other" },
] as const;
