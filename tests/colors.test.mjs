import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastRatio, contrastingInk } from '../src/lib/colors.ts';

test('contrast calculation matches black, white and identical-colour reference cases', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#3288bd', '#3288bd'), 1);
});

test('all eleven requested colours retain readable abbreviations in both page themes', async () => {
  const subjects = JSON.parse(await readFile(new URL('../src/data/subjects.json', import.meta.url)));
  const palette = ['#9e0142','#d53e4f','#f46d43','#fdae61','#fee08b','#ffffbf','#e6f598','#abdda4','#66c2a5','#3288bd','#5e4fa2'];
  assert.deepEqual(subjects.map(subject => subject.color), palette);
  for (const subject of subjects) {
    assert.ok(contrastRatio(subject.color, contrastingInk(subject.color)) >= 4.5, subject.id);
  }
});
