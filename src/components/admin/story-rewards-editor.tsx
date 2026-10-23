"use client";

import { useState, useEffect } from "react";
import { Plus, X, Tag, Trophy, ShoppingBag } from "lucide-react";
import { StoryReward } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface StoryRewardsEditorProps {
  rewards: StoryReward[];
  onChange: (rewards: StoryReward[]) => void;
}

export function StoryRewardsEditor({
  rewards,
  onChange,
}: StoryRewardsEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<StoryReward["type"]>("discount");
  const [options, setOptions] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<StoryReward>>({
    description: "",
    amount: 10,
  });

  useEffect(() => {
    if (isAdding && type !== "discount") {
      fetchOptions(type);
    }
  }, [isAdding, type]);

  const fetchOptions = async (rewardType: StoryReward["type"]) => {
    setLoading(true);
    let table = "products";
    let titleField = "title";

    if (rewardType === "achievement") {
      table = "achievements";
      titleField = "title";
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
      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          id: (data[0] as unknown as Record<string, string>).id,
        }));
      }
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!formData.description) return;

    // Construct reward object based on type
    const newReward: StoryReward = {
      type,
      description: formData.description,
      ...(type === "discount" && { amount: formData.amount }),
      ...(type !== "discount" && { id: formData.id }),
    };

    onChange([...rewards, newReward]);
    setIsAdding(false);
    setFormData({ description: "", amount: 10 });
  };

  const handleRemove = (index: number) => {
    const newRewards = [...rewards];
    newRewards.splice(index, 1);
    onChange(newRewards);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "discount":
        return <Tag size={14} />;
      case "achievement":
        return <Trophy size={14} />;
      case "product":
        return <ShoppingBag size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {rewards.map((reward, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-surface-1 border border-line p-3 rounded text-sm"
          >
            <div className="flex items-center gap-3 text-fg-secondary">
              <span className="text-fg-muted">{getIcon(reward.type)}</span>
              <span className="uppercase font-label tracking-wider text-fg-muted bg-surface-1 px-1.5 py-0.5 rounded border border-line">
                {reward.type}
              </span>
              <span>{reward.description}</span>
              {reward.amount ? (
                <span className="text-success text-xs">({reward.amount}%)</span>
              ) : null}
            </div>
            <button
              onClick={() => handleRemove(idx)}
              className="text-fg-muted hover:text-danger transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {rewards.length === 0 && !isAdding && (
          <div className="text-center py-6 text-fg-muted text-xs italic bg-surface-1 border border-dashed border-line rounded">
            No rewards set.
          </div>
        )}
      </div>

      {isAdding ? (
        <div className="bg-surface-1 border border-line p-4 rounded space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex gap-2 mb-2">
            {(["discount", "achievement", "product"] as const).map((t) => (
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

          <div className="space-y-3">
            <Input
              placeholder="Description (e.g. '10% Off Next Order')"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="bg-surface-2 border-line"
            />

            {type === "discount" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-fg-muted">Amount (%):</span>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseInt(e.target.value),
                    })
                  }
                  className="bg-surface-2 border-line w-24"
                />
              </div>
            )}

            {type !== "discount" && (
              <select
                value={formData.id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
                className="w-full bg-surface-2 border border-line text-cream text-sm rounded px-3 py-2 outline-none focus:border-primary"
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
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => setIsAdding(false)}
              size="sm"
              variant="ghost"
              className="hover:bg-surface-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              size="sm"
              className="bg-cream text-ink hover:bg-cream"
            >
              <Plus size={16} className="mr-2" /> Add Reward
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
          <Plus size={14} className="mr-2" /> Add Reward
        </Button>
      )}
    </div>
  );
}
