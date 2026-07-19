export function isRichTextEmpty(html?: string): boolean {
  if (!html) {
    return true;
  }

  const textContent = html.replace(/<[^>]*>/g, '').trim();
  return textContent.length === 0;
}
