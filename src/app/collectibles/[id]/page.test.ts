import { describe, expect, it } from "vitest";
import CollectiblePage from "@/app/collectibles/[id]/page";

describe("CollectiblePage", () => {
  it("calls notFound() when the collectible is missing", async () => {
    await expect(
      CollectiblePage({
        params: Promise.resolve({ id: "missing-artifact-f7" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the detail client when the collectible exists", async () => {
    const element = await CollectiblePage({
      params: Promise.resolve({ id: "rover-x" }),
    });

    expect(element).toBeTruthy();
    expect(element.type).toBeDefined();
  });
});
