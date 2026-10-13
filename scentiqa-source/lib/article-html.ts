// Minimal HTML sanitizer for admin-authored article bodies.
// Articles are written in the admin CMS (trusted authors), but we still strip
// anything executable as defense in depth: <script>/<style>/<iframe>/<object>,
// event-handler attributes (onclick=...), and javascript: URLs.
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4',
  'blockquote', 'code', 'pre', 'hr', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

export function sanitizeArticleHtml(html: string): string {
  // Strip comments first
  let out = html.replace(/<!--[\s\S]*?-->/g, '');
  // Remove dangerous elements entirely (with content)
  out = out.replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)[\s\S]*?<\/\1\s*>/gi, '');
  out = out.replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*\/?>/gi, '');
  // Process remaining tags: keep allowed ones with safe attributes only
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName: string) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    const isClose = match.startsWith('</');
    if (isClose) return `</${tag}>`;
    // Keep only href on <a> (http/https/mailto, no javascript:)
    if (tag === 'a') {
      const hrefMatch = match.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? '') : '';
      if (/^(https?:\/\/|mailto:|\/)/i.test(href)) {
        const safe = href.replace(/"/g, '%22');
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer">`;
      }
      return '<a>';
    }
    // Self-closing for void elements
    if (tag === 'br' || tag === 'hr') return `<${tag} />`;
    return `<${tag}>`;
  });
  return out;
}

/** True when the body already contains HTML markup (vs plain text paragraphs). */
export function looksLikeHtml(body: string): boolean {
  return /<(p|div|strong|b|em|i|ul|ol|li|h[1-4]|br|a)[\s>]/.test(body);
}

/** Convert plain-text body (paragraphs separated by blank lines) to simple HTML. */
export function plainTextToHtml(body: string): string {
  const esc = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
    .join('');
}
