"use client";

import {
  STORY_MAP_CARD_H,
  STORY_MAP_HERO_H,
  STORY_MAP_READER,
  STORY_MAP_V,
  buildStoryMap,
  type StoryMapLabelScope,
  type StoryMapLayout,
  type StoryMapMode,
  type StoryMapNodeInput,
  type StoryMapProgress,
} from "@/lib/story-map";
import { cn } from "@/lib/utils";
import "./story-map.css";

function MapSvg({
  layout,
  className,
}: {
  layout: StoryMapLayout;
  className?: string;
}) {
  return (
    <div className={cn("story-map-wrap", className)}>
      <svg
        className={cn(
          "story-map",
          layout.mode === "ghost" && "is-ghost",
          layout.mode === "open" && "is-open",
          layout.mode === "lit" && "is-lit",
        )}
        viewBox={layout.viewBox}
        role="img"
        aria-label={layout.summary}
      >
        <title>{layout.summary}</title>
        {layout.edges.map((edge) => (
          <path
            key={`${edge.from}-${edge.to}`}
            className={cn(
              "e",
              edge.kind === "path" && "is-path",
              edge.kind === "next" && "is-next",
            )}
            d={edge.d}
          />
        ))}
        {layout.nodes.map((node) => (
          <g key={node.id}>
            {node.role === "current" ? (
              <circle className="halo" cx={node.x} cy={node.y} r={15} />
            ) : null}
            {node.terminal ? (
              <rect
                className={cn(
                  "n",
                  "is-end",
                  node.role === "current" && "is-current",
                  node.role === "path" && "is-path",
                  node.role === "next" && "is-next",
                )}
                x={node.x - 4.5}
                y={node.y - 4.5}
                width={9}
                height={9}
              />
            ) : (
              <circle
                className={cn(
                  "n",
                  node.role === "current" && "is-current",
                  node.role === "path" && "is-path",
                  node.role === "next" && "is-next",
                )}
                cx={node.x}
                cy={node.y}
                r={node.role === "current" ? 7 : 5}
              />
            )}
            {node.labels.map((label) => (
              <text
                key={`${label.kind}-${label.text}`}
                className={cn("lb", `is-${label.kind}`)}
                x={label.x}
                y={label.y}
              >
                {label.text}
              </text>
            ))}
          </g>
        ))}
      </svg>
      <ol className="story-map-choices">
        {layout.choices.map((choice) => (
          <li key={choice.id}>{choice.text}</li>
        ))}
      </ol>
    </div>
  );
}

export function StoryMap({
  title,
  nodes,
  mode,
  progress,
  sample = false,
  labelScope,
  variant = "card",
}: {
  title: string;
  nodes: readonly StoryMapNodeInput[];
  mode: StoryMapMode;
  progress?: StoryMapProgress;
  sample?: boolean;
  labelScope?: StoryMapLabelScope;
  variant?: "card" | "hero" | "reader";
}) {
  const scope =
    labelScope ??
    (mode === "lit" ? (variant === "reader" ? "path" : "all") : "fork");
  const shared = { title, nodes, mode, progress, sample, labelScope: scope };
  const wide = buildStoryMap({
    ...shared,
    orientation: "horizontal",
    size: variant === "hero" ? STORY_MAP_HERO_H : STORY_MAP_CARD_H,
  });
  const tall = buildStoryMap({
    ...shared,
    orientation: "vertical",
    size: variant === "reader" ? STORY_MAP_READER : STORY_MAP_V,
  });

  if (variant === "reader") {
    return <MapSvg layout={tall} className="map-reader" />;
  }

  return (
    <div className={cn("map-frame", variant === "hero" ? "hero" : "card")}>
      <MapSvg layout={wide} className="maph" />
      <MapSvg layout={tall} className="mapv" />
    </div>
  );
}
