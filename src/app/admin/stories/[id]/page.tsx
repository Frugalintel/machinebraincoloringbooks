"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import { StoryForm } from "@/components/admin/story-form";

export default function EditStoryPage() {
  const params = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) throw error;
        setStory(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
        fetchStory();
    }
  }, [params.id]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (!story) return <div>Story not found</div>;

  return <StoryForm initialData={story} isEditing={true} />;
}

