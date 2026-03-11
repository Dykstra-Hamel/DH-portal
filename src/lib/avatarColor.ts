const AVATAR_COLORS = [
  '#0080f0', // blue
  '#00c281', // green
  '#fbbc55', // yellow
  '#f1841e', // orange
  '#84cc16', // lime
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
];

export function getAvatarColor(seed: string): string {
  const hash = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
