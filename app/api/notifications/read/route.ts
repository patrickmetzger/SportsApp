import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id, mark_all } = body;

    if (mark_all) {
      // Mark all notifications as read for this user
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notification_id) {
      return NextResponse.json({ error: "notification_id or mark_all required" }, { status: 400 });
    }

    // Mark single notification as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notification_id)
      .eq("user_id", user.id); // Ensure user owns this notification

    if (error) {
      console.error("Error marking notification as read:", error);
      return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in mark as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
