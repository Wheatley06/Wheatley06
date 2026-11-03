/**
 * Global visual identity.
 * Wheatley06 Cyberpunk Design System
 */

export const PROFILE = {
  name: "WHEATLEY06",
  title: "PAC-MAN CONTRIBUTIONS",
  background: "#0D1117",
};

export const COLORS = {
  background: "#0D1117",
  panel: "#101A2B",
  cyan: "#00CFFF",
  blue: "#1677FF",
  teal: "#00D6B0",
  purple: "#8B35FF",
  magenta: "#D946EF",
  pacman: "#FFE600",

  contributions: [
    "#0D1117",
    "#123D24",
    "#176B35",
    "#25A249",
    "#39E75F",
  ],
};

export const EFFECTS = {
  glow: true,
  particles: true,
  animatedWalls: true,
  neonIntensity: 0.85,
};

export const CANVAS = {
  width: 1200,
  height: 480,
  padding: 24,
  background: COLORS.background,
};

export function getContributionColor(count, maxCount) {
  if (count <= 0) return COLORS.contributions[0];

  const level = Math.min(
    4,
    Math.ceil((count / Math.max(maxCount, 1)) * 4)
  );

  return COLORS.contributions[level];
}
