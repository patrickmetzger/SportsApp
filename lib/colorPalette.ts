/**
 * Color palette generator for school branding
 * Generates complementary colors and variations from primary/secondary colors
 */

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a color palette with variations
 */
export function generateColorPalette(primaryColor: string, secondaryColor: string) {
  const primary = hexToHSL(primaryColor);
  const secondary = hexToHSL(secondaryColor);

  // Generate variations of primary color
  const primaryLighter = hslToHex(primary.h, primary.s, Math.min(primary.l + 15, 95));
  const primaryLight = hslToHex(primary.h, primary.s, Math.min(primary.l + 10, 90));
  const primaryDark = hslToHex(primary.h, primary.s, Math.max(primary.l - 10, 10));
  const primaryDarker = hslToHex(primary.h, primary.s, Math.max(primary.l - 15, 5));

  // Generate variations of secondary color
  const secondaryLighter = hslToHex(secondary.h, secondary.s, Math.min(secondary.l + 15, 95));
  const secondaryLight = hslToHex(secondary.h, secondary.s, Math.min(secondary.l + 10, 90));
  const secondaryDark = hslToHex(secondary.h, secondary.s, Math.max(secondary.l - 10, 10));
  const secondaryDarker = hslToHex(secondary.h, secondary.s, Math.max(secondary.l - 15, 5));

  // Generate accent colors (complementary to primary)
  const accentHue = (primary.h + 180) % 360;
  const accent = hslToHex(accentHue, primary.s, primary.l);
  const accentLight = hslToHex(accentHue, primary.s, Math.min(primary.l + 10, 90));

  // Generate neutral colors based on primary
  const neutral50 = hslToHex(primary.h, Math.max(primary.s - 40, 5), 98);
  const neutral100 = hslToHex(primary.h, Math.max(primary.s - 40, 5), 95);
  const neutral200 = hslToHex(primary.h, Math.max(primary.s - 35, 5), 90);

  return {
    primary: {
      base: primaryColor,
      lighter: primaryLighter,
      light: primaryLight,
      dark: primaryDark,
      darker: primaryDarker,
    },
    secondary: {
      base: secondaryColor,
      lighter: secondaryLighter,
      light: secondaryLight,
      dark: secondaryDark,
      darker: secondaryDarker,
    },
    accent: {
      base: accent,
      light: accentLight,
    },
    neutral: {
      50: neutral50,
      100: neutral100,
      200: neutral200,
    },
  };
}

/**
 * Generate CSS variables string for the palette
 */
export function generateCSSVariables(primaryColor: string, secondaryColor: string): string {
  const palette = generateColorPalette(primaryColor, secondaryColor);

  return `
    --school-primary: ${palette.primary.base};
    --school-primary-lighter: ${palette.primary.lighter};
    --school-primary-light: ${palette.primary.light};
    --school-primary-dark: ${palette.primary.dark};
    --school-primary-darker: ${palette.primary.darker};

    --school-secondary: ${palette.secondary.base};
    --school-secondary-lighter: ${palette.secondary.lighter};
    --school-secondary-light: ${palette.secondary.light};
    --school-secondary-dark: ${palette.secondary.dark};
    --school-secondary-darker: ${palette.secondary.darker};

    --school-accent: ${palette.accent.base};
    --school-accent-light: ${palette.accent.light};

    --school-neutral-50: ${palette.neutral[50]};
    --school-neutral-100: ${palette.neutral[100]};
    --school-neutral-200: ${palette.neutral[200]};
  `;
}
