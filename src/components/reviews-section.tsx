"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, User, Pencil, Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= (hoverRating || rating)
                ? "fill-primary text-primary"
                : "fill-transparent text-[#333]"
            } transition-colors`}
          />
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
  const displayName = review.user?.display_name || "Anonymous User";
  const initials = displayName.substring(0, 2).toUpperCase();
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border border-[#222] bg-[#0a0a0a] p-6 relative group"
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50"></div>

      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10 border border-[#333]">
          {review.user?.avatar_url ? <AvatarImage src={review.user.avatar_url} alt={displayName} /> : null}
          <AvatarFallback className="bg-[#222] text-primary font-mono text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-white">{displayName}</span>
              {review.is_verified_purchase ? <span className="text-[9px] font-mono uppercase tracking-widest text-green-500 border border-green-900/50 px-2 py-0.5 bg-green-900/20">
                  Verified
                </span> : null}
            </div>
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
              {date}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <StarRating rating={review.rating} size="sm" />
            {review.title ? <span className="font-heading text-white uppercase tracking-wide text-sm">
                {review.title}
              </span> : null}
          </div>

          {review.comment ? <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {review.comment}
            </p> : null}

          <div className="flex items-center justify-between">
            <button
              onClick={onHelpful}
              className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-primary transition-colors"
            >
              <ThumbsUp size={12} />
              <span>Helpful ({review.helpful_count})</span>
            </button>

            {isOwn ? <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={onEdit}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div> : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewForm({
  existingReview,
  onSubmit,
  onCancel,
}: {
  existingReview?: Review;
  onSubmit: (data: { rating: number; title: string; comment: string }) => Promise<void>;
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
    <form onSubmit={handleSubmit} className="border border-[#222] bg-[#111] p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-8 w-1 bg-primary"></div>
        <h3 className="font-heading text-xl uppercase tracking-wide text-white">
          {existingReview ? "Edit Your Review" : "Write a Review"}
        </h3>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            Your Rating *
          </label>
          <StarRating rating={rating} onRate={setRating} interactive size="lg" />
          {rating === 0 && (
            <p className="text-[10px] font-mono text-gray-500 mt-2">
              Click to rate
            </p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
            Review Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience..."
            className="bg-black border-[#333] text-white placeholder:text-gray-600 focus:border-primary h-11"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
            Your Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={4}
            className="w-full bg-black border border-[#333] text-white placeholder:text-gray-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 p-3 text-sm resize-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="h-12 px-8 bg-primary hover:bg-white hover:text-black text-black font-heading uppercase tracking-widest rounded-none transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Submitting...</span>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                {existingReview ? "Update Review" : "Submit Review"}
              </>
            )}
          </Button>

          {onCancel ? <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              className="h-12 px-6 text-gray-500 hover:text-white font-mono uppercase tracking-widest"
            >
              Cancel
            </Button> : null}
        </div>
      </div>
    </form>
  );
}

export function ReviewsSection({ productId, productTitle }: ReviewsSectionProps) {
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

  const handleSubmitReview = async (data: { rating: number; title: string; comment: string }) => {
    if (userReview) {
      // Update existing review
      const { data: updated, error } = await updateReview(userReview.id, data);
      if (error) {
        showError("Failed to update review. Please try again.");
        return;
      }
      success("Review updated successfully!");
      setIsEditing(false);
    } else {
      // Create new review
      const { data: created, error } = await createReview({
        product_id: productId,
        ...data,
      });
      if (error) {
        showError(error.message || "Failed to submit review. Please try again.");
        return;
      }
      success("Review submitted successfully!");
    }
    
    // Reload reviews
    await loadReviews();
    await loadUserReview();
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    
    const { error } = await deleteReview(userReview.id);
    if (error) {
      showError("Failed to delete review. Please try again.");
      return;
    }
    
    success("Review deleted successfully!");
    setUserReview(null);
    await loadReviews();
  };

  const handleHelpful = async (reviewId: string) => {
    await markReviewHelpful(reviewId);
    await loadReviews();
  };

  return (
    <section className="border-t border-[#222] pt-12 mt-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-8 w-2 bg-primary"></div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">
              Customer Reviews
            </h2>
          </div>
          <p className="font-mono text-sm text-gray-500 tracking-widest uppercase">
            Feedback from verified neural network users
          </p>
        </div>

        {/* Rating Summary */}
        {rating && rating.review_count > 0 ? <div className="flex items-center gap-6 bg-[#111] border border-[#222] px-6 py-4">
            <div className="text-center">
              <div className="font-heading text-4xl text-white">
                {rating.average_rating.toFixed(1)}
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                out of 5
              </div>
            </div>
            <div className="border-l border-[#333] pl-6">
              <StarRating rating={Math.round(rating.average_rating)} size="md" />
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                {rating.review_count} {rating.review_count === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div> : null}
      </div>

      {/* Review Form or Login Prompt */}
      {user ? (
        userReview && !isEditing ? (
          <div className="mb-8 p-4 border border-primary/30 bg-primary/5">
            <p className="text-sm text-gray-400 font-mono">
              You've already reviewed this product.{" "}
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary hover:underline"
              >
                Edit your review
              </button>
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <ReviewForm
              existingReview={isEditing ? userReview ?? undefined : undefined}
              onSubmit={handleSubmitReview}
              onCancel={isEditing ? () => setIsEditing(false) : undefined}
            />
          </div>
        )
      ) : (
        <div className="mb-8 p-6 border border-[#222] bg-[#111] text-center">
          <User size={24} className="mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400 font-mono text-sm mb-4">
            Sign in to leave a review
          </p>
          <Button
            onClick={() => openAuthModal("login")}
            className="h-10 px-6 bg-primary hover:bg-white hover:text-black text-black font-heading uppercase tracking-widest rounded-none"
          >
            Sign In
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-[#222] bg-[#0a0a0a] p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#222]" />
                <div className="flex-1">
                  <div className="h-4 bg-[#222] w-1/4 mb-3 rounded" />
                  <div className="h-3 bg-[#222] w-1/3 mb-4 rounded" />
                  <div className="h-3 bg-[#222] w-full mb-2 rounded" />
                  <div className="h-3 bg-[#222] w-2/3 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border border-[#222] bg-[#0a0a0a]">
          <Star size={32} className="mx-auto mb-4 text-[#333]" />
          <p className="font-mono text-gray-500 uppercase tracking-widest text-sm">
            No reviews yet
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
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
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

// Export a smaller component for showing ratings in product cards
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
      {showCount ? <span className="text-[10px] font-mono text-gray-500">
          ({rating.review_count})
        </span> : null}
    </div>
  );
}
