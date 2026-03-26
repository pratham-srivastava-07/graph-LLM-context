import { GraphData, QueryResult, GraphStats } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchGraph(): Promise<GraphData> {
    const res = await fetch(`${BASE_URL}/graph`);
    if (!res.ok) throw new Error('Failed to fetch graph');
    const json = await res.json() as { success: boolean; data: GraphData };
    return json.data;
}

export async function fetchGraphStats(): Promise<GraphStats> {
    const res = await fetch(`${BASE_URL}/graph/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const json = await res.json() as { success: boolean; data: GraphStats };
    return json.data;
}

export async function fetchNodeById(id: string) {
    const res = await fetch(`${BASE_URL}/graph/node/${id}`);
    if (!res.ok) throw new Error('Failed to fetch node');
    const json = await res.json() as { success: boolean; data: { node: unknown; neighbors: unknown[]; edges: unknown[] } };
    return json.data;
}

export async function sendQuery(query: string): Promise<QueryResult> {
    const res = await fetch(`${BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    const json = await res.json() as QueryResult;
    return json;
}

export async function fetchSuggestions(): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/query/suggestions`);
    if (!res.ok) return [];
    const json = await res.json() as { suggestions: string[] };
    return json.suggestions;
}