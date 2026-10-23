"use client";

import { useState, useEffect } from "react";
import { Plus, X, ShoppingBag, Trophy, Gem } from "lucide-react";
import { StoryRequirement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface StoryRequirementsEditorProps {
  requirements: StoryRequirement[];
  onChange: (requirements: StoryRequirement[]) => void;
}

export function StoryRequirementsEditor({
  requirements,
  onChange,
}: StoryRequirementsEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<StoryRequirement["type"]>("product");
  const [options, setOptions] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (isAdding) {
      fetchOptions(type);
    }
  }, [isAdding, type]);

  const fetchOptions = async (reqType: StoryRequirement["type"]) => {
    setLoading(true);
    let table = "products";
    let titleField = "title";

    if (reqType === "achievement") {
      table = "achievements";
      titleField = "title";
    } else if (reqType === "collectible") {
      table = "collectibles";
      titleField = "name";
    }

    const { data } = await supabase
      .from(table)
      .select(`id, ${titleField}`)
      .limit(50);
    if (data) {
      setOptions(
        data.map((d) => ({
          id: (d as unknown as Record<string, string>).id,
          title: (d as unknown as Record<string, string>)[titleField],
        })),
      );
      if (data.length > 0)
        setSelectedId((data[0] as unknown as Record<string, string>).id);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!selectedId) return;
    const option = options.find((o) => o.id === selectedId);
    if (!option) return;

    const newReq: StoryRequirement = {
      type,
      id: selectedId,
      name: option.title,
    };

    onChange([...requirements, newReq]);
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    const newReqs = [...requirements];
    newReqs.splice(index, 1);
    onChange(newReqs);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "product":
        return <ShoppingBag size={14} />;
      case "achievement":
        return <Trophy size={14} />;
      case "collectible":
        return <Gem size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-surface-1 border border-line p-3 rounded text-sm"
          >
            <div className="flex items-center gap-3 text-fg-secondary">
              <span className="text-fg-muted">{getIcon(req.type)}</span>
              <span className="uppercase font-label tracking-wider text-fg-muted bg-surface-1 px-1.5 py-0.5 rounded border border-line">
                {req.type}
              </span>
              <span>{req.name}</span>
            </div>
            <button
              onClick={() => handleRemove(idx)}
              className="text-fg-muted hover:text-danger transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {requirements.length === 0 && !isAdding && (
          <div className="text-center py-6 text-fg-muted text-xs italic bg-surface-1 border border-dashed border-line rounded">
            No requirements set. Story is unlocked by default.
          </div>
        )}
      </div>

      {isAdding ? (
        <div className="bg-surface-1 border border-line p-4 rounded space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex gap-2">
            {(["product", "achievement", "collectible"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded transition-colors
                  ${
                    type === t
                      ? "bg-cream text-ink border-primary font-bold"
                      : "text-fg-muted border-line hover:text-cream hover:border-line-strong"
                  }
                `}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 bg-surface-2 border border-line text-cream text-sm rounded px-3 py-2 outline-none focus:border-primary"
            >
              {loading ? (
                <option>Loading...</option>
              ) : options.length === 0 ? (
                <option>No items found</option>
              ) : (
                options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))
              )}
            </select>
            <Button
              onClick={handleAdd}
              size="sm"
              className="bg-cream text-ink hover:bg-cream"
            >
              <Plus size={16} />
            </Button>
            <Button
              onClick={() => setIsAdding(false)}
              size="sm"
              variant="ghost"
              className="hover:bg-surface-3"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsAdding(true)}
          variant="outline"
          className="w-full border-dashed border-line text-fg-muted hover:text-primary hover:border-primary hover:bg-cream/5 h-10 text-xs uppercase tracking-widest"
        >
          <Plus size={14} className="mr-2" /> Add Requirement
        </Button>
      )}
    </div>
  );
}
