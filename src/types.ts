export type Category = 'notas-clase' | 'apuntes-estudio' | 'laboratorio';
export interface Subject { id: string; name: string; abbreviation: string; year: 3 | 4; color: string; position: { x: number; y: number }; }
export interface Lesson { id: string; subjectId: string; title: string; description: string; date?: string | null; path: string; tags?: string[]; category?: Category; }
