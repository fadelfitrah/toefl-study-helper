import { 
  Award, Clock, CheckCircle2, TrendingUp, Flame, Play, 
  BookOpen, Headphones, Mic, PenTool, ArrowUpRight, Target, ChevronRight 
} from "lucide-react";

export default function DashboardView({ dashboardData, onStartPractice, onRefresh, onOpenGoalModal }) {
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-zinc-400 font-medium text-sm">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data perkembangan...</span>
        </div>
      </div>
    );
  }

  const { user, streak, today, totalEstimatedScore, skillMetrics, weeklyTrend, recentSessions } = dashboardData;
  const targetMax = user?.target_score_max || 100;
  const scoreProgressPercent = Math.min(100, Math.round((totalEstimatedScore / targetMax) * 100));

  const skillConfig = {
    reading: {
      name: "Reading",
      desc: "Reading Comprehension",
      icon: <BookOpen size={20} className="text-orange-500" />,
      bg: "bg-orange-50",
    },
    listening: {
      name: "Listening",
      desc: "Conversations & Lectures",
      icon: <Headphones size={20} className="text-zinc-700" />,
      bg: "bg-zinc-100",
    },
    speaking: {
      name: "Speaking",
      desc: "Interviews & Integrated",
      icon: <Mic size={20} className="text-zinc-700" />,
      bg: "bg-zinc-100",
    },
    writing: {
      name: "Writing",
      desc: "Emails & Academic Topics",
      icon: <PenTool size={20} className="text-zinc-700" />,
      bg: "bg-zinc-100",
    },
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner - Elegant Minimalist White & Gray with Orange Accents */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-8 sm:p-10 shadow-lg shadow-zinc-900/10 border border-zinc-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold mb-4">
              <Flame size={14} className="text-orange-400" />
              <span>Target Ujian: {user?.target_score_max || 105} Poin</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Halo, {user?.full_name || "TOEFL Fighter"}!
            </h2>
            <p className="mt-2 text-zinc-300 text-sm leading-relaxed">
              Konsistensi harian adalah kunci utama menaklukkan TOEFL iBT. Terus tingkatkan akurasi dan capai target skor impian Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenGoalModal}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition-all text-center"
            >
              Ubah Target
            </button>
            <button
              onClick={() => onStartPractice()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold shadow-lg shadow-orange-500/30 transition-all"
            >
              <Play size={15} fill="currentColor" />
              <span>Mulai Latihan Hari Ini</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Estimasi Skor */}
        <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Estimasi Total
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {totalEstimatedScore}
            </span>
            <span className="text-sm font-semibold text-zinc-400">/ 120 Poin</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs font-medium text-zinc-500 mb-1.5">
              <span>Menuju Target ({targetMax})</span>
              <span className="font-semibold text-orange-600">{scoreProgressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${scoreProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Soal Hari Ini */}
        <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Soal Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {today.questions}
            </span>
            <span className="text-sm font-semibold text-zinc-400">Soal</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            <strong className="text-zinc-800">{today.correct} Benar</strong> dari {today.sessions} sesi latihan
          </p>
        </div>

        {/* Waktu Belajar Hari Ini */}
        <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Waktu Belajar
            </span>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {today.minutes}
            </span>
            <span className="text-sm font-semibold text-zinc-400">/ {today.targetMinutes} Menit</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs font-medium text-zinc-500 mb-1.5">
              <span>Target Harian</span>
              <span className="font-semibold text-zinc-700">
                {Math.min(100, Math.round((today.minutes / today.targetMinutes) * 100))}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-800 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((today.minutes / today.targetMinutes) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Streak Belajar */}
        <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Konsistensi
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Flame size={18} fill="currentColor" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-orange-600 tracking-tight">
              {streak}
            </span>
            <span className="text-sm font-semibold text-zinc-400">Hari Berturut-turut</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Pertahankan latihan setiap hari untuk menjaga streak tetap menyala!
          </p>
        </div>
      </div>

      {/* 4 TOEFL Skills Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
              Perkembangan 4 Modul TOEFL
            </h3>
            <p className="text-xs text-zinc-400 font-medium">
              Standar skor resmi 0 - 30 poin per modul
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {skillMetrics.map((item) => {
            const conf = skillConfig[item.skill] || {
              name: item.skill,
              desc: "TOEFL Section",
              icon: <BookOpen size={20} />,
              bg: "bg-zinc-100",
            };
            const scorePercent = Math.round((item.estimated_score / 30) * 100);

            return (
              <div
                key={item.skill}
                className="group rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${conf.bg} flex items-center justify-center`}>
                        {conf.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 text-base">{conf.name}</h4>
                        <p className="text-[11px] text-zinc-400 font-medium">{conf.desc}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Estimasi Skor</span>
                      <span className="text-base font-extrabold text-zinc-900">
                        {item.estimated_score} <span className="text-xs text-zinc-400">/ 30</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-200 mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                    <span>{item.attempted} Soal Dijawab</span>
                    <span className="font-semibold text-zinc-700">{item.accuracy_percent}% Akurasi</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => onStartPractice(item.skill)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-orange-600 bg-orange-50/70 hover:bg-orange-500 hover:text-white transition-all group/btn"
                  >
                    <span>Latihan {conf.name}</span>
                    <ArrowUpRight size={14} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Weekly Activity & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Trends */}
        <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <h4 className="font-bold text-zinc-900 text-sm">Aktivitas 7 Hari Terakhir</h4>
            </div>
            <span className="text-xs text-zinc-400 font-medium">Konsistensi Belajar</span>
          </div>

          {weeklyTrend.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              Belum ada riwayat aktivitas dalam 7 hari terakhir. Selesaikan latihan pertama Anda!
            </div>
          ) : (
            <div className="space-y-2.5">
              {weeklyTrend.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50/80 border border-zinc-100 text-xs"
                >
                  <span className="font-semibold text-zinc-700">
                    {new Date(t.date_str).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500">{t.questions_count} Soal</span>
                    <span className="font-bold text-zinc-900 bg-white px-2.5 py-1 rounded-md border border-zinc-200/60">
                      {t.minutes_spent} Menit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Practice Sessions */}
        <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <h4 className="font-bold text-zinc-900 text-sm">Sesi Latihan Terkini</h4>
            </div>
            <span className="text-xs text-zinc-400 font-medium">Riwayat Terbaru</span>
          </div>

          {recentSessions.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              Belum ada sesi latihan yang diselesaikan.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold uppercase text-[10px]">
                      {s.skill.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 capitalize">
                        {s.skill} Practice
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {new Date(s.completed_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-zinc-900">
                      {s.accuracy_percent}% Akurasi
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {s.correct_answers}/{s.total_questions} Soal • {s.duration_seconds}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
