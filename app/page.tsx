"use client";
import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
    const [passcode, setPasscode] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);

    const ADMIN_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || "fc26vip";

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passcode === ADMIN_CODE) {
            setIsAuthorized(true);
        } else {
            alert("Mã truy cập không chính xác!");
        }
    };

    const handleDownload = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/download');
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (error) {
            alert("Lỗi kết nối máy chủ R2!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#111111] text-white p-4 font-sans">

            {!isAuthorized ? (
                /* --- LOGIN --- */
                <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col items-center gap-6">
                    {/* Logo */}
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#ce5a67]/40">
                        <Image src="/logo.png" alt="Dung Gaming" width={128} height={128} className="object-cover w-full h-full" />
                    </div>

                    {/* Title */}
                    <div className="text-center">
                        <h1 className="text-2xl font-black tracking-widest text-white">DUNGDIBINHLUAN</h1>
                        <p className="text-xs text-slate-500 tracking-[0.3em] uppercase mt-1">ALL IN ONE GAME SET UP</p>
                    </div>

                    {/* Input */}
                    <input
                        type="password"
                        placeholder="• • • • • • • •"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#ce5a67] transition-all text-center tracking-[1em] text-lg"
                    />

                    {/* Button */}
                    <button type="submit" className="w-full bg-[#ce5a67] text-white font-black py-4 rounded-2xl hover:bg-[#b44c5c] transition-all text-lg tracking-widest">
                        XÁC THỰC
                    </button>
                </form>

            ) : (
                /* --- DASHBOARD --- */
                <div className="w-full max-w-xl bg-[#1a1a1a] rounded-3xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-4 p-6 border-b border-white/5">
                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                            <Image src="/logo.png" alt="Dung Gaming" width={56} height={56} className="object-cover w-full h-full" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black italic tracking-tight">DUNGDIBINHLUAN</h1>
                            <p className="text-[10px] text-[#ce5a67] tracking-[0.3em] uppercase">ALL IN ONE GAME SET UP</p>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Title + Badge */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tight">DUNGDIBINHLUAN</h2>
                                <p className="text-[10px] text-[#ce5a67] tracking-[0.3em] uppercase mt-1">ALL IN ONE GAME SET UP</p>
                            </div>
                            <div className="flex items-center gap-2 border border-[#ce5a67]/30 rounded-full px-3 py-1.5 mt-1">
                                <span className="w-2 h-2 bg-[#ce5a67] rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-bold text-[#ce5a67] tracking-widest">SYSTEM ONLINE</span>
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-5 bg-[#111] rounded-2xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Dung lượng file</p>
                                <p className="text-2xl font-black">50<span className="text-sm text-[#ce5a67] ml-1">GB</span></p>
                            </div>
                            <div className="p-5 bg-[#111] rounded-2xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Định dạng</p>
                                <p className="text-xl font-black text-[#ce5a67]">WINRAR</p>
                            </div>
                        </div>

                        {/* Download Button */}
                        <button
                            onClick={handleDownload}
                            disabled={loading}
                            className="w-full py-5 bg-[#ce5a67] rounded-2xl font-black text-xl text-white tracking-widest hover:bg-[#b44c5c] transition-all active:scale-[0.98]"
                        >
                            {loading ? "ĐANG KHỞI TẠO..." : "BẮT ĐẦU TẢI XUỐNG"}
                        </button>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between text-[9px] text-slate-600 uppercase tracking-widest">
                            <span>Powered by Google</span>
                            <span>© 2026 DUNGDIBINHLUAN</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
