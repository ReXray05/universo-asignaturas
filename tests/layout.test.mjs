import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLayout } from '../src/lib/layout.ts';
const subjects = JSON.parse(await readFile(new URL('../src/data/subjects.json', import.meta.url)));
test('all eleven subjects are present and stable when the library grows', () => {
  const memory = new Map();
  globalThis.localStorage = {getItem:key => memory.get(key) ?? null,setItem:(key,value) => memory.set(key,value)};
  assert.equal(subjects.length,11);
  assert.equal(subjects.filter(s => s.year===3).length,5);
  assert.equal(subjects.filter(s => s.year===4).length,6);
  const original = createLayout(subjects,[]);
  const fixtures = Array.from({length:121},(_,i)=>({id:`fixture-${i}`,subjectId:subjects[i%11].id,title:`Fixture ${i}`,description:'Temporary test only',path:`lessons/fixture-${i}/index.html`}));
  const populated = createLayout(subjects,fixtures);
  assert.equal(populated.links.length,121);
  for (const node of original.nodes) {
    const after = populated.nodes.find(n => n.key===node.key);
    assert.ok(Math.hypot(after.x-node.x,after.y-node.y)<0.002);
  }
  const next = createLayout(subjects,[...fixtures,{...fixtures[0],id:'fixture-new'}]);
  for(const node of populated.nodes) {
    const after = next.nodes.find(n => n.key===node.key);
    assert.ok(Math.hypot(after.x-node.x,after.y-node.y)<0.002);
    assert.ok(Number.isFinite(after.x)&&Number.isFinite(after.y));
  }
  for(let i=0;i<next.nodes.length;i++) for(let j=i+1;j<next.nodes.length;j++) {
    const a=next.nodes[i],b=next.nodes[j];
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>Math.abs(a.radius-b.radius),'No node may completely hide another');
  }
  delete globalThis.localStorage;
});
