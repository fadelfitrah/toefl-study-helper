import { useState, useEffect, useRef } from "react";
import { 
  BookOpen, Headphones, Mic, MicOff, PenTool, CheckCircle, 
  XCircle, Clock, Send, ChevronRight, RotateCcw, ArrowLeft, 
  Layers, Volume2, Square, Sparkles, RefreshCcw, Eye, EyeOff,
  Award, AlertCircle, Radio
} from "lucide-react";
import { getQuestions, submitPracticeSession } from "../services/api";

export default function PracticeView({ initialSkill = "", onCompletePractice }) {
  const [selectedSkill, setSelectedSkill] = useState(initialSkill || "");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);

  // Practice state
  const [selectedOption, setSelectedOption] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Audio & interactive helpers
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  // Speech Recognition state for Speaking
  const [isRecordingSpeech, setIsRecordingSpeech] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadQuestions(selectedSkill);
  }, [selectedSkill]);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Cleanup speech synthesis & recognition on question change or unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [activeQuestion]);

  async function loadQuestions(skill) {
    setLoading(true);
    try {
      const res = await getQuestions(skill);
      setQuestions(res.data || []);
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectQuestion(q) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecordingSpeech(false);
    setIsPlayingAudio(false);
    setShowTranscript(true);
    setSpeechError("");
    setActiveQuestion(q);
    setSelectedOption("");
    setTextAnswer("");
    setTimerSeconds(0);
    setTimerActive(true);
    setResult(null);
  }

  function handleResetCurrentQuestion() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecordingSpeech(false);
    setSpeechError("");
    setSelectedOption("");
    setTextAnswer("");
    setResult(null);
    setTimerSeconds(0);
    setTimerActive(true);
  }

  function handlePlayAudio(text) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Browser Anda tidak mendukung fitur pemutaran audio SpeechSynthesis.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  }

  // Toggle mikrofon untuk menangkap suara speaking user
  function toggleSpeechRecording() {
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert("Browser Anda belum mendukung Web Speech Recognition. Anda tetap dapat mengetikkan teks kalimat secara langsung.");
      return;
    }

    if (isRecordingSpeech) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsRecordingSpeech(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecordingSpeech(true);
        setSpeechError("");
      };

      recognition.onresult = (event) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
        setTextAnswer(fullTranscript.trim());
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Izin mikrofon belum diberikan. Mohon izinkan akses mikrofon pada ikon gembok browser Anda.");
        } else if (event.error === "no-speech") {
          setSpeechError("Tidak ada suara yang terdeteksi. Silakan coba berbicara lebih dekat ke mikrofon.");
        } else {
          setSpeechError("Kendala mikrofon: " + event.error);
        }
        setIsRecordingSpeech(false);
      };

      recognition.onend = () => {
        setIsRecordingSpeech(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setSpeechError("Tidak dapat mengaktifkan mikrofon: " + err.message);
      setIsRecordingSpeech(false);
    }
  }

  // Normalisasi opsi jawaban agar selalu memiliki { id: "A", text: "..." }
  const normalizedOptions = Array.isArray(activeQuestion?.options)
    ? activeQuestion.options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        if (typeof opt === "string") {
          return { id: letter, text: opt };
        }
        if (typeof opt === "object" && opt !== null) {
          return {
            id: (opt.id || letter).toString().toUpperCase(),
            text: opt.text || opt.label || "",
          };
        }
        return { id: letter, text: String(opt) };
      })
    : [];

  const isMultipleChoice = normalizedOptions.length > 0;
  const isSpeakingRepeat = activeQuestion?.skill === "speaking" && (activeQuestion?.question_type === "listen_repeat" || Boolean(activeQuestion?.content?.transcript));

  async function handleSubmit() {
    if (!activeQuestion) return;

    if (isRecordingSpeech && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsRecordingSpeech(false);
    }

    setSubmitting(true);
    setTimerActive(false);

    let answerPayload = {};
    if (isMultipleChoice) {
      answerPayload = { selected_option: selectedOption };
    } else {
      answerPayload = { text: textAnswer.trim() };
    }

    try {
      const res = await submitPracticeSession({
        userId: 1,
        skill: activeQuestion.skill,
        sessionType: "practice",
        durationSeconds: timerSeconds || 30,
        answers: [
          {
            questionId: activeQuestion.id,
            answer: answerPayload,
            timeSpentSeconds: timerSeconds || 30,
          },
        ],
      });

      if (res.success && res.data.results?.length > 0) {
        setResult(res.data.results[0]);
        if (onCompletePractice) onCompletePractice();
      }
    } catch (err) {
      alert("Gagal mengirim jawaban: " + err.message);
      setTimerActive(true);
    } finally {
      setSubmitting(false);
    }
  }

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const skillTabs = [
    { id: "", label: "Semua Skill", icon: <Layers size={15} /> },
    { id: "reading", label: "Reading", icon: <BookOpen size={15} /> },
    { id: "listening", label: "Listening", icon: <Headphones size={15} /> },
    { id: "writing", label: "Writing", icon: <PenTool size={15} /> },
    { id: "speaking", label: "Speaking", icon: <Mic size={15} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Skill Tabs & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-2xl bg-zinc-100/90 border border-zinc-200/60 overflow-x-auto">
          {skillTabs.map((tab) => {
            const isTabActive = selectedSkill === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedSkill(tab.id);
                  setActiveQuestion(null);
                  setResult(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isTabActive
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeQuestion && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-800 shadow-sm">
              <Clock size={15} className="text-orange-500" />
              <span>{formatTime(timerSeconds)}</span>
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.stop();
                  } catch (_) {}
                }
                setActiveQuestion(null);
                setResult(null);
                setTimerActive(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-600 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Daftar Soal</span>
            </button>
          </div>
        )}
      </div>

      {/* Question Selector List (When No Question is Active) */}
      {!activeQuestion && (
        <div className="space-y-4">
          <div className="text-xs font-medium text-zinc-400">
            Tersedia <strong className="text-zinc-800 font-bold">{questions.length}</strong> butir latihan pada kategori ini:
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs font-medium">
              Memuat daftar latihan...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {questions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  className="group rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                        {q.skill}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium capitalize">
                        {q.difficulty}
                      </span>
                    </div>

                    <h4 className="font-bold text-zinc-900 text-sm mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {q.prompt}
                    </h4>

                    <p className="text-xs text-zinc-400 font-medium">
                      Tipe: <code className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[11px]">{q.question_type.replace(/_/g, " ")}</code>
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-700 group-hover:text-orange-600 transition-colors">
                    <span>Mulai Pengerjaan</span>
                    <ChevronRight size={16} className="text-zinc-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Question Workout Interface */}
      {activeQuestion && (
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
          {/* Question Prompt Header */}
          <div className="pb-5 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                {activeQuestion.skill}
              </span>
              <span className="text-xs text-zinc-400">
                Format: {activeQuestion.question_type.replace(/_/g, " ")}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              {activeQuestion.prompt}
            </h3>
          </div>

          {/* Split Content Box */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Passage / Transcript / Skenario */}
            <div className="rounded-2xl bg-zinc-50/80 border border-zinc-200/60 p-5 sm:p-6 text-sm text-zinc-800 leading-relaxed max-h-[550px] overflow-y-auto space-y-4">
              {/* Reading Passage */}
              {activeQuestion.content?.passage && (
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Reading Passage
                  </h5>
                  <p className="whitespace-pre-wrap text-zinc-700 leading-relaxed text-sm">
                    {activeQuestion.content.passage}
                  </p>
                </div>
              )}

              {/* Audio Transcript / Narator Player (Listening & Speaking Repeat) */}
              {activeQuestion.content?.transcript && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      {isSpeakingRepeat ? "Kalimat Model (Dengarkan & Ulangi)" : "Audio Percakapan / Pertanyaan"}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {showTranscript ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showTranscript ? "Sembunyikan Teks" : "Tampilkan Teks"}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-orange-950">
                      <Volume2 size={18} className="text-orange-600 shrink-0" />
                      <span>{isSpeakingRepeat ? "Suara Narator Model" : "Audio Narator TOEFL"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(activeQuestion.content.transcript)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isPlayingAudio
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/20"
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <Square size={13} fill="currentColor" />
                          <span>Berhenti</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>Dengarkan Kalimat</span>
                        </>
                      )}
                    </button>
                  </div>

                  {showTranscript && (
                    <div className="p-4 rounded-xl bg-white border border-zinc-200/60 text-zinc-800 text-xs sm:text-sm font-medium leading-relaxed italic border-l-4 border-l-orange-500">
                      "{activeQuestion.content.transcript}"
                    </div>
                  )}

                  {isSpeakingRepeat && (
                    <div className="p-3 rounded-xl bg-zinc-100/80 text-[11px] text-zinc-600 space-y-1">
                      <strong className="text-zinc-800 block font-semibold">Petunjuk Speaking Listen & Repeat:</strong>
                      <p>1. Dengarkan kalimat narator hingga selesai.</p>
                      <p>2. Tekan tombol mikrofon pada sisi kanan, lalu ulangi kalimat tersebut dengan jelas.</p>
                      <p>3. Sistem otomatis menilai ketepatan <strong>Pronunciation</strong> dan <strong>Grammar</strong> Anda.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Skenario Tugas */}
              {activeQuestion.content?.scenario && (
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Skenario Tugas
                  </h5>
                  <p className="text-zinc-700 text-xs sm:text-sm">{activeQuestion.content.scenario}</p>
                </div>
              )}

              {/* Petunjuk Pengerjaan */}
              {activeQuestion.content?.requirements && Array.isArray(activeQuestion.content.requirements) && (
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Petunjuk Pengerjaan
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-zinc-600">
                    {activeQuestion.content.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Word Chips for build_a_sentence */}
              {activeQuestion.content?.words && Array.isArray(activeQuestion.content.words) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Kumpulan Kata (Klik untuk menyusun)
                    </h5>
                    {!result && textAnswer.trim() && (
                      <button
                        type="button"
                        onClick={() => setTextAnswer("")}
                        className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        Reset Kalimat
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeQuestion.content.words.map((w, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={!!result}
                        onClick={() => {
                          if (result) return;
                          const current = textAnswer.trim();
                          const newText = current ? `${current} ${w}` : w;
                          setTextAnswer(newText);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-orange-400 hover:bg-orange-50/50 text-xs font-semibold text-zinc-700 shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        + {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Response Inputs */}
            <div className="flex flex-col justify-between space-y-5">
              {/* Multiple Choice Options */}
              {isMultipleChoice ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Pilih Jawaban Anda
                    </h5>
                    {result && (
                      <span className="text-xs font-semibold text-zinc-500">
                        {result.isCorrect ? "Status: Benar" : "Status: Salah"}
                      </span>
                    )}
                  </div>

                  {normalizedOptions.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const correctLetter = (result?.correctOption || result?.answerKey?.correct_option || "").toString().toUpperCase();
                    const isAnswerKey = result && opt.id === correctLetter;
                    const isWrongSelection = result && isSelected && !result.isCorrect;

                    let optionContainerClass = "bg-white border-zinc-200 hover:border-orange-300 hover:bg-orange-50/30 cursor-pointer";
                    let badgeClass = "bg-zinc-100 text-zinc-600";

                    if (!result) {
                      if (isSelected) {
                        optionContainerClass = "bg-orange-50/80 border-orange-500 shadow-sm ring-1 ring-orange-500/20";
                        badgeClass = "bg-orange-500 text-white";
                      }
                    } else {
                      if (isAnswerKey) {
                        optionContainerClass = "bg-emerald-50/90 border-emerald-500 text-emerald-950 font-medium ring-2 ring-emerald-500/20";
                        badgeClass = "bg-emerald-600 text-white";
                      } else if (isWrongSelection) {
                        optionContainerClass = "bg-rose-50/90 border-rose-500 text-rose-950 font-medium ring-2 ring-rose-500/20";
                        badgeClass = "bg-rose-600 text-white";
                      } else {
                        optionContainerClass = "bg-zinc-50/50 border-zinc-200/70 text-zinc-400 opacity-60";
                        badgeClass = "bg-zinc-100 text-zinc-400";
                      }
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => !result && setSelectedOption(opt.id)}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${optionContainerClass}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${badgeClass}`}
                        >
                          {opt.id}
                        </div>
                        <div className="text-sm font-medium leading-snug pt-0.5 flex-1">
                          {opt.text}
                        </div>
                        {result && isAnswerKey && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-lg shrink-0">
                            <CheckCircle size={13} />
                            <span>Kunci Benar</span>
                          </span>
                        )}
                        {result && isWrongSelection && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/90 px-2.5 py-1 rounded-lg shrink-0">
                            <XCircle size={13} />
                            <span>Pilihan Anda (Salah)</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : activeQuestion.skill === "speaking" ? (
                /* Dedicated Speaking Voice Capture Interface */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Rekaman Suara Speaking Anda
                    </h5>
                    <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1.5">
                      <Radio size={13} className={isRecordingSpeech ? "text-rose-500 animate-pulse" : "text-zinc-400"} />
                      <span>{isRecordingSpeech ? "Merekam (EN-US)..." : "Mikrofon Siap"}</span>
                    </span>
                  </div>

                  {/* Big Voice Recording Button */}
                  {!result && (
                    <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-center space-y-3">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={toggleSpeechRecording}
                          className={`relative flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                            isRecordingSpeech
                              ? "bg-rose-600 text-white ring-4 ring-rose-500/30 animate-pulse hover:bg-rose-700"
                              : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-98"
                          }`}
                        >
                          {isRecordingSpeech ? (
                            <>
                              <Square size={18} fill="currentColor" />
                              <span>Hentikan Rekaman (Selesai Bicara)</span>
                            </>
                          ) : (
                            <>
                              <Mic size={18} />
                              <span>Mulai Bicara (Ulangi Kalimat)</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-zinc-500">
                        {isRecordingSpeech
                          ? "🎙️ Sedang mendengarkan... Ucapkan kalimat dalam bahasa Inggris dengan jelas."
                          : "Klik tombol di atas untuk mulai merekam suara ucapan Anda."}
                      </p>

                      {speechError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-left flex items-start gap-2">
                          <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                          <span>{speechError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transcribed Speech Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                      <span>Transkrip Hasil Tangkapan Suara:</span>
                      {!result && textAnswer.trim() && (
                        <button
                          type="button"
                          onClick={() => setTextAnswer("")}
                          className="text-[11px] font-semibold text-zinc-400 hover:text-rose-600 cursor-pointer"
                        >
                          Hapus & Rekam Ulang
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={5}
                      placeholder={
                        speechSupported
                          ? "Hasil suara yang Anda ucapkan akan muncul di sini secara otomatis..."
                          : "Ketik kalimat yang Anda ucapkan di sini..."
                      }
                      value={textAnswer}
                      disabled={!!result}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm text-zinc-900 placeholder:text-zinc-400 bg-white transition-all resize-y font-medium"
                    />

                    <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                      <span>
                        Jumlah Kata:{" "}
                        <strong className="text-zinc-700">
                          {textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0}
                        </strong>{" "}
                        kata
                      </span>
                      <span>Durasi: {formatTime(timerSeconds)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Text Area for General Writing */
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Tuliskan Jawaban / Respons Anda
                  </h5>
                  <textarea
                    rows={9}
                    placeholder="Tulis jawaban lengkap Anda di sini..."
                    value={textAnswer}
                    disabled={!!result}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm text-zinc-900 placeholder:text-zinc-400 bg-white transition-all resize-y"
                  />
                  <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span>
                      Jumlah Kata:{" "}
                      <strong className="text-zinc-700">
                        {textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0}
                      </strong>{" "}
                      kata
                    </span>
                    <span>Durasi: {formatTime(timerSeconds)}</span>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              {!result && (
                <button
                  disabled={submitting || (isMultipleChoice ? !selectedOption : !textAnswer.trim())}
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                >
                  <Send size={16} />
                  <span>
                    {submitting ? "Mengevaluasi Pengucapan & Tata Bahasa..." : "Submit Jawaban & Nilai Speaking"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Results & Detailed Speaking Feedback Box */}
          {result && (
            <div
              className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                result.speakingEvaluation
                  ? "bg-white border-zinc-200/90 shadow-sm"
                  : result.isCorrect === true
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                  : result.isCorrect === false
                  ? "bg-rose-50/70 border-rose-300 text-rose-950"
                  : "bg-orange-50/70 border-orange-300 text-orange-950"
              }`}
            >
              {/* Evaluasi Khusus Speaking Repeat (Pronunciation & Grammar Grades) */}
              {result.speakingEvaluation ? (
                <div className="space-y-6">
                  {/* Speaking Header Score Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm">
                        <Award size={26} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                          Hasil Penilaian Speaking Otomatis
                        </span>
                        <h4 className="text-lg font-extrabold text-zinc-900">
                          Evaluasi Pengucapan & Tata Bahasa
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-zinc-400 font-medium">Skor Keseluruhan</div>
                        <div className="text-xl font-black text-zinc-900">
                          {result.speakingEvaluation.overallScore} <span className="text-xs text-zinc-400 font-semibold">/ 100</span>
                        </div>
                      </div>
                      <div className="px-3.5 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider">Est. TOEFL iBT</div>
                        <div className="text-sm font-black text-orange-600">
                          {result.speakingEvaluation.toeflScoreEstimated} / 30
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two Main Grade Cards: Pronunciation & Grammar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Pronunciation Grade Card */}
                    <div className="p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 size={16} className="text-orange-500" />
                          <h5 className="font-extrabold text-sm text-zinc-900">1. Pronunciation Grade</h5>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-orange-100/80 text-orange-800 font-extrabold text-xs">
                          {result.speakingEvaluation.pronunciation.grade}
                        </span>
                      </div>

                      {/* Score Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-zinc-600 mb-1">
                          <span>Akurasi Fonem & Artikulasi</span>
                          <span>{result.speakingEvaluation.pronunciation.score}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              result.speakingEvaluation.pronunciation.score >= 80
                                ? "bg-emerald-500"
                                : result.speakingEvaluation.pronunciation.score >= 65
                                ? "bg-orange-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${result.speakingEvaluation.pronunciation.score}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {result.speakingEvaluation.pronunciation.feedback}
                      </p>

                      {/* Word-by-Word Chip Analysis */}
                      {result.speakingEvaluation.pronunciation.wordBreakdown && (
                        <div className="pt-2 border-t border-zinc-200/60">
                          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                            Analisis Akurasi Kata per Kata:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.speakingEvaluation.pronunciation.wordBreakdown.map((item, idx) => {
                              let chipClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                              let icon = "✓";
                              if (item.status === "imprecise") {
                                chipClass = "bg-amber-50 text-amber-800 border-amber-300";
                                icon = "~";
                              } else if (item.status === "omitted") {
                                chipClass = "bg-rose-50 text-rose-700 border-rose-200 line-through opacity-70";
                                icon = "✕";
                              }

                              return (
                                <span
                                  key={idx}
                                  title={item.spoken ? `Diucapkan: "${item.spoken}"` : "Kata terlewat"}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs ${chipClass}`}
                                >
                                  <span>{item.word}</span>
                                  <span className="text-[10px] opacity-75">{icon}</span>
                                </span>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">✓ Tepat</span>
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">~ Variasi fonem</span>
                            <span className="inline-flex items-center gap-1 text-rose-700 font-medium">✕ Terlewat</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Grammar Grade Card */}
                    <div className="p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-orange-500" />
                          <h5 className="font-extrabold text-sm text-zinc-900">2. Grammar Grade</h5>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-orange-100/80 text-orange-800 font-extrabold text-xs">
                          {result.speakingEvaluation.grammar.grade}
                        </span>
                      </div>

                      {/* Score Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-zinc-600 mb-1">
                          <span>Integritas Sintaksis & Tata Bahasa</span>
                          <span>{result.speakingEvaluation.grammar.score}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              result.speakingEvaluation.grammar.score >= 80
                                ? "bg-emerald-500"
                                : result.speakingEvaluation.grammar.score >= 65
                                ? "bg-orange-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${result.speakingEvaluation.grammar.score}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {result.speakingEvaluation.grammar.feedback}
                      </p>

                      {/* Observations Checklist */}
                      {result.speakingEvaluation.grammar.observations && (
                        <div className="pt-2 border-t border-zinc-200/60 space-y-1.5">
                          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                            Observasi Struktur Kalimat:
                          </span>
                          {result.speakingEvaluation.grammar.observations.map((obs, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700">
                              <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{obs}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comparison Box: Target vs Spoken */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
                    <div>
                      <strong className="text-zinc-500 font-semibold block uppercase tracking-wider text-[10px]">
                        Kalimat Model Acuan:
                      </strong>
                      <p className="text-zinc-900 font-semibold mt-0.5 font-serif">
                        "{result.speakingEvaluation.targetTranscript}"
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-200/60">
                      <strong className="text-zinc-500 font-semibold block uppercase tracking-wider text-[10px]">
                        Hasil Tangkapan Ucapan Anda:
                      </strong>
                      <p className="text-orange-950 font-semibold mt-0.5 italic">
                        "{result.speakingEvaluation.userTranscript || "(Tidak ada ucapan)"}"
                      </p>
                    </div>
                  </div>

                  {result.explanation && (
                    <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/60 text-xs text-zinc-700 leading-relaxed shadow-2xs">
                      <strong className="text-zinc-900 block mb-1 font-bold flex items-center gap-1.5">
                        <Sparkles size={14} className="text-orange-500" />
                        <span>Pembahasan Materi & Tips Speaking:</span>
                      </strong>
                      {result.explanation}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleResetCurrentQuestion}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <RefreshCcw size={14} />
                      <span>Ulangi Latihan Bicara Ini</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined" && "speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                        }
                        setActiveQuestion(null);
                        setResult(null);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Pilih Soal Latihan Lain</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Evaluation for Multiple Choice / Writing */
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 mt-0.5">
                      {result.isCorrect === true ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                          <CheckCircle size={22} />
                        </div>
                      ) : result.isCorrect === false ? (
                        <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                          <XCircle size={22} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm">
                          <Sparkles size={22} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-extrabold text-base">
                          {result.isCorrect === true
                            ? "Jawaban Tepat! Analisis Sesuai"
                            : result.isCorrect === false
                            ? "Jawaban Belum Tepat"
                            : "Jawaban Telah Berhasil Disimpan"}
                        </h4>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            result.isCorrect === true
                              ? "bg-emerald-200/80 text-emerald-800"
                              : result.isCorrect === false
                              ? "bg-rose-200/80 text-rose-800"
                              : "bg-orange-200/80 text-orange-800"
                          }`}
                        >
                          {result.isCorrect === true ? "+100% Akurasi" : result.isCorrect === false ? "0% Akurasi" : "Tersimpan"}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                        {result.feedback}
                      </p>

                      {result.acceptedAnswers && result.acceptedAnswers.length > 0 && !result.isCorrect && (
                        <div className="mt-3 p-3 rounded-xl bg-white/90 border border-rose-200 text-xs">
                          <strong className="text-rose-900 block font-bold mb-0.5">Susunan Kalimat yang Diterima:</strong>
                          <span className="text-zinc-800 font-semibold">{result.acceptedAnswers[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {result.explanation && (
                    <div className="mt-4 p-4 rounded-2xl bg-white/90 border border-zinc-200/70 text-xs text-zinc-700 leading-relaxed shadow-2xs">
                      <strong className="text-zinc-900 block mb-1 font-bold flex items-center gap-1.5">
                        <Sparkles size={14} className="text-orange-500" />
                        <span>Pembahasan & Analisis Soal:</span>
                      </strong>
                      {result.explanation}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleResetCurrentQuestion}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <RefreshCcw size={14} />
                      <span>Ulangi Soal Ini</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined" && "speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                        }
                        setActiveQuestion(null);
                        setResult(null);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Pilih Soal Latihan Lain</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
