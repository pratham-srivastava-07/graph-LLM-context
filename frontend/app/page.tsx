'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { GraphData, GraphNode, GraphStats, QueryResult } from '../lib/types';
import { fetchGraph, fetchGraphStats } from '../lib/api';
import Sidebar from '../components/Sidebar';
import Toolbar from '../components/Toolbar';
import ChatPanel from '../components/ChatPanel';

// GraphView uses canvas — must be client-side only
const GraphView = dynamic(() => import('../components/GraphView'), { ssr: false });

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    Promise.all([fetchGraph(), fetchGraphStats()])
      .then(([graph, s]) => {
        setGraphData(graph);
        setStats(s);
        setLoading(false);
      })
      .catch(err => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const handleQueryResult = useCallback((result: QueryResult) => {
    if (result.highlighted_node_ids && result.highlighted_node_ids.length > 0) {
      setHighlightedIds(new Set(result.highlighted_node_ids));
    } else {
      setHighlightedIds(new Set());
    }
    setSelectedNode(null);
  }, []);

  const handleFilterByType = useCallback((type: string | null) => {
    setFilterType(prev => prev === type ? null : type);
    setHighlightedIds(new Set());
    setSelectedNode(null);
  }, []);

  const handleClearHighlights = useCallback(() => {
    setHighlightedIds(new Set());
    setSelectedNode(null);
  }, []);

  return (
    <>
      <Head>
        <title>SAP O2C Graph Explorer</title>
        <meta name="description" content="SAP Order-to-Cash Graph Query System" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>" />
      </Head>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <Toolbar
          stats={stats}
          onResetLayout={() => window.location.reload()}
          onFitView={() => {}}
          highlightCount={highlightedIds.size}
          onClearHighlights={handleClearHighlights}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left sidebar */}
          <Sidebar
            stats={stats}
            selectedNode={selectedNode}
            onClearSelection={() => setSelectedNode(null)}
            activeFilter={filterType}
            onFilterByType={handleFilterByType}
          />

          {/* Main graph area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {loading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 16,
                background: 'var(--bg-base)', zIndex: 10,
              }}>
                <div style={{
                  width: 48, height: 48,
                  border: '2px solid var(--border)',
                  borderTopColor: 'var(--accent-blue)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em' }}>
                  LOADING GRAPH DATA...
                </div>
              </div>
            )}

            {error && !loading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                background: 'var(--bg-base)', zIndex: 10, padding: 32,
              }}>
                <div style={{ fontSize: 32 }}>⚠️</div>
                <div style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'center', maxWidth: 500 }}>
                  Could not connect to backend at http://localhost:3001
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', maxWidth: 500 }}>
                  Start the backend with: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)' }}>cd backend && npm run dev</code>
                </div>
                <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}># Quick start</div>
                  <div>cd backend</div>
                  <div>npm install</div>
                  <div>npm run dev</div>
                  <div style={{ marginTop: 8, color: 'var(--text-muted)' }}># In another terminal:</div>
                  <div>cd frontend</div>
                  <div>npm install</div>
                  <div>npm run dev</div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <GraphView
                data={graphData}
                highlightedIds={highlightedIds}
                selectedNode={selectedNode}
                filterType={filterType}
                onNodeClick={handleNodeClick}
              />
            )}
          </div>

          {/* Right chat panel */}
          <ChatPanel onQueryResult={handleQueryResult} />
        </div>
      </div>
    </>
  );
}