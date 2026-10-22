"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowDown,
  GripVertical,
  CheckCircle2,
  FileText,
  Lock,
  Clock,
  QrCode,
  Split,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StoryNode, StoryChallenge } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaUpload } from "@/components/media-upload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StoryBranchingView } from "./story-branching-view";

interface StoryNodeEditorProps {
  nodes: StoryNode[];
  onChange: (nodes: StoryNode[]) => void;
}

// Sortable Item Component
function SortableNodeItem({
  node,
  index,
  updateNode,
  deleteNode,
  setChallengeType,
  updateChallengeConfig,
  isLast,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChallenge = !!node.challenge;

  return (
    <div ref={setNodeRef} style={style} className="relative mb-6">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-[50%] md:left-[24px] top-[100%] h-8 w-px bg-surface-3 z-0 flex items-center justify-center">
          <ArrowDown size={14} className="text-fg-faint mt-2" />
        </div>
      )}

      <div className="relative z-10 bg-surface-1 border border-line rounded-lg p-4 md:p-6 group hover:border-primary/30 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-line pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-fg-faint hover:text-cream"
            >
              <GripVertical size={20} />
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center text-xs font-mono text-fg-muted shrink-0">
              {index + 1}
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm text-fg-secondary">
                SECTION {index + 1}
              </span>
              <span className="text-[10px] font-mono text-fg-faint uppercase hidden md:inline-block">
                ID: {node.id.slice(0, 8)}...
              </span>
            </div>
          </div>
          <button
            onClick={() => deleteNode(node.id)}
            className="text-fg-faint hover:text-danger transition-colors self-end md:self-auto p-2"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Content */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-fg-muted uppercase mb-2 block">
                Adventure Text
              </label>
              <textarea
                value={node.content}
                onChange={(e) =>
                  updateNode(node.id, { content: e.target.value })
                }
                className="w-full h-32 bg-surface-1 border border-line rounded p-3 text-sm text-fg-secondary focus:outline-none focus:border-primary placeholder:text-fg-muted font-sans"
                placeholder="Once upon a time..."
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-fg-muted uppercase mb-2 block">
                Interactivity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-1 p-1 rounded border border-line">
                {[
                  { id: "none", icon: FileText, label: "None" },
                  { id: "riddle", icon: Lock, label: "Riddle" },
                  { id: "timer", icon: Clock, label: "Timer" },
                  { id: "scan", icon: QrCode, label: "Scan" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setChallengeType(node.id, type.id as any)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-2 rounded text-[10px] uppercase font-mono transition-colors
                                      ${
                                        (node.challenge?.type || "none") ===
                                        type.id
                                          ? "bg-primary text-ink font-bold"
                                          : "text-fg-muted hover:text-cream hover:bg-surface-2"
                                      }
                                  `}
                  >
                    <type.icon size={12} /> {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Challenge Config */}
            {hasChallenge ? (
              <div className="bg-surface-1 border border-dashed border-line p-4 rounded space-y-3 animate-in fade-in slide-in-from-top-2">
                {node.challenge?.type === "riddle" && (
                  <>
                    <Input
                      placeholder="Question (e.g. What has keys...?)"
                      value={node.challenge.config.question || ""}
                      onChange={(e) =>
                        updateChallengeConfig(
                          node.id,
                          "question",
                          e.target.value,
                        )
                      }
                      className="bg-surface-1 border-line"
                    />
                    <Input
                      placeholder="Answer (e.g. Piano)"
                      value={node.challenge.config.answer || ""}
                      onChange={(e) =>
                        updateChallengeConfig(node.id, "answer", e.target.value)
                      }
                      className="bg-surface-1 border-line"
                    />
                  </>
                )}
                {node.challenge?.type === "timer" && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-fg-muted">
                      Duration (seconds):
                    </label>
                    <Input
                      type="number"
                      value={node.challenge.config.duration || 60}
                      onChange={(e) =>
                        updateChallengeConfig(
                          node.id,
                          "duration",
                          parseInt(e.target.value),
                        )
                      }
                      className="bg-surface-1 border-line w-24"
                    />
                  </div>
                )}
                {node.challenge?.type === "scan" && (
                  <Input
                    placeholder="Target Code (e.g. PAGE_5)"
                    value={node.challenge.config.target_code || ""}
                    onChange={(e) =>
                      updateChallengeConfig(
                        node.id,
                        "target_code",
                        e.target.value,
                      )
                    }
                    className="bg-surface-1 border-line"
                  />
                )}
              </div>
            ) : null}
          </div>

          {/* Right: Media */}
          <div className="space-y-4">
            <label className="text-[10px] font-mono text-fg-muted uppercase mb-2 block">
              Media Assets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MediaUpload
                type="image"
                label="Scene Image"
                defaultUrl={node.image_url}
                onUpload={(url) => updateNode(node.id, { image_url: url })}
              />
              <MediaUpload
                type="audio"
                label="Background Audio"
                defaultUrl={node.audio_url}
                onUpload={(url) => updateNode(node.id, { audio_url: url })}
              />
            </div>

            {/* Choices (Simplified) */}
            <div className="pt-4 border-t border-line">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-mono text-fg-muted uppercase">
                  Next Step
                </label>
              </div>
              {node.choices.length === 0 ? (
                <div className="text-xs text-fg-muted italic">
                  End of adventure (or configure manually)
                </div>
              ) : (
                <div className="space-y-2">
                  {node.choices.map((choice: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs bg-surface-1 p-2 rounded border border-line"
                    >
                      <ArrowRight size={12} className="text-primary shrink-0" />
                      <span className="text-fg-secondary truncate">
                        &quot;{choice.text}&quot;
                      </span>
                      <span className="text-fg-muted">→</span>
                      <span className="font-mono text-fg-muted text-[10px] truncate">
                        {choice.nextNodeId}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoryNodeEditor({ nodes, onChange }: StoryNodeEditorProps) {
  const [viewMode, setViewMode] = useState<"builder" | "visual" | "json">(
    "builder",
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const updateNode = (id: string, updates: Partial<StoryNode>) => {
    const newNodes = nodes.map((node) =>
      node.id === id ? { ...node, ...updates } : node,
    );
    onChange(newNodes);
  };

  const addNode = (
    template: "text" | "choice" | "riddle" | "timer" | "scan" | "end" = "text",
  ) => {
    const id = `node-${nodes.length + 1}-${Math.random().toString(36).substr(2, 4)}`;

    // Auto-link previous node to this new one if in builder mode
    const updatedNodes = [...nodes];
    if (viewMode === "builder" && nodes.length > 0) {
      const lastNode = updatedNodes[updatedNodes.length - 1];
      if (!lastNode.choices || lastNode.choices.length === 0) {
        updatedNodes[updatedNodes.length - 1] = {
          ...lastNode,
          choices: [{ text: "Continue", nextNodeId: id }],
        };
      }
    }

    const newNode: StoryNode = {
      id,
      content: "",
      choices: [],
      type:
        template === "riddle" || template === "timer" || template === "scan"
          ? "challenge"
          : template === "choice"
            ? "choice"
            : template === "end"
              ? "ending"
              : "text",
    };

    if (template === "riddle") {
      newNode.challenge = {
        type: "riddle",
        config: { question: "", answer: "" },
      };
    } else if (template === "timer") {
      newNode.challenge = { type: "timer", config: { duration: 60 } };
    } else if (template === "scan") {
      newNode.challenge = { type: "scan", config: { target_code: "" } };
    } else if (template === "choice") {
      newNode.content = "Make your choice...";
      newNode.choices = [
        { text: "Option A", nextNodeId: "" },
        { text: "Option B", nextNodeId: "" },
      ];
    }

    onChange([...updatedNodes, newNode]);
  };

  useEffect(() => {
    if (nodes.length === 0) {
      addNode();
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = nodes.findIndex((n) => n.id === active.id);
      const newIndex = nodes.findIndex((n) => n.id === over.id);

      const newNodes = arrayMove(nodes, oldIndex, newIndex);

      // Optional: Auto-relink if in pure linear mode?
      // For now, let's keep links as is to preserve logic, or we can prompt.
      // Assuming linear builder primarily for linear stories.

      onChange(newNodes);
    }
  };

  const deleteNode = (id: string) => {
    if (confirm("Delete this section?")) {
      const newNodes = nodes.filter((n) => n.id !== id);
      onChange(newNodes);
    }
  };

  const setChallengeType = (
    nodeId: string,
    type: "none" | "riddle" | "timer" | "scan",
  ) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    if (type === "none") {
      const { challenge: _challenge, ...rest } = node;
      updateNode(nodeId, { ...rest, type: "text" });
    } else {
      const defaultConfigs: Record<string, any> = {
        riddle: { question: "What has keys but no locks?", answer: "Piano" },
        timer: { duration: 60 },
        scan: { target_code: "CLUE_1" },
      };

      const newChallenge: StoryChallenge = {
        type: type as any,
        config: defaultConfigs[type],
      };

      updateNode(nodeId, {
        challenge: newChallenge,
        type: "challenge",
      });
    }
  };

  const updateChallengeConfig = (nodeId: string, field: string, value: any) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !node.challenge) return;

    updateNode(nodeId, {
      challenge: {
        ...node.challenge,
        config: {
          ...node.challenge.config,
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 min-h-[60vh] md:min-h-[600px] bg-background">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-line bg-surface-1 rounded-t-lg gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-surface-2 rounded p-1 flex-1 sm:flex-none justify-center sm:justify-start overflow-x-auto">
            <button
              type="button"
              onClick={() => setViewMode("builder")}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${viewMode === "builder" ? "bg-primary text-ink font-bold" : "text-fg-muted hover:text-cream"}`}
            >
              EASY BUILDER
            </button>
            <button
              type="button"
              onClick={() => setViewMode("visual")}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${viewMode === "visual" ? "bg-primary text-ink font-bold" : "text-fg-muted hover:text-cream"}`}
            >
              VISUAL GRAPH
            </button>
            <button
              type="button"
              onClick={() => setViewMode("json")}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${viewMode === "json" ? "bg-primary text-ink font-bold" : "text-fg-muted hover:text-cream"}`}
            >
              JSON
            </button>
          </div>
          <span className="text-xs text-fg-muted font-mono ml-2 hidden sm:inline">
            {nodes.length} Sections
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background border border-t-0 border-line rounded-b-lg h-[60vh] md:h-[600px]">
        {viewMode === "builder" && (
          <div className="space-y-6 p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={nodes.map((n) => n.id)}
                strategy={verticalListSortingStrategy}
              >
                {nodes.map((node, index) => (
                  <SortableNodeItem
                    key={node.id}
                    node={node}
                    index={index}
                    isLast={index === nodes.length - 1}
                    updateNode={updateNode}
                    deleteNode={deleteNode}
                    setChallengeType={setChallengeType}
                    updateChallengeConfig={updateChallengeConfig}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <div className="sticky bottom-4 z-20 flex justify-center pb-4 pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-primary text-ink hover:bg-cream w-full md:w-auto md:px-12 h-14 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-sm rounded-full">
                    <Plus size={18} className="mr-2" /> Add Next Section
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-surface-1 border-line text-cream w-56">
                  <DropdownMenuItem
                    onClick={() => addNode("text")}
                    className="focus:bg-surface-3 cursor-pointer"
                  >
                    <FileText size={14} className="mr-2" /> Narrative Block
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addNode("choice")}
                    className="focus:bg-surface-3 cursor-pointer"
                  >
                    <Split size={14} className="mr-2" /> Branching Choice
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addNode("riddle")}
                    className="focus:bg-surface-3 cursor-pointer"
                  >
                    <Lock size={14} className="mr-2" /> Riddle Challenge
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addNode("timer")}
                    className="focus:bg-surface-3 cursor-pointer"
                  >
                    <Clock size={14} className="mr-2" /> Timer Challenge
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addNode("scan")}
                    className="focus:bg-surface-3 cursor-pointer"
                  >
                    <QrCode size={14} className="mr-2" /> Scan Challenge
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => addNode("end")}
                    className="focus:bg-surface-3 cursor-pointer text-primary"
                  >
                    <CheckCircle2 size={14} className="mr-2" /> Adventure Ending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {viewMode === "json" && (
          <textarea
            value={JSON.stringify(nodes, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                // ignore parse errors
              }
            }}
            className="w-full h-full bg-background text-success font-mono text-sm p-4 focus:outline-none resize-none"
          />
        )}

        {viewMode === "visual" && (
          <StoryBranchingView
            nodes={nodes}
            onChange={onChange}
            onSelectNode={(_id) => {
              // Could scroll to it in builder or open a modal
              // For now, switch to builder and scroll
              setViewMode("builder");
              // setTimeout(() => document.getElementById(id)?.scrollIntoView(), 100);
            }}
          />
        )}
      </div>
    </div>
  );
}
