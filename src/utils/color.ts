export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function parseColorToHex(input: string): string | null {
  const trimmed = input.trim();

  const hexShort = /^#([0-9a-fA-F]{3})$/.exec(trimmed);
  if (hexShort) {
    const [, h] = hexShort;
    return '#' + h.split('').map((c) => c + c).join('').toLowerCase();
  }

  const hexFull = /^#([0-9a-fA-F]{6})$/.exec(trimmed);
  if (hexFull) {
    return '#' + hexFull[1].toLowerCase();
  }

  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/.exec(trimmed);
  if (rgb) {
    const r = parseInt(rgb[1]);
    const g = parseInt(rgb[2]);
    const b = parseInt(rgb[3]);
    if (r > 255 || g > 255 || b > 255) return null;
    return rgbToHex(r, g, b);
  }

  return null;
}
