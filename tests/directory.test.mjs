import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeSearch, extractCodes, matchesRecord, MAX_QUERY_LENGTH, MAX_ALIASES} from '../src/core.mjs';

const washer = {code: '4C', aliases: ['4E', 'nF'], brand: 'Samsung', category: 'washer', search: 'Samsung washer water supply'};
const dishwasher = {...washer, category: 'dishwasher', search: 'Samsung dishwasher water supply'};
const windows = {code: '0x800F081F', aliases: ['CBS_E_SOURCE_MISSING'], brand: 'Microsoft', category: 'optional-feature', search: 'Microsoft Windows optional feature source files'};

test('Unicode normalization is bounded and retains literal text', () => {
  assert.equal(normalizeSearch(' ＥＲＲＯＲ\t０ｘ８００Ｆ０８１Ｆ '), 'error 0x800f081f');
  assert.equal(normalizeSearch('E–01'), 'e-01');
  assert.equal(normalizeSearch('A\u200bB'), 'a b');
  assert.equal(normalizeSearch(null), '');
  assert.equal(normalizeSearch('a'.repeat(501)).length, MAX_QUERY_LENGTH);
  assert.equal(normalizeSearch('a'.repeat(500)+'0x800f081f').includes('0x'), false);
});

test('extract actual numeric, compact Code43, prefix and hexadecimal codes', () => {
  assert.deepEqual(extractCodes('Device failed (Code43). Error 0x800F081F'), ['43', '0x800f081f']);
  assert.deepEqual(extractCodes('오류코드: Ｅ－０１'), ['e-01']);
  assert.deepEqual(extractCodes('error: OE'), ['oe']);
  assert.deepEqual(extractCodes('x0x800f081fx'), []);
});

test('pasted diagnostics find exact codes and aliases without partial code matches', () => {
  assert(matchesRecord(windows, 'Operation failed with error 0x800F081F. Please review logs.'));
  assert(matchesRecord(windows, 'Error: CBS_E_SOURCE_MISSING'));
  assert(matchesRecord({code:'Code 43'}, 'Windows stopped this device (Code43).'));
  assert(matchesRecord({code:'5100'}, 'Printer error code 5100 occurred.'));
  assert(!matchesRecord(windows, '0x800F081'));
  assert(!matchesRecord({code:'5100'}, '510'));
  assert(!matchesRecord({code:'E-01'}, 'E-011'));
  assert(!matchesRecord({code:'Er FF',aliases:['F']}, 'error: failed'));
});

test('context collisions remain independent and filters cannot be bypassed', () => {
  const records = [washer, dishwasher, {...washer, brand:'Other'}];
  assert.equal(records.filter(record => matchesRecord(record,'4C')).length,3);
  assert.equal(records.filter(record => matchesRecord(record,'error 4C',{brand:'Samsung',category:'dishwasher'})).length,1);
  assert(!matchesRecord(windows,'Error 0x800F081F',{category:'windows-update'}));
  assert(matchesRecord(washer,'Samsung washer'));
  assert(!matchesRecord(dishwasher,'Samsung washer'));
});

test('unknown, invalid and injection-looking strings stay literal', () => {
  assert(!matchesRecord(windows,'0xDEADBEEF'));
  assert(!matchesRecord(washer,'unknown product'));
  assert(!matchesRecord(null,'4C'));
  assert(!matchesRecord(washer,null));
  assert(matchesRecord(washer,''));
  for (const query of ['<script>alert(1)</script>','.*','[a-z]+','${x}','(a+)+$']) assert(!matchesRecord(washer,query));
  assert(matchesRecord({code:'(E-01)',aliases:[]},'(E-01)'));
});

test('alias count has explicit lower, upper and invalid-option boundaries', () => {
  const record = {code:'main',aliases:Array.from({length:MAX_ALIASES+1},(_,i)=>`alias${i}`)};
  assert(matchesRecord(record,`alias${MAX_ALIASES-1}`));
  assert(!matchesRecord(record,`alias${MAX_ALIASES}`));
  assert(!matchesRecord(record,'alias0',{maxAliases:0}));
  assert(!matchesRecord(record,'alias0',{maxAliases:-2}));
  assert(matchesRecord(record,'alias0',{maxAliases:NaN}));
  assert(!matchesRecord(record,`alias${MAX_ALIASES}`,{maxAliases:100000}));
});

class Element {
  constructor({value='',dataset={},text=''}={}) { this.value=value; this.dataset=dataset; this.textContent=text; this.hidden=false; this.children=[]; this.handlers={}; this.options=[]; }
  addEventListener(name,callback) { this.handlers[name]=callback; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children=[...nodes]; }
  focus() { this.focused=true; }
  fire(name) { return this.handlers[name]?.({preventDefault(){}}); }
}
function fixture(config, selectors={}) {
  const classes=new Set();
  const elements={'#app-config':new Element({text:JSON.stringify(config)}),'#status':new Element(),...selectors};
  for (const [selector,element] of Object.entries(elements)) if (selector.startsWith('#')) element.id=selector.slice(1);
  return {elements,documentElement:{classList:{add(value){classes.add(value);},contains(value){return classes.has(value);}}},
    querySelector(selector){return elements[selector]||null;},querySelectorAll(selector){return selector==='[data-record]'?(elements.cards||[]):selector.endsWith('form button')?(elements.formButtons||[]):[];},
    createElement(tag){const node=new Element(); node.tagName=tag; return node;}};
}
const ui={copied:'Copied',copyFailed:'Copy failed',results:'Results: {n}',unknown:'Unknown',notProvided:'Not provided',loadFailed:'Load failed',loading:'Loading',namespace:'Namespace',vendorId:'Vendor',deviceId:'Device',manufacturer:'Manufacturer',architecture:'Architecture',brand:'Brand',details:'Details',driver:'Driver'};
async function client(name) {
  let source=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  source=source.replace("'./core.mjs'",JSON.stringify(new URL('../src/core.mjs',import.meta.url).href));
  for(const core of ['device-core.mjs','cuda-core.mjs']) source=source.replace(`'./${core}'`,JSON.stringify(new URL('../src/'+core,import.meta.url).href));
  return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
function mockGlobal(name,value) {
  const before=Object.getOwnPropertyDescriptor(globalThis,name);
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
  return ()=>before?Object.defineProperty(globalThis,name,before):delete globalThis[name];
}
const allText=node=>[node.textContent,...node.children.map(allText)].join(' ');

test('directory client filters cards, updates count, and resets context',async()=>{
  const {initDirectory}=await client('directory-app.js');
  const cards=[washer,dishwasher].map(record=>new Element({dataset:{...record,aliases:JSON.stringify(record.aliases)}}));
  const root=fixture({ui},{'#search':new Element(),'#brand-filter':new Element({value:'all'}),'#category-filter':new Element({value:'all'}),'#result-count':new Element(),'#no-results':new Element(),'#clear-search':new Element(),cards});
  initDirectory(root);
  assert.equal(root.elements['#result-count'].textContent,'Results: 2');
  root.elements['#search'].value='4C'; root.elements['#category-filter'].value='dishwasher'; root.elements['#search'].fire('input');
  assert(cards[0].hidden); assert(!cards[1].hidden);
  root.elements['#search'].value='No such error'; root.elements['#search'].fire('input'); assert(!root.elements['#no-results'].hidden);
  root.elements['#clear-search'].fire('click'); assert.equal(root.elements['#result-count'].textContent,'Results: 2');
  assert(root.documentElement.classList.contains('app-ready'));
});

test('Directory detail page initializes without controls or data fetch',async()=>{
  const restore=mockGlobal('fetch',()=>{throw Error('Detail page fetched data');});
  try {
    const module=await client('directory-app.js'),root=fixture({ui,messages:{}});
    await module.initDirectory(root);
    assert(root.documentElement.classList.contains('app-ready'));
  } finally {restore();}
});
