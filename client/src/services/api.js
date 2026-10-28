const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function checkApiHealth() {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) throw new Error("Backend tidak dapat dihubungi");
  return response.json();
}

export async function checkDatabaseHealth() {
  const response = await fetch(`${API_URL}/health/db`);
  if (!response.ok) throw new Error("Koneksi database gagal");
  return response.json();
}

// Dashboard
export async function getDashboardOverview(userId = 1) {
  const response = await fetch(`${API_URL}/dashboard/overview?userId=${userId}`);
  if (!response.ok) throw new Error("Gagal mengambil data dashboard");
  return response.json();
}

export async function updateGoals(goalsData) {
  const response = await fetch(`${API_URL}/dashboard/goals`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goalsData),
  });
  if (!response.ok) throw new Error("Gagal memperbarui target skor");
  return response.json();
}

// Questions & Skills
export async function getSkillsSummary() {
  const response = await fetch(`${API_URL}/questions/skills-summary`);
  if (!response.ok) throw new Error("Gagal mengambil ringkasan skill");
  return response.json();
}

export async function getQuestions(skill = "") {
  const url = skill ? `${API_URL}/questions?skill=${skill}` : `${API_URL}/questions`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Gagal mengambil daftar soal");
  return response.json();
}

// Learning materials
export async function getMaterials(skill = "") {
  const query = skill ? `?skill=${encodeURIComponent(skill)}` : "";
  const response = await fetch(`${API_URL}/materials${query}`);
  if (!response.ok) throw new Error("Gagal memuat daftar materi");
  return response.json();
}

export async function getMaterial(id) {
  const response = await fetch(`${API_URL}/materials/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error("Gagal memuat detail materi");
  return response.json();
}

export function getMaterialMediaUrl(id, type) {
  return `${API_URL}/materials/${encodeURIComponent(id)}/${type}`;
}

// Practice
export async function submitPracticeSession(payload) {
  const response = await fetch(`${API_URL}/practice/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Gagal mengirim hasil latihan");
  return response.json();
}

export async function getPracticeHistory(userId = 1) {
  const response = await fetch(`${API_URL}/practice/history?userId=${userId}`);
  if (!response.ok) throw new Error("Gagal memuat riwayat latihan");
  return response.json();
}
