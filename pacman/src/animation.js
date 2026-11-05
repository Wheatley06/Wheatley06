/** WHEATLEY06 — SVG SMIL animation utilities. */

import { COLORS, EFFECTS } from "./config.js";

// --------------------------------------------------
// PAC-MAN
// --------------------------------------------------

export function renderPacmanMouth(radius = 9) {
  const r = Math.max(1, Number(radius) || 9);

  return `
    <animate
      attributeName="d"
      values="
        M 0 0 L ${r} ${-r * 0.62} A ${r} ${r} 0 1 1 ${r} ${r * 0.62} Z;
        M 0 0 L ${r} 0 A ${r} ${r} 0 1 1 ${r} 0 Z;
        M 0 0 L ${r} ${-r * 0.62} A ${r} ${r} 0 1 1 ${r} ${r * 0.62} Z
      "
      dur="0.42s"
      repeatCount="indefinite"
    />
  `;
}

export function renderPacmanPath({
  path,
  duration = 90,
} = {}) {
  if (!path) return "";

  return `
    <animateMotion
      path="${path}"
      dur="${duration}s"
      calcMode="paced"
      rotate="auto"
      repeatCount="indefinite"
    />
  `;
}

// --------------------------------------------------
// GHOST MOVEMENT
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
      calcMode="paced"
      rotate="0"
      repeatCount="indefinite"
    />
  `;
}

// --------------------------------------------------
// GHOST VISIBILITY / COLLISION
// --------------------------------------------------

export function renderGhostVisibility(
  collision,
  duration = 90
) {
  if (!collision) return "";

  const fraction = Math.max(
    0.001,
    Math.min(0.97, collision.fraction)
  );

  const fadeEnd = Math.min(
    0.99,
    fraction + 0.003
  );

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

// --------------------------------------------------
// GHOST EXPLOSION
// --------------------------------------------------

export function renderGhostExplosion({
  x,
  y,
  fraction,
  duration = 90,
  color = COLORS.cyan,
} = {}) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(fraction)
  ) {
    return "";
  }

  const start = Math.max(
    0.001,
    Math.min(0.94, fraction)
  );

  const peak = Math.min(0.96, start + 0.004);
  const end = Math.min(0.99, start + 0.055);

  const keyTimes = `0;${start};${peak};${end};1`;

  const particles = [
    { dx: -13, dy: -8 },
    { dx: 12, dy: -11 },
    { dx: 17, dy: 3 },
    { dx: 9, dy: 14 },
    { dx: -10, dy: 13 },
    { dx: -17, dy: 2 },
    { dx: 0, dy: -17 },
    { dx: 1, dy: 17 },
  ];

  const particleMarkup = particles.map(
    (particle, index) => {
      const dx = particle.dx;
      const dy = particle.dy;

      const delay = (index % 3) * 0.001;

      const particleTimes = `0;${start};${Math.min(
        0.96,
        peak + delay
      )};${end};1`;

      return `
        <circle
          cx="0"
          cy="0"
          r="${index % 2 === 0 ? 1.8 : 1.3}"
          fill="${index % 2 === 0 ? color : "#FFFFFF"}"
        >
          <animate
            attributeName="opacity"
            values="0;0;1;0;0"
            keyTimes="${particleTimes}"
            dur="${duration}s"
            repeatCount="indefinite"
          />

          <animateTransform
            attributeName="transform"
            type="translate"
            values="
              0 0;
              0 0;
              ${dx} ${dy};
              ${dx * 1.35} ${dy * 1.35};
              ${dx * 1.35} ${dy * 1.35}
            "
            keyTimes="${particleTimes}"
            dur="${duration}s"
            repeatCount="indefinite"
          />
        </circle>
      `;
    }
  ).join("");

  return `
    <g transform="translate(${x} ${y})">

      <!-- Shockwave -->
      <circle
        cx="0"
        cy="0"
        r="2"
        fill="none"
        stroke="${color}"
        stroke-width="1.8"
      >
        <animate
          attributeName="r"
          values="1;1;7;16;16"
          keyTimes="${keyTimes}"
          dur="${duration}s"
          repeatCount="indefinite"
        />

        <animate
          attributeName="opacity"
          values="0;0;1;0;0"
          keyTimes="${keyTimes}"
          dur="${duration}s"
          repeatCount="indefinite"
        />
      </circle>

      <!-- Explosion flash -->
      <circle
        cx="0"
        cy="0"
        r="4"
        fill="#FFFFFF"
        filter="url(#pacman-glow)"
      >
        <animate
          attributeName="r"
          values="0;0;5;1;0"
          keyTimes="${keyTimes}"
          dur="${duration}s"
          repeatCount="indefinite"
        />

        <animate
          attributeName="opacity"
          values="0;0;1;0;0"
          keyTimes="${keyTimes}"
          dur="${duration}s"
          repeatCount="indefinite"
        />
      </circle>

      <!-- Energy particles -->
      ${particleMarkup}

    </g>
  `;
}

// Compatibility helpers.
export function renderGhostCapture() {
  return "";
}

export function renderSpeedBoost() {
  return "";
}

// --------------------------------------------------
// COLLECTIBLES
// --------------------------------------------------

export function renderCollectiblePickup({
  duration = 90,
  pickupTime = 5,
} = {}) {
  const fraction = Math.max(
    0.001,
    Math.min(0.97, pickupTime / duration)
  );

  const fadeEnd = Math.min(
    0.99,
    fraction + 0.0025
  );

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
      values="3;4.2;3"
      dur="1.2s"
      repeatCount="indefinite"
    />
  `;
}

// --------------------------------------------------
// VISUAL EFFECTS
// --------------------------------------------------

export function renderGhostMovement() {
  return `
    <animateTransform
      attributeName="transform"
      type="translate"
      additive="sum"
      values="0 0;0 -1.2;0 0;0 1.2;0 0"
      dur="2.8s"
      repeatCount="indefinite"
    />
  `;
}

export function renderWallGlow(index = 0) {
  return `
    <animate
      attributeName="opacity"
      values="0.82;1;0.82"
      dur="3.2s"
      begin="${(Math.max(0, index) % 7) * 0.18}s"
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
      dur="3.4s"
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
    <circle
      cx="${x}"
      cy="${y}"
      r="${radius}"
      fill="${color}"
    >
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

  return `
    <g>
      ${particles.map(renderParticle).join("")}
    </g>
  `;
}
