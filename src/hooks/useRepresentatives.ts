import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const representativeQueryKey = ["state-representatives"];
export function useRepresentatives(operations = false) {
  return useQuery({
    queryKey: [...representativeQueryKey, operations ? "operations" : "public"],
    queryFn: async () => {
      const base = supabase.from("state_representatives");
      if (operations) {
        const { data, error } = await base.select("id,state_slug,zone,name,email,phone,is_active,updated_at,representative_personal_details(spouse_name,representative_birthday,spouse_birthday)")
          .order("state_slug").order("zone").order("name");
        if (error) throw error;
        return data;
      }
      const { data, error } = await base.select("id,state_slug,zone,name,email,phone,is_active,updated_at")
        .eq("is_active", true).order("zone").order("name");
      if (error) throw error;
      return data;
    },
    // Avoid retaining personal information after leaving the operations screen.
    gcTime: operations ? 0 : 5 * 60 * 1000,
  });
}
