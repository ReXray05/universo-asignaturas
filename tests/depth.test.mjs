import test from 'node:test';
import assert from 'node:assert/strict';
import { subjectDepths } from '../src/lib/depth.ts';
const subjects=Array.from({length:11},(_,i)=>({id:`subject-${i}`}));
const lessonsFor=counts=>counts.flatMap((count,i)=>Array.from({length:count},()=>({subjectId:subjects[i].id})));
test('equal library growth preserves relative depths instead of bringing every planet forward',()=>{
 const empty=subjectDepths(subjects,[]);
 const populated=subjectDepths(subjects,lessonsFor(subjects.map(()=>50)));
 assert.deepEqual(empty,populated);
 assert.ok(new Set([...populated.values()]).size>5,'Equal lesson counts still have depth variation');
});
test('relative lesson prominence dominates bounded deterministic variation',()=>{
 const depths=subjectDepths(subjects,lessonsFor([100,1,1,1,1,1,1,1,1,1,1]));
 const prominent=depths.get(subjects[0].id);
 for(const s of subjects.slice(1))assert.ok(prominent>depths.get(s.id));
 for(const depth of depths.values())assert.ok(depth>=.2&&depth<=.93);
 const reordered=subjectDepths([...subjects].reverse(),lessonsFor([100,1,1,1,1,1,1,1,1,1,1]));
 for(const [id,depth]of depths)assert.equal(reordered.get(id),depth);
});
