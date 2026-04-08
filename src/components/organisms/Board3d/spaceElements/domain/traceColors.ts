// Float32Array → Float32Array. Zero imports de Three.js.

export function generateTraceColors(positions, baseColor, colorVariation = 0.15) {
  const particleCount = positions.length / 3;
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < particleCount; i++) {
    const v = (Math.random() - 0.5) * colorVariation;
    const idx = i * 3;
    colors[idx]     = Math.max(0, Math.min(1, baseColor.r + v));
    colors[idx + 1] = Math.max(0, Math.min(1, baseColor.g + v));
    colors[idx + 2] = Math.max(0, Math.min(1, baseColor.b + v));
  }

  return colors;
}
