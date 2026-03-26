'use client';
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GraphData, GraphNode, GraphEdge } from '../lib/types';
import { NODE_COLORS, NODE_SIZES, EDGE_COLORS, NODE_ICONS } from '../lib/constant';

interface GraphViewProps {
  data: GraphData;
  highlightedIds: Set<string>;
  selectedNode: GraphNode | null;
  filterType: string | null;
  onNodeClick: (node: GraphNode) => void;
}

// D3-based force graph rendered on canvas
export default function GraphView({ data, highlightedIds, selectedNode, filterType, onNodeClick }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<SimNode | null>(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);

  type SimNode = GraphNode & { sx: number; sy: number; vx: number; vy: number; };
  type SimEdge = { source: SimNode; target: SimNode; type: GraphEdge['type']; id: string };

  // Build simulation nodes/edges from data
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // Filter nodes if type filter active
    const visibleNodeIds = new Set(
      filterType
        ? data.nodes.filter(n => n.type === filterType).map(n => n.id)
        : data.nodes.map(n => n.id)
    );

    // If filtering, also show immediate neighbors
    if (filterType) {
      data.edges.forEach(e => {
        const src = typeof e.source === 'string' ? e.source : e.source.id;
        const tgt = typeof e.target === 'string' ? e.target : e.target.id;
        if (visibleNodeIds.has(src)) visibleNodeIds.add(tgt);
        if (visibleNodeIds.has(tgt)) visibleNodeIds.add(src);
      });
    }

    nodesRef.current = data.nodes
      .filter(n => visibleNodeIds.has(n.id))
      .map(n => ({
        ...n,
        sx: W / 2 + (Math.random() - 0.5) * 300,
        sy: H / 2 + (Math.random() - 0.5) * 300,
        vx: 0,
        vy: 0,
      }));

    const nodeMap = new Map(nodesRef.current.map(n => [n.id, n]));
    edgesRef.current = data.edges
      .map(e => ({
        id: e.id,
        type: e.type,
        source: nodeMap.get(typeof e.source === 'string' ? e.source : e.source.id)!,
        target: nodeMap.get(typeof e.target === 'string' ? e.target : e.target.id)!,
      }))
      .filter(e => e.source && e.target);

    // Center transform with initial zoom out
    transformRef.current = { x: 0, y: 0, k: 0.8 }; // Start less zoomed out

    // Auto-fit to show all nodes
    const fitToView = () => {
      if (nodesRef.current.length === 0) return;
      
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      nodesRef.current.forEach(n => {
        minX = Math.min(minX, n.sx);
        maxX = Math.max(maxX, n.sx);
        minY = Math.min(minY, n.sy);
        maxY = Math.max(maxY, n.sy);
      });
      
      const nodeWidth = maxX - minX;
      const nodeHeight = maxY - minY;
      const padding = 20; // Tight padding for better initial scale
      
      const scaleX = (W - padding * 2) / nodeWidth;
      const scaleY = (H - padding * 2) / nodeHeight;
      const optimalZoom = Math.min(scaleX, scaleY, 1.25); // Max 125% zoom to fill space
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      transformRef.current = {
        x: W / 2 - centerX * optimalZoom,
        y: H / 2 - centerY * optimalZoom,
        k: optimalZoom
      };
    };

    // Call fit to view after a short delay to let nodes settle
    const initialFit = setTimeout(fitToView, 250);
    return () => clearTimeout(initialFit);
  }, [data, filterType]);

  // Force simulation + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Zoom isolation: Use native non-passive listener to reliably prevent browser zoom
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      const newK = Math.max(0.1, Math.min(5, transformRef.current.k * zoomFactor));
      
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      transformRef.current.x = mx - (mx - transformRef.current.x) * (newK / transformRef.current.k);
      transformRef.current.y = my - (my - transformRef.current.y) * (newK / transformRef.current.k);
      transformRef.current.k = newK;
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });

    const ctx = canvas.getContext('2d')!;
    let W = 0, H = 0;

    function resize() {
      W = container!.clientWidth;
      H = container!.clientHeight;
      canvas!.width = W * window.devicePixelRatio;
      canvas!.height = H * window.devicePixelRatio;
      canvas!.style.width = W + 'px';
      canvas!.style.height = H + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function tick() {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Simple force simulation
      const alpha = 0.05;
      const repulsion = 800;
      const springLen = 80;
      const springK = 0.02;
      const centerK = 0.003;
      const damping = 0.88;

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].sx - nodes[i].sx;
          const dy = nodes[j].sy - nodes[i].sy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          nodes[i].vx -= force * dx / dist;
          nodes[i].vy -= force * dy / dist;
          nodes[j].vx += force * dx / dist;
          nodes[j].vy += force * dy / dist;
        }
      }

      // Spring forces on edges
      edges.forEach(e => {
        const dx = e.target.sx - e.source.sx;
        const dy = e.target.sy - e.source.sy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - springLen) * springK;
        e.source.vx += force * dx / dist;
        e.source.vy += force * dy / dist;
        e.target.vx -= force * dx / dist;
        e.target.vy -= force * dy / dist;
      });

      // Center gravity
      nodes.forEach(n => {
        n.vx += (W / 2 - n.sx) * centerK;
        n.vy += (H / 2 - n.sy) * centerK;
        n.vx *= damping;
        n.vy *= damping;
        if (dragNodeRef.current?.id !== n.id) {
          n.sx += n.vx * alpha * 20;
          n.sy += n.vy * alpha * 20;
        }
      });

      draw();
      animFrameRef.current = requestAnimationFrame(tick);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const selId = selectedNode?.id;
      const hasHighlight = highlightedIds.size > 0;
      const hasFilter = !!selId || hasHighlight;

      // Draw edges
      edges.forEach(e => {
        const srcHighlit = highlightedIds.has(e.source.id) || e.source.id === selId;
        const tgtHighlit = highlightedIds.has(e.target.id) || e.target.id === selId;
        const edgeActive = !hasFilter || srcHighlit || tgtHighlit;
        const alpha = edgeActive ? (srcHighlit && tgtHighlit ? 0.9 : 0.5) : 0.08;

        ctx.beginPath();
        ctx.moveTo(e.source.sx, e.source.sy);
        ctx.lineTo(e.target.sx, e.target.sy);
        const baseColor = EDGE_COLORS[e.type] || '#444';
        ctx.strokeStyle = baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = edgeActive ? 1.5 : 0.5;
        ctx.stroke();

        // Edge label on active edges
        if (edgeActive && transformRef.current.k > 0.6) {
          const mx = (e.source.sx + e.target.sx) / 2;
          const my = (e.source.sy + e.target.sy) / 2;
          ctx.font = `9px IBM Plex Mono, monospace`;
          ctx.fillStyle = baseColor + '99';
          ctx.textAlign = 'center';
          ctx.fillText(e.type.replace(/_/g, ' '), mx, my - 4);
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        const isSelected = n.id === selId;
        const isHighlit = highlightedIds.has(n.id);
        const isHovered = hoveredNode?.id === n.id;
        const dimmed = hasFilter && !isSelected && !isHighlit && !isHovered;

        const baseColor = NODE_COLORS[n.type] || '#888';
        const r = (NODE_SIZES[n.type] || 6) * (isSelected ? 1.5 : isHighlit ? 1.3 : 1);
        const alpha = dimmed ? 0.15 : 1;

        // Glow ring for highlighted / selected
        if ((isHighlit || isSelected) && !dimmed) {
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = baseColor + '55';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);

        const grad = ctx.createRadialGradient(n.sx - r * 0.3, n.sy - r * 0.3, 0, n.sx, n.sy, r);
        grad.addColorStop(0, baseColor + 'FF');
        grad.addColorStop(1, baseColor + '88');

        ctx.globalAlpha = alpha;
        ctx.fillStyle = grad;
        ctx.fill();

        if (isSelected || isHighlit) {
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Label
        const showLabel = !dimmed && (isSelected || isHighlit || isHovered || transformRef.current.k > 0.65);
        if (showLabel) {
          ctx.font = `${isSelected ? 'bold ' : ''}${Math.max(9, 11 * transformRef.current.k)}px Space Grotesk, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = dimmed ? '#444' : 'var(--text-primary, #E6EDF3)';
          const label = n.label.length > 20 ? n.label.slice(0, 18) + '…' : n.label;
          ctx.fillText(label, n.sx, n.sy + r + 12);
        }
      });

      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('wheel', handleNativeWheel);
      ro.disconnect();
    };
  }, [data, selectedNode, highlightedIds, hoveredNode, filterType]);

  // Mouse interaction
  const getNodeAt = useCallback((canvasX: number, canvasY: number): SimNode | null => {
    const tx = (canvasX - transformRef.current.x) / transformRef.current.k;
    const ty = (canvasY - transformRef.current.y) / transformRef.current.k;
    let found: SimNode | null = null;
    let minDist = Infinity;
    nodesRef.current.forEach(n => {
      const d = Math.hypot(n.sx - tx, n.sy - ty);
      const r = (NODE_SIZES[n.type] || 6) + 4;
      if (d < r && d < minDist) { minDist = d; found = n; }
    });
    return found;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const node = getNodeAt(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    if (node) {
      dragNodeRef.current = node;
      isDraggingRef.current = false;
    } else {
      dragNodeRef.current = null;
      isDraggingRef.current = true;
    }
    lastMouseRef.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  }, [getNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const dx = e.nativeEvent.offsetX - lastMouseRef.current.x;
    const dy = e.nativeEvent.offsetY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };

    if (dragNodeRef.current) {
      dragNodeRef.current.sx += dx / transformRef.current.k;
      dragNodeRef.current.sy += dy / transformRef.current.k;
    } else if (e.buttons === 1) {
      transformRef.current.x += dx;
      transformRef.current.y += dy;
    }

    // Hover detection
    const hovered = getNodeAt(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setHoveredNode(hovered);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = hovered ? 'pointer' : 'grab';
  }, [getNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragNodeRef.current) {
      const node = getNodeAt(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      if (node && node.id === dragNodeRef.current.id) {
        onNodeClick(node);
      }
    }
    dragNodeRef.current = null;
    isDraggingRef.current = false;
  }, [getNodeAt, onNodeClick]);

  // Removed React onWheel to use native non-passive listener for zoom isolation
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // Logic moved to native listener in useEffect
  }, []);

  return (
    <div ref={containerRef} style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative', 
      overflow: 'hidden', 
      background: 'var(--bg-base)',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #21262D 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.5,
      }} />
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseLeave={() => setHoveredNode(null)}
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%', 
          cursor: 'grab',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
      {/* Controls hint - positioned at absolute bottom */}
      <div style={{
        position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 12,
        padding: '3px 10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        fontSize: 9, color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <span>scroll: zoom</span>
        <span style={{ color: 'var(--border-bright)' }}>|</span>
        <span>drag: pan / move node</span>
        <span style={{ color: 'var(--border-bright)' }}>|</span>
        <span>click: inspect</span>
      </div>
    </div>
  );
}