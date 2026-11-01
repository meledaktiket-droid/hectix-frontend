import sanitizeHtml from "sanitize-html"

export function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "p", "strong", "em", "ul", "ol", "li", "a", "img", "br"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  })
}
