import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  fetchProductReviews: vi.fn(),
  fetchProductRating: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
  getUserReview: vi.fn(),
  markReviewHelpful: vi.fn(),
}));

vi.mock("@/lib/reviews", () => api);

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ user: null, openAuthModal: vi.fn() }),
}));

vi.mock("@/context/toast-context", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

import { ReviewsSection } from "@/components/reviews-section";

const review = {
  id: "r1",
  product_id: "p1",
  user_id: "u1",
  rating: 4,
  title: "Solid",
  comment: "Nice pages",
  is_verified_purchase: false,
  helpful_count: 2,
  created_at: "2026-04-01T00:00:00.000Z",
  updated_at: "2026-04-01T00:00:00.000Z",
};

describe("ReviewsSection names", () => {
  beforeEach(() => {
    api.fetchProductRating.mockResolvedValue({
      data: { product_id: "p1", average_rating: 4, review_count: 1 },
      error: null,
    });
  });

  it("shows Reader when a review has no display name", async () => {
    api.fetchProductReviews.mockResolvedValue({
      data: [review],
      error: null,
    });

    render(<ReviewsSection productId="p1" />);

    expect(await screen.findByText("Reader")).toBeInTheDocument();
    expect(screen.queryByText("Anonymous")).not.toBeInTheDocument();
  });

  it("shows a profile display name when one was loaded", async () => {
    api.fetchProductReviews.mockResolvedValue({
      data: [{ ...review, user: { display_name: "Ada" } }],
      error: null,
    });

    render(<ReviewsSection productId="p1" />);

    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.queryByText("Reader")).not.toBeInTheDocument();
  });
});
