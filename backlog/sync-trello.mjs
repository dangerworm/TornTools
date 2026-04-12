#!/usr/bin/env node
// Syncs Trello cards from the TornTools board to markdown files in backlog/
// Skips the "Done" list. Requires TRELLO_API_KEY and TRELLO_TOKEN in .env

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from repo root
const envPath = join(__dirname, '..', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/^"|"$/g, '')];
    })
);

const KEY = env.TRELLO_API_KEY;
const TOKEN = env.TRELLO_TOKEN;
const BOARD_ID = 'eAZJWxEi';

if (!KEY || !TOKEN) {
  console.error('Missing TRELLO_API_KEY or TRELLO_TOKEN in .env');
  process.exit(1);
}

function trelloUrl(path, params = {}) {
  const url = new URL(`https://api.trello.com/1${path}`);
  url.searchParams.set('key', KEY);
  url.searchParams.set('token', TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function trelloGet(path, params = {}) {
  const res = await fetch(trelloUrl(path, params));
  if (!res.ok) throw new Error(`Trello API error ${res.status}: ${await res.text()}`);
  return res.json();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function formatCard(card, listName, labels, checklists, members) {
  const lines = [];

  lines.push(`# ${card.name}`);
  lines.push('');
  lines.push(`**List:** ${listName}`);

  if (labels.length > 0) {
    lines.push(`**Labels:** ${labels.map(l => l.name || l.color).join(', ')}`);
  }

  if (members.length > 0) {
    lines.push(`**Members:** ${members.map(m => m.fullName).join(', ')}`);
  }

  if (card.due) {
    const due = new Date(card.due).toISOString().split('T')[0];
    lines.push(`**Due:** ${due}${card.dueComplete ? ' ✓' : ''}`);
  }

  lines.push(`**Trello:** ${card.shortUrl}`);
  lines.push('');

  if (card.desc?.trim()) {
    lines.push('## Description');
    lines.push('');
    lines.push(card.desc.trim());
    lines.push('');
  }

  for (const checklist of checklists) {
    lines.push(`## ${checklist.name}`);
    lines.push('');
    for (const item of checklist.checkItems) {
      const tick = item.state === 'complete' ? 'x' : ' ';
      lines.push(`- [${tick}] ${item.name}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  console.log('Fetching board data...');

  const [lists, cards, boardMembers] = await Promise.all([
    trelloGet(`/boards/${BOARD_ID}/lists`),
    trelloGet(`/boards/${BOARD_ID}/cards`, { members: 'true', checklists: 'all' }),
    trelloGet(`/boards/${BOARD_ID}/members`),
  ]);

  const listMap = Object.fromEntries(lists.map(l => [l.id, l.name]));
  const memberMap = Object.fromEntries(boardMembers.map(m => [m.id, m]));

  const activeLists = new Set(
    lists.filter(l => l.name !== 'Done').map(l => l.id)
  );

  const activeCards = cards.filter(c => activeLists.has(c.idList));
  console.log(`Found ${activeCards.length} cards (skipping Done list)`);

  // Remove previously generated card files (but not this script)
  const existing = readdirSync(__dirname).filter(f => f.endsWith('.md'));
  for (const file of existing) {
    unlinkSync(join(__dirname, file));
  }

  const written = [];
  for (const card of activeCards) {
    const listName = listMap[card.idList] ?? 'Unknown';
    const labels = card.labels ?? [];
    const checklists = (card.checklists ?? []).sort((a, b) => a.pos - b.pos);
    const members = (card.idMembers ?? []).map(id => memberMap[id]).filter(Boolean);

    const slug = slugify(card.name);
    const filename = `${slug}.md`;
    const content = formatCard(card, listName, labels, checklists, members);

    writeFileSync(join(__dirname, filename), content, 'utf8');
    written.push({ filename, list: listName });
  }

  // Print summary grouped by list
  const byList = {};
  for (const { filename, list } of written) {
    (byList[list] ??= []).push(filename);
  }
  for (const [list, files] of Object.entries(byList)) {
    console.log(`\n${list} (${files.length})`);
    for (const f of files) console.log(`  ${f}`);
  }

  console.log(`\nDone. ${written.length} files written to backlog/`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
