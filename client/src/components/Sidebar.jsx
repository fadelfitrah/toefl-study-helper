import {
  BarChart3,
  BookOpen,
  Edit3,
  History,
  Settings,
  Flame,
  CheckCircle2,
  XCircle,
  Award,
  Menu,
  X,
  Target,
  LibraryBig,
} from "lucide-react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  streak = 0,
  onOpenGoalModal,
  systemStatus,
  user,
  totalEstimatedScore = 0,
  mobileOpen,
  setMobileOpen,
}) {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <BarChart3 size={20} />,
      desc: "Ringkasan & Metriks",
    },
    {
      id: "practice",
      label: "Latihan Soal",
      icon: <Edit3 size={20} />,
      desc: "Reading, Listening, dll",
    },
    {
      id: "materials",
      label: "Materi Belajar",
      icon: <LibraryBig size={20} />,
      desc: "Pelajari empat skill TOEFL",
    },
    {
      id: "history",
      label: "Riwayat Sesi",
      icon: <History size={20} />,
      desc: "Log evaluasi & skor",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#224248] border-r border-zinc-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-[#224248] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <BookOpen size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-lg text-orange-500 tracking-tight flex items-center gap-1.5">
                  TOEFL Path
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                    iBT
                  </span>
                </span>
                <p className="text-xs text-orange-100 font-medium">
                  Daily Preparation
                </p>
              </div>
            </div>

            <button
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Streak Card */}
          <div className="p-4 mx-4 mt-5 rounded-2xl bg-gradient-to-b from-orange-200 to-white border border-orange-100/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm">
                  <Flame size={18} fill="currentColor" />
                </div>
                <div>
                  <div className="text-xs text-[#224248] font-medium">
                    Streak Belajar
                  </div>
                  <div className="text-base font-bold text-zinc-900">
                    {streak} Hari Aktif
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                Konsisten 🔥
              </span>
            </div>
          </div>

          {/* Nav List */}
          <div className="px-3 py-6">
            <div className="text-[11px] font-semibold text-orange-500 uppercase tracking-wider px-3 mb-2">
              Menu Utama
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-orange-500 text-white font-semibold shadow-sm"
                        : "text-orange-500 hover:bg-orange-100 hover:text-[#224248] font-medium"
                    }`}
                  >
                    <span
                      className={`transition-colors ${
                        isActive
                          ? "text-white group-hover:text-white"
                          : "text-zinc-400 group-hover:text-zinc-600"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm leading-tight">{item.label}</div>
                      <div
                        className={`text-[10px] leading-tight mt-1 ${
                          isActive ? "text-white" : "text-zinc-400"
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-6 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mt-6 mb-2">
              Preferensi
            </div>
            <button
              onClick={() => {
                onOpenGoalModal();
                setMobileOpen(false);
              }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium transition-all group"
            >
              <span className="text-zinc-400 group-hover:text-zinc-600">
                <Target size={20} />
              </span>
              <div className="flex-1">
                <div className="text-sm leading-tight">Target Skor</div>
                <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                  Goal: {user?.target_score_max || 105} Poin
                </div>
              </div>
              <Settings size={16} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Sidebar Footer / User Profile & Database Status */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          {/* Status Koneksi */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-3 rounded-lg bg-white border border-zinc-200/60 text-xs">
            <span className="text-zinc-500 font-medium">MySQL & Backend</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemStatus.api && systemStatus.db
                    ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                    : "bg-rose-500"
                }`}
              />
              <span
                className={
                  systemStatus.api && systemStatus.db
                    ? "text-emerald-600"
                    : "text-rose-600"
                }
              >
                {systemStatus.api && systemStatus.db ? "Terhubung" : "Offline"}
              </span>
            </div>
          </div>

          {/* User Mini Card */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-sm">
              {(user?.full_name || "TL").substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-zinc-900 truncate">
                {user?.full_name || "TOEFL Learner"}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                Estimasi: {totalEstimatedScore} / 120
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
