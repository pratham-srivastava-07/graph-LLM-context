'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { QueryResult } from '../lib/types';
import { sendQuery, fetchSuggestions } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  result?: QueryResult;
  timestamp: Date;
}

interface ChatPanelProps {
  onQueryResult: (result: QueryResult) => void;
}

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <div style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', padding: '8px 0' }}>No rows returned.</div>;

  const cols = Object.keys(rows[0]);
  return (
    <div style={{ overflowX: 'auto', marginTop: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        <thead>
          <tr style={{ background: 'var(--bg-elevated)' }}>
            {cols.map(c => (
              <th key={c} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
                {c.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)' }}>
              {cols.map(c => {
                const val = row[c];
                const isStatus = c === 'status' || c === 'order_status';
                const isNum = typeof val === 'number';
                const isDate = typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val);
                return (
                  <td key={c} style={{ padding: '5px 10px', whiteSpace: 'nowrap' }}>
                    {val === null || val === undefined ? (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    ) : isStatus ? (
                      <span className={`badge badge-${String(val).replace(/\s+/g, '.')}`}>{String(val)}</span>
                    ) : isNum ? (
                      <span style={{ color: 'var(--accent-green)' }}>{Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    ) : isDate ? (
                      <span style={{ color: 'var(--text-secondary)' }}>{String(val)}</span>
                    ) : (
                      <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ChatPanel({ onQueryResult }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    text: 'Ask me anything about your SAP Order-to-Cash data. I can trace order flows, find invoicing gaps, aggregate payments, and more.',
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSQL, setShowSQL] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchSuggestions().then(setSuggestions).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = async (query: string) => {
    if (!query.trim() || loading) return;
    setShowSuggestions(false);

    const userMsg: Message = { id: Date.now() + '-u', role: 'user', text: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await sendQuery(query);
      const assistantMsg: Message = {
        id: Date.now() + '-a',
        role: result.success ? 'assistant' : 'error',
        text: result.summary || result.error || 'Query executed.',
        result,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (result.success) onQueryResult(result);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + '-e', role: 'error',
        text: `Network error: ${(e as Error).message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input); }
  };

  const filteredSuggestions = suggestions.filter(s =>
    input.length === 0 || s.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div style={{
      width: 420,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>Natural Language Query</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto', letterSpacing: '0.06em' }}>
          LLM → SQL → GRAPH
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <div key={msg.id} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 4,
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '90%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #388BFD22, #388BFD44)'
                : msg.role === 'error'
                ? 'rgba(248,81,73,0.1)'
                : 'var(--bg-elevated)',
              border: `1px solid ${msg.role === 'user' ? '#388BFD44' : msg.role === 'error' ? 'rgba(248,81,73,0.3)' : 'var(--border)'}`,
              fontSize: 13,
              color: msg.role === 'error' ? 'var(--accent-red)' : 'var(--text-primary)',
              lineHeight: 1.5,
            }}>
              {msg.role !== 'user' && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {msg.role === 'error' ? '⚠ Error' : '◆ Assistant'}
                </div>
              )}
              {msg.text}
            </div>

            {/* Result table + SQL toggle */}
            {msg.result?.success && msg.result.rows.length > 0 && (
              <div style={{ maxWidth: '100%', width: '100%' }}>
                <ResultTable rows={msg.result.rows.slice(0, 50)} />
                {msg.result.rows.length > 50 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 0', fontFamily: 'var(--font-mono)' }}>
                    Showing 50 of {msg.result.rows.length} rows
                  </div>
                )}
                <button
                  onClick={() => setShowSQL(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                  style={{
                    marginTop: 6, background: 'none', border: '1px solid var(--border)',
                    borderRadius: 4, padding: '3px 10px', fontSize: 10,
                    color: 'var(--text-muted)', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                    transition: 'all 0.15s',
                  }}
                >
                  {showSQL[msg.id] ? '▲ HIDE SQL' : '▼ SHOW SQL'}
                </button>
                {showSQL[msg.id] && (
                  <pre style={{
                    marginTop: 6,
                    padding: 10,
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 10,
                    color: 'var(--accent-violet)',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                  }}>
                    {msg.result.query}
                  </pre>
                )}
                {msg.result.highlighted_node_ids && msg.result.highlighted_node_ids.length > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--accent-blue)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    ⬡ {msg.result.highlighted_node_ids.length} nodes highlighted in graph
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '2px 12px 12px 12px', maxWidth: '80%' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)',
                  animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Translating query...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          maxHeight: 200, overflowY: 'auto',
          background: 'var(--bg-elevated)',
        }}>
          <div style={{ padding: '6px 16px 4px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Suggestions
          </div>
          {filteredSuggestions.slice(0, 6).map((s, i) => (
            <button
              key={i}
              onClick={() => { setInput(s); setShowSuggestions(false); inputRef.current?.focus(); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              ↗ {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Ask about orders, deliveries, invoices..."
            rows={2}
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-bright)',
              borderRadius: 8,
              padding: '10px 12px',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-display)',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              transition: 'border-color 0.15s',
            }}
            onFocusCapture={e => (e.target.style.borderColor = 'var(--accent-blue)')}
            onBlurCapture={e => (e.target.style.borderColor = 'var(--border-bright)')}
          />
          <button
            onClick={() => submit(input)}
            disabled={!input.trim() || loading}
            style={{
              padding: '10px 16px',
              background: input.trim() && !loading ? 'var(--accent-blue)' : 'var(--bg-elevated)',
              border: '1px solid var(--border-bright)',
              borderRadius: 8,
              color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              fontSize: 16,
              transition: 'all 0.15s',
              flexShrink: 0,
              lineHeight: 1,
              height: 42,
            }}
            title="Send query (Enter)"
          >↑</button>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Enter to send · Shift+Enter for newline · Dataset queries only
        </div>
      </div>
    </div>
  );
}