/**
 * Full Workspace Sync: Q1 2026, Q2 2026, Q3 2026, Q4 2026, and Cuti
 * - Extracts all tasks, dates, assignees, squads, URLs
 * - Extracts Notion child blocks: page notes/specs converted to Markdown (description)
 * - Resolves all directly uploaded Notion files (PDFs, docx, html, images),
 *   downloads them, uploads to Supabase Storage 'task-attachments', and saves permanent CDN URLs
 * - Extracts Parent / Child relationships (parent_id)
 * - Preserves Notion historical created_time and last_edited_time
 * - Upserts everything into Supabase PostgreSQL
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

function post(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Notion API HTTP ${res.statusCode}: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download file, HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: res.headers['content-type'] || 'application/octet-stream',
        });
      });
    }).on('error', reject);
  });
}

async function queryCollection(collectionId, collectionViewId) {
  return post('https://www.notion.so/api/v3/queryCollection', {
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
}

function formatRichText(fragments) {
  if (!fragments || !Array.isArray(fragments)) return '';
  return fragments
    .map((frag) => {
      let text = frag[0] || '';
      const decorations = frag[1];
      if (decorations && Array.isArray(decorations)) {
        for (const dec of decorations) {
          if (dec[0] === 'b') text = `**${text}**`;
          else if (dec[0] === 'i') text = `*${text}*`;
          else if (dec[0] === 's') text = `~~${text}~~`;
          else if (dec[0] === 'c') text = `\`${text}\``;
          else if (dec[0] === 'a') text = `[${text}](${dec[1]})`;
        }
      }
      return text;
    })
    .join('');
}

function extractParentId(prop) {
  if (!prop || !Array.isArray(prop)) return null;
  for (const item of prop) {
    if (Array.isArray(item[1])) {
      for (const sub of item[1]) {
        if (sub[0] === 'p' && sub[1]) {
          return sub[1];
        }
      }
    }
  }
  return null;
}

function extractSubItemIds(prop) {
  if (!prop || !Array.isArray(prop)) return [];
  const ids = [];
  for (const item of prop) {
    if (Array.isArray(item[1])) {
      for (const sub of item[1]) {
        if (sub[0] === 'p' && sub[1]) {
          ids.push(sub[1]);
        }
      }
    }
  }
  return ids;
}

async function loadPageDetails(pageId, supabase) {
  try {
    const chunk = await post('https://www.notion.so/api/v3/loadPageChunk', {
      pageId,
      limit: 100,
      cursor: { stack: [] },
      chunkNumber: 0,
      verticalColumns: false,
    });

    const blocks = chunk.recordMap?.block || {};
    const descriptionLines = [];
    const attachments = [];
    const fileRequests = [];

    for (const [bid, bval] of Object.entries(blocks)) {
      const b = bval?.value?.value || bval?.value;
      if (!b || bid === pageId) continue;

      const title = formatRichText(b.properties?.title);

      switch (b.type) {
        case 'header':
          if (title) descriptionLines.push(`\n# ${title}\n`);
          break;
        case 'sub_header':
          if (title) descriptionLines.push(`\n## ${title}\n`);
          break;
        case 'sub_sub_header':
        case 'header_4':
          if (title) descriptionLines.push(`\n### ${title}\n`);
          break;
        case 'text':
          if (title) descriptionLines.push(title);
          break;
        case 'bulleted_list':
          if (title) descriptionLines.push(`* ${title}`);
          break;
        case 'numbered_list':
          if (title) descriptionLines.push(`1. ${title}`);
          break;
        case 'to_do': {
          const checked = b.properties?.checked?.[0]?.[0] === 'Yes' ? 'x' : ' ';
          if (title) descriptionLines.push(`- [${checked}] ${title}`);
          break;
        }
        case 'quote':
        case 'callout':
          if (title) descriptionLines.push(`> ${title}`);
          break;
        case 'code':
          if (title) descriptionLines.push(`\`\`\`\n${title}\n\`\`\``);
          break;
        case 'divider':
          descriptionLines.push('---');
          break;
        case 'file':
        case 'image':
        case 'embed': {
          const rawSource =
            b.properties?.source?.[0]?.[0] || b.format?.display_source || '';
          const fileName =
            b.properties?.title?.[0]?.[0] ||
            (rawSource ? rawSource.split(':').pop() : 'Attachment');
          const size = b.properties?.size?.[0]?.[0] || '';

          if (rawSource && rawSource.startsWith('attachment:')) {
            fileRequests.push({
              blockId: bid,
              source: rawSource,
              fileName: fileName.replace(/[^\w.-]/g, '_'),
              size,
              type: b.type,
            });
          }
          break;
        }
      }
    }

    // Resolve Notion signed URLs and upload directly to Supabase Storage
    if (fileRequests.length > 0 && supabase) {
      const signedUrlsRes = await post('https://www.notion.so/api/v3/getSignedFileUrls', {
        urls: fileRequests.map((f) => ({
          url: f.source,
          permissionRecord: { table: 'block', id: f.blockId },
        })),
      });

      const signedUrls = signedUrlsRes?.signedUrls || [];
      for (let i = 0; i < fileRequests.length; i++) {
        const fileReq = fileRequests[i];
        const downloadUrl = signedUrls[i];
        if (!downloadUrl) continue;

        try {
          const { buffer, contentType } = await downloadFile(downloadUrl);
          const storagePath = `${pageId}/${fileReq.fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('task-attachments')
            .upload(storagePath, buffer, {
              contentType,
              upsert: true,
            });

          if (uploadErr) {
            console.error(`Upload error for ${fileReq.fileName}:`, uploadErr.message);
          } else {
            const { data: pubData } = supabase.storage
              .from('task-attachments')
              .getPublicUrl(storagePath);

            attachments.push({
              id: fileReq.blockId,
              name: fileReq.fileName,
              size: fileReq.size,
              type: fileReq.type,
              url: pubData.publicUrl,
            });
          }
        } catch (downloadErr) {
          console.error(`Failed to download ${fileReq.fileName}:`, downloadErr.message);
        }
      }
    }

    return {
      description: descriptionLines.join('\n').trim(),
      attachments,
    };
  } catch (err) {
    console.error(`Error loading page details for ${pageId}:`, err.message);
    return { description: '', attachments: [] };
  }
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

    // Parent task relation (|zGD)
    const parent_id = extractParentId(props['|zGD']);
    const sub_item_ids = extractSubItemIds(props['=mye']);

    // Timestamps
    const created_at = b.created_time
      ? new Date(b.created_time).toISOString()
      : new Date().toISOString();
    const updated_at = b.last_edited_time
      ? new Date(b.last_edited_time).toISOString()
      : new Date().toISOString();

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
      parent_id,
      _sub_item_ids: sub_item_ids,
      _hasContent: Boolean(b.content && b.content.length > 0),
      attachments: [],
      description: '',
      created_at,
      updated_at,
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

    const created_at = b.created_time
      ? new Date(b.created_time).toISOString()
      : new Date().toISOString();
    const updated_at = b.last_edited_time
      ? new Date(b.last_edited_time).toISOString()
      : new Date().toISOString();

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
      parent_id: null,
      attachments: [],
      description: '',
      created_at,
      updated_at,
      _hasContent: false,
    });
  }

  return tasks;
}

async function main() {
  console.log('--- Starting Notion Full Workspace & Files Sync ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let supabase = null;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`Connected to Supabase at ${supabaseUrl}`);
  }

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
      const parsed =
        src.type === 'cuti'
          ? parseCutiRecords(raw)
          : parseQuarterTasks(raw, src.name);
      console.log(`Extracted ${parsed.length} items`);
      allTasks.push(...parsed);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
  }

  // Cross-reference sub-items to populate parent_id if missing on the child
  const taskById = new Map();
  allTasks.forEach((t) => taskById.set(t.id, t));

  allTasks.forEach((t) => {
    if (t._sub_item_ids && t._sub_item_ids.length > 0) {
      t._sub_item_ids.forEach((childId) => {
        const child = taskById.get(childId);
        if (child && !child.parent_id) {
          child.parent_id = t.id;
        }
      });
    }
  });

  // Extract page descriptions and upload attached files
  console.log('\nProcessing page descriptions and uploading direct file attachments...');
  let contentCount = 0;
  let totalUploadedFiles = 0;

  for (let i = 0; i < allTasks.length; i++) {
    const t = allTasks[i];
    if (t._hasContent) {
      contentCount++;
      process.stdout.write(`[${contentCount}] Loading blocks for: "${t.title.slice(0, 35)}" ... `);
      const { description, attachments } = await loadPageDetails(t.id, supabase);
      t.description = description;
      t.attachments = attachments;
      if (attachments.length > 0) {
        totalUploadedFiles += attachments.length;
        console.log(`✓ Attached ${attachments.length} files`);
      } else {
        console.log(`✓ (Description ${description.length} chars)`);
      }
    }
    // Clean up temporary internal parsing properties
    delete t._hasContent;
    delete t._sub_item_ids;
  }

  console.log(`\nProcessed ${contentCount} pages with content.`);
  console.log(`Total attachments migrated to Supabase Storage: ${totalUploadedFiles}`);

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
  if (supabase) {
    console.log(`\nUpserting ${allTasks.length} tasks into Supabase...`);
    const BATCH_SIZE = 50;
    for (let i = 0; i < allTasks.length; i += BATCH_SIZE) {
      const batch = allTasks.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('tasks').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Error upserting batch ${i} - ${i + batch.length}:`, error.message);
      } else {
        process.stdout.write(`Upserted ${Math.min(i + batch.length, allTasks.length)}/${allTasks.length}\r`);
      }
    }
    console.log('\nAll tasks successfully upserted to Supabase!');
  } else {
    console.warn('Supabase credentials missing, only updated local cache.');
  }
}

main().catch(console.error);
