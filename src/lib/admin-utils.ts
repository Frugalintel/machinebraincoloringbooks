import { supabase } from "./supabase";

/**
 * Logs an administrative action to the database.
 * This is a centralized wrapper for the `log_admin_action` RPC.
 * 
 * @param action - The action performed (e.g., 'create_product', 'delete_user')
 * @param resource - The resource type affected (e.g., 'products', 'users')
 * @param targetId - The ID of the affected resource (optional)
 * @param details - Additional details about the action (optional object)
 */
export async function logAdminAction(
  action: string,
  resource: string,
  targetId?: string | null,
  details: Record<string, any> = {}
) {
  try {
    const { error } = await supabase.rpc('log_admin_action', {
      p_action: action,
      p_resource: resource,
      p_target_id: targetId || null,
      p_details: details
    });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (err) {
    console.error('Unexpected error logging admin action:', err);
  }
}

