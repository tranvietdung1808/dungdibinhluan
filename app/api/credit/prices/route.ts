import { CREDIT_TOPUP_PACKAGES } from "@/lib/server/credit";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";

// =====================================================
// /api/credit/prices — danh sách các gói nạp credit (public, không cần auth)
// =====================================================
export const maxDuration = 60;

// GET — trả về catalog giá nạp credit
export async function GET() {
  return runRoute(async () => {
    return successResponse({ packages: CREDIT_TOPUP_PACKAGES });
  });
}