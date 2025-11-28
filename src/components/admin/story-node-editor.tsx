"use client";

import { useState } from "react";
import { StoryNode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowRight, AlertTriangle, Play, GripVertical, CheckCircle2, Lock, FileText, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StoryNodeEditorProps {
  nodes: StoryNode[];
  onChange: (nodes: StoryNode[]) => void;
}

export function StoryNodeEditor({ nodes, onChange }: StoryNodeEditorProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes.length > 0 ? nodes[0].id : null);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  // Helper to update a specific node
  const updateNode = (id: string, updates: Partial<StoryNode>) => {
    const newNodes = nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    );
    onChange(newNodes);
  };

  // Add a new node
  const addNode = () => {
    const id = `node-${nodes.length + 1}-${Math.random().toString(36).substr(2, 4)}`;
    const newNode: StoryNode = {
      id,
      content: "",
      choices: [],
      type: 'text'
    };
    onChange([...nodes, newNode]);
    setSelectedNodeId(id);
  };

  // Delete a node
  const deleteNode = (id: string) => {
    if (confirm("Are you sure? This might break links from other nodes.")) {
      const newNodes = nodes.filter(n => n.id !== id);
      onChange(newNodes);
      if (selectedNodeId === id) {
        setSelectedNodeId(newNodes.length > 0 ? newNodes[0].id : null);
      }
    }
  };

  // Add a choice to a node
  const addChoice = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newChoice = { text: "", nextNodeId: "" };
    updateNode(nodeId, { choices: [...(node.choices || []), newChoice] });
  };

  // Update a choice
  const updateChoice = (nodeId: string, choiceIndex: number, field: 'text' | 'nextNodeId', value: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.choices) return;

    const newChoices = [...node.choices];
    newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
    updateNode(nodeId, { choices: newChoices });
  };

  // Remove a choice
  const removeChoice = (nodeId: string, choiceIndex: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.choices) return;

    const newChoices = node.choices.filter((_, i) => i !== choiceIndex);
    updateNode(nodeId, { choices: newChoices });
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col gap-4 h-[600px] border border-[#333] rounded-lg overflow-hidden bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#111]">
        <div className="flex items-center gap-2">
            <div className="flex bg-[#222] rounded p-1">
                <button
                    onClick={() => setViewMode('visual')}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${viewMode === 'visual' ? 'bg-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                    VISUAL
                </button>
                <button
                    onClick={() => setViewMode('json')}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${viewMode === 'json' ? 'bg-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                    JSON
                </button>
            </div>
            <span className="text-xs text-gray-500 font-mono ml-2">
                {nodes.length} Nodes
            </span>
        </div>
        <Button onClick={addNode} size="sm" className="bg-[#222] hover:bg-primary hover:text-black border border-[#333] text-xs font-mono">
            <Plus size={14} className="mr-2" /> ADD NODE
        </Button>
      </div>

      {viewMode === 'json' ? (
        <textarea 
            value={JSON.stringify(nodes, null, 2)}
            onChange={(e) => {
                try {
                    onChange(JSON.parse(e.target.value));
                } catch (err) {
                    // ignore parse errors while typing
                }
            }}
            className="flex-1 w-full bg-[#0a0a0a] text-green-500 font-mono text-sm p-4 focus:outline-none resize-none"
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar: Node List */}
            <div className="w-64 border-r border-[#333] overflow-y-auto bg-[#111]">
                {nodes.map(node => (
                    <div 
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-3 border-b border-[#222] cursor-pointer hover:bg-[#1a1a1a] transition-colors relative group
                            ${selectedNodeId === node.id ? 'bg-[#1a1a1a] border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-mono font-bold uppercase truncate
                                ${node.id === 'start' ? 'text-green-500' : (node.type === 'ending' ? 'text-red-500' : 'text-blue-400')}
                            `}>
                                {node.id === 'start' && <Play size={10} className="inline mr-1" />}
                                {node.id}
                            </span>
                            {selectedNodeId === node.id && (
                                <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="text-gray-600 hover:text-red-500">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-2 font-mono leading-relaxed">
                            {node.content || <span className="italic opacity-50">No content...</span>}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Panel: Node Editor */}
            <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6">
                {selectedNode ? (
                    <div className="max-w-2xl mx-auto space-y-6">
                        
                        {/* Header Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono text-gray-500 uppercase">Node ID</label>
                                <Input 
                                    value={selectedNode.id}
                                    onChange={(e) => updateNode(selectedNode.id, { id: e.target.value })}
                                    className="bg-[#151515] border-[#333] font-mono text-xs h-9"
                                    disabled={selectedNode.id === 'start'} // Lock start node ID
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono text-gray-500 uppercase">Type</label>
                                <div className="flex bg-[#151515] rounded border border-[#333] h-9 p-1">
                                    <button 
                                        onClick={() => updateNode(selectedNode.id, { type: 'text' })}
                                        className={`flex-1 text-[10px] uppercase font-mono rounded flex items-center justify-center gap-1 transition-colors
                                            ${selectedNode.type !== 'ending' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}
                                        `}
                                    >
                                        <FileText size={12} /> Text
                                    </button>
                                    <button 
                                        onClick={() => updateNode(selectedNode.id, { type: 'ending' })}
                                        className={`flex-1 text-[10px] uppercase font-mono rounded flex items-center justify-center gap-1 transition-colors
                                            ${selectedNode.type === 'ending' ? 'bg-red-900/30 text-red-400' : 'text-gray-500 hover:text-gray-300'}
                                        `}
                                    >
                                        <CheckCircle2 size={12} /> Ending
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Narrative Content</label>
                            <textarea 
                                value={selectedNode.content}
                                onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                                className="w-full min-h-[120px] bg-[#151515] border border-[#333] rounded p-3 text-sm text-gray-300 focus:outline-none focus:border-primary placeholder:text-gray-600 font-sans leading-relaxed"
                                placeholder="Write the story segment here..."
                            />
                        </div>

                        {/* Image URL */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Image URL (Optional)</label>
                            <Input 
                                value={selectedNode.image_url || ""}
                                onChange={(e) => updateNode(selectedNode.id, { image_url: e.target.value })}
                                className="bg-[#151515] border-[#333] font-mono text-xs h-9"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Choices Section */}
                        {selectedNode.type !== 'ending' && (
                            <div className="space-y-3 pt-4 border-t border-[#222]">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">Choices ({selectedNode.choices?.length || 0})</label>
                                    <Button onClick={() => addChoice(selectedNode.id)} size="sm" variant="outline" className="h-6 text-[10px] uppercase border-[#333] hover:bg-[#222]">
                                        <Plus size={10} className="mr-1" /> Add Choice
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {(!selectedNode.choices || selectedNode.choices.length === 0) && (
                                        <div className="p-4 border border-dashed border-[#333] rounded bg-[#111/50] text-center">
                                            <p className="text-xs text-gray-500 font-mono">No choices defined. This will be a dead end unless it's an ending.</p>
                                        </div>
                                    )}

                                    {selectedNode.choices?.map((choice, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-[#151515] p-3 rounded border border-[#333] group hover:border-[#444] transition-colors">
                                            <div className="mt-2 text-gray-600">
                                                <ArrowRight size={14} />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Input 
                                                    value={choice.text}
                                                    onChange={(e) => updateChoice(selectedNode.id, idx, 'text', e.target.value)}
                                                    className="bg-[#0a0a0a] border-[#333] h-8 text-xs"
                                                    placeholder="Choice text (e.g. 'Open the door')"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-500 font-mono">GO TO:</span>
                                                    <select 
                                                        value={choice.nextNodeId}
                                                        onChange={(e) => updateChoice(selectedNode.id, idx, 'nextNodeId', e.target.value)}
                                                        className="flex-1 bg-[#0a0a0a] border border-[#333] rounded h-8 text-xs px-2 text-gray-300 focus:outline-none focus:border-primary font-mono"
                                                    >
                                                        <option value="">Select Node...</option>
                                                        {nodes.map(n => (
                                                            <option key={n.id} value={n.id}>
                                                                {n.id} {n.id === 'start' ? '(Start)' : ''} {n.type === 'ending' ? '(Ending)' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <button onClick={() => removeChoice(selectedNode.id, idx)} className="text-gray-600 hover:text-red-500 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                        <GripVertical size={48} />
                        <p className="font-mono text-sm uppercase tracking-widest">Select a node to edit</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

