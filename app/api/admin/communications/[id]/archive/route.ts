import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.role !== "admin" && currentUser.role !== "school_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from("communications")
      .update({ archived: true })
      .eq("id", id);

    if (updateError) {
      console.error("Error archiving communication:", updateError);
      return NextResponse.json({ error: "Failed to archive communication" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in archive communication:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
