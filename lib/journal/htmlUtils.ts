/**
 * Utility functions for handling HTML content from rich text editors
 */

/**
 * Strips HTML tags and decodes HTML entities from a string
 * @param html - The HTML string to clean
 * @returns Plain text content without HTML tags or entities
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  // Prefer DOM decoding when available (client-side)
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
  }
  
  // Server-side fallback: strip tags and decode a few common entities
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return decoded.replace(/\s+/g, ' ').trim();
}

/**
 * Checks if HTML content is empty (contains no meaningful text)
 * @param html - The HTML string to check
 * @returns true if the content is empty or only contains whitespace
 */
export function isHtmlEmpty(html: string | null | undefined): boolean {
  return stripHtml(html).length === 0;
}

/**
 * Gets clean text from HTML or returns a fallback message
 * @param html - The HTML string to clean
 * @param fallback - The fallback message if content is empty (default: 'No description added')
 * @returns Cleaned text or fallback message
 */
export function getCleanTextOrFallback(
  html: string | null | undefined,
  fallback: string = 'No description added'
): string {
  const cleaned = stripHtml(html);
  return cleaned || fallback;
}

/**
 * Sanitizes HTML content before saving to database
 * Converts empty or whitespace-only HTML to empty string
 * @param html - The HTML string from rich text editor
 * @returns Sanitized HTML string or empty string
 */
export function sanitizeHtmlForSave(html: string | null | undefined): string {
  if (!html) return '';
  
  // Check if the HTML contains only empty tags and whitespace
  if (isHtmlEmpty(html)) {
    return '';
  }
  
  // Return the original HTML if it has actual content
  return html;
}
