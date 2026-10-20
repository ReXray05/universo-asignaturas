import test from 'node:test';
import assert from 'node:assert/strict';
import { zoomIdentity } from 'd3-zoom';
import { attachMapGestures } from '../src/lib/mapGestures.ts';

function harness() {
  const subject={key:'subject:a',id:'a',subjectId:'a',kind:'subject',x:100,y:100};
  const satellite={key:'lesson:b',id:'b',subjectId:'a',kind:'lesson',x:180,y:100};
  const neighbour={key:'subject:c',id:'c',subjectId:'c',kind:'subject',x:300,y:100};
  const nodes=[subject,satellite,neighbour];
  class Canvas extends EventTarget {
    targetNode=subject;
    getBoundingClientRect(){return {left:0,top:0,width:800,height:600};}
    closest(){return this.targetNode ? {getAttribute:()=>this.targetNode.key,setPointerCapture:()=>{}} : null;}
    setPointerCapture(){}
    hasPointerCapture(){return false;}
  }
  const svg=new Canvas();
  let transform=zoomIdentity.scale(2), armed=null, settled=null, saved=0;
  const dispose=attachMapGestures(svg,nodes,{width:800,height:600},{
    onStart(){},onHideTooltip(){},onArm:key=>armed=key,onMove(){},onSettle:key=>settled=key,onSave:()=>saved++,getTransform:()=>transform,onTransform:value=>transform=value,
  });
  const pointer=(type,x,y,id=1)=>{
    const event=new Event(type,{cancelable:true});
    Object.assign(event,{button:0,clientX:x,clientY:y,pointerId:id});
    svg.dispatchEvent(event); return event;
  };
  return {svg,nodes,subject,satellite,neighbour,pointer,dispose,state:()=>({transform,armed,settled,saved})};
}

test('quick drag over a planet pans without moving nodes or opening their click action', () => {
  const h=harness();
  try {
    h.pointer('pointerdown',100,100);h.pointer('pointermove',160,130);h.pointer('pointerup',160,130);
    assert.equal(h.subject.x,100);assert.equal(h.state().transform.x,60);assert.equal(h.state().transform.y,30);
    assert.equal(h.state().settled,null);
    assert.equal(h.pointer('click',160,130).defaultPrevented,true);
  } finally {h.dispose();}
});

test('a short stationary hold arms planet dragging, honours zoom and carries satellites', async () => {
  const h=harness();
  try {
    h.pointer('pointerdown',100,100);
    await new Promise(resolve=>setTimeout(resolve,350));
    assert.equal(h.state().armed,'subject:a');
    h.pointer('pointermove',160,140);h.pointer('pointerup',160,140);
    assert.equal(h.subject.x,130);assert.equal(h.subject.y,120);
    assert.equal(h.satellite.x,210);assert.equal(h.satellite.y,120);
    assert.equal(h.neighbour.x,300);
    assert.equal(h.state().transform.x,0);assert.equal(h.state().transform.k,2);
    assert.equal(h.state().settled,'subject:a');assert.equal(h.state().armed,null);
    assert.equal(h.pointer('click',160,140).defaultPrevented,true);
  } finally {h.dispose();}
});

test('normal click stays available; cancellation clears a hold and two pointers zoom the camera', async () => {
  const h=harness();
  try {
    h.pointer('pointerdown',100,100);h.pointer('pointerup',100,100);
    assert.equal(h.pointer('click',100,100).defaultPrevented,false);
    h.pointer('pointerdown',100,100);h.pointer('pointercancel',100,100);
    await new Promise(resolve=>setTimeout(resolve,350));
    assert.equal(h.state().armed,null);
    h.pointer('pointerdown',100,100,1);h.pointer('pointerdown',200,100,2);h.pointer('pointermove',250,100,2);
    assert.equal(h.state().transform.k,3);assert.equal(h.subject.x,100);
    h.pointer('pointerup',250,100,2);h.pointer('pointerup',100,100,1);
  } finally {h.dispose();}
});
