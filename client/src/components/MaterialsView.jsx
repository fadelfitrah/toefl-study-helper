import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  Image,
  Mic,
  PenTool,
  Play,
  Volume2,
} from "lucide-react";
import { getMaterial, getMaterialMediaUrl, getMaterials } from "../services/api";

const skills = [
  { id: "", label: "Semua materi" },
  { id: "reading", label: "Reading" },
  { id: "listening", label: "Listening" },
  { id: "speaking", label: "Speaking" },
  { id: "writing", label: "Writing" },
];

const skillIcons = {
  reading: BookOpen,
  listening: Headphones,
  speaking: Mic,
  writing: PenTool,
};

const difficultyLabels = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

// Sanitasi teks dari karakter matematika atau kode escape yang rusak
function sanitizeText(str) {
  if (!str) return "";
  return str
    .replace(/\$[^\$\n\r]*rightarrow[^\$\n\r]*\$/gi, "→")
    .replace(/\$ightarrow\$/gi, "→")
    .replace(/\\rightarrow/gi, "→")
    .replace(/\$\s*→\s*\$/g, "→");
}

// Render format inline: bold (**...**), italic (*...*), dan tanda panah (→)
function renderInline(text) {
  if (!text) return null;
  const sanitized = sanitizeText(String(text));

  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|→)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(sanitized)) !== null) {
    if (match.index > lastIndex) {
      parts.push(sanitized.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`b-${key++}`} className="font-bold text-zinc-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={`i-${key++}`} className="italic text-zinc-800">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token === "→") {
      parts.push(
        <span key={`a-${key++}`} className="inline-flex items-center mx-1.5 text-orange-600 font-bold select-none">
          →
        </span>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < sanitized.length) {
    parts.push(sanitized.slice(lastIndex));
  }

  return parts.length > 0 ? parts : sanitized;
}

// Komponen untuk me-render markdown secara rapi tanpa karakter mentah (##, **, *, ---, dll)
function FormattedMarkdown({ content }) {
  if (!content) return null;
  const lines = sanitizeText(String(content)).split("\n");

  const elements = [];
  let currentList = null;
  let currentNumList = null;
  let key = 0;

  function flushLists() {
    if (currentList) {
      elements.push(
        <ul key={`ul-${key++}`} className="space-y-2 my-3 pl-1">
          {currentList}
        </ul>
      );
      currentList = null;
    }
    if (currentNumList) {
      elements.push(
        <ol key={`ol-${key++}`} className="space-y-2.5 my-3 pl-1">
          {currentNumList}
        </ol>
      );
      currentNumList = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushLists();
      continue;
    }

    // Horizontal rule: --- or ***
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      flushLists();
      elements.push(<hr key={`hr-${key++}`} className="my-6 border-zinc-200/80" />);
      continue;
    }

    // Heading level 2: ## ...
    if (trimmed.startsWith("## ")) {
      flushLists();
      const headingText = trimmed.replace(/^##\s+/, "");
      elements.push(
        <h2
          key={`h2-${key++}`}
          className="text-lg sm:text-xl font-extrabold text-zinc-900 mt-7 mb-3 pb-2 border-b border-zinc-100 flex items-center gap-2"
        >
          {renderInline(headingText)}
        </h2>
      );
      continue;
    }

    // Heading level 3: ### ...
    if (trimmed.startsWith("### ")) {
      flushLists();
      const headingText = trimmed.replace(/^###\s+/, "");
      elements.push(
        <h3
          key={`h3-${key++}`}
          className="text-base font-bold text-zinc-800 mt-5 mb-2.5 flex items-center gap-2"
        >
          {renderInline(headingText)}
        </h3>
      );
      continue;
    }

    // Blockquote: > ...
    if (trimmed.startsWith("> ")) {
      flushLists();
      const quoteText = trimmed.replace(/^>\s+/, "").replace(/^"|"$/g, "");
      elements.push(
        <div
          key={`quote-${key++}`}
          className="my-3.5 p-4 sm:p-5 rounded-2xl bg-orange-50/60 border-l-4 border-orange-500 text-zinc-800 text-sm leading-relaxed shadow-2xs"
        >
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-serif text-xl leading-none select-none">“</span>
            <div className="flex-1 italic font-serif leading-relaxed text-zinc-700">
              {renderInline(quoteText)}
            </div>
            <span className="text-orange-500 font-serif text-xl leading-none select-none">”</span>
          </div>
        </div>
      );
      continue;
    }

    // Bullet list item: * ... or - ...
    if (/^[\*\-]\s+/.test(trimmed)) {
      if (currentNumList) flushLists();
      const itemText = trimmed.replace(/^[\*\-]\s+/, "");
      if (!currentList) currentList = [];
      currentList.push(
        <li key={`li-${key++}`} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
          <span className="flex-1">{renderInline(itemText)}</span>
        </li>
      );
      continue;
    }

    // Numbered list item: 1. ...
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (currentList) flushLists();
      const num = numMatch[1];
      const itemText = numMatch[2];
      if (!currentNumList) currentNumList = [];
      currentNumList.push(
        <li key={`nli-${key++}`} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-700">
          <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <span className="flex-1">{renderInline(itemText)}</span>
        </li>
      );
      continue;
    }

    // Regular paragraph
    flushLists();
    elements.push(
      <p key={`p-${key++}`} className="text-sm leading-relaxed text-zinc-700 my-2">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushLists();

  return <div className="space-y-1">{elements}</div>;
}

function parseMaterialBody(body) {
  if (typeof body !== "string") return body;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed : body;
  } catch {
    return body;
  }
}

function getAudioTranscript(material, content) {
  if (material.audio_transcript) return material.audio_transcript;
  // Hanya ambil transkrip untuk skill listening atau materi dengan audio
  if (material.skill === "listening" || material.audio_url) {
    if (content && typeof content === "object") {
      return content.audio_transcript || content.audio_script || content.transcript || "";
    }
  }
  return "";
}

function getSpeechText(material, content, transcript) {
  if (transcript) return transcript;
  if (typeof content === "string") return content;

  const instructions = content?.instructions || content?.description || material.description;
  const questions = Array.isArray(content?.questions)
    ? content.questions.map((item) => item.question).filter(Boolean).join(". ")
    : "";
  return [instructions, questions].filter(Boolean).join(". ");
}

function StructuredValue({ value }) {
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-700">
        {value.map((item, index) => (
          <li key={index}><StructuredValue value={item} /></li>
        ))}
      </ul>
    );
  }

  if (value && typeof value === "object") {
    return (
      <dl className="space-y-3">
        {Object.entries(value).map(([key, nestedValue]) => (
          <div key={key}>
            <dt className="text-xs font-semibold text-zinc-500">
              {key.replace(/_/g, " ")}
            </dt>
            <dd className="mt-1 text-sm text-zinc-700">
              <StructuredValue value={nestedValue} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span>{renderInline(String(value ?? ""))}</span>;
}

function MaterialBody({ content }) {
  if (typeof content === "string") {
    return (
      <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 sm:p-7">
        <FormattedMarkdown content={content} />
      </section>
    );
  }

  if (!content || typeof content !== "object") return null;

  const hiddenKeys = new Set([
    "audio_script",
    "audio_transcript",
    "transcript",
    "questions",
    "task_type",
  ]);
  const displayEntries = Object.entries(content).filter(
    ([key, value]) => !hiddenKeys.has(key) && value != null,
  );
  const titleCase = (value) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="space-y-5">
      {displayEntries.map(([key, value]) => (
        <section key={key} className="rounded-2xl border border-zinc-200/70 bg-white p-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            {key === "content_origin" ? "Tentang konten" : titleCase(key)}
          </h3>
          {Array.isArray(value) ? (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-700">
              {value.map((item, index) => (
                <li key={`${key}-${index}`}>
                  <StructuredValue value={item} />
                </li>
              ))}
            </ul>
          ) : typeof value === "object" ? (
            <StructuredValue value={value} />
          ) : (
            <div className="text-sm leading-7 text-zinc-700">
              {renderInline(String(value))}
            </div>
          )}
        </section>
      ))}

      {Array.isArray(content.questions) && content.questions.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-zinc-200/70 bg-white p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Cek pemahaman
          </h3>
          {content.questions.map((item, index) => (
            <div key={`question-${index}`} className="border-t border-zinc-100 pt-4 first:border-0 first:pt-0">
              <p className="text-sm font-semibold leading-relaxed text-zinc-800">
                {index + 1}. {renderInline(item.question)}
              </p>
              {Array.isArray(item.options) && (
                <ol className="mt-2 space-y-1 pl-5 text-sm leading-relaxed text-zinc-600">
                  {item.options.map((option, optionIndex) => (
                    <li key={`option-${optionIndex}`} className="list-[upper-alpha]">
                      {renderInline(option)}
                    </li>
                  ))}
                </ol>
              )}
              {item.correct_answer != null && (
                <p className="mt-3 text-sm text-emerald-700">
                  <strong>Jawaban:</strong> {renderInline(item.correct_answer)}
                </p>
              )}
              {item.explanation && (
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  <strong>Pembahasan:</strong> {renderInline(item.explanation)}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default function MaterialsView() {
  const [skill, setSkill] = useState("");
  const [materials, setMaterials] = useState([]);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [loadedSkill, setLoadedSkill] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const loading = loadedSkill !== skill;
  const error = requestError?.skill === skill ? requestError.message : "";
  const imageUrl = (material) =>
    material.image_url || (material.has_image ? getMaterialMediaUrl(material.id, "image") : "");
  const audioUrl = (material) =>
    material.audio_url || (material.has_audio ? getMaterialMediaUrl(material.id, "audio") : "");
  const content = activeMaterial ? parseMaterialBody(activeMaterial.body) : null;
  const transcript = activeMaterial ? getAudioTranscript(activeMaterial, content) : "";
  const hasAudioContent = Boolean(
    activeMaterial && (activeMaterial.skill === "listening" || activeMaterial.audio_url || transcript)
  );

  useEffect(() => {
    let cancelled = false;
    getMaterials(skill)
      .then((response) => {
        if (!cancelled) {
          setMaterials(response.data || []);
          setLoadedSkill(skill);
          setRequestError(null);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setMaterials([]);
          setRequestError({ skill, message: requestError.message });
          setLoadedSkill(skill);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [skill]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  async function openMaterial(material) {
    setRequestError(null);
    try {
      const response = await getMaterial(material.id);
      setActiveMaterial(response.data);
    } catch (requestError) {
      setRequestError({ skill, message: requestError.message });
    }
  }

  function toggleReadAloud(text) {
    if (!("speechSynthesis" in window)) {
      setRequestError({ skill, message: "Fitur baca teks tidak didukung browser ini." });
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setRequestError({ skill, message: "Audio teks tidak dapat diputar." });
    };
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  function backToList() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setActiveMaterial(null);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {activeMaterial ? (
        <article className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm">
          {imageUrl(activeMaterial) && (
            <img
              src={imageUrl(activeMaterial)}
              alt=""
              className="h-56 w-full object-cover sm:h-72"
            />
          )}
          <div className="space-y-6 p-6 sm:p-9">
            <button
              onClick={backToList}
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-orange-600 cursor-pointer transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke materi
            </button>

            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700 capitalize">{activeMaterial.skill}</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">
                  {difficultyLabels[activeMaterial.difficulty] || activeMaterial.difficulty}
                </span>
                <span className="text-zinc-400">{activeMaterial.estimated_minutes} menit</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">{activeMaterial.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">{activeMaterial.description}</p>
            </div>

            {audioUrl(activeMaterial) && (
              <audio controls preload="none" className="w-full">
                <source src={audioUrl(activeMaterial)} />
                Browser Anda tidak mendukung pemutar audio.
              </audio>
            )}

            {/* Audio Section hanya untuk materi Listening atau yang memiliki file audio / naskah audio */}
            {hasAudioContent && (
              <section className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                    <Volume2 size={17} className="text-orange-500" />
                    {activeMaterial.skill === "listening" ? "Audio latihan" : "Transcript audio"}
                  </h3>
                  {transcript && (
                    <button
                      onClick={() => toggleReadAloud(transcript)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-orange-700 shadow-sm hover:bg-orange-100 cursor-pointer"
                    >
                      {speaking ? <Volume2 size={14} /> : <Play size={14} />}
                      {speaking ? "Hentikan audio" : audioUrl(activeMaterial) ? "Dengarkan transcript" : "Putar audio"}
                    </button>
                  )}
                </div>
                {transcript ? (
                  <div className="text-sm leading-7 text-zinc-700">
                    {renderInline(transcript)}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-zinc-600">
                    Naskah audio belum tersedia. Dengarkan petunjuk materi melalui audio browser.
                  </p>
                )}
              </section>
            )}

            {activeMaterial.skill === "listening" && !audioUrl(activeMaterial) && !transcript && (
              <button
                onClick={() => toggleReadAloud(getSpeechText(activeMaterial, content, transcript))}
                disabled={!getSpeechText(activeMaterial, content, transcript)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {speaking ? <Volume2 size={16} /> : <Play size={16} />}
                {speaking ? "Hentikan audio" : "Putar materi"}
              </button>
            )}

            <MaterialBody content={content} />

            <p className="border-t border-zinc-100 pt-4 text-xs text-zinc-400">
              Sumber: {activeMaterial.source_url ? (
                <a href={activeMaterial.source_url} target="_blank" rel="noreferrer" className="underline hover:text-orange-600">
                  {activeMaterial.source_name}
                </a>
              ) : activeMaterial.source_name}
            </p>
          </div>
        </article>
      ) : (
        <>
          <section className="rounded-3xl bg-gradient-to-br from-[#224248] to-zinc-900 p-7 text-white sm:p-9">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 text-orange-300"><BookOpen size={24} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-300">Pusat belajar</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Materi TOEFL iBT</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
                  Pelajari strategi dan contoh orisinal untuk empat skill. Materi, transkrip, dan referensi media diambil dari database aplikasi.
                </p>
              </div>
            </div>
          </section>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {skills.map((item) => (
              <button
                key={item.id}
                onClick={() => setSkill(item.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                  skill === item.id ? "bg-orange-500 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-orange-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm font-medium text-zinc-400">Memuat materi dari database...</div>
          ) : materials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
              <Image className="mx-auto text-zinc-300" size={28} />
              <p className="mt-3 text-sm font-semibold text-zinc-700">Belum ada materi untuk kategori ini.</p>
              <p className="mt-1 text-xs text-zinc-400">Tambahkan materi ke tabel learning_materials.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {materials.map((material) => {
                const Icon = skillIcons[material.skill] || BookOpen;
                return (
                  <button
                    key={material.id}
                    onClick={() => openMaterial(material)}
                    className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md cursor-pointer"
                  >
                    {imageUrl(material) ? (
                      <img src={imageUrl(material)} alt="" loading="lazy" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-zinc-50 text-orange-500">
                        <Icon size={32} />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="rounded-md bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                          {material.skill}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-400">
                          {difficultyLabels[material.difficulty] || material.difficulty} · {material.estimated_minutes} mnt
                        </span>
                      </div>
                      <h3 className="font-bold text-zinc-900 group-hover:text-orange-600">{material.title}</h3>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-500">{material.description}</p>
                      <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-orange-600">
                        Buka materi <Play size={13} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
