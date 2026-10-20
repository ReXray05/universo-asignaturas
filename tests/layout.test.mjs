import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLayout, planetRadius, relaxLayout, savePositions } from '../src/lib/layout.ts';
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


test('experimental radii grow gradually, are bounded and can be disabled', () => {
  assert.equal(planetRadius(0,true),39);
  assert.equal(planetRadius(1,true),43);
  assert.ok(planetRadius(4,true)>planetRadius(1,true));
  assert.ok(planetRadius(100000,true)<=78);
  assert.equal(planetRadius(100,false),39);
});

test('a relocated planet stays at its drop position, neighbours react and coordinates persist across filters', () => {
  const memory = new Map();
  globalThis.localStorage = {getItem:key => memory.get(key) ?? null,setItem:(key,value) => memory.set(key,value)};
  try {
    const {nodes,links} = createLayout(subjects,[]);
    const moved=nodes[0], neighbour=nodes[1], distant=nodes[10];
    const before={x:neighbour.x,y:neighbour.y};
    const far={x:distant.x,y:distant.y};
    moved.x=neighbour.x+10; moved.y=neighbour.y+5;
    const drop={x:moved.x,y:moved.y};
    const simulation=relaxLayout(nodes,links,moved.key).stop();
    simulation.tick(150);
    assert.equal(moved.x,drop.x); assert.equal(moved.y,drop.y);
    assert.ok(Math.hypot(neighbour.x-before.x,neighbour.y-before.y)>20);
    assert.ok(Math.hypot(neighbour.x-moved.x,neighbour.y-moved.y)>moved.radius+neighbour.radius);
    assert.ok(Math.hypot(distant.x-far.x,distant.y-far.y)<8);
    assert.ok(simulation.alpha()<simulation.alphaMin(),'Physics reaches rest after a bounded relaxation');
    savePositions(nodes);
    const saved=createLayout(subjects,[]).nodes;
    for(const node of nodes) {
      const after=saved.find(n=>n.key===node.key);
      assert.ok(Math.hypot(after.x-node.x,after.y-node.y)<.002);
    }
    savePositions([saved[0]]);
    assert.equal(Object.keys(JSON.parse(memory.get('universo.positions.v1'))).length,11);
  } finally { delete globalThis.localStorage; }
});
