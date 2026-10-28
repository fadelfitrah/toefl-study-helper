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

function levenshteinDistance(s1, s2) {
  const a = (s1 || "").toLowerCase();
  const b = (s2 || "").toLowerCase();
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function wordSimilarity(w1, w2) {
  if (!w1 || !w2) return 0;
  const a = w1.toLowerCase();
  const b = w2.toLowerCase();
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, 1 - levenshteinDistance(a, b) / maxLen);
}

function evaluateSpeakingRepeat(targetSentence, spokenText) {
  if (!targetSentence) return null;
  const cleanTargetWords = targetSentence
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const cleanSpokenWords = (spokenText || "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (cleanSpokenWords.length === 0) {
    return {
      pronunciation: {
        score: 0,
        grade: "E (No Speech Detected)",
        feedback: "Tidak ada suara atau ucapan yang terdeteksi. Silakan aktifkan mikrofon dan ulangi kalimat.",
        wordBreakdown: cleanTargetWords.map((w) => ({ word: w, status: "omitted" })),
        mispronouncedWords: [],
        omittedWords: cleanTargetWords,
      },
      grammar: {
        score: 0,
        grade: "E (Incomplete)",
        feedback: "Belum ada susunan kalimat yang diucapkan.",
        observations: ["Kalimat target belum diulang."],
      },
      overallScore: 0,
      toeflScoreEstimated: 0,
      targetTranscript: targetSentence,
      userTranscript: "",
    };
  }

  // 1. Evaluasi Pengucapan (Pronunciation Grade & Word Alignment)
  const wordBreakdown = [];
  let pronunciationPoints = 0;
  const usedSpokenIndices = new Set();
  const mispronouncedWords = [];
  const omittedWords = [];

  for (let i = 0; i < cleanTargetWords.length; i++) {
    const targetWord = cleanTargetWords[i];
    const targetLower = targetWord.toLowerCase();

    let bestMatchIndex = -1;
    let highestSim = 0;

    const searchStart = Math.max(0, i - 3);
    const searchEnd = Math.min(cleanSpokenWords.length, i + 4);

    for (let j = searchStart; j < searchEnd; j++) {
      if (usedSpokenIndices.has(j)) continue;
      const sim = wordSimilarity(targetLower, cleanSpokenWords[j]);
      if (sim > highestSim) {
        highestSim = sim;
        bestMatchIndex = j;
      }
    }

    if (highestSim >= 0.85) {
      usedSpokenIndices.add(bestMatchIndex);
      pronunciationPoints += 1.0;
      wordBreakdown.push({
        word: targetWord,
        status: "correct",
        spoken: cleanSpokenWords[bestMatchIndex],
        similarity: Math.round(highestSim * 100),
      });
    } else if (highestSim >= 0.60) {
      usedSpokenIndices.add(bestMatchIndex);
      pronunciationPoints += 0.65;
      mispronouncedWords.push({
        target: targetWord,
        spoken: cleanSpokenWords[bestMatchIndex],
      });
      wordBreakdown.push({
        word: targetWord,
        status: "imprecise",
        spoken: cleanSpokenWords[bestMatchIndex],
        similarity: Math.round(highestSim * 100),
      });
    } else {
      omittedWords.push(targetWord);
      wordBreakdown.push({
        word: targetWord,
        status: "omitted",
        spoken: null,
        similarity: 0,
      });
    }
  }

  const rawPronScore = (pronunciationPoints / cleanTargetWords.length) * 100;
  const lengthPenalty = Math.min(20, Math.abs(cleanTargetWords.length - cleanSpokenWords.length) * 3);
  const pronunciationScore = Math.max(10, Math.min(100, Math.round(rawPronScore - lengthPenalty * 0.3)));

  let pronGrade = "A (Excellent Pronunciation)";
  let pronFeedback = "Artikulasi pengucapan kata sangat jelas, intonasi natural, dan suku kata terdengar tegas.";
  if (pronunciationScore >= 88) {
    pronGrade = "A (Excellent Pronunciation)";
    pronFeedback = "Artikulasi kata sangat jelas, ritme natural, dan setiap bunyi fonem diucapkan dengan tepat.";
  } else if (pronunciationScore >= 75) {
    pronGrade = "B (Good Clarity)";
    pronFeedback = "Pengucapan sebagian besar kata sudah baik dan mudah dipahami, dengan variasi fonem minor.";
  } else if (pronunciationScore >= 60) {
    pronGrade = "C (Fair - Minor Slips)";
    pronFeedback = "Sebagian kata berhasil ditangkap, namun beberapa artikulasi kata kunci masih kurang jelas atau terpotong.";
  } else {
    pronGrade = "D (Needs Improvement)";
    pronFeedback = "Perlu latihan artikulasi lebih lanjut pada konsonan dan vokal agar kata terdengar lebih tegas.";
  }

  if (mispronouncedWords.length > 0) {
    pronFeedback += ` Perhatikan bunyi kata: "${mispronouncedWords.map((m) => m.target).slice(0, 3).join('", "')}".`;
  }
  if (omittedWords.length > 0) {
    pronFeedback += ` Kata yang terlewat: "${omittedWords.slice(0, 3).join('", "')}".`;
  }

  // 2. Evaluasi Tata Bahasa (Grammar Grade & Syntactic Integrity)
  const targetLowerWords = cleanTargetWords.map((w) => w.toLowerCase());
  const spokenLowerWords = cleanSpokenWords.map((w) => w.toLowerCase());

  // A. Longest Common Subsequence (LCS) untuk mengecek urutan sintaksis kata
  const lcsMatrix = Array(targetLowerWords.length + 1)
    .fill(null)
    .map(() => Array(spokenLowerWords.length + 1).fill(0));
  for (let i = 1; i <= targetLowerWords.length; i++) {
    for (let j = 1; j <= spokenLowerWords.length; j++) {
      if (targetLowerWords[i - 1] === spokenLowerWords[j - 1]) {
        lcsMatrix[i][j] = lcsMatrix[i - 1][j - 1] + 1;
      } else {
        lcsMatrix[i][j] = Math.max(lcsMatrix[i - 1][j], lcsMatrix[i][j - 1]);
      }
    }
  }
  const lcsLength = lcsMatrix[targetLowerWords.length][spokenLowerWords.length];
  const orderScore = (lcsLength / targetLowerWords.length) * 100;

  // B. Pengecekan Kata Fungsional Gramatikal (Articles, Prepositions, Auxiliaries)
  const functionWords = new Set([
    "the", "a", "an", "at", "in", "on", "for", "of", "to", "with", "by", "is", "are", "will", "and", "that", "its", "their", "all"
  ]);
  const targetFunctionWords = targetLowerWords.filter((w) => functionWords.has(w));
  let matchedFunctionWords = 0;
  for (const fw of targetFunctionWords) {
    if (spokenLowerWords.includes(fw)) matchedFunctionWords++;
  }
  const functionWordScore = targetFunctionWords.length > 0 ? (matchedFunctionWords / targetFunctionWords.length) * 100 : 100;

  // C. Kelengkapan Kalimat (Sentence Completeness)
  const completenessScore = Math.min(100, (cleanSpokenWords.length / cleanTargetWords.length) * 100);

  const grammarScore = Math.max(
    10,
    Math.min(
      100,
      Math.round(orderScore * 0.50 + functionWordScore * 0.35 + completenessScore * 0.15)
    )
  );

  let gramGrade = "A (Flawless Structure)";
  let gramFeedback = "Struktur kalimat gramatikal utuh, urutan kata dan partikel kalimat tertata dengan sangat baik.";
  const grammarObservations = [];

  if (grammarScore >= 88) {
    gramGrade = "A (Flawless Structure)";
    gramFeedback = "Struktur kalimat gramatikal utuh. Urutan Subjek-Predikat-Objek dan kata hubung/preposisi sangat tepat.";
    grammarObservations.push("Sintaksis dan urutan kata (word order) 100% konsisten dengan kalimat model.");
    grammarObservations.push("Penggunaan kata bantu (auxiliary/preposition) lengkap tanpa reduksi.");
  } else if (grammarScore >= 75) {
    gramGrade = "B (Solid Grammar)";
    gramFeedback = "Struktur gramatikal kalimat baik. Hanya terdapat sedikit ketidaksesuaian kecil pada artikel atau partikel penghubung.";
    grammarObservations.push("Urutan kata utama terjaga dengan baik.");
    grammarObservations.push("Perhatikan kelengkapan kata depan (preposition) atau determiner.");
  } else if (grammarScore >= 60) {
    gramGrade = "C (Acceptable Syntax)";
    gramFeedback = "Kalimat memiliki esensi makna yang tepat, namun terjadi pergeseran urutan kata atau penghilangan kata gramatikal penting.";
    grammarObservations.push("Beberapa susunan frase mengalami pergeseran atau terlewat.");
  } else {
    gramGrade = "D (Fragmented Syntax)";
    gramFeedback = "Struktur kalimat belum utuh atau urutan kata tidak sesuai dengan susunan baku bahasa Inggris.";
    grammarObservations.push("Banyak elemen tata bahasa yang belum terangkai dengan lengkap.");
  }

  const overallScore = Math.round(pronunciationScore * 0.5 + grammarScore * 0.5);
  const toeflScoreEstimated = Math.round((overallScore / 100) * 30);

  return {
    pronunciation: {
      score: pronunciationScore,
      grade: pronGrade,
      feedback: pronFeedback,
      wordBreakdown,
      mispronouncedWords,
      omittedWords,
    },
    grammar: {
      score: grammarScore,
      grade: gramGrade,
      feedback: gramFeedback,
      observations: grammarObservations,
    },
    overallScore,
    toeflScoreEstimated,
    targetTranscript: targetSentence,
    userTranscript: spokenText,
  };
}

// POST /api/practice/start
exports.startSession = async (req, res) => {
  try {
    const { userId = 1, skill = "reading", sessionType = "practice" } = req.body;

    const [result] = await pool.query(
      `INSERT INTO practice_sessions (user_id, skill, session_type, status, started_at) 
       VALUES (?, ?, ?, 'in_progress', NOW())`,
      [userId, skill, sessionType]
    );

    res.status(201).json({
      success: true,
      message: "Sesi latihan berhasil dimulai",
      data: {
        sessionId: result.insertId,
        skill,
        sessionType,
      },
    });
  } catch (error) {
    console.error("Error starting practice session:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memulai sesi latihan",
      error: error.message,
    });
  }
};

// POST /api/practice/submit
exports.submitSession = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      sessionId,
      userId = 1,
      skill = "reading",
      sessionType = "practice",
      durationSeconds = 0,
      answers = [], // [{ questionId, answer, timeSpentSeconds }]
    } = req.body;

    await connection.beginTransaction();

    let targetSessionId = sessionId;

    // Jika sessionId belum ada, buat sesi baru secara otomatis
    if (!targetSessionId) {
      const [newSession] = await connection.query(
        `INSERT INTO practice_sessions (user_id, skill, session_type, status, started_at, completed_at, duration_seconds)
         VALUES (?, ?, ?, 'completed', NOW(), NOW(), ?)`,
        [userId, skill, sessionType, durationSeconds]
      );
      targetSessionId = newSession.insertId;
    } else {
      await connection.query(
        `UPDATE practice_sessions 
         SET status = 'completed', completed_at = NOW(), duration_seconds = ?
         WHERE id = ?`,
        [durationSeconds, targetSessionId]
      );
    }

    let correctCount = 0;
    let scorableCount = 0;
    const evaluatedResults = [];

    for (const item of answers) {
      const { questionId, answer, timeSpentSeconds = 0 } = item;

      // Ambil data kunci jawaban soal
      const [qRows] = await connection.query(
        "SELECT id, skill, question_type, prompt, content, options, answer_key, explanation FROM questions WHERE id = ?",
        [questionId]
      );

      if (qRows.length === 0) continue;

      const q = qRows[0];
      const answerKey = safeJsonParse(q.answer_key) || {};
      const options = safeJsonParse(q.options) || [];

      let isCorrect = null;
      let scoreValue = null;
      let feedbackNote = null;
      let speakingEvaluation = null;

      const qContent = safeJsonParse(q.content) || {};
      const isSpeakingRepeat = q.skill === "speaking" && (q.question_type === "listen_repeat" || Boolean(qContent && qContent.transcript));

      // Evaluasi otomatis berdasarkan tipe soal
      const correctOptionLetter = (answerKey.correct_option || answerKey.correctOption || "").toString().trim().toUpperCase();

      if (correctOptionLetter) {
        // Pilihan Ganda (misal Reading / Listening)
        scorableCount++;
        const rawSelected = typeof answer === "object" ? (answer.selected_option ?? answer.text) : answer;
        const selectedStr = rawSelected ? String(rawSelected).trim() : "";

        // Cek kecocokan ID ("A", "B", "C", "D") atau isi teks opsi
        const parsedOptions = Array.isArray(options) ? options : [];
        const isMatchId = selectedStr.toUpperCase() === correctOptionLetter;
        const correctOptObj = parsedOptions.find((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const optId = (typeof opt === "object" && opt !== null ? opt.id : letter) || letter;
          return optId.toUpperCase() === correctOptionLetter;
        });
        const correctText = correctOptObj ? (typeof correctOptObj === "object" ? correctOptObj.text : correctOptObj) : "";
        const isMatchText = correctText && selectedStr.toLowerCase() === String(correctText).trim().toLowerCase();

        isCorrect = Boolean(isMatchId || isMatchText);
        if (isCorrect) correctCount++;
        scoreValue = isCorrect ? 1.0 : 0.0;
        feedbackNote = isCorrect
          ? "Jawaban tepat! Analisis Anda sesuai dengan petunjuk soal."
          : `Jawaban kurang tepat. Pilihan yang benar adalah opsi ${correctOptionLetter}${correctText ? `: "${correctText}"` : ""}.`;
      } else if (answerKey.accepted_answers && Array.isArray(answerKey.accepted_answers)) {
        // Build a Sentence / Teks Isian
        scorableCount++;
        const userText = typeof answer === "object" ? (answer.text || "") : String(answer || "");
        const cleanUser = userText.trim().toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ");
        const matched = answerKey.accepted_answers.some(
          (acc) => acc.trim().toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ") === cleanUser
        );
        isCorrect = matched;
        if (isCorrect) correctCount++;
        scoreValue = isCorrect ? 1.0 : 0.0;
        feedbackNote = isCorrect
          ? "Struktur kalimat gramatikal tepat dan sesuai susunan kata."
          : `Susunan belum tepat. Contoh susunan yang diterima: "${answerKey.accepted_answers[0]}"`;
      } else if (isSpeakingRepeat) {
        // Soal Speaking Listen & Repeat (Evaluasi Pronunciation & Grammar)
        scorableCount++;
        const targetSentence = (qContent && qContent.transcript) || (answerKey && answerKey.target_transcript) || q.prompt;
        const spokenText = typeof answer === "object" ? (answer.text || answer.transcript || answer.spoken_text || "") : String(answer || "");

        speakingEvaluation = evaluateSpeakingRepeat(targetSentence, spokenText);
        isCorrect = speakingEvaluation.overallScore >= 70;
        if (isCorrect) correctCount++;
        scoreValue = speakingEvaluation.toeflScoreEstimated;
        feedbackNote = `Pronunciation: ${speakingEvaluation.pronunciation.grade} (${speakingEvaluation.pronunciation.score}%) | Grammar: ${speakingEvaluation.grammar.grade} (${speakingEvaluation.grammar.score}%). ${speakingEvaluation.pronunciation.feedback} ${speakingEvaluation.grammar.feedback}`;
      } else {
        // Soal Subjektif (Writing Email, Academic Discussion, Speaking Bebas)
        const textContent = typeof answer === "object" ? (answer.text || answer.transcript || "") : String(answer || "");
        const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
        scoreValue = wordCount > 30 ? 4.0 : 2.5; // Estimasi awal rubric 0-5
        feedbackNote = `Jawaban berhasil disimpan (${wordCount} kata). Siap untuk dievaluasi mandiri atau ulasan lebih lanjut.`;
      }

      // Simpan ke tabel responses
      const [respResult] = await connection.query(
        `INSERT INTO responses (session_id, question_id, answer, is_correct, score_value, time_spent_seconds, answered_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
            answer = VALUES(answer), 
            is_correct = VALUES(is_correct), 
            score_value = VALUES(score_value),
            time_spent_seconds = VALUES(time_spent_seconds)`,
        [
          targetSessionId,
          questionId,
          JSON.stringify(typeof answer === "object" ? answer : { text: answer }),
          isCorrect,
          scoreValue,
          timeSpentSeconds,
        ]
      );

      // Simpan feedback awal
      const responseId = respResult.insertId;
      if (responseId && feedbackNote) {
        const rubricScoresJson = speakingEvaluation ? JSON.stringify(speakingEvaluation) : null;
        const strengthsText = speakingEvaluation
          ? `Pronunciation: ${speakingEvaluation.pronunciation.grade} (${speakingEvaluation.pronunciation.score}%) | Grammar: ${speakingEvaluation.grammar.grade} (${speakingEvaluation.grammar.score}%)`
          : (isCorrect ? "Pemahaman konteks baik" : "Perhatikan kata kunci pada teks/soal");

        await connection.query(
          `INSERT INTO feedback (response_id, rubric_scores, strengths, improvements, feedback_source)
           VALUES (?, ?, ?, ?, 'rule_based')`,
          [responseId, rubricScoresJson, strengthsText, feedbackNote]
        );
      }

      evaluatedResults.push({
        questionId,
        skill: q.skill,
        questionType: q.question_type,
        prompt: q.prompt,
        userAnswer: answer,
        selectedOption: typeof answer === "object" ? (answer.selected_option || answer.text) : answer,
        correctOption: correctOptionLetter || null,
        acceptedAnswers: answerKey.accepted_answers || null,
        isCorrect,
        scoreValue,
        answerKey,
        explanation: q.explanation,
        feedback: feedbackNote,
        speakingEvaluation,
      });
    }

    const accuracyPercent = scorableCount > 0 ? Math.round((correctCount / scorableCount) * 100) : 100;

    // Catat ke skill_progress untuk grafik dashboard
    await connection.query(
      `INSERT INTO skill_progress (user_id, skill, assessment_type, accuracy_percent, rubric_score, assessed_at)
       VALUES (?, ?, 'daily', ?, ?, NOW())`,
      [userId, skill, accuracyPercent, scorableCount > 0 ? (accuracyPercent / 100) * 30 : null]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Latihan berhasil disubmit dan dievaluasi",
      data: {
        sessionId: targetSessionId,
        skill,
        totalQuestions: answers.length,
        scorableCount,
        correctCount,
        accuracyPercent,
        durationSeconds,
        results: evaluatedResults,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error submitting practice session:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan hasil latihan",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// GET /api/practice/history
exports.getHistory = async (req, res) => {
  try {
    const { userId = 1, limit = 15 } = req.query;

    const [rows] = await pool.query(
      `SELECT 
        ps.id,
        ps.skill,
        ps.session_type,
        ps.status,
        ps.duration_seconds,
        ps.completed_at,
        COUNT(r.id) AS total_answered,
        SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END) AS total_correct
       FROM practice_sessions ps
       LEFT JOIN responses r ON ps.id = r.session_id
       WHERE ps.user_id = ? AND ps.status = 'completed'
       GROUP BY ps.id
       ORDER BY ps.completed_at DESC
       LIMIT ?`,
      [userId, Number(limit)]
    );

    const history = rows.map((session) => {
      const answered = Number(session.total_answered || 0);
      const correct = Number(session.total_correct || 0);
      const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

      return {
        ...session,
        accuracy_percent: accuracy,
      };
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching practice history:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat latihan",
      error: error.message,
    });
  }
};

// GET /api/practice/session/:id
exports.getSessionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [sessionRows] = await pool.query(
      "SELECT * FROM practice_sessions WHERE id = ?",
      [id]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sesi tidak ditemukan",
      });
    }

    const [responseRows] = await pool.query(
      `SELECT 
        r.id AS response_id,
        r.question_id,
        r.answer,
        r.is_correct,
        r.score_value,
        r.time_spent_seconds,
        q.skill,
        q.question_type,
        q.prompt,
        q.content,
        q.options,
        q.answer_key,
        q.explanation,
        f.rubric_scores,
        f.strengths,
        f.improvements
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       LEFT JOIN feedback f ON r.id = f.response_id
       WHERE r.session_id = ?`,
      [id]
    );

    const responses = responseRows.map((item) => ({
      ...item,
      answer: safeJsonParse(item.answer),
      content: safeJsonParse(item.content),
      options: safeJsonParse(item.options),
      answer_key: safeJsonParse(item.answer_key),
      rubric_scores: safeJsonParse(item.rubric_scores),
    }));

    res.status(200).json({
      success: true,
      data: {
        session: sessionRows[0],
        responses,
      },
    });
  } catch (error) {
    console.error("Error fetching session details:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail sesi",
      error: error.message,
    });
  }
};
