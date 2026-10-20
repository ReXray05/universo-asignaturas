/** WCAG relative luminance for the validated six-digit subject colours. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

/** The same solid fill keeps its readable ink in either page theme. */
export function contrastingInk(background: string): string {
  if (contrastRatio(background, '#18181a') >= 4.5) return '#18181a';
  if (contrastRatio(background, '#ffffff') >= 4.5) return '#ffffff';
  return '#000000';
}
