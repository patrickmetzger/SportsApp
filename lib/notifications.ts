import { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "new_registration"
  | "message"
  | "incident_report"
  | "incident_update"
  | "payment_received"
  | "program_update"
  | "schedule_change";

interface CreateNotificationParams {
  supabase: SupabaseClient;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification({
  supabase,
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      read: false,
    });

    if (error) {
      // If table doesn't exist, log but don't fail
      if (error.code === "42P01") {
        console.log("Notifications table does not exist yet");
        return { success: true };
      }
      console.error("Error creating notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in createNotification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function createBulkNotifications({
  supabase,
  userIds,
  type,
  title,
  message,
  link,
}: Omit<CreateNotificationParams, "userId"> & { userIds: string[] }): Promise<{ success: boolean; error?: string }> {
  try {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      type,
      title,
      message,
      link,
      read: false,
    }));

    const { error } = await supabase.from("notifications").insert(notifications);

    if (error) {
      if (error.code === "42P01") {
        console.log("Notifications table does not exist yet");
        return { success: true };
      }
      console.error("Error creating bulk notifications:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in createBulkNotifications:", error);
    return { success: false, error: "Failed to create notifications" };
  }
}
