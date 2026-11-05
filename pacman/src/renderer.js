function renderWalls() {
  const metrics = mazeMetrics();

  const segments = getWallSegments(MAZE_LAYOUT);

  return segments.map((segment, index) => {
    // getWallSegments() returns:
    // x, y, width, height

    const x =
      metrics.originX +
      segment.x * metrics.cell;

    const y =
      metrics.originY +
      segment.y * metrics.cell;

    const width =
      segment.width * metrics.cell;

    const height =
      segment.height * metrics.cell;

    // Prevent invalid SVG coordinates.
    if (
      ![
        x,
        y,
        width,
        height,
      ].every(Number.isFinite)
    ) {
      return "";
    }

    return `
      <rect
        x="${x.toFixed(2)}"
        y="${y.toFixed(2)}"
        width="${width.toFixed(2)}"
        height="${height.toFixed(2)}"
        rx="2"
        fill="none"
        stroke="${MAZE_CONFIG.wallColor}"
        stroke-width="${MAZE_CONFIG.wallThickness}"
        stroke-linejoin="round"
        filter="url(#cyan-glow)"
        opacity="0.95"
      >
        ${renderWallGlow(index)}
      </rect>
    `;
  }).join("");
}
