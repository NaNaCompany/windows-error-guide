/** Pure directory matching. Ambiguous codes retain every matching context. */
export const MAX_QUERY_LENGTH = 500;
export const MAX_ALIASES = 32;

export function normalizeSearch(value) {
  if (typeof value !== 'string') return '';
  return value.slice(0, MAX_QUERY_LENGTH).normalize('NFKC').toLowerCase()
    .replace(/[\u0000-\u001f\u007f\u200b-\u200d\ufeff]/g, ' ')
    .replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, ' ').trim()
    .slice(0, MAX_QUERY_LENGTH);
}

const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bounded = (text, value) => value && new RegExp(`(?<![\\p{L}\\p{N}_])${escapePattern(value)}(?![\\p{L}\\p{N}_])`, 'u').test(text);
const canonicalCode = value => normalizeSearch(value).replace(/^code\s*[:#-]?\s*(\d+)$/, '$1');

export function extractCodes(value) {
  const text = normalizeSearch(value);
  const codes = [];
  for (const match of text.matchAll(/(?<![\p{L}\p{N}_])(?:0x[0-9a-f]{1,16}|code\s*[:#-]?\s*\d{1,4}|[a-z]{0,4}-?\d[a-z0-9]{0,5}(?:-[a-z0-9]{1,6})?)(?![\p{L}\p{N}_])/gu)) {
    codes.push(canonicalCode(match[0]));
  }
  // Alpha-only codes are accepted only when explicitly labelled as an error/code.
  for (const match of text.matchAll(/(?:error(?:\s+code)?|code|오류\s*코드|오류|에러|エラー(?:コード)?|错误(?:代码)?|fehler(?:code)?|código(?:\s+de\s+error)?)\s*[:：#-]?\s*([a-z]{1,6}(?:\s+[a-z]{1,3})?)(?![\p{L}\p{N}_-])/gu)) {
    codes.push(canonicalCode(match[1]));
  }
  return [...new Set(codes)];
}

function aliasesOf(record, maxAliases) {
  const limit = Number.isInteger(maxAliases) ? Math.max(0, Math.min(MAX_ALIASES, maxAliases)) : MAX_ALIASES;
  return (Array.isArray(record.aliases) ? record.aliases : []).slice(0, limit)
    .filter(value => typeof value === 'string' && value.trim()).map(normalizeSearch);
}

export function matchesRecord(record, query, {brand = 'all', category = 'all', maxAliases = MAX_ALIASES} = {}) {
  if (!record || typeof record !== 'object' || typeof query !== 'string') return false;
  if (brand !== 'all' && normalizeSearch(brand) !== normalizeSearch(record.brand)) return false;
  if (category !== 'all' && normalizeSearch(category) !== normalizeSearch(record.category)) return false;
  const text = normalizeSearch(query);
  if (!text) return true;
  const names = [normalizeSearch(record.code), ...aliasesOf(record, maxAliases)].filter(Boolean);
  if (names.some(name => canonicalCode(name) === canonicalCode(text))) return true;
  const codeParts = names.flatMap(name => [canonicalCode(name), ...extractCodes(name)]);
  const queryCodes = extractCodes(text);
  // A short code query must never be a substring of a longer code or ordinary word.
  if (/^(?:0x[0-9a-f]+|code\s*[:#-]?\s*\d+|[a-z]{0,4}-?\d[a-z0-9-]*)$/u.test(text)) {
    return queryCodes.some(code => codeParts.includes(code));
  }
  const corpus = normalizeSearch([record.search, record.brand, record.category, record.code,
    ...(Array.isArray(record.models) ? record.models : []), ...names].filter(value => typeof value === 'string').join(' '));
  if (text.split(' ').every(token => /^[a-z0-9_-]+$/.test(token) ? bounded(corpus, token) : corpus.includes(token))) return true;
  // Pasted diagnostics may contain prose absent from the directory. Only labelled codes
  // or hexadecimal codes bypass the prose search; context filters still apply above.
  const diagnostic = /0x[0-9a-f]+|(?:error|code|오류|에러|エラー|错误|fehler|código)/u.test(text);
  if (!diagnostic) return false;
  return queryCodes.some(code => codeParts.includes(code)) || names.some(name => bounded(text, name));
}
