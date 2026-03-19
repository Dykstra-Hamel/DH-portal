export function htmlToPlainText(html: string): string {
  if (!html) return '';

  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const temp = document.createElement('div');
  temp.innerHTML = html;
  return (temp.textContent || '').replace(/\s+/g, ' ').trim();
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const normalized = text.trim();
  if (!normalized) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalized);
      return true;
    }
  } catch {
    // Fallback to execCommand below.
  }

  if (typeof document === 'undefined') return false;

  try {
    const textarea = document.createElement('textarea');
    textarea.value = normalized;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
