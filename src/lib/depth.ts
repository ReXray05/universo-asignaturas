import type { Lesson, Subject } from '../types';

const variation = (id: string) => {
 let hash = 2166136261;
 for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
 return (hash >>> 0) / 4294967295;
};

/** Relative ranks keep an equally populated universe at the same overall depth. */
export function subjectDepths(subjects: Pick<Subject, 'id'>[], lessons: Pick<Lesson, 'subjectId'>[]): Map<string, number> {
 const counts = new Map(subjects.map(subject => [subject.id, 0]));
 for (const lesson of lessons) if (counts.has(lesson.subjectId)) counts.set(lesson.subjectId, counts.get(lesson.subjectId)! + 1);
 const values = [...counts.values()];
 return new Map(subjects.map(subject => {
  const count = counts.get(subject.id)!;
  const below = values.filter(value => value < count).length;
  const equal = values.filter(value => value === count).length;
  const rank = (below + equal / 2) / Math.max(1, subjects.length);
  return [subject.id, .20 + rank * .55 + variation(subject.id) * .18];
 }));
}
