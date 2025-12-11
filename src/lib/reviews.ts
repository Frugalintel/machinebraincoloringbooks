import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Review, ProductRating } from './types';

// Fetch all reviews for a product
export async function fetchProductReviews(productId: string): Promise<{ data: Review[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles!reviews_user_id_fkey(display_name, avatar_url)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  return { data: data as Review[] | null, error };
}

// Fetch average rating for a product
export async function fetchProductRating(productId: string): Promise<{ data: ProductRating | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (error) return { data: null, error };

  if (!data || data.length === 0) {
    return { 
      data: { 
        product_id: productId, 
        average_rating: 0, 
        review_count: 0 
      }, 
      error: null 
    };
  }

  const sum = data.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / data.length) * 10) / 10;

  return {
    data: {
      product_id: productId,
      average_rating: average,
      review_count: data.length
    },
    error: null
  };
}

// Fetch ratings for multiple products (for store listing)
export async function fetchProductRatings(productIds: string[]): Promise<{ data: Record<string, ProductRating>; error: PostgrestError | null }> {
  if (productIds.length === 0) {
    return { data: {}, error: null };
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('product_id, rating')
    .in('product_id', productIds);

  if (error) return { data: {}, error };

  // Group by product and calculate averages
  const ratings: Record<string, ProductRating> = {};
  
  productIds.forEach(id => {
    const productReviews = data?.filter(r => r.product_id === id) || [];
    if (productReviews.length > 0) {
      const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
      ratings[id] = {
        product_id: id,
        average_rating: Math.round((sum / productReviews.length) * 10) / 10,
        review_count: productReviews.length
      };
    } else {
      ratings[id] = {
        product_id: id,
        average_rating: 0,
        review_count: 0
      };
    }
  });

  return { data: ratings, error: null };
}

// Create a new review
export async function createReview(review: {
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
}): Promise<{ data: Review | null; error: PostgrestError | Error | null }> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) {
    return { data: null, error: new Error('You must be logged in to leave a review') };
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...review,
      user_id: userData.user.id,
      is_verified_purchase: false, // Could check orders table in future
    })
    .select()
    .single();

  return { data: data as Review | null, error };
}

// Update an existing review
export async function updateReview(
  reviewId: string,
  updates: {
    rating?: number;
    title?: string;
    comment?: string;
  }
): Promise<{ data: Review | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single();

  return { data: data as Review | null, error };
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  return { error };
}

// Check if user has already reviewed a product
export async function getUserReview(productId: string): Promise<{ data: Review | null; error: PostgrestError | null }> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  return { data: data as Review | null, error };
}

// Mark a review as helpful (increment helpful_count)
export async function markReviewHelpful(reviewId: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('increment_helpful_count', { review_id: reviewId });
  
  // Fallback if RPC doesn't exist - just fetch and update
  if (error?.code === 'PGRST202') {
    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single();
    
    if (review) {
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ helpful_count: (review.helpful_count || 0) + 1 })
        .eq('id', reviewId);
      return { error: updateError };
    }
  }
  
  return { error };
}
