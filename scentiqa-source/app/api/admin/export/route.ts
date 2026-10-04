import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';

const TABLES = ['perfumes', 'houses', 'prices', 'sellers', 'dupe_relationships', 'reviews', 'users'] as const;

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const url = new URL(request.url);
  const table = url.searchParams.get('table') ?? '';
  const format = url.searchParams.get('format') ?? 'json';
  if (!(TABLES as readonly string[]).includes(table))
    return NextResponse.json({ error: 'Unknown table' }, { status: 400 });

  const c = getSupabaseServer(true)!;
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await c.from(table).select('*').range(offset, offset + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) break;
    rows.push(...data);
    offset += 1000;
    if (offset >= 20000) break;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'csv') {
    const cols = rows.length ? Object.keys(rows[0]) : ['id'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...rows.map((r) => cols.map((k) => esc(r[k])).join(','))].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="scentiqa-${table}-${stamp}.csv"`,
      },
    });
  }
  return new NextResponse(JSON.stringify(rows, null, 1), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="scentiqa-${table}-${stamp}.json"`,
    },
  });
}
