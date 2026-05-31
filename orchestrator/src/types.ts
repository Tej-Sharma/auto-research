// Shared types for the orchestrator.

export type Mode = 'academic' | 'market';
export type Tool = 'web' | 'tiktok' | 'youtube';
export type Platform = 'web' | 'tiktok' | 'youtube' | 'reddit' | 'x';
export type Tone = 'good' | 'mixed' | 'novel' | 'addressed';
export type GapStatus = 'detected' | 'investigating' | 'novel' | 'addressed' | 'partial';

export interface SearchSpec {
  tool: Tool;
  query: string;
  rationale?: string;
  /** Optional explicit URLs for the web crawler (skips a SERP step). */
  urls?: string[];
}

export interface Source {
  id?: string;            // assigned after persist
  platform: Platform;
  url: string;
  title: string;
  author: string;
  metrics: Record<string, number>;
  excerpt: string;
  raw?: unknown;
}

export interface Finding {
  id: string;             // run:{id}:f1
  title: string;
  evidence: string;
  sourceIds: string[];
}

export interface Analysis {
  id: string;             // run:{id}:a1 / :ia2
  tone: Tone;
  verdict: string;
  body: string;
}

export interface Gap {
  id: string;             // run:{id}:g1 / :g3b
  parentGapId?: string;
  findingId?: string;
  title: string;
  why: string;
  status: GapStatus;
  depth: number;
  saturation?: number;
  plan?: unknown;
}

export interface GapVerdict {
  tone: Tone;             // novel | addressed | mixed
  verdict: string;
  body: string;
  saturation: number;     // 0 open .. 1 crowded
  winnability?: number;   // 0..1, for opportunity score
  evidenceRefs?: string[];
}

export interface Report {
  summary: string[];
  novel: any[];
  addressed: any[];
  stats: Record<string, number>;
}
