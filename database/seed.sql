
USE toefl_path;

-- Materi orisinal untuk katalog belajar. Media bersifat opsional; isi audio_transcript
-- dapat dibacakan browser jika audio_url belum disediakan.
INSERT INTO learning_materials (
    slug, title, description, skill, difficulty, estimated_minutes, body,
    image_url, audio_url, audio_transcript, source_name
) VALUES
(
    'reading-campus-notices',
    'Membaca Pengumuman Kampus',
    'Latih menemukan tujuan, detail waktu, dan perubahan informasi dari pengumuman singkat.',
    'reading',
    'beginner',
    8,
    'CAMPUS LIBRARY NOTICE\n\nThe east reading room will be closed on Friday, October 24, from 9:00 a.m. to 1:00 p.m. for routine maintenance. Students may use the west reading room, which will remain open until 10:00 p.m. Books due on Friday may be returned to the outdoor drop box.\n\nSTRATEGI\n1. Baca judul atau kalimat pertama untuk menemukan topik.\n2. Tandai kata waktu dan lokasi.\n3. Bedakan informasi yang berubah dari layanan yang tetap tersedia.\n\nCEK PEMAHAMAN\nRuang baca mana yang tetap buka, dan sampai pukul berapa?',
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80',
    NULL,
    NULL,
    'Teks TOEFL Path orisinal; foto ilustrasi dari Unsplash'
),
(
    'listening-office-hours',
    'Memahami Percakapan tentang Jam Konsultasi',
    'Gunakan transcript untuk berlatih menangkap masalah, saran, dan tindakan berikutnya.',
    'listening',
    'intermediate',
    10,
    'Listen for the situation, the speaker’s problem, and the proposed solution. Do not try to translate every word.\n\nLATIHAN\nDengarkan atau bacakan dialog, lalu jawab: Apa masalah mahasiswa? Apa yang disarankan dosen? Apa yang akan dilakukan mahasiswa selanjutnya?',
    NULL,
    NULL,
    'Student: I saw that your office hours have moved to Wednesday, but I have a lab at that time. Professor: I can meet on Thursday morning instead. Would 10:30 work for you? Student: Yes, thank you. I will bring my draft then.',
    'TOEFL Path (konten orisinal)'
),
(
    'speaking-structured-response',
    'Menyusun Jawaban Speaking yang Jelas',
    'Bangun respons lisan singkat dengan pendapat, alasan, dan contoh yang relevan.',
    'speaking',
    'intermediate',
    12,
    'PROMPT\nSome students prefer studying alone, while others prefer studying in a group. Which do you prefer, and why?\n\nKERANGKA 45 DETIK\n1. Nyatakan pilihan Anda secara langsung.\n2. Berikan satu alasan utama.\n3. Tambahkan contoh spesifik.\n4. Tutup dengan menghubungkan contoh ke pilihan Anda.\n\nContoh pembuka: “I prefer studying in a small group because …” Rekam jawaban Anda dan periksa kejelasan, kelancaran, serta dukungan contohnya.',
    NULL,
    NULL,
    'Some students prefer studying alone, while others prefer studying in a group. Which do you prefer, and why?',
    'TOEFL Path (konten orisinal)'
),
(
    'writing-academic-paragraph',
    'Mengembangkan Paragraf Akademik',
    'Latih menyampaikan klaim, alasan, dan contoh dalam paragraf yang terorganisasi.',
    'writing',
    'intermediate',
    15,
    'PROMPT\nShould universities provide more online courses? State your position and support it with reasons and a relevant example.\n\nSTRUKTUR\n• Klaim: jawab pertanyaan dengan posisi yang jelas.\n• Alasan: jelaskan mengapa posisi tersebut masuk akal.\n• Bukti atau contoh: berikan situasi spesifik.\n• Penutup: hubungkan kembali contoh dengan klaim.\n\nSetelah menulis, periksa apakah setiap kalimat mendukung ide utama, lalu cek tata bahasa dan pilihan kata.',
    NULL,
    NULL,
    NULL,
    'TOEFL Path (konten orisinal)'
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    skill = VALUES(skill),
    difficulty = VALUES(difficulty),
    estimated_minutes = VALUES(estimated_minutes),
    body = VALUES(body),
    image_url = VALUES(image_url),
    audio_url = VALUES(audio_url),
    audio_transcript = VALUES(audio_transcript),
    source_name = VALUES(source_name),
    is_active = 1;

-- Soal 1: Reading - Complete the Words
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'reading',
    'complete_the_words',
    'intermediate',
    'Complete the missing letters in the passage.',
    JSON_OBJECT(
        'passage',
        'Regular exercise can improve concentration. It also helps students maintain energy throughout the day.',
        'instructions',
        'Complete each word using the context of the passage.'
    ),
    NULL,
    JSON_OBJECT(
        'sample_answer',
        'This sample uses a complete passage. Add blank positions before using it as a scored exercise.'
    ),
    'This is an introductory sample. The production version should replace selected letters with blanks and validate each response.'
);

-- Soal 2: Reading - Read in Daily Life
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'reading',
    'read_in_daily_life',
    'intermediate',
    'Why was the study room schedule changed?',
    JSON_OBJECT(
        'passage',
        'NOTICE: The campus study room will open at 10 AM on Friday instead of 8 AM because maintenance work is scheduled in the morning.'
    ),
    JSON_ARRAY(
        JSON_OBJECT('id', 'A', 'text', 'Because of scheduled maintenance'),
        JSON_OBJECT('id', 'B', 'text', 'Because students requested a closure'),
        JSON_OBJECT('id', 'C', 'text', 'Because the room is being relocated'),
        JSON_OBJECT('id', 'D', 'text', 'Because the campus is closed all day')
    ),
    JSON_OBJECT('correct_option', 'A'),
    'The notice explicitly states that maintenance work is scheduled for the morning.'
);

-- Soal 3: Listening - Listen and Choose a Response
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'listening',
    'listen_choose_response',
    'intermediate',
    'Listen to the prompt and choose the most appropriate response.',
    JSON_OBJECT(
        'transcript',
        'Could you tell me where the student services office is?',
        'audio_url',
        NULL,
        'note',
        'Use the transcript to generate or record audio for the practice version.'
    ),
    JSON_ARRAY(
        JSON_OBJECT('id', 'A', 'text', 'It is next to the main library.'),
        JSON_OBJECT('id', 'B', 'text', 'I submitted it yesterday.'),
        JSON_OBJECT('id', 'C', 'text', 'The service was very helpful.'),
        JSON_OBJECT('id', 'D', 'text', 'I usually study in the evening.')
    ),
    JSON_OBJECT('correct_option', 'A'),
    'The question asks for a location, so the appropriate response gives directions.'
);

-- Soal 4: Listening - Listen to a Conversation
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'listening',
    'listen_conversation',
    'intermediate',
    'What will the student probably do next?',
    JSON_OBJECT(
        'transcript',
        'Student: I cannot access the article for our assignment. Professor: Try opening it through the university library portal. Student: I will try that now.',
        'audio_url',
        NULL
    ),
    JSON_ARRAY(
        JSON_OBJECT('id', 'A', 'text', 'Visit the library tomorrow'),
        JSON_OBJECT('id', 'B', 'text', 'Open the article through the library portal'),
        JSON_OBJECT('id', 'C', 'text', 'Submit a different assignment'),
        JSON_OBJECT('id', 'D', 'text', 'Ask another student to write the assignment')
    ),
    JSON_OBJECT('correct_option', 'B'),
    'The student says that they will try accessing the article through the library portal.'
);

-- Soal 5: Writing - Build a Sentence
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'writing',
    'build_a_sentence',
    'intermediate',
    'Arrange the words to form a grammatically correct sentence.',
    JSON_OBJECT(
        'words',
        JSON_ARRAY(
            'students',
            'should',
            'review',
            'their notes',
            'before the exam'
        )
    ),
    NULL,
    JSON_OBJECT(
        'accepted_answers',
        JSON_ARRAY(
            'Students should review their notes before the exam.'
        )
    ),
    'The modal verb should is followed by the base form review.'
);

-- Soal 6: Writing - Write an Email
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'writing',
    'write_email',
    'intermediate',
    'Write an email to your instructor explaining that you cannot attend a scheduled consultation. Ask to arrange another time.',
    JSON_OBJECT(
        'scenario',
        'You have a consultation scheduled for Thursday afternoon, but you have a timetable conflict.',
        'requirements',
        JSON_ARRAY(
            'Explain why you cannot attend',
            'Apologize politely',
            'Ask about an alternative time'
        ),
        'suggested_time_seconds',
        600
    ),
    NULL,
    JSON_OBJECT(
        'rubric',
        JSON_ARRAY(
            'task_fulfillment',
            'organization',
            'grammar',
            'vocabulary',
            'appropriate_tone'
        )
    ),
    'A strong response should address all three requirements and use an appropriate email tone.'
);

-- Soal 7: Writing - Academic Discussion
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'writing',
    'academic_discussion',
    'intermediate',
    'Some people believe university students should attend lectures in person, while others prefer online lectures. Which approach do you think is more effective, and why?',
    JSON_OBJECT(
        'requirements',
        JSON_ARRAY(
            'State your position clearly',
            'Support your position with reasons',
            'Add a relevant example'
        ),
        'suggested_time_seconds',
        600
    ),
    NULL,
    JSON_OBJECT(
        'rubric',
        JSON_ARRAY(
            'relevance',
            'development',
            'organization',
            'grammar',
            'vocabulary'
        )
    ),
    'Evaluate the response using a writing rubric rather than a single fixed answer.'
);

-- Soal 8: Speaking - Take an Interview
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'speaking',
    'take_interview',
    'intermediate',
    'What is one skill you would like to learn, and how would it help you in your studies or career?',
    JSON_OBJECT(
        'preparation_seconds',
        0,
        'response_seconds',
        45,
        'rubric',
        JSON_ARRAY(
            'relevance',
            'clarity',
            'development',
            'grammar',
            'vocabulary',
            'intelligibility'
        )
    ),
    NULL,
    JSON_OBJECT(
        'rubric_based',
        TRUE
    ),
    'Evaluate how clearly the speaker answers the question and develops supporting details.'
);

-- Soal 9: Speaking - Listen and Repeat
INSERT INTO questions (
    skill, question_type, difficulty, prompt,
    content, options, answer_key, explanation
) VALUES (
    'speaking',
    'listen_repeat',
    'intermediate',
    'Listen carefully and repeat the sentence.',
    JSON_OBJECT(
        'transcript',
        'The research team will present its findings at the university conference next week.',
        'audio_url',
        NULL
    ),
    NULL,
    JSON_OBJECT(
        'rubric_based',
        TRUE
    ),
    'Evaluate the completeness and intelligibility of the repeated sentence. This initial version uses a transcript until audio assets are added.'
);
