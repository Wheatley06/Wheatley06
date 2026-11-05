/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * SVG SMIL animation utilities.
 */

import { COLORS, EFFECTS } from "./config.js";

// --------------------------------------------------
// PAC-MAN
// --------------------------------------------------

export function renderPacmanMouth(radius = 10) {
  const r = Math.max(1, Number(radius) || 10);

  return `
    <animate
      attributeName="d"
      values="
        M 0 0 L ${r} ${-r * 0.65}
        A ${r} ${r} 0 1 1 ${r} ${r * 0.65} Z;
        M 0 0 L ${r} 0
        A ${r} ${r} 0 1 1 ${r} 0 Z;
        M 0 0 L ${r} ${-r * 0.65}
        A ${r} ${r} 0 1 1 ${r} ${r * 0.65} Z
      "
      dur="0.42s"
      repeatCount="indefinite"
    />
  `;
}

export function renderPacmanPath({
  path,
  duration = 90,
  keyPoints,
  keyTimes,
} = {}) {
  if (!path) return "";

  const hasTiming =
    keyPoints &&
    keyTimes &&
    keyPoints.split(";").length === keyTimes.split(";").length;

  return `
    <animateMotion
      path="${path}"
      dur="${duration}s"
      calcMode="linear"
      ${hasTiming
        ? `keyPoints="${keyPoints}" keyTimes="${keyTimes}"`
        : ""}
      rotate="auto"
      repeatCount="indefinite"
    />
  `;
}

// --------------------------------------------------
// GHOSTS
// --------------------------------------------------

export function renderGhostEscape({
  path,
  duration = 90,
  delay = 0,
} = {}) {
  if (!path) return "";

  return `
    <animateMotion
      path="${path}"
      dur="${duration}s"
      begin="${delay}s"
      calcMode="linear"
      rotate="auto"
      repeatCount="indefinite"
    />
  `;
}

// Ghosts are never captured or removed.
export function renderGhostCapture() {
  return "";
}

// --------------------------------------------------
// COLLECTIBLES
// --------------------------------------------------

export function renderCollectiblePickup({
  duration = 90,
  pickupTime = 5,
} = {}) {
  const safeDuration = Math.max(1, Number(duration) || 90);

  const fraction = Math.max(
    0.001,
    Math.min(0.97, Number(pickupTime) / safeDuration)
  );

  const fadeEnd = Math.min(0.99, fraction + 0.002);

  return `
    <animate
      attributeName="opacity"
      values="1;1;0;0;1"
      keyTimes="0;${fraction};${fadeEnd};0.999;1"
      dur="${safeDuration}s"
      repeatCount="indefinite"
    />
  `;
}

export function renderSpecialCoinGlow() {
  return `
    <animate
      attributeName="r"
      values="3;4;3"
      dur="0.8s"
      repeatCount="indefinite"
    />
  `;
}

// Special coins have no speed or capture effect.
export function renderSpeedBoost() {
  return "";
}

// --------------------------------------------------
// GHOST IDLE MOVEMENT
// --------------------------------------------------

export function renderGhostMovement(index = 0) {
  return `
    <animateTransform
      attributeName="transform"
      type="translate"
      additive="sum"
      values="0 0;0 -1.5;0 0;0 1.5;0 0"
      dur="2.4s"
      begin="${Math.max(0, index) * 0.2}s"
      repeatCount="indefinite"
    />
  `;
}

// --------------------------------------------------
// WALLS AND CONTRIBUTIONS
// --------------------------------------------------

export function renderWallGlow(index = 0) {
  return `
    <animate
      attributeName="opacity"
      values="0.82;1;0.82"
      dur="3s"
      begin="${(Math.max(0, index) % 6) * 0.18}s"
      repeatCount="indefinite"
    />
  `;
}

export function renderContributionGlow(intensity = 1) {
  const value = Math.max(
    0.2,
    Math.min(1, Number(intensity) || 0.2)
  );

  return `
    <animate
      attributeName="opacity"
      values="${value * 0.7};${value};${value * 0.7}"
      dur="3s"
      repeatCount="indefinite"
    />
  `;
}

// --------------------------------------------------
// HUD PARTICLES
// --------------------------------------------------

function renderParticle({
  x,
  y,
  radius = 2,
  color = COLORS.cyan,
  delay = 0,
}) {
  return `
    <circle cx="${x}" cy="${y}" r="${radius}" fill="${color}">
      <animate
        attributeName="opacity"
        values="0;1;0"
        dur="2.5s"
        begin="${delay}s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="r"
        values="${radius};${radius * 1.8};${radius}"
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

  return `<g>${particles.map(renderParticle).join("")}</g>`;
}
