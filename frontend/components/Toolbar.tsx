'use client';

import React from 'react';
import { RotateCcw, Maximize, X } from 'lucide-react';
import { GraphStats } from '../lib/types';
import { NODE_COLORS } from '../lib/constant';
import { Button } from './ui/button';

interface ToolbarProps {
  stats: GraphStats | null;
  onResetLayout: () => void;
  onFitView: () => void;
  highlightCount: number;
  onClearHighlights: () => void;
}

export default function Toolbar({ stats, onResetLayout, onFitView, highlightCount, onClearHighlights }: ToolbarProps) {
  return (
    <div style={{
      height: 48,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 8,
      flexShrink: 0,
      margin: 0
    }}>
      {/* Graph node type legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        {stats && Object.entries(stats.nodesByType).map(([type, count]) => {
          const color = NODE_COLORS[type as keyof typeof NODE_COLORS] || '#888';
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{type}</span>
              <span style={{ fontSize: 10, color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Highlight indicator */}
      {highlightCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(56,139,253,0.15)', border: '1px solid rgba(56,139,253,0.4)', borderRadius: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#388BFD', animation: 'pulse-glow 2s infinite' }} />
          <span style={{ fontSize: 11, color: '#388BFD', fontFamily: 'var(--font-mono)' }}>{highlightCount} nodes highlighted</span>
          <button
            onClick={onClearHighlights}
            style={{ background: 'none', border: 'none', color: '#388BFD', cursor: 'pointer', padding: '0 2px', opacity: 0.7 }}
          ><X size={14} /></button>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <Button variant="outline" size="sm" onClick={onResetLayout} className="h-8 gap-2 px-3 text-xs font-medium rounded-lg bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10 text-white/80 transition-all duration-300 shadow-sm backdrop-blur-md">
          <RotateCcw size={14} className="text-[#388BFD]" /> Reset
        </Button>
        {/* <Button variant="outline" size="sm" onClick={onFitView} className="h-8 gap-2 px-3 text-xs font-medium rounded-lg bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10 text-white/80 transition-all duration-300 shadow-sm backdrop-blur-md">
          <Maximize size={14} className="text-[#388BFD]" /> Fit
        </Button> */}
      </div>
    </div>
  );
}