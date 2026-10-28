# TOEFL Path 🎯
**Personal TOEFL iBT Learning Platform & Daily Progress Tracker**

Platform web interaktif untuk latihan dan pemantauan perkembangan harian persiapan tes **TOEFL iBT** (Reading, Listening, Speaking, Writing).

---

## 🚀 Tech Stack

- **Frontend**: Vite + React 19 + Lucide Icons
- **Backend**: Express.js + MySQL2 (Connection Pool)
- **Database**: MySQL (via XAMPP)

---

## 📁 Struktur Proyek

```text
toefl-path/
├── client/                     # Frontend Vite + React
│   ├── src/
│   │   ├── components/         # DashboardView, PracticeView, HistoryView, GoalModal, Navbar
│   │   ├── services/           # api.js (koneksi API REST)
│   │   ├── App.jsx             # Aplikasi utama dengan navigasi tab
│   │   └── index.css           # Desain modern sistem antarmuka
│   └── package.json
├── server/                     # Backend Node.js Express
│   ├── src/
│   │   ├── controllers/        # dashboard, practice, questions controllers
│   │   ├── routes/             # dashboard, practice, questions routes
│   │   ├── config/             # database pool config
│   │   ├── app.js              # Express app & route middleware
│   │   └── server.js           # Server runner (Port 5000)
│   ├── .env                    # Konfigurasi port & koneksi database MySQL
│   └── package.json
└── database/
    ├── schema.sql              # Skema tabel lengkap DDL & User default
    └── seed.sql                # Bank soal awal TOEFL iBT (4 Skills)
```

---

## 🛠️ Panduan Menjalankan Sistem

### 1. Pastikan MySQL XAMPP Berjalan
- Buka **XAMPP Control Panel**.
- Pastikan modul **MySQL** dalam status **Start** (Port 3306).
- Impor `database/schema.sql`, lalu `database/seed.sql` melalui phpMyAdmin atau MySQL CLI. Seed aman dijalankan ulang untuk memperbarui materi contoh.

### 2. Jalankan Backend (Express API)
Buka terminal baru di folder `server`:
```bash
cd server
npm run dev
```
> Server akan berjalan di: `http://localhost:5000`

### 3. Jalankan Frontend (Vite React)
Buka terminal baru di folder `client`:
```bash
cd client
npm run dev
```
> Aplikasi web akan terbuka di: `http://localhost:5173`

---

## ✨ Fitur-Fitur Utama

1. **Dashboard Pemantauan Harian**:
   - Penghitung **Streak Harian** (konsistensi latihan setiap hari).
   - Indikator **Estimasi Skor TOEFL (0 - 120)** berbanding target skor impian.
   - Ringkasan aktivitas harian (jumlah soal terjawab, menit belajar vs target).
   - Pengukur performa **4 Bagian TOEFL (Reading, Listening, Speaking, Writing)** standar skala 0 - 30.
   - Grafik tren pengerjaan 7 hari terakhir.
   - Pengaturan Target Skor (Min/Max) dan Waktu Belajar Harian melalui modal interaktif.

2. **Ruang Latihan Interaktif (Practice Room)**:
   - Filter soal berdasarkan skill: Reading, Listening, Writing, dan Speaking.
   - Tampilan passage/teks bacaan, transkrip audio, atau skenario.
   - Stopwatch pencatat waktu pengerjaan per butir soal.
   - Koreksi otomatis untuk soal pilihan ganda & susun kalimat (*build a sentence*).
   - Editor respons teks & penghitung kata untuk Writing & Speaking.
   - Pembahasan detail (*explanation*) & umpan balik (*rubric feedback*) pasca pengerjaan.

3. **Riwayat Sesi (Practice History)**:
   - Pencatatan seluruh sesi latihan ke database MySQL secara otomatis.
   - Menampilkan tanggal, jam pengerjaan, modul skill, durasi, dan persentase akurasi.

4. **Pusat Materi Belajar**:
   - Materi reading, listening, speaking, dan writing tersimpan di tabel `learning_materials`.
   - Setiap materi dapat menyimpan gambar/audio sebagai BLOB di MySQL (`image_data`/`audio_data`) dengan MIME type, atau menggunakan URL eksternal; transkrip, sumber, tingkat kesulitan, dan isi teks juga tersimpan.
   - Bila belum ada berkas audio, browser dapat membacakan transkrip dengan fitur text-to-speech.
   - Jalankan ulang `database/seed.sql` untuk memasukkan atau memperbarui materi orisinal contoh.

### API Materi
- `GET /api/materials` — daftar materi; dukung filter `?skill=reading|listening|speaking|writing`.
- `GET /api/materials/:id` — isi lengkap satu materi.
- `GET /api/materials/:id/image` dan `/api/materials/:id/audio` — media BLOB yang tersimpan di database.

Belum ada API publik resmi TOEFL iBT yang menyediakan keseluruhan bank materi/soal berlisensi untuk diunduh. Materi contoh pada proyek ini dibuat orisinal. Untuk media sendiri, simpan data biner beserta MIME type ke kolom BLOB dan tambahkan informasi atribusi/sumber; URL eksternal tetap dapat digunakan bila media disimpan di layanan lain.
