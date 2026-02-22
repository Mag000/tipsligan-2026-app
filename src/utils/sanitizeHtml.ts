import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize chronicle HTML content (allows rich text formatting)
 */
export function sanitizeChronicleHtml(html: string): string {
  const result = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "ul",
      "ol",
      "li",
      "a",
      "h1",
      "h2",
      "h3",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  } as any);
  return String(result);
}

/**
 * Sanitize comment text (strips all HTML)
 */
export function sanitizeCommentText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}
