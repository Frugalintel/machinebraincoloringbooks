import { describe, expect, it } from "vitest";
import {
  STORY_MAP_CARD_H,
  STORY_MAP_V,
  buildStoryMap,
  type StoryMapNodeInput,
} from "@/lib/story-map";

const tree: StoryMapNodeInput[] = [
  {
    id: "a",
    label: "The fork",
    choices: [
      { text: "The warm lantern", nextNodeId: "b" },
      { text: "The cold lantern", nextNodeId: "c" },
    ],
  },
  {
    id: "b",
    label: "The warm lantern",
    choices: [{ text: "Cross", nextNodeId: "d" }],
  },
  { id: "c", label: "The cold lantern", choices: [] },
  { id: "d", label: "", choices: [] },
];

function node(layout: ReturnType<typeof buildStoryMap>, id: string) {
  const found = layout.nodes.find((item) => item.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

describe("buildStoryMap", () => {
  it("turns a choice tree into nodes and edges", () => {
    const layout = buildStoryMap({
      title: "Test",
      nodes: tree,
      mode: "open",
      orientation: "horizontal",
      size: STORY_MAP_CARD_H,
    });

    expect(layout.nodes.map((item) => item.id).sort()).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(layout.edges).toHaveLength(3);
    expect(node(layout, "b").x).toBeGreaterThan(node(layout, "a").x);
    expect(node(layout, "b").y).not.toBeCloseTo(node(layout, "c").y);
    expect(node(layout, "d").terminal).toBe(true);
    expect(node(layout, "a").terminal).toBe(false);
    expect(layout.summary).toContain("Every path is shown");
  });

  it("runs vertical on the mobile orientation", () => {
    const layout = buildStoryMap({
      title: "Test",
      nodes: tree,
      mode: "open",
      orientation: "vertical",
      size: STORY_MAP_V,
    });

    expect(node(layout, "b").y).toBeGreaterThan(node(layout, "a").y);
    expect(node(layout, "b").x).not.toBeCloseTo(node(layout, "c").x);
    expect(layout.orientation).toBe("vertical");
  });

  it("draws a locked story as a ghost without labels or a lit path", () => {
    const layout = buildStoryMap({
      title: "Far Station",
      nodes: tree,
      mode: "ghost",
      orientation: "horizontal",
      progress: { completedIds: ["a"], currentId: "b" },
    });

    expect(layout.ghost).toBe(true);
    expect(layout.nodes.every((item) => item.labels.length === 0)).toBe(true);
    expect(layout.nodes.every((item) => item.role === "idle")).toBe(true);
    expect(layout.edges.every((edge) => edge.kind === "idle")).toBe(true);
    expect(layout.summary).toContain("Locked");
    expect(layout.choices.map((choice) => choice.text).join(" ")).toContain(
      "Locked",
    );
  });

  it("leaves a signed-out map unlit even when a path is known", () => {
    const layout = buildStoryMap({
      title: "The Lantern Road",
      nodes: tree,
      mode: "open",
      orientation: "horizontal",
      sample: true,
      progress: { completedIds: ["a"], currentId: "b" },
    });

    expect(layout.edges.every((edge) => edge.kind === "idle")).toBe(true);
    expect(layout.nodes.every((item) => item.role === "idle")).toBe(true);
    expect(
      layout.nodes.some((item) =>
        item.labels.some((label) => label.kind === "here"),
      ),
    ).toBe(false);
    expect(layout.summary).toContain("(sample)");
    expect(layout.choices.map((choice) => choice.text)).toEqual([
      "The fork",
      "The warm lantern",
      "The cold lantern",
    ]);
  });

  it("lights the taken path and marks the next choice", () => {
    const layout = buildStoryMap({
      title: "The Lantern Road",
      nodes: tree,
      mode: "lit",
      orientation: "horizontal",
      labelScope: "all",
      progress: { completedIds: ["a"], currentId: "b" },
    });

    expect(
      layout.edges.find((edge) => edge.from === "a" && edge.to === "b")?.kind,
    ).toBe("path");
    expect(
      layout.edges.find((edge) => edge.from === "b" && edge.to === "d")?.kind,
    ).toBe("next");
    expect(node(layout, "b").role).toBe("current");
    expect(
      node(layout, "b").labels.some((label) => label.text === "You are here"),
    ).toBe(true);
    expect(node(layout, "d").labels.map((label) => label.text)).toContain(
      "Cross",
    );
  });

  it("uses stored positions on the wide map and still stacks the vertical one", () => {
    const positioned: StoryMapNodeInput[] = [
      { ...tree[0], position: { x: 0, y: 50 } },
      { ...tree[1], position: { x: 80, y: 10 } },
      { ...tree[2], position: { x: 80, y: 90 } },
      { ...tree[3], position: { x: 160, y: 10 } },
    ];
    const wide = buildStoryMap({
      title: "Test",
      nodes: positioned,
      mode: "open",
      orientation: "horizontal",
      size: STORY_MAP_CARD_H,
    });
    const tall = buildStoryMap({
      title: "Test",
      nodes: positioned,
      mode: "open",
      orientation: "vertical",
      size: STORY_MAP_V,
    });

    expect(node(wide, "d").x).toBeGreaterThan(node(wide, "b").x);
    expect(node(wide, "c").y).toBeGreaterThan(node(wide, "b").y);
    expect(node(tall, "b").y).toBeGreaterThan(node(tall, "a").y);
    expect(node(tall, "b").x).not.toBeCloseTo(node(tall, "c").x);
  });
});
