import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";

// =====================================================
// /api/account/plans — danh sách gói membership active
// Public (hiển thị trên trang account & membership)
// =====================================================
export const maxDuration = 60;

export async function GET() {
  return runRoute(async () => {
    const { data, error } = await supabaseAdmin
      .from("membership_plans")
      .select("id, name, description, price, duration_days, features, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) return errorResponse("Không tải được danh sách gói", 500);

    return successResponse({
      plans: (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        duration_days: p.duration_days,
        features: p.features ?? [],
        is_active: p.is_active,
        sort_order: p.sort_order,
      })),
    });
  });
}