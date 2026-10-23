import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const USER_MAP: Record<string, string> = {
  '50fe2c09-c555-45ad-85e4-a423db2516af': 'Sigit',
  'ed534b8d-bb71-4404-88f1-a06ff6edc99b': 'Banu',
  'e5ab5269-73b4-477c-8bac-dc9fe527977f': 'Widy',
  '1d5d872b-594c-8198-bf18-0002e878cb40': 'Frans',
  '39c9363b-d979-46d5-98fb-553d3c32728d': 'Dian',
};

const SOURCES = [
  { name: 'Q4 2026', cid: '08130a0f-8091-8252-97e9-076e8e795e52', vid: '12a30a0f-8091-8314-9a58-08b855188683', type: 'quarter' },
  { name: 'Q3 2026', cid: 'b0930a0f-8091-831a-88c2-078df570af8f', vid: '75430a0f-8091-8201-8443-08779ea2a00d', type: 'quarter' },
  { name: 'Q2 2026', cid: '33b30a0f-8091-81e2-bae5-000b0447890e', vid: '33b30a0f-8091-815d-b2cc-000cda6032bb', type: 'quarter' },
  { name: 'Q1 2026', cid: '2e630a0f-8091-80b6-84bb-000b27e1aabe', vid: '2e630a0f-8091-800e-a1aa-000cc481f453', type: 'quarter' },
  { name: 'Cuti', cid: '30b30a0f-8091-80d9-94bf-000b1d8f448e', vid: '30b30a0f-8091-805d-a406-000cd74071fb', type: 'cuti' },
];

function formatId(id: string) {
  if (id.includes('-')) return id;
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

async function queryNotion(collectionId: string, collectionViewId: string) {
  const payload = {
    collection: { id: formatId(collectionId) },
    collectionView: { id: formatId(collectionViewId) },
    loader: {
      type: 'reducer',
      reducers: {
        collection_group_results: {
          type: 'results',
          limit: 500,
        },
      },
      sort: [],
      searchQuery: '',
      userTimeZone: 'Asia/Jakarta',
    },
  };

  const res = await fetch('https://www.notion.so/api/v3/queryCollection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Notion query failed with status: ${res.status}`);
  }

  return res.json();
}

function parseTasks(raw: any, quarterLabel: string) {
  const blocks = raw.recordMap?.block || {};
  const tasks: any[] = [];

  for (const [bid, bval] of Object.entries<any>(blocks)) {
    const b = bval?.value?.value || {};
    if (b.type !== 'page' || b.parent_table !== 'collection') continue;

    const props = b.properties || {};
    const title = (props.title || []).map((t: any) => t[0]).join('') || 'Untitled';
    const status = props['a@Ze']?.[0]?.[0] || 'Not started';
    const priority = props['Qon=']?.[0]?.[0] || 'Medium';

    const squadRaw = props['Kl~G']?.[0]?.[0] || '';
    const squads = squadRaw.split(',').map((s: string) => s.trim()).filter(Boolean);

    const pmRaw = props['z?tz']?.[0]?.[0] || '';
    const pms = pmRaw.split(',').map((p: string) => p.trim()).filter(Boolean);

    const wbs = props['eW:s']?.[0]?.[0] || '';
    const figma_url = props['gLwN']?.[0]?.[0] || '';
    const prd_url = props['DXqN']?.[0]?.[0] || '';
    const taiga_url = props['R@sP']?.[0]?.[0] || '';
    const other_docs = props['s=WH']?.[0]?.[0] || props['Zo~r']?.[0]?.[0] || '';

    let start_date = null;
    let end_date = null;
    const dateProp = props['Toos'] || [];
    for (const dElem of dateProp) {
      if (Array.isArray(dElem[1])) {
        for (const sub of dElem[1]) {
          if (sub[0] === 'd' && typeof sub[1] === 'object') {
            start_date = sub[1].start_date || null;
            end_date = sub[1].end_date || null;
          }
        }
      }
    }

    const assignees: string[] = [];
    const assignedProp = props['\\Z^H'] || [];
    for (const aElem of assignedProp) {
      if (Array.isArray(aElem[1])) {
        for (const sub of aElem[1]) {
          if (sub[0] === 'u') {
            const uid = sub[1];
            assignees.push(USER_MAP[uid] || uid);
          }
        }
      }
    }

    tasks.push({
      id: bid,
      title,
      status,
      priority,
      quarter: quarterLabel,
      wbs,
      squads,
      pms,
      assignees,
      start_date,
      end_date,
      figma_url,
      prd_url,
      taiga_url,
      other_docs,
    });
  }

  return tasks;
}

function parseCuti(raw: any) {
  const blocks = raw.recordMap?.block || {};
  const tasks: any[] = [];

  for (const [bid, bval] of Object.entries<any>(blocks)) {
    const b = bval?.value?.value || {};
    if (b.type !== 'page' || b.parent_table !== 'collection') continue;

    const props = b.properties || {};
    const title = (props.title || []).map((t: any) => t[0]).join('') || 'Cuti';

    const assignees: string[] = [];
    const assignedProp = props['jC<t'] || [];
    for (const aElem of assignedProp) {
      if (Array.isArray(aElem[1])) {
        for (const sub of aElem[1]) {
          if (sub[0] === 'u') {
            const uid = sub[1];
            assignees.push(USER_MAP[uid] || uid);
          }
        }
      }
    }

    let start_date = null;
    let end_date = null;
    const dateProp = props['tY\\K'] || [];
    for (const dElem of dateProp) {
      if (Array.isArray(dElem[1])) {
        for (const sub of dElem[1]) {
          if (sub[0] === 'd' && typeof sub[1] === 'object') {
            start_date = sub[1].start_date || null;
            end_date = sub[1].end_date || null;
          }
        }
      }
    }

    let quarter = 'Q4 2026';
    if (start_date) {
      const month = parseInt(start_date.split('-')[1], 10);
      if (month <= 3) quarter = 'Q1 2026';
      else if (month <= 6) quarter = 'Q2 2026';
      else if (month <= 9) quarter = 'Q3 2026';
      else quarter = 'Q4 2026';
    }

    tasks.push({
      id: bid,
      title,
      status: 'Paid Leave',
      priority: 'Low',
      quarter,
      wbs: '',
      squads: ['Leave'],
      pms: [],
      assignees,
      start_date,
      end_date,
      figma_url: '',
      prd_url: '',
      taiga_url: '',
      other_docs: '',
    });
  }

  return tasks;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetQuarter: string | undefined = body?.quarter; // e.g. 'Q4 2026' or undefined for all

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const sourcesToSync = targetQuarter && targetQuarter !== 'all'
      ? SOURCES.filter((s) => s.name === targetQuarter || s.type === 'cuti')
      : SOURCES;

    const allTasks: any[] = [];

    for (const src of sourcesToSync) {
      try {
        const raw = await queryNotion(src.cid, src.vid);
        const parsed = src.type === 'cuti' ? parseCuti(raw) : parseTasks(raw, src.name);
        allTasks.push(...parsed);
      } catch (err: any) {
        console.warn(`Failed syncing ${src.name}:`, err.message);
      }
    }

    // Upsert into Supabase in chunks of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < allTasks.length; i += BATCH_SIZE) {
      const chunk = allTasks.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('tasks').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error(`Error upserting chunk ${i}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: allTasks.length,
      quarter: targetQuarter || 'all',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
