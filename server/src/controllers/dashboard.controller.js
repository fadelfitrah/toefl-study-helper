const pool = require("../config/database");

// GET /api/dashboard/overview
exports.getOverview = async (req, res) => {
  try {
    const userId = Number(req.query.userId || 1);

    // 1. Ambil Profil & Target Pengguna
    const [userRows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, 
              g.target_score_min, g.target_score_max, g.target_exam_date, g.daily_study_minutes
       FROM users u
       LEFT JOIN user_goals g ON u.id = g.user_id
       WHERE u.id = ?`,
      [userId]
    );

    const user = userRows.length > 0 ? userRows[0] : null;

    // 2. Statistik Hari Ini
    const [todayRows] = await pool.query(
      `SELECT 
        COUNT(DISTINCT ps.id) AS sessions_today,
        COUNT(r.id) AS questions_today,
        COALESCE(SUM(ps.duration_seconds), 0) AS seconds_today,
        SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END) AS correct_today
       FROM practice_sessions ps
       LEFT JOIN responses r ON ps.id = r.session_id
       WHERE ps.user_id = ? 
         AND ps.status = 'completed'
         AND DATE(ps.completed_at) = CURRENT_DATE`,
      [userId]
    );

    const todayStats = todayRows[0] || {
      sessions_today: 0,
      questions_today: 0,
      seconds_today: 0,
      correct_today: 0,
    };

    // 3. Hitung Daily Streak
    const [dateRows] = await pool.query(
      `SELECT DISTINCT DATE(completed_at) as practice_date
       FROM practice_sessions
       WHERE user_id = ? AND status = 'completed'
       ORDER BY practice_date DESC
       LIMIT 30`,
      [userId]
    );

    let streak = 0;
    if (dateRows.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      const dates = dateRows.map((d) => {
        const dateObj = new Date(d.practice_date);
        return dateObj.toISOString().split("T")[0];
      });

      // Cek apakah ada latihan hari ini atau kemarin
      const latestDate = dates[0];
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (latestDate === todayStr || latestDate === yesterdayStr) {
        streak = 1;
        let checkDate = new Date(latestDate);
        for (let i = 1; i < dates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const expectedStr = checkDate.toISOString().split("T")[0];
          if (dates[i] === expectedStr) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // 4. Performa per Skill (Reading, Listening, Speaking, Writing)
    const [skillRows] = await pool.query(
      `SELECT 
        q.skill,
        COUNT(r.id) AS total_attempted,
        SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END) AS total_correct,
        AVG(CASE WHEN r.score_value IS NOT NULL THEN r.score_value ELSE NULL END) AS avg_score
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       JOIN practice_sessions ps ON r.session_id = ps.id
       WHERE ps.user_id = ?
       GROUP BY q.skill`,
      [userId]
    );

    const defaultSkills = ["reading", "listening", "speaking", "writing"];
    const skillMetrics = defaultSkills.map((skillName) => {
      const found = skillRows.find((s) => s.skill === skillName);
      const attempted = found ? Number(found.total_attempted) : 0;
      const correct = found ? Number(found.total_correct) : 0;
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      // Estimasi skor TOEFL skala 0 - 30
      const estimatedScore = attempted > 0 ? Math.min(30, Math.round((accuracy / 100) * 30)) : 0;

      return {
        skill: skillName,
        attempted,
        correct,
        accuracy_percent: accuracy,
        estimated_score: estimatedScore,
      };
    });

    // 5. Tren Aktivitas 7 Hari Terakhir
    const [trendRows] = await pool.query(
      `SELECT 
        DATE(ps.completed_at) AS date_str,
        COUNT(DISTINCT ps.id) AS sessions_count,
        COUNT(r.id) AS questions_count,
        ROUND(COALESCE(SUM(ps.duration_seconds), 0) / 60) AS minutes_spent
       FROM practice_sessions ps
       LEFT JOIN responses r ON ps.id = r.session_id
       WHERE ps.user_id = ? 
         AND ps.status = 'completed'
         AND ps.completed_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
       GROUP BY DATE(ps.completed_at)
       ORDER BY date_str ASC`,
      [userId]
    );

    // 6. Sesi Terakhir (Recent 5 Sessions)
    const [recentRows] = await pool.query(
      `SELECT 
        ps.id,
        ps.skill,
        ps.session_type,
        ps.duration_seconds,
        ps.completed_at,
        COUNT(r.id) AS total_questions,
        SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers
       FROM practice_sessions ps
       LEFT JOIN responses r ON ps.id = r.session_id
       WHERE ps.user_id = ? AND ps.status = 'completed'
       GROUP BY ps.id
       ORDER BY ps.completed_at DESC
       LIMIT 5`,
      [userId]
    );

    const recentSessions = recentRows.map((s) => ({
      ...s,
      accuracy_percent:
        Number(s.total_questions) > 0
          ? Math.round((Number(s.correct_answers) / Number(s.total_questions)) * 100)
          : 0,
    }));

    // 7. Estimasi Total Skor TOEFL Saat Ini (Jumlah 4 Skill)
    const totalEstimatedScore = skillMetrics.reduce((acc, curr) => acc + curr.estimated_score, 0);

    res.status(200).json({
      success: true,
      data: {
        user,
        streak,
        today: {
          sessions: Number(todayStats.sessions_today || 0),
          questions: Number(todayStats.questions_today || 0),
          minutes: Math.round(Number(todayStats.seconds_today || 0) / 60),
          correct: Number(todayStats.correct_today || 0),
          targetMinutes: user ? user.daily_study_minutes : 60,
        },
        totalEstimatedScore,
        skillMetrics,
        weeklyTrend: trendRows,
        recentSessions,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memuat data dashboard",
      error: error.message,
    });
  }
};

// PUT /api/dashboard/goals
exports.updateGoals = async (req, res) => {
  try {
    const userId = Number(req.body.userId || 1);
    const { targetScoreMin = 80, targetScoreMax = 105, targetExamDate, dailyStudyMinutes = 60 } = req.body;

    await pool.query(
      `INSERT INTO user_goals (user_id, target_score_min, target_score_max, target_exam_date, daily_study_minutes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         target_score_min = VALUES(target_score_min),
         target_score_max = VALUES(target_score_max),
         target_exam_date = VALUES(target_exam_date),
         daily_study_minutes = VALUES(daily_study_minutes)`,
      [userId, targetScoreMin, targetScoreMax, targetExamDate || null, dailyStudyMinutes]
    );

    res.status(200).json({
      success: true,
      message: "Target belajar berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error updating goals:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui target belajar",
      error: error.message,
    });
  }
};
