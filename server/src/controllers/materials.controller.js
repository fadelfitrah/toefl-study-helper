const pool = require("../config/database");

const validSkills = new Set(["reading", "listening", "speaking", "writing"]);

function mapMaterial(row) {
  return {
    ...row,
    estimated_minutes: Number(row.estimated_minutes),
  };
}

// GET /api/materials
exports.getMaterials = async (req, res) => {
  try {
    const { skill } = req.query;
    if (skill && !validSkills.has(skill)) {
      return res.status(400).json({
        success: false,
        message: "Skill harus reading, listening, speaking, atau writing",
      });
    }

    const params = [];
    let query = `SELECT id, slug, title, description, skill, difficulty,
                        estimated_minutes, image_url, source_name,
                        (image_data IS NOT NULL) AS has_image,
                        (audio_data IS NOT NULL) AS has_audio
                 FROM learning_materials
                 WHERE is_active = 1`;
    if (skill) {
      query += " AND skill = ?";
      params.push(skill);
    }
    query += " ORDER BY FIELD(skill, 'reading', 'listening', 'speaking', 'writing'), id";

    const [rows] = await pool.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapMaterial),
    });
  } catch (error) {
    console.error("Error fetching learning materials:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil materi belajar",
    });
  }
};

// GET /api/materials/:id
exports.getMaterialById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, slug, title, description, skill, difficulty, estimated_minutes,
              body, image_url, audio_url, audio_transcript, source_name, source_url,
              (image_data IS NOT NULL) AS has_image,
              (audio_data IS NOT NULL) AS has_audio
       FROM learning_materials
       WHERE id = ? AND is_active = 1`,
      [req.params.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Materi tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: mapMaterial(rows[0]),
    });
  } catch (error) {
    console.error("Error fetching learning material:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail materi",
    });
  }
};

async function sendMedia(req, res, dataColumn, mimeColumn, allowedTypes) {
  try {
    const [rows] = await pool.query(
      `SELECT ${dataColumn} AS media, ${mimeColumn} AS mime_type
       FROM learning_materials
       WHERE id = ? AND is_active = 1`,
      [req.params.id],
    );

    if (rows.length === 0 || !rows[0].media) {
      return res.status(404).json({
        success: false,
        message: "Berkas media tidak ditemukan",
      });
    }

    if (!allowedTypes.has(rows[0].mime_type)) {
      return res.status(415).json({
        success: false,
        message: "Tipe berkas media tidak didukung",
      });
    }

    res.set({
      "Content-Type": rows[0].mime_type,
      "Content-Length": rows[0].media.length,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    return res.status(200).send(rows[0].media);
  } catch (error) {
    console.error("Error fetching learning material media:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil berkas media",
    });
  }
}

exports.getMaterialImage = (req, res) =>
  sendMedia(req, res, "image_data", "image_mime_type", new Set(["image/jpeg", "image/png", "image/webp"]));

exports.getMaterialAudio = (req, res) =>
  sendMedia(req, res, "audio_data", "audio_mime_type", new Set(["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"]));
