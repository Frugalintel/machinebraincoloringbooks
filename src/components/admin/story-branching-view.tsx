"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Plus, Minus, Move, Trash2, Edit, Link as LinkIcon, MoreHorizontal } from "lucide-react";
import { StoryNode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StoryBranchingViewProps {
  nodes: StoryNode[];
  onChange: (nodes: StoryNode[]) => void;
  onSelectNode: (nodeId: string) => void;
}

const GRID_SIZE = 20;

export function StoryBranchingView({ nodes, onChange, onSelectNode }: StoryBranchingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Connection Dragging State
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string, choiceIndex?: number, startPos: {x:number, y:number} } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [potentialTargetId, setPotentialTargetId] = useState<string | null>(null);

  // Initialize layout
  useEffect(() => {
    // Only calculate if positions aren't set
    const positions: Record<string, { x: number; y: number }> = {};
    let needsUpdate = false;

    // Use existing positions or naive auto-layout
    const levels: Record<string, number> = {};
    const queue = [{ id: nodes[0]?.id, level: 0 }];
    const visited = new Set();
    
    // BFS for levels
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (!id || visited.has(id)) continue;
      visited.add(id);
      levels[id] = level;

      const node = nodes.find(n => n.id === id);
      if (node) {
        node.choices.forEach(c => {
          if (!visited.has(c.nextNodeId)) {
            queue.push({ id: c.nextNodeId, level: level + 1 });
          }
        });
      }
    }

    const levelCounts: Record<number, number> = {};
    
    nodes.forEach(node => {
      if (node.position) {
        positions[node.id] = node.position;
      } else {
        // Auto layout fallback - snap to grid
        const level = levels[node.id] || 0;
        if (!levelCounts[level]) levelCounts[level] = 0;
        
        positions[node.id] = {
          x: (level * 400 + 100),
          y: (levelCounts[level] * 300 + 100)
        };
        levelCounts[level]++;
        needsUpdate = true;
      }
    });

    setNodePositions(positions);
  }, [nodes.length]); 

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale * delta, 0.1), 3);
      setScale(newScale);
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // --- Input Handlers (Unified Mouse & Touch) ---

  const getClientPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if ('touches' in e) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent, nodeId?: string, choiceIndex?: number, isPort?: boolean) => {
    // Check if target is interactive (like dropdown button), let it propagate
    if ((e.target as HTMLElement).closest('button') && !isPort) return;

    // Prevent default scrolling on touch
    if ('touches' in e) {
        // e.preventDefault(); // Don't block all touch, let zoom happen
    }

    const { x, y } = getClientPos(e);

    if (isPort && nodeId !== undefined) {
        e.stopPropagation();
        const nodePos = nodePositions[nodeId];
        setConnectionStart({ 
            nodeId, 
            choiceIndex,
            startPos: { x: nodePos.x + 220, y: nodePos.y + 75 } // Fallback, will be updated
        });
        return;
    }

    if (nodeId) {
        e.stopPropagation();
        setDraggingNodeId(nodeId);
        setLastMousePos({ x, y });
    } else {
        setIsDraggingCanvas(true);
        setLastMousePos({ x, y });
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getClientPos(e);

    // Update raw mouse pos for connection line
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
        setMousePos({ 
            x: (x - rect.left - position.x) / scale, 
            y: (y - rect.top - position.y) / scale 
        });
    }

    // Check for potential target overlap
    if (connectionStart) {
        const element = document.elementFromPoint(x, y);
        const targetNode = element?.closest('.story-node');
        if (targetNode) {
            const targetId = targetNode.getAttribute('data-id');
            if (targetId && targetId !== connectionStart.nodeId) {
                setPotentialTargetId(targetId);
            } else {
                setPotentialTargetId(null);
            }
        } else {
            setPotentialTargetId(null);
        }
    }

    if (isDraggingCanvas) {
      const dx = x - lastMousePos.x;
      const dy = y - lastMousePos.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x, y });
    } else if (draggingNodeId) {
      const dx = (x - lastMousePos.x) / scale;
      const dy = (y - lastMousePos.y) / scale;
      
      setNodePositions(prev => ({
        ...prev,
        [draggingNodeId]: {
          x: (prev[draggingNodeId]?.x || 0) + dx,
          y: (prev[draggingNodeId]?.y || 0) + dy
        }
      }));
      setLastMousePos({ x, y });
    }
  };

  const handleEnd = () => {
    setIsDraggingCanvas(false);
    
    if (draggingNodeId) {
      const rawPos = nodePositions[draggingNodeId];
      const snappedPos = {
          x: Math.round(rawPos.x / GRID_SIZE) * GRID_SIZE,
          y: Math.round(rawPos.y / GRID_SIZE) * GRID_SIZE
      };
      setNodePositions(prev => ({ ...prev, [draggingNodeId]: snappedPos }));
      const updatedNodes = nodes.map(n => 
        n.id === draggingNodeId 
          ? { ...n, position: snappedPos } 
          : n
      );
      onChange(updatedNodes);
      setDraggingNodeId(null);
    }

    if (connectionStart) {
        if (potentialTargetId) {
            const updatedNodes = [...nodes];
            const sourceNodeIndex = updatedNodes.findIndex(n => n.id === connectionStart.nodeId);
            
            if (sourceNodeIndex >= 0) {
                const sourceNode = updatedNodes[sourceNodeIndex];
                const existingChoice = sourceNode.choices.find(c => c.nextNodeId === potentialTargetId);
                
                if (!existingChoice) {
                    const newChoice = {
                        text: "New Choice",
                        nextNodeId: potentialTargetId
                    };
                    updatedNodes[sourceNodeIndex] = {
                        ...sourceNode,
                        choices: [...sourceNode.choices, newChoice]
                    };
                    onChange(updatedNodes);
                }
            }
        }
        setConnectionStart(null);
        setPotentialTargetId(null);
    }
  };

  const handleDeleteNode = (id: string) => {
      if (confirm("Delete this node?")) {
          const newNodes = nodes.filter(n => n.id !== id);
          onChange(newNodes);
      }
  };

  // --- Step Connection Routing ---
  const renderConnectionLine = (start: {x:number, y:number}, end: {x:number, y:number}, isHovered: boolean = false, label?: string) => {
      const { x: x1, y: y1 } = start;
      const { x: x2, y: y2 } = end;
      
      let d = "";
      
      if (x2 > x1 + 50) {
          const r = 10;
          const mx = (x1 + x2) / 2;
          d = `M ${x1} ${y1} 
               L ${mx - r} ${y1} 
               Q ${mx} ${y1} ${mx} ${y1 + (y2 > y1 ? r : -r)}
               L ${mx} ${y2 + (y2 > y1 ? -r : r)}
               Q ${mx} ${y2} ${mx + r} ${y2}
               L ${x2} ${y2}`;
      } else {
          const gutter = 40;
          const verticalClearance = y2 > y1 ? 100 : -100;
          d = `M ${x1} ${y1}
               L ${x1 + gutter} ${y1}
               L ${x1 + gutter} ${y1 + verticalClearance}
               L ${x2 - gutter} ${y1 + verticalClearance}
               L ${x2 - gutter} ${y2}
               L ${x2} ${y2}`;
      }

      return (
        <g className="transition-opacity duration-300">
          <path 
              d={d}
              fill="none" 
              stroke={isHovered ? "#22c55e" : "#555"} 
              strokeWidth={isHovered ? "2.5" : "1.5"}
              markerEnd={isHovered ? "url(#arrowhead-active)" : "url(#arrowhead)"}
              className="transition-all duration-300 ease-in-out"
          />
          {label ? <foreignObject x={(x1+x2)/2 - 50} y={(y1+y2)/2 - 12} width="100" height="24">
                  <div className={`flex justify-center transition-all duration-300 ${isHovered ? 'opacity-100 scale-105' : 'opacity-80 scale-100'}`}>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono truncate max-w-full border shadow-sm select-none backdrop-blur-sm
                          ${isHovered 
                              ? 'bg-[#22c55e] text-black border-[#22c55e] font-bold' 
                              : 'bg-[#111] text-gray-400 border-[#333]'
                          }
                      `}>
                          {label}
                      </span>
                  </div>
              </foreignObject> : null}
        </g>
      );
  };

  const getChoicePortPosition = (nodeId: string, index: number, total: number) => {
      const pos = nodePositions[nodeId] || { x: 0, y: 0 };
      const headerHeight = 45;
      const bodyHeight = 60; 
      const footerPadding = 12;
      const itemHeight = 24;
      
      const yOffset = headerHeight + bodyHeight + footerPadding + (index * itemHeight) + (itemHeight / 2);
      return { x: pos.x + 220, y: pos.y + yOffset };
  };

  return (
    <div className="relative w-full h-[60vh] md:h-[600px] overflow-hidden bg-[#0a0a0a] border border-[#333] rounded-lg select-none touch-none">
      
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ 
            backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
            backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
            backgroundPosition: `${position.x}px ${position.y}px`
        }}
      ></div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <div className="bg-[#222] border border-[#333] rounded flex">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-[#333]" onClick={() => setScale(s => Math.min(s + 0.1, 3))}><Plus size={14}/></Button>
            <div className="flex items-center px-2 text-xs font-mono border-l border-r border-[#333] w-12 justify-center">{Math.round(scale * 100)}%</div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-[#333]" onClick={() => setScale(s => Math.max(s - 0.1, 0.1))}><Minus size={14}/></Button>
        </div>
        <Button type="button" variant="outline" size="sm" className="bg-[#222] border-[#333] hover:bg-[#333]" onClick={() => { setScale(1); setPosition({x:0, y:0}); }}>
            Reset
        </Button>
      </div>

      <div 
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={(e) => handleStart(e)}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e)}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <div 
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDraggingCanvas || draggingNodeId ? 'none' : 'transform 0.1s ease-out'
          }}
          className="w-full h-full relative"
        >
          {/* Connections Layer */}
          <svg className="absolute top-0 left-0 overflow-visible pointer-events-none z-0">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M1,1 L7,4 L1,7 L2,4 Z" fill="#555" />
              </marker>
              <marker id="arrowhead-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M1,1 L7,4 L1,7 L2,4 Z" fill="#22c55e" />
              </marker>
            </defs>
            
            {/* Existing Connections */}
            {nodes.map(node => (
              node.choices.map((choice, idx) => {
                if (!nodePositions[node.id] || !nodePositions[choice.nextNodeId]) return null;

                const start = getChoicePortPosition(node.id, idx, node.choices.length);
                // Target is center-left of target node
                const targetPos = nodePositions[choice.nextNodeId];
                const end = { x: targetPos.x, y: targetPos.y + 75 }; // Approx center Y

                const isHovered = hoveredNodeId === node.id || hoveredNodeId === choice.nextNodeId;
                return (
                    <g key={`${node.id}-${idx}`}>
                        {renderConnectionLine(start, end, isHovered, choice.text)}
                    </g>
                );
              })
            ))}

            {/* Temporary Dragging Line */}
            {connectionStart ? <path 
                    d={`M ${connectionStart.startPos.x} ${connectionStart.startPos.y} 
                       L ${mousePos.x} ${mousePos.y}`}
                    fill="none"
                    stroke="#22c55e" 
                    strokeWidth="2.5" 
                    strokeDasharray="6,4"
                    className="animate-pulse"
                /> : null}
          </svg>

          {/* Nodes Layer */}
          {nodes.map(node => {
            const pos = nodePositions[node.id] || { x: 0, y: 0 };
            const isTarget = potentialTargetId === node.id;
            const isSource = connectionStart?.nodeId === node.id;

            return (
              <ContextMenu key={node.id}>
                <ContextMenuTrigger>
                  <div
                    data-id={node.id}
                    style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                    className={`story-node absolute w-[220px] bg-[#111] border rounded-lg shadow-xl flex flex-col z-10 transition-all duration-200
                        ${draggingNodeId === node.id 
                            ? 'border-primary ring-2 ring-primary/20 cursor-grabbing scale-105 z-50 shadow-2xl' 
                            : 'border-[#333] hover:border-gray-500 cursor-grab'
                        }
                        ${hoveredNodeId === node.id ? 'border-gray-500' : ''}
                        ${isTarget ? 'border-green-500 ring-2 ring-green-500/50 scale-105' : ''}
                        ${isSource ? 'border-primary' : ''}
                    `}
                    onMouseDown={(e) => handleStart(e, node.id)}
                    onTouchStart={(e) => handleStart(e, node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onDoubleClick={() => onSelectNode(node.id)}
                  >
                    {/* Header */}
                    <div className={`flex justify-between items-center p-3 border-b border-[#333] bg-[#1a1a1a] rounded-t-lg
                        ${isTarget ? 'bg-green-900/20' : ''}
                    `}>
                      <span className="text-[10px] font-mono text-gray-400 truncate max-w-[80px]">{node.id.slice(0, 8)}</span>
                      
                      <div className="flex items-center gap-2">
                          <div className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider
                            ${node.type === 'choice' ? 'bg-blue-900/30 text-blue-400' :
                              node.type === 'challenge' ? 'bg-red-900/30 text-red-400' :
                              node.type === 'ending' ? 'bg-green-900/30 text-green-400' :
                              'bg-gray-800 text-gray-400'
                            }
                          `}>
                            {node.type || 'TEXT'}
                          </div>
                          
                          {/* Mobile Action Menu (Visible) */}
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-[#333] text-gray-400 -mr-1">
                                      <MoreHorizontal size={12} />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white z-[60]">
                                  <DropdownMenuItem onClick={() => onSelectNode(node.id)} className="focus:bg-[#333] cursor-pointer">
                                      <Edit size={14} className="mr-2" /> Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteNode(node.id)} className="focus:bg-red-900/20 text-red-500 cursor-pointer">
                                      <Trash2 size={14} className="mr-2" /> Delete Node
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-3 text-xs text-gray-300 font-sans leading-relaxed bg-[#111]">
                        <p className="line-clamp-3 pointer-events-none select-none">
                            {node.content || <span className="text-gray-600 italic">Empty content...</span>}
                        </p>
                    </div>

                    {/* Choices (Outputs) */}
                    <div className="p-3 border-t border-[#333] bg-[#111] rounded-b-lg flex flex-col gap-2 relative">
                        {node.choices.map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] text-gray-500 font-mono group/choice relative" data-choice-index={i}>
                                <span className="truncate max-w-[150px] group-hover/choice:text-white transition-colors">{c.text}</span>
                                
                                {/* Output Port Handle - Specific to Choice */}
                                <div 
                                    className="connection-port w-6 h-6 -mr-5 flex items-center justify-center cursor-crosshair opacity-50 hover:opacity-100 transition-opacity bg-transparent z-20"
                                    title="Drag to connect"
                                    onMouseDown={(e) => handleStart(e, node.id, i, true)}
                                    onTouchStart={(e) => handleStart(e, node.id, i, true)}
                                >
                                    <div className={`w-2 h-2 rounded-full border border-gray-500 bg-[#111] group-hover/choice:bg-primary group-hover/choice:border-primary transition-colors
                                        ${connectionStart?.nodeId === node.id && connectionStart?.choiceIndex === i ? 'bg-primary border-primary scale-125' : ''}
                                    `}></div>
                                </div>
                            </div>
                        ))}
                        
                        {node.choices.length === 0 && (
                             <div className="flex items-center justify-end h-6">
                                {/* Empty spacer to maintain layout */}
                             </div>
                        )}
                    </div>

                    {/* Input Port Visual (Center Left) */}
                    <div className={`absolute top-[50%] -left-1.5 w-3 h-3 border rounded-full transform -translate-y-1/2 transition-colors z-20
                        ${isTarget ? 'bg-green-500 border-green-500 scale-125' : 'bg-[#111] border-gray-500'}
                    `}></div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="bg-[#1a1a1a] border-[#333] text-white">
                    <ContextMenuItem onClick={() => onSelectNode(node.id)} className="focus:bg-[#333] cursor-pointer">
                        <Edit size={14} className="mr-2" /> Edit Details
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleDeleteNode(node.id)} className="focus:bg-red-900/20 text-red-500 cursor-pointer">
                        <Trash2 size={14} className="mr-2" /> Delete Node
                    </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>
    </div>
  );
}
