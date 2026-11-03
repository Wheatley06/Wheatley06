
/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * SVG SMIL animation utilities.
 */

import { COLORS, EFFECTS } from "./config.js";

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
      dur="0.45s"
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

  const speedAttributes = keyPoints && keyTimes
    ? `keyPoints="${keyPoints}" keyTimes="${keyTimes}" calcMode="linear"`
    : `calcMode="linear"`;

  return `
    <animateMotion
      path="${path}"
      dur="${duration}s"
      ${speedAttributes}
      rotate="auto"
      repeatCount="indefinite"
    />
  `;
}

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
      rotate="auto"
      calcMode="linear"
      repeatCount="indefinite"
    />
  `;
}

export function renderGhostCapture({
  duration = 90,
  captureTime = 60,
} = {}) {
  const fraction = Math.max(
    0.01,
    Math.min(0.97, captureTime / duration)
  );

  const fadeEnd = Math.min(0.99, fraction + 0.012);

  return `
    <animate
      attributeName="opacity"
      values="1;1;0;0;1"
      keyTimes="0;${fraction};${fadeEnd};0.999;1"
      dur="${duration}s"
      repeatCount="indefinite"
    />
  `;
}

export function renderCollectiblePickup({
  duration = 90,
  pickupTime = 5,
} = {}) {
  const fraction = Math.max(
    0.001,
    Math.min(0.97, pickupTime / duration)
  );

  const fadeEnd = Math.min(0.99, fraction + 0.003);

  return `
    <animate
      attributeName="opacity"
      values="1;1;0;0;1"
      keyTimes="0;${fraction};${fadeEnd};0.999;1"
      dur="${duration}s"
      repeatCount="indefinite"
    />
  `;
}

export function renderSpecialCoinGlow() {
  return `
    <animate
      attributeName="r"
      values="3;4.5;3"
      dur="0.7s"
      repeatCount="indefinite"
    />
  `;
}

export function renderGhostMovement(index = 0) {
  return `
    <animateTransform
      attributeName="transform"
      type="translate"
      additive="sum"
      values="0 0;0 -3;0 0;0 3;0 0"
      dur="2.4s"
      begin="${Math.max(0, index) * 0.35}s"
      repeatCount="indefinite"
    />
  `;
}

export function renderWallGlow(index = 0) {
  return `
    <animate
      attributeName="opacity"
      values="0.65;1;0.65"
      dur="2.5s"
      begin="${(Math.max(0, index) % 5) * 0.25}s"
      repeatCount="indefinite"
    />
  `;
}

export function renderContributionGlow(intensity = 1) {
  const value = Math.max(0.2, Math.min(1, Number(intensity) || 0.2));

  return `
    <animate
      attributeName="opacity"
      values="${value * 0.65};${value};${value * 0.65}"
      dur="3s"
      repeatCount="indefinite"
    />
  `;
}

export function renderSpeedBoost({
  duration = 90,
  start = 10,
  end = 18,
} = {}) {
  return `
    <animate
      attributeName="opacity"
      values="1;1;0.72;1"
      keyTimes="0;${start / duration};${end / duration};1"
      dur="${duration}s"
      repeatCount="indefinite"
    />
  `;
}

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
