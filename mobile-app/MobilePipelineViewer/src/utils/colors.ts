// Color utility functions

export const hexToRgba = (hex: string, alpha: number): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const rgbToRgba = (rgb: string, alpha: number): string => {
  // Extract RGB values from rgb(r, g, b) format
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  
  const [, r, g, b] = match;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const addTransparency = (color: string, alpha: number): string => {
  if (color.startsWith('#')) {
    return hexToRgba(color, alpha);
  } else if (color.startsWith('rgb(')) {
    return rgbToRgba(color, alpha);
  }
  return color;
};