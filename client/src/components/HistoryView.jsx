import { useState, useEffect } from "react";
import { History, Calendar, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { getPracticeHistory } from "../services/api";

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await getPracticeHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
            Log Riwayat Pengerjaan
          </h3>
          <p className="text-xs text-zinc-400 font-medium">
            Semua riwayat sesi latihan yang tersimpan secara real-time di MySQL
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-all shadow-2xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-orange-500" : ""} />
          <span>{loading ? "Menyegarkan..." : "Segarkan Riwayat"}</span>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="rounded-3xl bg-white border border-zinc-200/80 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-4">
            <History size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 text-base mb-1">
            Belum Ada Riwayat Sesi
          </h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Mulailah mengerjakan soal latihan pada menu Latihan Soal untuk mengumpulkan catatan progres belajar Anda.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-zinc-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6">Modul Skill</th>
                  <th className="py-4 px-6">Tipe Sesi</th>
                  <th className="py-4 px-6">Waktu Pengerjaan</th>
                  <th className="py-4 px-6">Durasi</th>
                  <th className="py-4 px-6">Jawaban Benar</th>
                  <th className="py-4 px-6 text-right">Akurasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                        {s.skill}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-zinc-800 capitalize">
                      {s.session_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-4 px-6 text-zinc-500 font-medium">
                      {new Date(s.completed_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6 text-zinc-500 font-medium">
                      {formatDuration(s.duration_seconds || 0)}
                    </td>
                    <td className="py-4 px-6 text-zinc-700 font-semibold">
                      {s.total_correct} / {s.total_answered} Soal
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          s.accuracy_percent >= 70
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-orange-50 text-orange-700 border border-orange-200"
                        }`}
                      >
                        {s.accuracy_percent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
