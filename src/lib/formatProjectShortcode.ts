export const formatProjectShortcode = (shortcode?: string | null): string => {
  if (!shortcode) return '';
  const parts = shortcode.split('_');
  if (parts.length >= 2) {
    return `${parts[0]}_${parts[1]}`;
  }
  return shortcode;
};
