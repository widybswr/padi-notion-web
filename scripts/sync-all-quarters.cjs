/**
 * Full Workspace Sync: Q1 2026, Q2 2026, Q3 2026, Q4 2026, and Cuti
 * Fetches from Notion and upserts all records into Supabase.
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  }
}

const USER_MAP = {
  '50fe2c09-c555-45ad-85e4-a423db2516af': 'Sigit',
  'ed534b8d-bb71-4404-88f1-a06ff6edc99b': 'Banu',
  'e5ab5269-73b4-477c-8bac-dc9fe527977f': 'Widy',
  '1d5d872b-594c-8198-bf18-0002e878cb40': 'Frans',
  '39c9363b-d979-46d5-98fb-553d3c32728d': 'Dian',
};

function formatId(id) {
  if (id.includes('-')) return id;
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

async function queryCollection(collectionId, collectionViewId) {
  const payload = JSON.stringify({
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
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://www.notion.so/api/v3/queryCollection',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Notion API returned status ${res.statusCode}: ${data}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function parseQuarterTasks(raw, quarterLabel) {
  const blocks = raw.recordMap?.block || {};
  const tasks = [];

  for (const [bid, bval] of Object.entries(blocks)) {
    const b = bval?.value?.value || {};
    if (b.type !== 'page' || b.parent_table !== 'collection') continue;

    const props = b.properties || {};

    // Title
    const title = (props.title || []).map((t) => t[0]).join('') || 'Untitled';

    // Status
    const status = props['a@Ze']?.[0]?.[0] || 'Not started';

    // Priority
    const priority = props['Qon=']?.[0]?.[0] || 'Medium';

    // Squads
    const squadRaw = props['Kl~G']?.[0]?.[0] || '';
    const squads = squadRaw.split(',').map((s) => s.trim()).filter(Boolean);

    // PMs
    const pmRaw = props['z?tz']?.[0]?.[0] || '';
    const pms = pmRaw.split(',').map((p) => p.trim()).filter(Boolean);

    // WBS
    const wbs = props['eW:s']?.[0]?.[0] || '';

    // URLs
    const figma_url = props['gLwN']?.[0]?.[0] || '';
    const prd_url = props['DXqN']?.[0]?.[0] || '';
    const taiga_url = props['R@sP']?.[0]?.[0] || '';
    const other_docs = props['s=WH']?.[0]?.[0] || props['Zo~r']?.[0]?.[0] || '';

    // Date
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

    // Assignees
    const assignees = [];
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

function parseCutiRecords(raw) {
  const blocks = raw.recordMap?.block || {};
  const tasks = [];

  for (const [bid, bval] of Object.entries(blocks)) {
    const b = bval?.value?.value || {};
    if (b.type !== 'page' || b.parent_table !== 'collection') continue;

    const props = b.properties || {};

    const title = (props.title || []).map((t) => t[0]).join('') || 'Cuti';
    const status = props['E<ud']?.[0]?.[0] || 'Paid Leave';

    // Assignees
    const assignees = [];
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

    // Date
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

    // Determine quarter based on start_date
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

async function main() {
  console.log('--- Starting Notion Sync across all quarters ---');

  const sources = [
    { name: 'Q4 2026', cid: '08130a0f-8091-8252-97e9-076e8e795e52', vid: '12a30a0f-8091-8314-9a58-08b855188683', type: 'quarter' },
    { name: 'Q3 2026', cid: 'b0930a0f-8091-831a-88c2-078df570af8f', vid: '75430a0f-8091-8201-8443-08779ea2a00d', type: 'quarter' },
    { name: 'Q2 2026', cid: '33b30a0f-8091-81e2-bae5-000b0447890e', vid: '33b30a0f-8091-815d-b2cc-000cda6032bb', type: 'quarter' },
    { name: 'Q1 2026', cid: '2e630a0f-8091-80b6-84bb-000b27e1aabe', vid: '2e630a0f-8091-800e-a1aa-000cc481f453', type: 'quarter' },
    { name: 'Cuti', cid: '30b30a0f-8091-80d9-94bf-000b1d8f448e', vid: '30b30a0f-8091-805d-a406-000cd74071fb', type: 'cuti' },
  ];

  const allTasks = [];

  for (const src of sources) {
    process.stdout.write(`Fetching ${src.name}... `);
    try {
      const raw = await queryCollection(src.cid, src.vid);
      const parsed = src.type === 'cuti'
        ? parseCutiRecords(raw)
        : parseQuarterTasks(raw, src.name);
      console.log(`Extracted ${parsed.length} items`);
      allTasks.push(...parsed);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
  }

  console.log(`\nTotal tasks collected: ${allTasks.length}`);

  // Summary by quarter
  const summary = {};
  allTasks.forEach((t) => {
    summary[t.quarter] = (summary[t.quarter] || 0) + 1;
  });
  console.log('Breakdown by quarter:', summary);

  // Update src/data/initial-tasks.json
  const jsonPath = path.resolve(__dirname, '../src/data/initial-tasks.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allTasks, null, 2));
  console.log(`Updated initial-tasks.json cache (${allTasks.length} tasks).`);

  // Upsert into Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const BATCH_SIZE = 50;
    for (let i = 0; i < allTasks.length; i += BATCH_SIZE) {
      const batch = allTasks.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('tasks').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Error upserting batch ${i} - ${i + batch.length}:`, error.message);
      } else {
        process.stdout.write(`Upserted ${i + batch.length}/${allTasks.length}\r`);
      }
    }
    console.log('\nAll tasks successfully upserted to Supabase!');
  } else {
    console.warn('Supabase credentials missing, only updated local cache.');
  }
}

main().catch(console.error);
