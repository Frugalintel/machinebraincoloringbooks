import { afterEach, describe, expect, it } from "vitest";
import { fetchPublishedStory } from "@/lib/story-lookup";

const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

describe("fetchPublishedStory", () => {
  const previous = {
    url: process.env[URL_KEY],
    key: process.env[KEY],
  };

  afterEach(() => {
    if (previous.url === undefined) delete process.env[URL_KEY];
    else process.env[URL_KEY] = previous.url;
    if (previous.key === undefined) delete process.env[KEY];
    else process.env[KEY] = previous.key;
  });

  it("returns null without a Supabase client when env is unset", async () => {
    delete process.env[URL_KEY];
    delete process.env[KEY];
    await expect(fetchPublishedStory("missing-story")).resolves.toBeNull();
  });
});
