'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Filter } from 'lucide-react';
import { GraphStats, GraphNode } from '../lib/types';
import { NODE_COLORS, NODE_ICONS, STATUS_COLORS } from '../lib/constant';
import { Badge } from './ui/badge';

interface SidebarProps {
  stats: GraphStats | null;
  selectedNode: GraphNode | null;
  onClearSelection: () => void;
  activeFilter: string | null;
  onFilterByType: (type: string | null) => void;
}

function formatValue(key: string, val: unknown): React.ReactNode {
  if (val === null || val === undefined || val === '') return <span style={{ color: 'var(--text-muted)' }}>—</span>;

  const statusLike = ['status', 'priority', 'segment', 'type', 'method'];
  if (statusLike.some(k => key.toLowerCase().includes(k)) && typeof val === 'string') {
    const safe = val.replace(/\s+/g, '.');
    return <Badge variant="outline" className={`badge-${safe}`}>{val}</Badge>;
  }

  if (typeof val === 'number') {
    if (key.includes('amount') || key.includes('price')) {
      return <span className="mono" style={{ color: 'var(--accent-green)' }}>{val.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>;
    }
    return <span className="mono">{val}</span>;
  }

  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    return <span className="mono" style={{ color: 'var(--text-secondary)' }}>{val}</span>;
  }

  return <span>{String(val)}</span>;
}

const SKIP_KEYS = ['id', 'order_id', 'customer_id', 'product_id', 'invoice_id', 'address_id', 'billing_address_id', 'shipping_address_id'];

export default function Sidebar({ stats, selectedNode, onClearSelection, activeFilter, onFilterByType }: SidebarProps) {
  return (
    <aside style={{
      width: 220,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      margin: 0,
      padding: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #388BFD, #BC8CFF)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white'
          }}><Network size={18} /></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>O2C GRAPH</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>SAP ORDER-TO-CASH</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

        {/* Selected Node Details */}
        <AnimatePresence mode="popLayout">
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Node Details</span>
              <button
                onClick={onClearSelection}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                title="Clear selection"
              ><X size={16} /></button>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${NODE_COLORS[selectedNode.type] || 'var(--border)'}44`,
              borderRadius: 'var(--radius-md)',
              padding: 12,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28,
                  background: `${NODE_COLORS[selectedNode.type]}22`,
                  border: `1px solid ${NODE_COLORS[selectedNode.type]}66`,
                  borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>{NODE_ICONS[selectedNode.type]}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{selectedNode.type}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{selectedNode.label}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(selectedNode.properties)
                  .filter(([k]) => !SKIP_KEYS.includes(k))
                  .map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 2, fontFamily: 'var(--font-mono)' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 12, textAlign: 'right', maxWidth: '55%', wordBreak: 'break-word' }}>
                      {formatValue(key, val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <hr className="divider" style={{ marginBottom: 16 }} />
          </motion.div>
        )}
        </AnimatePresence>

        {/* Node Type Filter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={12} /> Filter by Type
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {stats && Object.entries(stats.nodesByType).map(([type, count]) => {
              const color = NODE_COLORS[type as keyof typeof NODE_COLORS] || '#8B949E';
              const isActive = activeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => onFilterByType(isActive ? null : type)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px',
                    background: isActive ? `${color}18` : 'transparent',
                    border: `1px solid ${isActive ? color + '44' : 'transparent'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {NODE_ICONS[type as keyof typeof NODE_ICONS]} {type}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: color, fontWeight: 600 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Graph Stats */}
        {stats && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Graph Stats
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Nodes', value: stats.totalNodes, color: 'var(--accent-blue)' },
                { label: 'Edges', value: stats.totalEdges, color: 'var(--accent-violet)' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', letterSpacing: '0.06em' }}>
          SAP O2C GRAPH EXPLORER v1.0
        </div>
      </div>
    </aside>
  );
}