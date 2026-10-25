/**
 * Branching story maps for B · Paths.
 * The diagram, the orange current-node dot, and its halo live with the
 * component styles so the off-guide graphic can change in one place.
 */

export type StoryMapChoice = {
  text: string;
  nextNodeId: string;
};

export type StoryMapNodeInput = {
  id: string;
  label?: string;
  choices?: readonly StoryMapChoice[];
  position?: { x: number; y: number };
};

export type StoryMapProgress = {
  completedIds: readonly string[];
  currentId: string | null;
};

export type StoryMapMode = "lit" | "open" | "ghost";
export type StoryMapOrientation = "horizontal" | "vertical";
export type StoryMapLabelScope = "fork" | "path" | "all" | "none";

export type StoryMapSize = {
  width: number;
  height: number;
};

export const STORY_MAP_CARD_H: StoryMapSize = { width: 820, height: 380 };
export const STORY_MAP_HERO_H: StoryMapSize = { width: 1360, height: 430 };
export const STORY_MAP_V: StoryMapSize = { width: 350, height: 440 };
export const STORY_MAP_READER: StoryMapSize = { width: 420, height: 640 };

export type StoryMapEdgeKind = "path" | "next" | "idle";
export type StoryMapNodeRole = "current" | "path" | "next" | "idle";

export type StoryMapEdge = {
  from: string;
  to: string;
  d: string;
  kind: StoryMapEdgeKind;
};

export type StoryMapLabel = {
  text: string;
  x: number;
  y: number;
  kind: "path" | "next" | "idle" | "here";
};

export type StoryMapNode = {
  id: string;
  x: number;
  y: number;
  terminal: boolean;
  role: StoryMapNodeRole;
  labels: StoryMapLabel[];
};

export type StoryMapChoiceItem = {
  id: string;
  text: string;
};

export type StoryMapLayout = {
  viewBox: string;
  width: number;
  height: number;
  mode: StoryMapMode;
  orientation: StoryMapOrientation;
  ghost: boolean;
  nodes: StoryMapNode[];
  edges: StoryMapEdge[];
  summary: string;
  choices: StoryMapChoiceItem[];
};

export type StoryMapRequest = {
  title: string;
  nodes: readonly StoryMapNodeInput[];
  mode: StoryMapMode;
  orientation: StoryMapOrientation;
  size?: StoryMapSize;
  progress?: StoryMapProgress;
  sample?: boolean;
  labelScope?: StoryMapLabelScope;
};

const PAD = 16;
/** 11px Plex Mono, uppercase, plus 0.1em tracking. Measured at 8.1px per glyph. */
export const STORY_MAP_LABEL_CHAR = 8.1;
const LABEL_CAP = 11;
/** Baseline gap that puts "You are here" on its own line under the node name. */
export const STORY_MAP_HERE_GAP = 34;

export function storyMapLabelWidth(text: string): number {
  return text.length * STORY_MAP_LABEL_CHAR;
}

/**
 * Wide maps label the whole drawing. The narrow vertical map only labels
 * the path you are on, so a right-hand choice is not clipped at the edge.
 */
export function storyMapLabelScopes(
  mode: StoryMapMode,
  variant: "card" | "hero" | "reader",
): { wide: StoryMapLabelScope; tall: StoryMapLabelScope } {
  if (variant === "reader") {
    return { wide: "path", tall: mode === "lit" ? "path" : "none" };
  }
  if (mode === "lit") return { wide: "all", tall: "path" };
  if (mode === "ghost") return { wide: "none", tall: "none" };
  return { wide: "fork", tall: "none" };
}

function placeLabel(
  text: string,
  anchorX: number,
  anchorY: number,
  size: StoryMapSize,
  prefer: "above" | "below",
): { x: number; y: number } {
  const width = storyMapLabelWidth(text);
  let x = anchorX + 14;
  if (x + width > size.width - 8) x = size.width - 8 - width;
  if (x < 8) x = 8;
  let y = prefer === "above" ? anchorY - 12 : anchorY + 16;
  if (y < LABEL_CAP) y = LABEL_CAP;
  if (y > size.height - 4) y = size.height - 4;
  return { x, y };
}

/** Name and "You are here" share a left edge, with the status on the next line. */
function stackHereLabel(
  nameX: number,
  nameY: number,
  nameText: string,
  size: StoryMapSize,
): { x: number; nameY: number; hereY: number } {
  let yName = nameY;
  let yHere = nameY + STORY_MAP_HERE_GAP;
  if (yName < LABEL_CAP) {
    const shift = LABEL_CAP - yName;
    yName += shift;
    yHere += shift;
  }
  if (yHere > size.height - 4) {
    const shift = yHere - (size.height - 4);
    yHere -= shift;
    yName = Math.max(LABEL_CAP, yName - shift);
  }
  const width = Math.max(
    storyMapLabelWidth(nameText),
    storyMapLabelWidth("You are here"),
  );
  let x = nameX;
  if (x + width > size.width - 8) x = size.width - 8 - width;
  if (x < 8) x = 8;
  return { x, nameY: yName, hereY: yHere };
}

const LABEL_BOX_TOP = 11;
const LABEL_BOX_BELOW = 2;
const LABEL_CLEAR = 4;

function labelsHit(a: StoryMapLabel, b: StoryMapLabel): boolean {
  const aRight = a.x + storyMapLabelWidth(a.text);
  const bRight = b.x + storyMapLabelWidth(b.text);
  const aTop = a.y - LABEL_BOX_TOP;
  const bTop = b.y - LABEL_BOX_TOP;
  return (
    a.x < bRight &&
    b.x < aRight &&
    aTop < b.y + LABEL_BOX_BELOW &&
    bTop < a.y + LABEL_BOX_BELOW
  );
}

/** Nudge a lower label down until it clears the one above it. */
function separateLabels(labels: StoryMapLabel[], size: StoryMapSize): void {
  const step = LABEL_BOX_BELOW + LABEL_CLEAR + LABEL_BOX_TOP;
  for (let pass = 0; pass < labels.length * 2; pass += 1) {
    let moved = false;
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const a = labels[i];
        const b = labels[j];
        if (!a || !b || !labelsHit(a, b)) continue;
        const lower = a.y > b.y || (a.y === b.y && a.x >= b.x) ? a : b;
        const upper = lower === a ? b : a;
        const next = upper.y + step;
        if (next <= size.height - 4) lower.y = next;
        else if (upper.y - step >= LABEL_CAP) upper.y = lower.y - step;
        moved = true;
      }
    }
    if (!moved) return;
  }
}

function round(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function indexNodes(
  nodes: readonly StoryMapNodeInput[],
): Map<string, StoryMapNodeInput> {
  const byId = new Map<string, StoryMapNodeInput>();
  for (const node of nodes) {
    if (!byId.has(node.id)) byId.set(node.id, node);
  }
  return byId;
}

function childIds(
  node: StoryMapNodeInput,
  byId: Map<string, StoryMapNodeInput>,
): string[] {
  const ids: string[] = [];
  for (const choice of node.choices ?? []) {
    if (!byId.has(choice.nextNodeId) || ids.includes(choice.nextNodeId)) {
      continue;
    }
    ids.push(choice.nextNodeId);
  }
  return ids;
}

function rootsOf(
  ordered: readonly StoryMapNodeInput[],
  byId: Map<string, StoryMapNodeInput>,
): string[] {
  const targeted = new Set<string>();
  for (const node of byId.values()) {
    for (const id of childIds(node, byId)) targeted.add(id);
  }
  const roots = ordered
    .filter((node) => byId.has(node.id) && !targeted.has(node.id))
    .map((node) => node.id);
  if (roots.length > 0) return roots;
  const first = ordered[0];
  return first ? [first.id] : [];
}

function depthsOf(
  roots: readonly string[],
  byId: Map<string, StoryMapNodeInput>,
): Map<string, number> {
  const depth = new Map<string, number>();
  const queue = roots.map((id) => ({ id, depth: 0 }));
  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    if (!item || depth.has(item.id)) continue;
    depth.set(item.id, item.depth);
    const node = byId.get(item.id);
    if (!node) continue;
    for (const child of childIds(node, byId)) {
      if (!depth.has(child)) queue.push({ id: child, depth: item.depth + 1 });
    }
  }
  for (const id of byId.keys()) {
    if (!depth.has(id)) depth.set(id, 0);
  }
  return depth;
}

function columnsOf(depth: Map<string, number>): string[][] {
  const columns: string[][] = [];
  for (const [id, level] of depth) {
    const column = columns[level] ?? [];
    column.push(id);
    columns[level] = column;
  }
  return columns.filter((column) => column.length > 0);
}

function hasPositions(
  nodes: readonly StoryMapNodeInput[],
  byId: Map<string, StoryMapNodeInput>,
): boolean {
  if (byId.size === 0) return false;
  return nodes.every((node) => {
    const stored = byId.get(node.id);
    const position = stored?.position;
    return (
      !!position && Number.isFinite(position.x) && Number.isFinite(position.y)
    );
  });
}

function place(
  along: number,
  cross: number,
  orientation: StoryMapOrientation,
): { x: number; y: number } {
  return orientation === "horizontal"
    ? { x: along, y: cross }
    : { x: cross, y: along };
}

function tidyPositions(
  columns: readonly string[][],
  orientation: StoryMapOrientation,
  size: StoryMapSize,
): Map<string, { x: number; y: number }> {
  const points = new Map<string, { x: number; y: number }>();
  const alongSpan =
    (orientation === "horizontal" ? size.width : size.height) - PAD * 2;
  const crossSpan =
    (orientation === "horizontal" ? size.height : size.width) - PAD * 2;
  const depthCount = Math.max(columns.length, 1);

  columns.forEach((ids, depth) => {
    const along =
      depthCount === 1
        ? alongSpan / 2 + PAD
        : PAD + (depth * alongSpan) / (depthCount - 1);
    ids.forEach((id, index) => {
      const cross =
        ids.length === 1
          ? crossSpan / 2 + PAD
          : PAD + (index * crossSpan) / (ids.length - 1);
      points.set(id, place(along, cross, orientation));
    });
  });
  return points;
}

function positionPoints(
  nodes: readonly StoryMapNodeInput[],
  size: StoryMapSize,
): Map<string, { x: number; y: number }> {
  const points = new Map<string, { x: number; y: number }>();
  const xs = nodes.map((node) => node.position?.x ?? 0);
  const ys = nodes.map((node) => node.position?.y ?? 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  for (const node of nodes) {
    const position = node.position;
    if (!position) continue;
    points.set(node.id, {
      x: PAD + ((position.x - minX) / spanX) * (size.width - PAD * 2),
      y: PAD + ((position.y - minY) / spanY) * (size.height - PAD * 2),
    });
  }
  return points;
}

function curve(
  from: { x: number; y: number },
  to: { x: number; y: number },
  orientation: StoryMapOrientation,
): string {
  if (orientation === "horizontal") {
    const mid = (from.x + to.x) / 2;
    return `M${round(from.x)} ${round(from.y)}C${round(mid)} ${round(from.y)} ${round(mid)} ${round(to.y)} ${round(to.x)} ${round(to.y)}`;
  }
  const mid = (from.y + to.y) / 2;
  return `M${round(from.x)} ${round(from.y)}C${round(from.x)} ${round(mid)} ${round(to.x)} ${round(mid)} ${round(to.x)} ${round(to.y)}`;
}

function takenPath(
  progress: StoryMapProgress | undefined,
  byId: Map<string, StoryMapNodeInput>,
): string[] {
  if (!progress) return [];
  const path = progress.completedIds.filter((id) => byId.has(id));
  if (
    progress.currentId &&
    byId.has(progress.currentId) &&
    !path.includes(progress.currentId)
  ) {
    path.push(progress.currentId);
  }
  return path;
}

export function storyMapSummary(
  title: string,
  mode: StoryMapMode,
  sample = false,
): string {
  const name = sample ? `${title} (sample)` : title;
  switch (mode) {
    case "ghost":
      return `Story map of ${name}. Locked. The shape of the story is shown without its choices.`;
    case "lit":
      return `Story map of ${name}. The highlighted line is the path you have taken so far.`;
    case "open":
      return `Story map of ${name}. Every path is shown. You choose as you read.`;
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

function choiceText(from: StoryMapNodeInput | undefined, toId: string): string {
  return (
    from?.choices?.find((choice) => choice.nextNodeId === toId)?.text.trim() ??
    ""
  );
}

function defaultSize(orientation: StoryMapOrientation): StoryMapSize {
  return orientation === "horizontal" ? STORY_MAP_CARD_H : STORY_MAP_V;
}

export function buildStoryMap(request: StoryMapRequest): StoryMapLayout {
  const size = request.size ?? defaultSize(request.orientation);
  const byId = indexNodes(request.nodes);
  const ordered = request.nodes.filter((node) => byId.get(node.id) === node);
  const roots = rootsOf(ordered, byId);
  const depth = depthsOf(roots, byId);
  const columns = columnsOf(depth);
  const usePositions =
    request.orientation === "horizontal" && hasPositions(ordered, byId);
  const points = usePositions
    ? positionPoints(ordered, size)
    : tidyPositions(columns, request.orientation, size);

  const path = takenPath(request.progress, byId);
  const currentId =
    request.mode === "lit" ? (request.progress?.currentId ?? null) : null;
  const pathSet = new Set(request.mode === "lit" ? path : []);
  const scope =
    request.labelScope ?? (request.mode === "open" ? "fork" : "all");

  const roleFor = (id: string): StoryMapNodeRole => {
    if (request.mode !== "lit") return "idle";
    if (id === currentId) return "current";
    if (pathSet.has(id)) return "path";
    const node = byId.get(currentId ?? "");
    if (node && childIds(node, byId).includes(id)) return "next";
    return "idle";
  };

  const edges: StoryMapEdge[] = [];
  for (const node of ordered) {
    const from = points.get(node.id);
    if (!from) continue;
    for (const toId of childIds(node, byId)) {
      const to = points.get(toId);
      if (!to) continue;
      const pathIndex = path.indexOf(node.id);
      const taken =
        request.mode === "lit" &&
        pathIndex >= 0 &&
        path[pathIndex + 1] === toId;
      const upcoming = request.mode === "lit" && node.id === currentId;
      let kind: StoryMapEdgeKind = "idle";
      if (taken) kind = "path";
      else if (upcoming) kind = "next";
      edges.push({
        from: node.id,
        to: toId,
        d: curve(from, to, request.orientation),
        kind,
      });
    }
  }

  const nodes: StoryMapNode[] = ordered.map((node) => {
    const point = points.get(node.id) ?? { x: PAD, y: PAD };
    const role = roleFor(node.id);
    const level = depth.get(node.id) ?? 0;
    const labels: StoryMapLabel[] = [];
    const ownLabel = node.label?.trim() ?? "";
    const incoming = choiceText(
      ordered.find((candidate) =>
        (candidate.choices ?? []).some(
          (choice) => choice.nextNodeId === node.id,
        ),
      ),
      node.id,
    );
    const visible =
      request.mode !== "ghost" &&
      scope !== "none" &&
      (scope === "all" ||
        (scope === "fork" && level <= 1) ||
        (scope === "path" && (role === "path" || role === "current")));
    const text =
      role === "next" && request.mode === "lit" && scope !== "path"
        ? incoming || ownLabel
        : ownLabel;
    if (visible && text) {
      const placed = placeLabel(text, point.x, point.y, size, "above");
      labels.push({
        text,
        x: placed.x,
        y: placed.y,
        kind: role === "next" ? "next" : role === "idle" ? "idle" : "path",
      });
    }
    if (role === "current" && scope !== "none" && request.mode === "lit") {
      const name = labels[labels.length - 1];
      if (name && name.kind !== "here") {
        const stacked = stackHereLabel(name.x, name.y, name.text, size);
        name.x = stacked.x;
        name.y = stacked.nameY;
        labels.push({
          text: "You are here",
          x: stacked.x,
          y: stacked.hereY,
          kind: "here",
        });
      } else {
        const placed = placeLabel(
          "You are here",
          point.x,
          point.y,
          size,
          "below",
        );
        labels.push({
          text: "You are here",
          x: placed.x,
          y: placed.y,
          kind: "here",
        });
      }
    }
    return {
      id: node.id,
      x: point.x,
      y: point.y,
      terminal: childIds(node, byId).length === 0,
      role,
      labels,
    };
  });

  const choices = choiceList(request, ordered, byId, path, currentId);
  separateLabels(
    nodes.flatMap((node) => node.labels),
    size,
  );

  return {
    viewBox: `0 0 ${size.width} ${size.height}`,
    width: size.width,
    height: size.height,
    mode: request.mode,
    orientation: request.orientation,
    ghost: request.mode === "ghost",
    nodes,
    edges,
    summary: storyMapSummary(request.title, request.mode, request.sample),
    choices,
  };
}

function choiceList(
  request: StoryMapRequest,
  ordered: readonly StoryMapNodeInput[],
  byId: Map<string, StoryMapNodeInput>,
  path: readonly string[],
  currentId: string | null,
): StoryMapChoiceItem[] {
  if (request.mode === "ghost") {
    return [
      {
        id: "locked",
        text: "Locked. The paths open when you unlock it.",
      },
    ];
  }

  if (request.mode === "open") {
    const items: StoryMapChoiceItem[] = [];
    const rootIds = rootsOf(ordered, byId);
    for (const rootId of rootIds) {
      const root = byId.get(rootId);
      if (root?.label?.trim()) {
        items.push({ id: root.id, text: root.label.trim() });
      }
      for (const choice of root?.choices ?? []) {
        const text = choice.text.trim();
        if (text) items.push({ id: `${rootId}-${choice.nextNodeId}`, text });
      }
    }
    return items;
  }

  const items: StoryMapChoiceItem[] = [];
  for (const id of path) {
    const node = byId.get(id);
    const label = id === currentId ? "You are here" : node?.label?.trim() || "";
    if (label) items.push({ id, text: label });
  }
  const current = currentId ? byId.get(currentId) : undefined;
  for (const choice of current?.choices ?? []) {
    const text = choice.text.trim();
    if (text) items.push({ id: `next-${choice.nextNodeId}`, text });
  }
  return items;
}
