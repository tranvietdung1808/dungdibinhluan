"use client";

// =====================================================
// Security — bảo mật tài khoản & đăng xuất
// Violet = accent phụ (bảo mật)
// =====================================================

import { useState } from "react";
import { Badge, Button, Card, CardHeader, Icon, useFeedback } from "./ui";
import { formatDateTime } from "./states";

export function SecuritySection({
  email,
  memberSince,
  lastSignIn,
  onLogout,
}: {
  email: string;
  memberSince?: string | null;
  lastSignIn?: string | null;
  onLogout: () => Promise<void>;
}) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const fb = useFeedback();

  const logout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
      // useAuth sẽ set user=null -> page chuyển về login state
    } catch {
      fb.report("Không đăng xuất được, thử lại", "error");
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Authentication method */}
      <Card>
        <CardHeader
          icon="lock"
          title="Xác thực"
          subtitle="Phương thức đăng nhập của tài khoản"
        />
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl surface-0 border border-line">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-violet/15 text-violet flex items-center justify-center shrink-0">
                <Icon name="shield" className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-title">Đăng nhập Google</p>
                <p className="text-xs text-muted truncate">{email}</p>
              </div>
            </div>
            <Badge tone="ok">
              <Icon name="check" className="w-3 h-3" />
              Đang dùng
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <SecurityInfo label="Người dùng từ" value={formatDateTime(memberSince)} />
            <SecurityInfo label="Đăng nhập gần nhất" value={formatDateTime(lastSignIn)} />
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            Tài khoản được xác thực qua Google OAuth. Dữ liệu cá nhân được lưu trữ bảo mật và
            chỉ hiển thị cho chính bạn.
          </p>
        </div>
      </Card>

      {/* Sessions / devices hint */}
      <Card>
        <CardHeader
          icon="settings"
          title="Quản lý phiên"
          subtitle="Các thiết bị đang đăng nhập"
        />
        <div className="p-5 sm:p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl surface-2 text-muted flex items-center justify-center shrink-0">
              <Icon name="user" className="w-4 h-4" />
            </span>
            <p className="text-sm text-body min-w-0">
              Phiên hiện tại trên thiết bị này. Đăng xuất sẽ kết thúc phiên.
            </p>
          </div>
        </div>
      </Card>

      {/* Danger zone: logout */}
      <Card className="border-danger/25">
        <CardHeader
          icon="logout"
          title="Đăng xuất"
          subtitle="Kết thúc phiên trên thiết bị này"
        />
        <div className="p-5 sm:p-6">
          {!confirm ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-muted leading-relaxed">
                Bạn sẽ cần đăng nhập lại bằng Google khi quay lại.
              </p>
              <Button variant="danger" size="md" onClick={() => setConfirm(true)} className="shrink-0">
                <Icon name="logout" className="w-4 h-4" />
                Đăng xuất
              </Button>
            </div>
          ) : (
            <div className="rounded-xl surface-0 border border-danger/20 p-4 space-y-3">
              <p className="text-sm text-body">
                Bạn có chắc muốn <span className="font-bold text-danger">đăng xuất</span> khỏi tài khoản?
              </p>
              <div className="flex items-center gap-2.5">
                <Button variant="danger" size="sm" onClick={logout} disabled={loggingOut}>
                  {loggingOut ? (
                    <>
                      <svg className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" viewBox="0 0 24 24" aria-hidden="true" />
                      Đang đăng xuất...
                    </>
                  ) : (
                    "Xác nhận đăng xuất"
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirm(false)} disabled={loggingOut}>
                  Hủy
                </Button>
              </div>
              {fb.msg && (
                <p className="text-xs text-danger" role="alert">
                  {fb.msg}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function SecurityInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl surface-0 border border-line px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted font-bold">{label}</p>
      <p className="text-sm text-body mt-0.5">{value}</p>
    </div>
  );
}