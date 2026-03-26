'use client';

import React from 'react';
import { GraphStats } from '../lib/types';
import { NODE_COLORS } from '../lib/constant';

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
      padding: '0 16px',
      gap: 12,
      flexShrink: 0,
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
            style={{ background: 'none', border: 'none', color: '#388BFD', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px', opacity: 0.7 }}
          >×</button>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { label: '⟲ Reset', action: onResetLayout },
          { label: '⊡ Fit', action: onFitView },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{
              padding: '5px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}