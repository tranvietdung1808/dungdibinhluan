"use client";

// =====================================================
// Profile — thông tin cá nhân + tài khoản liên kết
// Violet = accent phụ (profile)
// =====================================================

import { useState } from "react";
import { Badge, Button, Card, CardHeader, Icon, Input, useFeedback } from "./ui";
import { formatDateTime } from "./states";

const API_TOKEN_MIN = 2;

export function ProfileSection({
  displayName,
  email,
  avatarUrl,
  memberSince,
  lastSignIn,
  onSaved,
  onError,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  memberSince?: string | null;
  lastSignIn?: string | null;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const fb = useFeedback();

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < API_TOKEN_MIN) {
      fb.report("Tên hiển thị cần ít nhất 2 ký tự", "error");
      return;
    }
    setSaving(true);
    fb.clear();
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        fb.report("Phiên đăng nhập đã hết hạn", "error");
        return;
      }
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: trimmed }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msg = "Lỗi: " + (d.error || "không xác định");
        fb.report(msg, "error");
        onError(msg);
        return;
      }
      fb.report("Đã lưu tên hiển thị mới", "ok");
      onSaved();
    } catch {
      const msg = "Lỗi kết nối, vui lòng thử lại";
      fb.report(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Thông tin cá nhân */}
      <Card>
        <CardHeader
          icon="user"
          title="Thông tin cá nhân"
          subtitle="Tên hiển thị và thông tin tài khoản được đồng bộ từ Google"
        />
        <div className="p-5 sm:p-6 space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 pb-5 border-b border-line">
            <div className="w-16 h-16 rounded-2xl surface-raised overflow-hidden shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={`Ảnh đại diện của ${displayName}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center text-2xl font-black text-muted">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-title">Ảnh đại diện</p>
              <p className="text-xs text-muted mt-0.5">Tự động đồng bộ khi đăng nhập bằng Google.</p>
            </div>
          </div>

          {/* Tên hiển thị */}
          <Input
            label="Tên hiển thị"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên hiển thị..."
            maxLength={64}
            hint="Từ 2 đến 64 ký tự, hiển thị trên toàn trang."
            error={name.length > 0 && name.trim().length < API_TOKEN_MIN ? "Tên quá ngắn" : undefined}
          />

          {/* Email (readonly) */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-text-body mb-1.5">
              Email
            </span>
            <div className="flex items-center gap-2 w-full bg-surface-0 border border-line rounded-xl px-4 py-2.5">
              <Icon name="mail" className="w-4 h-4 text-muted shrink-0" />
              <span className="text-sm text-body select-all min-w-0 truncate">{email}</span>
              <span className="ml-auto text-[10px] text-muted bg-surface-2 px-2 py-0.5 rounded-md shrink-0">
                Google
              </span>
            </div>
          </div>

          {/* Member since + last sign-in */}
          {(memberSince || lastSignIn) && (
            <div className="grid sm:grid-cols-2 gap-3">
              <InfoRow label="Tham gia từ" value={formatDateTime(memberSince)} />
              <InfoRow label="Đăng nhập gần nhất" value={formatDateTime(lastSignIn)} />
            </div>
          )}

          {/* Save */}
          <div className="flex items-center gap-4 pt-1">
            <Button onClick={save} disabled={saving || name.trim().length < API_TOKEN_MIN}>
              {saving ? (
                <>
                  <svg className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" viewBox="0 0 24 24" aria-hidden="true" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Icon name="check" className="w-4 h-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
            {fb.msg && (
              <span
                className={`text-xs font-semibold ${fb.kind === "ok" ? "text-ok" : "text-danger"}`}
                role="status"
              >
                {fb.msg}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Tài khoản liên kết */}
      <Card>
        <CardHeader
          icon="shield"
          title="Tài khoản liên kết"
          subtitle="Phương thức đăng nhập đang dùng"
        />
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl surface-0 border border-line">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center shrink-0">
                <GoogleIcon />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-title">Google</p>
                <p className="text-xs text-muted truncate">{email}</p>
              </div>
            </div>
            <Badge tone="ok">
              <Icon name="check" className="w-3 h-3" />
              Đã liên kết
            </Badge>
          </div>
          <p className="text-[11px] text-muted mt-4 leading-relaxed">
            Bạn đăng nhập bằng Google. Thông tin tài khoản và avatar được đồng bộ tự động mỗi lần đăng nhập.
          </p>
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl surface-0 border border-line px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted font-bold">{label}</p>
      <p className="text-sm text-body mt-0.5">{value}</p>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}