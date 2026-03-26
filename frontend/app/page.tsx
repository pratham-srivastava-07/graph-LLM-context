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
  const [mounted, setMounted] = useState(false);
  const [chatWidth, setChatWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const resetRef = useRef<(() => void) | null>(null);

  // Handle resizing
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 280 && newWidth < 800) {
        setChatWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 0, padding: 0, userSelect: isResizing ? 'none' : 'auto' }}>
        {/* Top bar */}
        <Toolbar
          stats={stats}
          onResetLayout={() => window.location.reload()}
          onFitView={() => {}}
          highlightCount={highlightedIds.size}
          onClearHighlights={handleClearHighlights}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', margin: 0, padding: 0 }}>
          {/* Left sidebar */}
          <Sidebar
            stats={stats}
            selectedNode={selectedNode}
            onClearSelection={() => setSelectedNode(null)}
            activeFilter={filterType}
            onFilterByType={handleFilterByType}
          />

          {/* Main graph area */}
          <div style={{ 
            flex: 1, 
            position: 'relative', 
            overflow: 'hidden',
            margin: 0,
            padding: 0
          }}>
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

          {/* Resize handle */}
          <div
            onMouseDown={startResizing}
            style={{
              width: '8px',
              marginLeft: '-4px',
              marginRight: '-4px',
              cursor: 'col-resize',
              background: isResizing ? 'var(--accent-blue)' : 'transparent',
              transition: 'background 0.2s',
              zIndex: 30,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center'
            }}
            onMouseEnter={e => !isResizing && (e.currentTarget.style.background = 'rgba(56, 139, 253, 0.15)')}
            onMouseLeave={e => !isResizing && (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: '1px', height: '100%', background: 'var(--border)' }} />
          </div>

          {/* Right chat panel */}
          <ChatPanel width={chatWidth} onQueryResult={handleQueryResult} />
        </div>
      </div>
    </>
  );
}