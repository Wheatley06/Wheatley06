/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * SVG animation utilities.
 *
 * Uses native SVG SMIL animations.
 * No external runtime dependencies.
 */

import { COLORS, EFFECTS } from "./config.js";

/**
 * Animate Pac-Man's movement.
 */
export function renderPacmanMovement({
  duration = 8,
  distance = 24,
} = {}) {
  return `
    <animateTransform
      attributeName="transform"
      type="translate"
      values="0 0; ${distance} 0; ${distance} 0"
      keyTimes="0; 0.85; 1"
      dur="${duration}s"
      repeatCount="indefinite"
    />
  `;
}

/**
 * Animate Pac-Man's mouth.
 */
export function renderPacmanMouth() {
  return `
    <animate
      attributeName="d"
      values="
        M 0 0 L 10 -5 A 10 10 0 0 1 10 5 Z;
        M 0 0 L 10 0 A 10 10 0 0 1 10 0 Z;
        M 0 0 L 10 -5 A 10 10 0 0 1 10 5 Z
      "
      dur="0.45s"
      repeatCount="indefinite"
    />
  `;
}

/**
 * Animate a ghost floating vertically.
 */
export function renderGhostMovement(index = 0) {
  const delay = index * 0.35;

  return `
    <animateTransform
      attributeName="transform"
      type="translate"
      values="0 0; 0 -5; 0 0; 0 4; 0 0"
      dur="2.4s"
      begin="${delay}s"
      repeatCount="indefinite"
    />
  `;
}

/**
 * Animate neon wall intensity.
 */
export function renderWallGlow(index = 0) {
  const delay = (index % 5) * 0.25;

  return `
    <animate
      attributeName="opacity"
      values="0.65; 1; 0.65"
      dur="2.5s"
      begin="${delay}s"
      repeatCount="indefinite"
    />
  `;
}

/**
 * Animate contribution cell brightness.
 */
export function renderContributionGlow(intensity = 1) {
  const safeIntensity = Math.max(0.25, Math.min(1, intensity));

  return `
    <animate
      attributeName="opacity"
      values="${safeIntensity * 0.65}; ${safeIntensity}; ${safeIntensity * 0.65}"
      dur="3s"
      repeatCount="indefinite"
    />
  `;
}

/**
 * Render a decorative particle.
 */
export function renderParticle({
  x,
  y,
  radius = 2,
  color = COLORS.cyan,
  delay = 0,
} = {}) {
  return `
    <circle cx="${x}" cy="${y}" r="${radius}"
      fill="${color}">
      <animate
        attributeName="opacity"
        values="0; 1; 0"
        dur="2.5s"
        begin="${delay}s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="r"
        values="${radius}; ${radius * 1.8}; ${radius}"
        dur="2.5s"
        begin="${delay}s"
        repeatCount="indefinite"
      />
    </circle>
  `;
}

/**
 * Render decorative HUD particles.
 */
export function renderHudParticles() {
  if (!EFFECTS.particles) return "";

  const particles = [
    { x: 80, y: 105, color: COLORS.cyan, delay: 0 },
    { x: 180, y: 420, color: COLORS.blue, delay: 0.5 },
    { x: 1040, y: 110, color: COLORS.purple, delay: 1 },
    { x: 1120, y: 400, color: COLORS.magenta, delay: 1.5 },
    { x: 100, y: 380, color: COLORS.teal, delay: 0.8 },
    { x: 1080, y: 180, color: COLORS.cyan, delay: 1.2 },
  ];

  return `
    <g>
      ${particles.map((particle) =>
        renderParticle(particle)
      ).join("")}
    </g>
  `;
}
