// app/page.tsx
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 flex flex-col justify-between font-sans Vietnamese">
      {/* Container Chính */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-slate-900 rounded-3xl p-10 shadow-2xl w-full max-w-7xl relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-16 relative z-10">
            <div className="flex items-center gap-6">
              {/* Logo Pixel-Art (Đã xóa nền, T thay file logo.svg của mình vào đây) */}
              <div className="w-24 h-24 rounded-full bg-slate-800 p-2 flex items-center justify-center">
                <Image src="/logo.svg" alt="Dung Gaming Logo" width={80} height={80} className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-slate-100 text-6xl font-bold">DUNGDIBINHLUAN</h1>
                <p className="text-slate-300 text-3xl Vietnamese-serif-sub font-light">ALL IN ONE GAME SET UP</p>
              </div>
            </div>
            
            {/* System Online Status */}
            <div className="flex items-center gap-3 bg-slate-800 rounded-full px-6 py-3 border border-slate-700">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-600"></span>
              </span>
              <span className="text-slate-300 text-xl font-medium tracking-widest Vietnamese uppercase">SYSTEM ONLINE</span>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-16 relative z-10">
            {/* Cụm Data Boxes */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <p className="text-slate-400 text-lg Vietnamese-sub Vietnamese uppercase">DUNG LƯỢNG FILE</p>
                <p className="text-slate-100 text-9xl font-bold Vietnamese-serif GB-text-extra Vietnamese">GB</p>
              </div>
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <p className="text-slate-400 text-lg Vietnamese-sub Vietnamese uppercase">ĐỊNH DẠNG</p>
                <p className="text-slate-100 text-9xl font-bold Vietnamese-serif Vietnamese">WINRAR</p>
              </div>
            </div>

            {/* Nút BẮT ĐẦU TẢI XUỐNG */}
            <button className="w-full text-center bg-pink-600 hover:bg-pink-700 text-white text-5xl font-bold py-12 rounded-3xl transition duration-300 shadow-lg shadow-pink-900/50 Vietnamese uppercase">
              BẮT ĐẦU TẢI XUỐNG
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between text-slate-500 text-xl mt-12 Vietnamese uppercase">
        <div>POWERED BY GOOGLE</div>
        <div>© 2026 DUNGDIBINHLUAN</div>
      </footer>
    </main>
  )
}