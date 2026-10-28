import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import PracticeView from "./components/PracticeView";
import HistoryView from "./components/HistoryView";
import MaterialsView from "./components/MaterialsView";
import GoalModal from "./components/GoalModal";
import { 
  checkApiHealth, 
  checkDatabaseHealth, 
  getDashboardOverview, 
  updateGoals 
} from "./services/api";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [practiceSkill, setPracticeSkill] = useState("");
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ api: false, db: false });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  async function initApp() {
    setLoading(true);
    setError("");

    try {
      const [apiRes, dbRes] = await Promise.allSettled([
        checkApiHealth(),
        checkDatabaseHealth(),
      ]);

      const isApiOk = apiRes.status === "fulfilled" && apiRes.value.success;
      const isDbOk = dbRes.status === "fulfilled" && dbRes.value.database === "connected";

      setSystemStatus({ api: isApiOk, db: isDbOk });

      if (isApiOk && isDbOk) {
        const overviewRes = await getDashboardOverview();
        if (overviewRes.success) {
          setDashboardData(overviewRes.data);
        }
      } else {
        setError("Koneksi ke backend Express atau MySQL XAMPP belum terhubung.");
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setError(err.message || "Gagal menghubungi server lokal.");
    } finally {
      setLoading(false);
    }
  }

  async function reloadDashboard() {
    try {
      const overviewRes = await getDashboardOverview();
      if (overviewRes.success) {
        setDashboardData(overviewRes.data);
      }
    } catch (err) {
      console.error("Error refreshing dashboard:", err);
    }
  }

  function handleStartPractice(skill = "") {
    setPracticeSkill(skill);
    setActiveTab("practice");
  }

  async function handleSaveGoal(goalData) {
    await updateGoals({ userId: 1, ...goalData });
    await reloadDashboard();
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-orange-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={dashboardData?.streak || 0}
        onOpenGoalModal={() => setGoalModalOpen(true)}
        systemStatus={systemStatus}
        user={dashboardData?.user}
        totalEstimatedScore={dashboardData?.totalEstimatedScore || 0}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen transition-all">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onStartPractice={handleStartPractice}
          onRefresh={reloadDashboard}
          user={dashboardData?.user}
        />

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
              <div>
                <strong className="font-bold">Status Server:</strong> {error}
              </div>
              <button
                onClick={initApp}
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-100 transition-colors"
              >
                Coba Ulang
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Memuat data TOEFL Path...</p>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardView
                  dashboardData={dashboardData}
                  onStartPractice={handleStartPractice}
                  onRefresh={reloadDashboard}
                  onOpenGoalModal={() => setGoalModalOpen(true)}
                />
              )}

              {activeTab === "practice" && (
                <PracticeView
                  initialSkill={practiceSkill}
                  onCompletePractice={reloadDashboard}
                />
              )}

              {activeTab === "history" && <HistoryView />}
              {activeTab === "materials" && <MaterialsView />}
            </>
          )}
        </main>
      </div>

      {/* Goal Configuration Modal */}
      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        currentGoal={dashboardData?.user}
        onSave={handleSaveGoal}
      />
    </div>
  );
}

export default App;
