/**
 * HTML Footer Injection Helper
 *
 * Intelligently injects footer HTML into email content while preserving structure.
 * Handles both full HTML documents and fragments.
 */

/**
 * Injects footer HTML into email content before the closing </body> tag if present,
 * otherwise appends it to the end of the HTML.
 *
 * @param htmlContent - The original HTML email content
 * @param footerHtml - The footer HTML to inject
 * @returns Modified HTML with footer injected
 */
export function injectFooterIntoHtml(htmlContent: string, footerHtml: string): string {
  // Trim whitespace from inputs
  const trimmedHtml = htmlContent.trim();
  const trimmedFooter = footerHtml.trim();

  // If the HTML is empty, return just the footer wrapped in basic HTML structure
  if (!trimmedHtml) {
    return `
<!DOCTYPE html>
<html>
<body>
${trimmedFooter}
</body>
</html>
`;
  }

  // Check if the HTML already contains this exact footer (prevent double-injection)
  if (trimmedHtml.includes(trimmedFooter)) {
    return trimmedHtml;
  }

  // Case 1: Full HTML document with closing </body> tag
  const bodyCloseRegex = /<\/body>/i;
  if (bodyCloseRegex.test(trimmedHtml)) {
    return trimmedHtml.replace(bodyCloseRegex, `${trimmedFooter}\n</body>`);
  }

  // Case 2: HTML with closing </html> tag but no </body> (malformed but handle gracefully)
  const htmlCloseRegex = /<\/html>/i;
  if (htmlCloseRegex.test(trimmedHtml)) {
    return trimmedHtml.replace(htmlCloseRegex, `${trimmedFooter}\n</html>`);
  }

  // Case 3: HTML fragment (no body or html closing tags) - append footer
  return `${trimmedHtml}\n${trimmedFooter}`;
}

/**
 * Injects footer text into plain text email content
 *
 * @param textContent - The original plain text email content
 * @param footerText - The footer text to inject
 * @returns Modified text with footer appended
 */
export function injectFooterIntoPlainText(textContent: string, footerText: string): string {
  const trimmedText = textContent.trim();
  const trimmedFooter = footerText.trim();

  // If the text is empty, return just the footer
  if (!trimmedText) {
    return trimmedFooter;
  }

  // Check if the text already contains this exact footer (prevent double-injection)
  if (trimmedText.includes(trimmedFooter)) {
    return trimmedText;
  }

  // Append footer with proper spacing
  return `${trimmedText}\n${trimmedFooter}`;
}
