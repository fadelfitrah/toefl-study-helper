const pool = require("../config/database");

function safeJsonParse(data) {
  if (!data) return null;
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function normalizeOptions(options) {
  const parsed = safeJsonParse(options);
  if (!Array.isArray(parsed)) return parsed;
  return parsed.map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    if (typeof opt === "string") {
      return { id: letter, text: opt };
    }
    if (typeof opt === "object" && opt !== null) {
      return {
        id: opt.id || letter,
        text: opt.text || opt.label || "",
      };
    }
    return { id: letter, text: String(opt) };
  });
}

// GET /api/questions
exports.getQuestions = async (req, res) => {
  try {
    const { skill, difficulty, limit = 20, offset = 0 } = req.query;

    let query = "SELECT id, skill, question_type, difficulty, prompt, content, options, created_at FROM questions WHERE is_active = 1";
    const params = [];

    if (skill) {
      query += " AND skill = ?";
      params.push(skill);
    }

    if (difficulty) {
      query += " AND difficulty = ?";
      params.push(difficulty);
    }

    query += " ORDER BY id ASC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);

    const questions = rows.map((q) => ({
      ...q,
      content: safeJsonParse(q.content),
      options: normalizeOptions(q.options),
    }));

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar soal",
      error: error.message,
    });
  }
};

// GET /api/questions/:id
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, skill, question_type, difficulty, prompt, content, options, explanation FROM questions WHERE id = ? AND is_active = 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan",
      });
    }

    const q = rows[0];
    res.status(200).json({
      success: true,
      data: {
        ...q,
        content: safeJsonParse(q.content),
        options: normalizeOptions(q.options),
      },
    });
  } catch (error) {
    console.error("Error fetching question by id:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail soal",
      error: error.message,
    });
  }
};

// GET /api/questions/skills-summary
exports.getSkillsSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        skill,
        COUNT(*) as total_questions,
        COUNT(DISTINCT question_type) as total_types
      FROM questions
      WHERE is_active = 1
      GROUP BY skill
    `);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching skills summary:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil ringkasan soal",
      error: error.message,
    });
  }
};
