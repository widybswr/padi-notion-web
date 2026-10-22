/**
 * Notion to Supabase Sync Script
 * 
 * Fetches the latest database records from Notion and upserts them into Supabase.
 * Usage:
 *   node scripts/sync-notion.js
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables if available
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

const NOTION_COLLECTION_ID = '08130a0f-8091-8252-97e9-076e8e795e52';
const NOTION_VIEW_ID = '12a30a0f-8091-8314-9a58-08b855188683';

const USER_MAP = {
  '50fe2c09-c555-45ad-85e4-a423db2516af': 'Sigit',
  'ed534b8d-bb71-4404-88f1-a06ff6edc99b': 'Banu',
  'e5ab5269-73b4-477c-8bac-dc9fe527977f': 'Widy',
  '1d5d872b-594c-8198-bf18-0002e878cb40': 'Frans',
  '39c9363b-d979-46d5-98fb-553d3c32728d': 'Dian',
};

async function fetchNotionData() {
  const payload = JSON.stringify({
    collection: { id: NOTION_COLLECTION_ID },
    collectionView: { id: NOTION_VIEW_ID },
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

function parseNotionRecords(raw) {
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
    const userflow_url = props['s=WH']?.[0]?.[0] || '';
    const other_docs = props['Zo~r']?.[0]?.[0] || '';

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
      wbs,
      squads,
      pms,
      assignees,
      start_date,
      end_date,
      figma_url,
      prd_url,
      taiga_url,
      userflow_url,
      other_docs,
    });
  }

  return tasks;
}

async function main() {
  console.log('Fetching tasks from Notion database...');
  const raw = await fetchNotionData();
  const tasks = parseNotionRecords(raw);
  console.log(`Extracted ${tasks.length} tasks from Notion.`);

  // Save to src/data/initial-tasks.json as backup/cache
  const jsonPath = path.resolve(__dirname, '../src/data/initial-tasks.json');
  fs.writeFileSync(jsonPath, JSON.stringify(tasks, null, 2));
  console.log(`Updated cache: ${jsonPath}`);

  // If Supabase credentials exist, sync to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('tasks').upsert(tasks, { onConflict: 'id' });
    if (error) {
      console.error('Error upserting into Supabase:', error);
    } else {
      console.log(`Successfully synced ${tasks.length} tasks to Supabase!`);
    }
  } else {
    console.log('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not configured in .env.local.');
    console.log('Tasks saved to local JSON cache.');
  }
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
