import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sampleStories } from "@/lib/story-samples";
import {
  STORY_MAP_CARD_H,
  STORY_MAP_V,
  buildStoryMap,
  storyMapLabelScopes,
  storyMapLabelWidth,
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

  it("labels only the path on the vertical map and keeps every label inside", () => {
    expect(storyMapLabelScopes("lit", "hero")).toEqual({
      wide: "all",
      tall: "path",
    });
    expect(storyMapLabelScopes("open", "card").tall).toBe("none");
    expect(storyMapLabelScopes("lit", "reader").tall).toBe("path");

    const lantern = sampleStories(true).find((story) => story.id === "lantern");
    if (!lantern) throw new Error("missing lantern sample");
    const layout = buildStoryMap({
      title: lantern.title,
      nodes: lantern.nodes,
      mode: "lit",
      orientation: "vertical",
      size: STORY_MAP_V,
      labelScope: storyMapLabelScopes("lit", "hero").tall,
      progress: {
        completedIds: lantern.completedIds,
        currentId: lantern.currentId,
      },
    });
    const labels = layout.nodes.flatMap((node) => node.labels);
    expect(labels.some((label) => /cold/i.test(label.text))).toBe(false);
    expect(labels.some((label) => label.text === "You are here")).toBe(true);
    for (const label of labels) {
      expect(label.x).toBeGreaterThanOrEqual(8);
      expect(label.x + storyMapLabelWidth(label.text)).toBeLessThanOrEqual(
        STORY_MAP_V.width - 8,
      );
      expect(label.y).toBeGreaterThanOrEqual(11);
      expect(label.y).toBeLessThanOrEqual(STORY_MAP_V.height);
    }

    const open = buildStoryMap({
      title: "Door",
      nodes: tree,
      mode: "open",
      orientation: "vertical",
      size: STORY_MAP_V,
      labelScope: "none",
    });
    expect(open.nodes.every((node) => node.labels.length === 0)).toBe(true);
  });

  it("shifts a long vertical label back inside the frame", () => {
    const layout = buildStoryMap({
      title: "Test",
      nodes: [
        {
          id: "a",
          label: "Start",
          choices: [
            { text: "Left", nextNodeId: "b" },
            {
              text: "The cold lantern stays on the right",
              nextNodeId: "c",
            },
          ],
        },
        { id: "b", label: "Left", choices: [] },
        {
          id: "c",
          label: "The cold lantern stays on the right",
          choices: [],
        },
      ],
      mode: "open",
      orientation: "vertical",
      size: STORY_MAP_V,
      labelScope: "all",
    });
    for (const label of layout.nodes.flatMap((node) => node.labels)) {
      expect(label.x + storyMapLabelWidth(label.text)).toBeLessThanOrEqual(
        STORY_MAP_V.width - 8,
      );
    }
  });

  it("switches index maps to the vertical frame at 640px", () => {
    const css = readFileSync(
      join(process.cwd(), "src/components/stories/story-map.css"),
      "utf8",
    );
    const mobile = css.slice(css.indexOf("@media (max-width: 640px)"));
    expect(mobile).toMatch(/\.maph\s*\{[^}]*display:\s*none/);
    expect(mobile).toMatch(/\.mapv\s*\{[^}]*display:\s*block/);
    expect(mobile).toMatch(/aspect-ratio:\s*350\s*\/\s*440/);
    expect(css).not.toMatch(/max-width:\s*760px/);
  });
});
