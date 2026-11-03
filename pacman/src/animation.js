
/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * SVG animation utilities.
 *
 * Native SVG SMIL animations.
 * No external runtime dependencies.
 */

import { COLORS, EFFECTS } from "./config.js";

// --------------------------------------------------
// PAC-MAN
// --------------------------------------------------

export function renderPacmanMovement({
  duration = 8,
  distance = 24,
} = {}) {
  return `
    <animateTransform
      attributeName="transform"
      type="translate"
      additive="sum"
      values="0 0; ${distance} 0"
      dur="${duration}s"
      repeatCount="indefinite"
    />
  `;
}

export function renderPacmanMouth(radius = 10) {
  const r = Math.max(1, Number(radius) || 10);
  const upperY = -r * 0.65;
  const lowerY = r * 0.65;

  return `
    <animate
      attributeName="d"
      values="
        M 0 0 L ${r} ${upperY}
        A ${r} ${r} 0 1 1 ${r} ${lowerY} Z;

        M 0 0 L ${r} 0
        A ${r} ${r} 0 1 1 ${r} 0 Z;

        M 0 0 L ${r} ${upperY}
        A ${r} ${r} 0 1 1 ${r} ${lowerY} Z
      "
      dur="0.45s"
      repeatCount="indefinite"
    />
  `;
}

/**
 * Moves Pac-Man along a precomputed SVG path.
 */
export function renderPacmanPath({
  path,
  duration = 30,
  delay = 0,
} = {}) {
  if (!path) return "";

  return `
    <animateMotion
      path="${path}"
      dur="${duration}s"
      begin="${delay}s"
      rotate="auto"
      repeatCount="indefinite"
      calcMode="linear"
    />
  `;
}

/**
 * Temporarily changes Pac-Man's speed.
 */
export function renderSpeedBoost({
  duration = 30,
  boostStart = 8,
  boostEnd = 14,
} = {}) {
  const normalSpeed = 1;
  const boostedSpeed = 1.8;

  return `
    <animate
      attributeName="opacity"
      values="1;1;1"
      dur="${duration}s"
      repeatCount="indefinite"
    />

    <set
      attributeName="data-speed"
      to="${boostedSpeed}"
      begin="${boostStart}s"
      dur="${Math.max(0, boostEnd - boostStart)}s"
    />
  `;
}

// --------------------------------------------------
// GHOSTS
// --------------------------------------------------

export function renderGhostMovement(index = 0) {
  const delay = Math.max(0, index) * 0.35;

  return `
    <animateTransform
      attributeName="transform"
      type="translate"
      additive="sum"
      values="0 0; 0 -4; 0 0; 0 4; 0 0"
      dur="2.4s"
      begin="${delay}s"
      repeatCount="indefinite"
    />
  `;
}

/**
 * Moves a ghost along its escape route.
 */
export function renderGhostEscape({
  path,
  duration = 24,
  delay = 0,
} = {}) {
  if (!path) return "";

  return `
    <animateMotion
      path="${path}"
      dur="${duration}s"
      begin="${delay}s"
      rotate="auto"
      repeatCount="indefinite"
      calcMode="linear"
    />
  `;
}

/**
 * Makes a captured ghost disappear and return
 * at the beginning of the next cycle.
 */
export function renderGhostCapture({
  duration = 30,
  captureTime = 20,
} = {}) {
  return `
    <animate
      attributeName="opacity"
      values="1;1;0;0;1"
      keyTimes="0;${captureTime / duration};${captureTime / duration + 0.001};0.99;1"
      dur="${duration}s"
      repeatCount="indefinite"
    />
  `;
}

// --------------------------------------------------
// WALLS
// --------------------------------------------------

export function renderWallGlow(index = 0) {
  const delay = (Math.max(0, index) % 5) * 0.25;

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

// --------------------------------------------------
// CONTRIBUTIONS AND COINS
// --------------------------------------------------

export function renderContributionGlow(intensity = 1) {
  const safeIntensity = Math.max(
    0.25,
    Math.min(1, Number(intensity) || 0.25)
  );

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
 * Makes a collectible disappear when Pac-Man reaches it.
 */
export function renderCollectiblePickup({
  duration = 30,
  pickupTime = 5,
} = {}) {
  const time = Math.max(0, Math.min(1, pickupTime / duration));

  return `
    <animate
      attributeName="opacity"
      values="1;1;0;0;1"
      keyTimes="0;${time};${Math.min(0.999, time + 0.001)};0.999;1"
      dur="${duration}s"
      repeatCount="indefinite"
    />
  `;
}

/**
 * Special coin pulse.
 */
export function renderSpecialCoinGlow() {
  return `
    <animate
      attributeName="r"
      values="3;5;3"
      dur="0.7s"
      repeatCount="indefinite"
    />

    <animate
      attributeName="opacity"
      values="0.65;1;0.65"
      dur="0.7s"
      repeatCount="indefinite"
    />
  `;
}

// --------------------------------------------------
// PARTICLES
// --------------------------------------------------

export function renderParticle({
  x = 0,
  y = 0,
  radius = 2,
  color = COLORS.cyan,
  delay = 0,
} = {}) {
  const safeRadius = Math.max(0.1, Number(radius) || 2);

  return `
    <circle
      cx="${x}"
      cy="${y}"
      r="${safeRadius}"
      fill="${color}"
    >
      <animate
        attributeName="opacity"
        values="0; 1; 0"
        dur="2.5s"
        begin="${delay}s"
        repeatCount="indefinite"
      />

      <animate
        attributeName="r"
        values="${safeRadius}; ${safeRadius * 1.8}; ${safeRadius}"
        dur="2.5s"
        begin="${delay}s"
        repeatCount="indefinite"
      />
    </circle>
  `;
}

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
