import { useState, useEffect } from "react";
import { X, Target, Save } from "lucide-react";

export default function GoalModal({ isOpen, onClose, currentGoal, onSave }) {
  const [targetMin, setTargetMin] = useState(85);
  const [targetMax, setTargetMax] = useState(105);
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentGoal) {
      setTargetMin(currentGoal.target_score_min || 85);
      setTargetMax(currentGoal.target_score_max || 105);
      setDailyMinutes(currentGoal.daily_study_minutes || 60);
      if (currentGoal.target_exam_date) {
        setExamDate(currentGoal.target_exam_date.split("T")[0]);
      }
    }
  }, [currentGoal]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        targetScoreMin: Number(targetMin),
        targetScoreMax: Number(targetMax),
        dailyStudyMinutes: Number(dailyMinutes),
        targetExamDate: examDate || null,
      });
      onClose();
    } catch (err) {
      alert("Gagal menyimpan target: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-zinc-200/80 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Target Skor TOEFL iBT
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                Sesuaikan target skor & waktu belajar harian
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Target Min (0-120)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={targetMin}
                onChange={(e) => setTargetMin(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-xs font-semibold text-zinc-900 bg-zinc-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Target Max (0-120)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={targetMax}
                onChange={(e) => setTargetMax(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-xs font-semibold text-zinc-900 bg-zinc-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Target Waktu Belajar Harian (Menit)
            </label>
            <input
              type="number"
              min="15"
              max="480"
              step="5"
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-xs font-semibold text-zinc-900 bg-zinc-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Rencana Tanggal Tes (Opsional)
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-xs font-semibold text-zinc-900 bg-zinc-50/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold shadow-sm shadow-orange-500/20 transition-all"
            >
              <Save size={15} />
              <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
