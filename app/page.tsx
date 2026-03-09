"use client";
import { useState } from 'react';

export default function Home() {
    const [passcode, setPasscode] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);

    // Lấy mã từ biến môi trường (nhớ thêm NEXT_PUBLIC_ ở .env.local)
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0a0c] text-white p-4 font-sans">
            {/* Hiệu ứng ánh sáng Hồng thương hiệu */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[#ce5a67]/10 blur-[150px] rounded-full pointer-events-none"></div>

            {!isAuthorized ? (
                /* --- CỔNG ĐĂNG NHẬP DOANH NGHIỆP --- */
                <form onSubmit={handleLogin} className="relative z-10 w-full max-w-sm p-10 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-[#ce5a67]/20 shadow-[0_0_50px_rgba(206,90,103,0.1)]">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[#ce5a67] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(206,90,103,0.4)]">
                            <span className="text-3xl font-black text-black">T</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-widest uppercase text-[#ce5a67]">DUNGDIBINHLUAN</h2>
                        <p className="text-xs text-slate-500 mt-2">SECURE ACCESS PORTAL</p>
                    </div>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 mb-6 focus:outline-none focus:border-[#ce5a67] transition-all text-center tracking-[1em] text-lg"
                    />
                    <button type="submit" className="w-full bg-[#ce5a67] text-black font-black py-4 rounded-xl hover:bg-[#b44c5c] transition-all shadow-lg shadow-[#ce5a67]/20">
                        XÁC THỰC
                    </button>
                </form>
            ) : (
                /* --- BẢNG ĐIỀU KHIỂN TẢI FILE (VIBE HỒNG) --- */
                <div className="relative z-10 w-full max-w-2xl p-1 bg-gradient-to-b from-[#ce5a67]/30 to-transparent rounded-[3rem]">
                    <div className="bg-[#0f0a0c] backdrop-blur-3xl rounded-[2.9rem] p-12 text-center">
                        <div className="flex justify-between items-center mb-12">
                            <div className="text-left">
                                <h1 className="text-4xl font-black italic tracking-tighter text-white">DUNGDIBINHLUAN <span className="text-[#ce5a67]"></span></h1>
                                <p className="text-[10px] text-slate-500 tracking-[0.4em] uppercase mt-1">Enterprise Asset Distribution</p>
                            </div>
                            <div className="px-4 py-1.5 border border-[#ce5a67]/30 rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#ce5a67] rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-bold text-[#ce5a67] tracking-widest">SYSTEM ONLINE</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-12">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase mb-2">Dung lượng file</p>
                                <p className="text-2xl font-black">60.0 <span className="text-sm text-[#ce5a67]">GB</span></p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase mb-2">Định dạng</p>
                                <p className="text-2xl font-black">WIN<span className="text-sm text-[#ce5a67]">RAR</span></p>
                            </div>
                        </div>

                        <button 
                            onClick={handleDownload}
                            disabled={loading}
                            className="group relative w-full py-6 bg-[#ce5a67] rounded-2xl font-black text-2xl text-black overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.98] shadow-[0_20px_40px_rgba(206,90,103,0.2)]"
                        >
                            <span className="relative z-10">{loading ? "ĐANG KHỞI TẠO..." : "BẮT ĐẦU TẢI XUỐNG"}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>

                        <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-600 uppercase tracking-widest">
                            <span>Powered by Cloudflare R2</span>
                            <span>© 2026 DUNGDIBINHLUAN</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}