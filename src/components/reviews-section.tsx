"use client";

import { useState, useEffect } from "react";
import { Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Review, ProductRating } from "@/lib/types";
import {
  fetchProductReviews,
  fetchProductRating,
  createReview,
  updateReview,
  deleteReview,
  getUserReview,
  markReviewHelpful,
} from "@/lib/reviews";

interface ReviewsSectionProps {
  productId: string;
  productTitle?: string;
}

const FIELD =
  "w-full border border-line-strong bg-background text-base text-cream placeholder:text-fg-muted";

function StarRating({
  rating,
  onRate,
  interactive = false,
  size = "md",
}: {
  rating: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const stars = [1, 2, 3, 4, 5].map((star) => (
    <Star
      key={star}
      aria-hidden="true"
      className={`${sizeClasses[size]} ${
        star <= (hoverRating || rating)
          ? "fill-cream text-cream"
          : "fill-transparent text-fg-faint"
      }`}
    />
  ));

  if (!interactive) {
    return (
      <span className="flex gap-0.5" role="img" aria-label={`${rating} of 5`}>
        {stars}
      </span>
    );
  }

  return (
    <div className="flex gap-1" role="group" aria-label="Your rating">
      {stars.map((icon, index) => (
        <button
          key={index}
          type="button"
          aria-label={`${index + 1} of 5`}
          aria-pressed={rating === index + 1}
          onClick={() => onRate?.(index + 1)}
          onMouseEnter={() => setHoverRating(index + 1)}
          onMouseLeave={() => setHoverRating(0)}
          className="flex size-11 items-center justify-center"
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  isOwn,
  onEdit,
  onDelete,
  onHelpful,
}: {
  review: Review;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onHelpful: () => void;
}) {
  const displayName = review.user?.display_name?.trim() || "Reader";
  const initials = displayName.substring(0, 2).toUpperCase();
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <li className="border-t border-line py-6">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10 border border-line">
          {review.user?.avatar_url ? (
            <AvatarImage src={review.user.avatar_url} alt="" />
          ) : null}
          <AvatarFallback className="bg-surface-2 font-label text-cream">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-cream">
                {displayName}
              </span>
              {review.is_verified_purchase ? (
                <span className="font-label border border-line-strong px-2 py-0.5 text-fg-secondary">
                  Verified purchase
                </span>
              ) : null}
            </div>
            <span className="font-label text-fg-muted">{date}</span>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <StarRating rating={review.rating} size="sm" />
            {review.title ? (
              <span className="text-base font-semibold text-cream">
                {review.title}
              </span>
            ) : null}
          </div>

          {review.comment ? (
            <p className="mb-4 text-base leading-relaxed text-fg-secondary">
              {review.comment}
            </p>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onHelpful}
              className="font-label min-h-11 text-fg-muted hover:text-cream"
            >
              Helpful ({review.helpful_count})
            </button>

            {isOwn ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label="Edit your review"
                  className="flex size-11 items-center justify-center text-fg-muted hover:text-cream"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Delete your review"
                  className="flex size-11 items-center justify-center text-fg-muted hover:text-cream"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function ReviewForm({
  existingReview,
  onSubmit,
  onCancel,
}: {
  existingReview?: Review;
  onSubmit: (data: {
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, title, comment });
      if (!existingReview) {
        setRating(0);
        setTitle("");
        setComment("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-line p-6">
      <h3 className="mb-6 text-h3 text-cream">
        {existingReview ? "Edit your review" : "Write a review"}
      </h3>

      <div className="space-y-6">
        <div>
          <p className="font-label mb-2 text-fg-secondary">Your rating</p>
          <StarRating
            rating={rating}
            onRate={setRating}
            interactive
            size="lg"
          />
          {rating === 0 ? (
            <p className="mt-2 text-base text-fg-muted">Choose 1 to 5 stars.</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="review-title"
            className="font-label mb-2 block text-fg-secondary"
          >
            Title
          </label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="In a few words"
            className={`${FIELD} h-11`}
          />
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="font-label mb-2 block text-fg-secondary"
          >
            Your review
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What was it like to color?"
            rows={4}
            className={`${FIELD} focus-ring resize-none p-3`}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={rating === 0 || isSubmitting}
            loading={isSubmitting}
          >
            {existingReview ? "Update review" : "Submit review"}
          </Button>

          {onCancel ? (
            <Button type="button" onClick={onCancel} variant="ghost" size="lg">
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

export function ReviewsSection({
  productId,
  productTitle,
}: ReviewsSectionProps) {
  const { user, openAuthModal } = useAuth();
  const { success, error: showError } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<ProductRating | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  useEffect(() => {
    if (user) {
      loadUserReview();
    } else {
      setUserReview(null);
    }
  }, [user, productId]);

  const loadReviews = async () => {
    setLoading(true);
    const [reviewsRes, ratingRes] = await Promise.all([
      fetchProductReviews(productId),
      fetchProductRating(productId),
    ]);

    if (reviewsRes.data) setReviews(reviewsRes.data);
    if (ratingRes.data) setRating(ratingRes.data);
    setLoading(false);
  };

  const loadUserReview = async () => {
    const { data } = await getUserReview(productId);
    setUserReview(data);
  };

  const handleSubmitReview = async (data: {
    rating: number;
    title: string;
    comment: string;
  }) => {
    if (userReview) {
      // Update existing review
      const { error } = await updateReview(userReview.id, data);
      if (error) {
        showError("Your review did not update. Try again.");
        return;
      }
      success("Review updated");
      setIsEditing(false);
    } else {
      // Create new review
      const { error } = await createReview({
        product_id: productId,
        ...data,
      });
      if (error) {
        showError(error.message || "Your review did not send. Try again.");
        return;
      }
      success("Review posted");
    }

    // Reload reviews
    await loadReviews();
    await loadUserReview();
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    const { error } = await deleteReview(userReview.id);
    if (error) {
      showError("Your review was not deleted. Try again.");
      return;
    }

    success("Review deleted");
    setUserReview(null);
    await loadReviews();
  };

  const handleHelpful = async (reviewId: string) => {
    await markReviewHelpful(reviewId);
    await loadReviews();
  };

  return (
    <section
      className="border-t border-line pt-12 pb-4"
      aria-labelledby="reviews-h"
    >
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h2 id="reviews-h" className="text-h2 text-cream">
            Reviews
          </h2>
          {productTitle ? (
            <p className="mt-2 text-base text-fg-secondary">
              From people who colored this book.
            </p>
          ) : null}
        </div>

        {rating && rating.review_count > 0 ? (
          <div className="flex items-center gap-6 border border-line px-6 py-4">
            <div className="text-center">
              <div className="price text-[32px] leading-none text-cream">
                {rating.average_rating.toFixed(1)}
              </div>
              <div className="font-label mt-1 text-fg-muted">out of 5</div>
            </div>
            <div className="border-l border-line pl-6">
              <StarRating
                rating={Math.round(rating.average_rating)}
                size="md"
              />
              <div className="font-label mt-1 text-fg-muted">
                {rating.review_count}{" "}
                {rating.review_count === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {user ? (
        userReview && !isEditing ? (
          <div className="mb-8 border border-line p-4">
            <p className="text-base text-fg-secondary">
              You reviewed this book.{" "}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-cream underline underline-offset-4"
              >
                Edit your review
              </button>
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <ReviewForm
              existingReview={isEditing ? (userReview ?? undefined) : undefined}
              onSubmit={handleSubmitReview}
              onCancel={isEditing ? () => setIsEditing(false) : undefined}
            />
          </div>
        )
      ) : (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border border-line p-6">
          <p className="text-base text-fg-secondary">
            Sign in to leave a review.
          </p>
          <Button
            type="button"
            size="lg"
            onClick={() => openAuthModal("login")}
          >
            Sign in
          </Button>
        </div>
      )}

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="border-t border-line py-6 motion-safe:animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-surface-3" />
                <div className="flex-1">
                  <div className="mb-3 h-4 w-1/4 bg-surface-3" />
                  <div className="mb-4 h-3 w-1/3 bg-surface-3" />
                  <div className="mb-2 h-3 w-full bg-surface-3" />
                  <div className="h-3 w-2/3 bg-surface-3" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : reviews.length === 0 ? (
        <p className="border-t border-line py-8 text-base text-fg-secondary">
          No reviews yet.
        </p>
      ) : (
        <ul>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={user?.id === review.user_id}
              onEdit={() => setIsEditing(true)}
              onDelete={handleDeleteReview}
              onHelpful={() => handleHelpful(review.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function ProductRatingDisplay({
  productId,
  showCount = true,
  size = "sm",
}: {
  productId: string;
  showCount?: boolean;
  size?: "sm" | "md";
}) {
  const [rating, setRating] = useState<ProductRating | null>(null);

  useEffect(() => {
    fetchProductRating(productId).then(({ data }) => {
      if (data) setRating(data);
    });
  }, [productId]);

  if (!rating || rating.review_count === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(rating.average_rating)} size={size} />
      {showCount ? (
        <span className="font-label text-fg-muted">
          ({rating.review_count})
        </span>
      ) : null}
    </div>
  );
}
