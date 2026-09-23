import type { Metadata } from "next";
import { Breadcrumb, Card, Container, InlineNotice } from "@/app/components/ui";
import CopyButton from "@/app/components/CopyButton";

export const metadata: Metadata = {
  title: "DMCA & Abuse | DungDiBinhLuan",
  description: "Báo cáo vi phạm bản quyền và lạm dụng trên website DungDiBinhLuan.",
  alternates: {
    canonical: "https://dungdibinhluan.com/dmca",
  },
};

const CONTACT_EMAIL = "dungdibinhluan@gmail.com";
const FACEBOOK_URL = "https://web.facebook.com/dungbinhluan/";

const steps = [
  {
    title: "Nhận báo cáo",
    description: "Tiếp nhận email báo cáo từ người dùng",
  },
  {
    title: "Xem xét",
    description: "Đánh giá tính hợp lệ và bằng chứng đi kèm",
  },
  {
    title: "Gỡ nếu vi phạm",
    description: "Xóa nội dung vi phạm và thông báo kết quả xử lý",
  },
];

export default function DMCAPage() {
  return (
    <main className="min-h-screen">
      <Container className="py-8 md:py-12">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "DMCA & Abuse" },
          ]}
        />

        <header className="mt-8 max-w-2xl">
          <h1 className="text-h1 text-[var(--color-title)]">
            DMCA &amp; báo cáo lạm dụng
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
            Kênh tiếp nhận báo cáo vi phạm bản quyền và lạm dụng trên DungDiBinhLuan.
          </p>
        </header>

        <div className="mt-10 max-w-3xl space-y-6">
          <Card>
            <h2 className="text-h3 text-[var(--color-title)]">
              Báo cáo vi phạm bản quyền
            </h2>
            <p className="mt-3 leading-relaxed text-[var(--color-body)]">
              Nếu bạn phát hiện nội dung trên website vi phạm bản quyền hoặc sở hữu
              trí tuệ của bạn, vui lòng gửi email báo cáo chi tiết đến địa chỉ liên
              hệ bên dưới. Chúng tôi cam kết xem xét và xử lý nghiêm túc mọi báo cáo
              hợp lệ.
            </p>
          </Card>

          <Card>
            <h2 className="text-h3 text-[var(--color-title)]">Email tiếp nhận</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] px-4 py-3">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="break-all font-mono text-base font-semibold text-[var(--color-accent-strong)] hover:underline md:text-lg"
              >
                {CONTACT_EMAIL}
              </a>
              <span className="ml-auto">
                <CopyButton text={CONTACT_EMAIL} />
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
              Vui lòng gửi email với tiêu đề rõ ràng, ví dụ:{" "}
              <span className="font-mono text-[var(--color-body)]">
                [DMCA Report] - Tên nội dung vi phạm
              </span>
            </p>
            <div className="mt-4">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("[DMCA Report] - ")}`}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-3 text-sm font-semibold text-[var(--color-title)] transition-colors hover:border-[var(--color-accent-border)]"
              >
                Soạn email báo cáo
              </a>
            </div>
          </Card>

          <Card>
            <h2 className="text-h3 text-[var(--color-title)]">Thời gian xử lý</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-body)]">
              Chúng tôi cam kết phản hồi và xử lý mọi báo cáo hợp lệ trong vòng
              48-72 giờ làm việc. Bạn sẽ nhận được email xác nhận khi chúng tôi bắt
              đầu xem xét báo cáo của bạn.
            </p>
          </Card>

          <Card>
            <h2 className="text-h3 text-[var(--color-title)]">Quy trình xử lý</h2>
            <ol className="mt-4 space-y-4">
              {steps.map((step, index) => (
                <li key={step.title} className="flex items-start gap-3.5">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-sm font-bold text-[var(--color-accent-strong)]"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-semibold text-[var(--color-title)]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <InlineNotice tone="danger" title="Nghiêm cấm lạm dụng hệ thống báo cáo">
            <p className="leading-relaxed">
              Chúng tôi nghiêm cấm việc lạm dụng hệ thống báo cáo để khai sai sự
              thật, quấy rối hoặc gây phiền toái cho người khác. Mọi hành vi lạm
              dụng sẽ bị xử lý và có thể dẫn đến việc chặn truy cập vĩnh viễn.
            </p>
          </InlineNotice>

          <Card>
            <h2 className="text-h3 text-[var(--color-title)]">Liên hệ nhanh</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-body)]">
              Bạn cũng có thể liên hệ qua Facebook để được hỗ trợ nhanh hơn:{" "}
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-accent-strong)] hover:underline"
              >
                DungDiBinhLuan
              </a>
            </p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
