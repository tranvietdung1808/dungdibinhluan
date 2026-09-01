"use client";

// =====================================================
// Security — bảo mật tài khoản & đăng xuất
// Violet = accent phụ (bảo mật) · Danger edge = đăng xuất
// Cấu trúc "asymmetric weight": 3 khối kế tiếp
// không dùng chung 1 layout-formula (icon-trái/text-phải)
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
    <div className="space-y-5">
      {/* Authentication method — khối thông tin: giữ formula icon-trái/text-phải */}
      <Card>
        <CardHeader
          icon="lock"
          title="Xác thực"
          subtitle="Phương thức đăng nhập của tài khoản"
        />
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl surface-card">
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

          {/* Gộp 2 box nhỏ thành 1 dòng inline — giảm "box trong box" */}
          {(memberSince || lastSignIn) && (
            <p className="text-xs text-muted leading-relaxed">
              {memberSince && <span>Người dùng từ {formatDateTime(memberSince)}</span>}
              {memberSince && lastSignIn && <span> · </span>}
              {lastSignIn && <span>Đăng nhập gần nhất {formatDateTime(lastSignIn)}</span>}
            </p>
          )}

          <p className="text-[11px] text-muted leading-relaxed">
            Tài khoản được xác thực qua Google OAuth. Dữ liệu cá nhân được lưu trữ bảo mật và
            chỉ hiển thị cho chính bạn.
          </p>
        </div>
      </Card>

      {/* Sessions / devices hint — đổi sang list row không icon-circle */}
      <section className="surface-card rounded-2xl" aria-labelledby="sec-sessions">
        <div className="px-5 pt-4 sm:px-6 sm:pt-5">
          <h3 id="sec-sessions" className="text-sm font-bold text-title tracking-wide">
            Quản lý phiên
          </h3>
          <p className="text-xs text-muted mt-0.5">Các thiết bị đang đăng nhập</p>
        </div>
        <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6 sm:pt-3">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full bg-ok shrink-0"
                aria-hidden="true"
              />
              <p className="text-sm text-body min-w-0">
                Phiên hiện tại trên thiết bị này
              </p>
            </div>
            <span className="text-xs text-muted shrink-0">Đang hoạt động</span>
          </div>
          <p className="text-xs text-muted leading-relaxed mt-3">
            Đăng xuất sẽ kết thúc phiên hiện tại. Bạn có thể đăng nhập lại bằng Google bất cứ lúc nào.
          </p>
        </div>
      </section>

      {/* Danger zone: logout — accent chỉ ở 1 cạnh trái, không viền 4 phía */}
      <Card className={confirm ? "border-l-[var(--accent-edge-width)] border-l-danger" : "border-l-[var(--accent-edge-width)] border-l-danger/70"}>
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-danger shrink-0">
              <Icon name="logout" className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-title tracking-wide">Đăng xuất</h3>
              {!confirm && (
                <p className="text-xs text-muted mt-0.5">
                  Kết thúc phiên trên thiết bị này
                </p>
              )}
            </div>
          </div>
          {!confirm && (
            <Button variant="secondary" size="sm" onClick={() => setConfirm(true)} className="shrink-0 text-danger border-danger/25 hover:bg-danger/10 hover:border-danger/40">
              <Icon name="logout" className="w-4 h-4" />
              Đăng xuất
            </Button>
          )}
        </div>

        {confirm && (
          <div className="border-t border-line px-5 py-4 sm:px-6 sm:py-5">
            <div className="rounded-xl surface-card p-4 space-y-3">
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
          </div>
        )}
      </Card>
    </div>
  );
}