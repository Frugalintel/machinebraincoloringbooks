"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Collectible } from "@/lib/types";
import { CollectibleForm } from "@/components/admin/collectible-form";
import { logger } from "@/lib/logger";

export default function EditCollectiblePage() {
  const params = useParams();
  const [collectible, setCollectible] = useState<Collectible | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectible = async () => {
      try {
        const { data, error } = await supabase
          .from('collectibles')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) throw error;
        setCollectible(data);
      } catch (error) {
        logger.error("Error fetching collectible:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
        fetchCollectible();
    }
  }, [params.id]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (!collectible) return <div className="text-center py-20 text-gray-500">Collectible not found</div>;

  return <CollectibleForm initialData={collectible} isEditing={true} />;
}
