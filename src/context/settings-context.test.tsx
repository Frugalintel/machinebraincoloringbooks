import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsProvider, useSettings } from "@/context/settings-context";
import { supabase } from "@/lib/supabase";

function Probe() {
  const { isLoading, campaign } = useSettings();
  return (
    <div>
      <span data-testid="settings-loading">
        {isLoading ? "loading" : "ready"}
      </span>
      <span data-testid="settings-name">{campaign.name}</span>
    </div>
  );
}

describe("SettingsProvider empty reads", () => {
  const campaignMaybe = vi.fn();
  const legacyMaybe = vi.fn();

  beforeEach(() => {
    campaignMaybe.mockReset();
    legacyMaybe.mockReset();
    campaignMaybe.mockResolvedValue({ data: null, error: null });
    legacyMaybe.mockResolvedValue({ data: null, error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "campaigns") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({ maybeSingle: campaignMaybe }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: legacyMaybe }),
        }),
      } as unknown as ReturnType<typeof supabase.from>;
    });
  });

  it("uses maybeSingle so an empty campaigns row is not a 406", async () => {
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("settings-loading")).toHaveTextContent("ready"),
    );
    expect(campaignMaybe).toHaveBeenCalled();
    expect(legacyMaybe).toHaveBeenCalled();
    expect(screen.getByTestId("settings-name")).toHaveTextContent(
      "Default Campaign",
    );
  });
});
