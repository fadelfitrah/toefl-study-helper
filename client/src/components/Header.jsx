import { Menu, Play, RefreshCw, Calendar } from "lucide-react";

export default function Header({
  activeTab,
  onOpenMobileSidebar,
  onStartPractice,
  onRefresh,
  user,
}) {
  const titles = {
    dashboard: {
      title: "Dashboard Perkembangan",
      subtitle: "Pantau performa dan target skor TOEFL iBT harian Anda",
    },
    practice: {
      title: "Ruang Latihan Interaktif",
      subtitle: "Pilih modul skill dan asah kemampuan menjawab soal",
    },
    materials: {
      title: "Materi Belajar TOEFL iBT",
      subtitle: "Pelajari strategi, teks, dan latihan audio untuk empat skill",
    },
    history: {
      title: "Riwayat Sesi Latihan",
      subtitle: "Evaluasi catatan latihan yang tersimpan di database",
    },
  };

  const current = titles[activeTab] || titles.dashboard;
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight leading-tight">
            {current.title}
          </h1>
          <p className="text-xs text-zinc-400 font-medium hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-100/80 px-3 py-1.5 rounded-lg border border-zinc-200/50">
          <Calendar size={14} className="text-zinc-400" />
          <span>{todayFormatted}</span>
        </div>

        <button
          onClick={onRefresh}
          title="Segarkan data"
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors border border-zinc-200/60"
        >
          <RefreshCw size={17} />
        </button>

        {activeTab !== "practice" && (
          <button
            onClick={() => onStartPractice()}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-medium text-xs shadow-sm shadow-orange-500/25 transition-all"
          >
            <Play size={14} fill="currentColor" />
            <span>Mulai Latihan</span>
          </button>
        )}
      </div>
    </header>
  );
}
