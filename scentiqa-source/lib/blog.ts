// Blog post loader — reads markdown files from content/blog with frontmatter.
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  content: string;
}

const BLOG_DIR = join(process.cwd(), 'content', 'blog');

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }
  return { meta, content: match[2].trim() };
}

// Minimal markdown to HTML (headings, bold, italic, lists, paragraphs, links).
export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3>${inline(trimmed.slice(4))}</h3>`;
    } else if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2>${inline(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h1>${inline(trimmed.slice(2))}</h1>`;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(trimmed.slice(2))}</li>`;
    } else if (trimmed === '') {
      if (inList) { html += '</ul>'; inList = false; }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${inline(trimmed)}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function inline(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

export function getAllBlogPosts(): BlogPost[] {
  try {
    const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
    const posts = files.map((f) => {
      const raw = readFileSync(join(BLOG_DIR, f), 'utf-8');
      const { meta, content } = parseFrontmatter(raw);
      return {
        slug: meta.slug || f.replace(/\.md$/, ''),
        title: meta.title || 'Untitled',
        description: meta.description || '',
        date: meta.date || '',
        content,
      };
    });
    return posts.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function getBlogPost(slug: string): BlogPost | null {
  return getAllBlogPosts().find((p) => p.slug === slug) ?? null;
}
