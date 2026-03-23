import Image from "next/image";
import Link from "next/link";
import CheckUyTinButton from "../../../components/CheckUyTinButton";

const editions = [
  {
    id: "normal",
    title: "EA FC 26",
    subtitle: "STANDARD EDITION",
    description: "Bộ cài đặt game đầy đủ, tối ưu hiệu năng. Chơi ngay không cần chờ đợi. Phù hợp với anh em mới bắt đầu.",
    features: ["✅ Game đầy đủ bản quyền crack", "✅ Tối ưu FPS sẵn", "✅ Hỗ trợ cài đặt 1:1"],
    tag: "PHỔ BIẾN",
    tagColor: "#ce5a67",
    img: "/games/fc26n.jpg",
    price: "149.000₫",
    href: "/games/fc26/payment?edition=normal", // 👈 đổi href
  },
  {
    id: "mods",
    title: "EA FC 26",
    subtitle: "FULL MODS EDITION",
    description: "Tất cả những gì bản thường có, kèm thêm bộ mods đỉnh cao: face mới, kit mới, sân vận động, v.v.",
    features: ["✅ Tất cả từ bản thường", "✅ Face mods cao cấp", "✅ Kit + Stadium mods"],
    tag: "EXCLUSIVE",
    tagColor: "#a855f7",
    img: "/games/fc26-banner.jpg",
    price: "269.000₫",
    href: "/games/fc26/payment?edition=mods", // 👈 đổi href
  },
];

export default function SelectEditionPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-3xl md:text-4xl font-black">
          CHỌN <span className="text-[#ce5a67]">PHIÊN BẢN</span>
        </h1>
        <p className="text-slate-500 text-xs tracking-widest uppercase">Chọn gói phù hợp với bạn</p>
      </div>

      <div className="mb-8">
        <CheckUyTinButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {editions.map(ed => (
          <Link
            key={ed.id}
            href={ed.href}
            className="group relative overflow-hidden rounded-3xl border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] duration-300 bg-[#111]"
          >
            <div className="relative h-48 overflow-hidden">
              <Image src={ed.img} alt={ed.title} fill className="object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent" />
              <span
                className="absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border"
                style={{ color: ed.tagColor, borderColor: `${ed.tagColor}40`, background: `${ed.tagColor}15` }}
              >
                {ed.tag}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-black">{ed.title}</h2>
                <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: ed.tagColor }}>{ed.subtitle}</p>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">{ed.description}</p>
              </div>
              <ul className="space-y-1.5">
                {ed.features.map(f => (
                  <li key={f} className="text-xs text-slate-300">{f}</li>
                ))}
              </ul>

              {/* Giá */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Giá</span>
                <span className="text-xl font-black" style={{ color: ed.tagColor }}>{ed.price}</span>
              </div>

              <div className="w-full py-3.5 rounded-2xl font-black text-xs tracking-widest text-center text-white transition-all" style={{ background: ed.tagColor }}>
                MUA NGAY →
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link href="/" className="mt-10 text-[10px] text-slate-600 hover:text-slate-400 transition-colors tracking-widest uppercase">
        ← Quay lại trang chủ
      </Link>
    </main>
  );
}
