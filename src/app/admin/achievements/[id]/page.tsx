"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Achievement } from "@/lib/types";
import { AchievementForm } from "@/components/admin/achievement-form";

export default function EditAchievementPage() {
  const params = useParams();
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievement = async () => {
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) throw error;
        setAchievement(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
        fetchAchievement();
    }
  }, [params.id]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (!achievement) return <div>Achievement not found</div>;

  return <AchievementForm initialData={achievement} isEditing={true} />;
}

