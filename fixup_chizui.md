# Rencana Perbaikan UX/UI (Fix-Up Plan): chizui.dev

Berdasarkan hasil analisis Design Meter, skor keseluruhan website saat ini adalah **28/100** (UI: 29, UX: 33). Evaluasi menunjukkan bahwa masalah utama yang membuat skor anjlok berkaitan dengan kejelasan konversi (*Conversion Clarity*), visibilitas tombol CTA, dan inkonsistensi tata letak.

Berikut adalah panduan *fix-up* terstruktur untuk mendongkrak skor dan memperbaiki pengalaman pengguna.

## 🚨 Prioritas Utama (High Impact)
*Selesaikan tiga hal ini terlebih dahulu untuk melihat lonjakan skor yang signifikan.*

### 1. Perbaiki Kontras Tombol CTA di Hero Section
* **Masalah:** Rasio kontras tombol CTA (Call to Action) saat ini hanya **~2.1:1**, jauh di bawah standar aksesibilitas WCAG (minimal 4.5:1). Ini membuat tombol sulit dilihat, mengurangi *engagement*, dan berpotensi mematikan konversi.
* **Solusi:** Ganti warna latar belakang (*background*) tombol atau warna teksnya. Pastikan warnanya benar-benar "stand out" dan kontras dengan latar belakang *hero section*.

### 2. Rapikan *Spacing* (Jarak) Antara Teks dan Tombol
* **Masalah:** Jarak antara elemen teks dan tombol tidak konsisten, menciptakan kesan berantakan (*cluttered*) yang membingungkan pengguna dan meningkatkan *bounce rate*.
* **Solusi:** Terapkan sistem *spacing* yang seragam di CSS. Gunakan *margin* dan *padding* yang konsisten (misalnya selalu menggunakan skala kelipatan 4px atau 8px) untuk memberikan ruang bernapas (*white space*) antar elemen.

### 3. Rombak Hierarki Visual Versi Mobile
* **Masalah:** Versi mobile memiliki skor lebih rendah (UI 55) dibanding desktop. Tata letaknya kehilangan hierarki visual, jaraknya berantakan, dan visibilitas CTA menurun drastis di layar kecil.
* **Solusi:** Susun ulang tata letak khusus untuk *mobile* (`@media queries`). Pastikan judul utama dan tombol CTA adalah hal pertama yang dilihat pengguna tanpa harus banyak *scroll*. Perbesar ukuran area sentuh (minimal 44x44 pixel) untuk tombol.

---

## 🎨 Perbaikan User Interface (UI)

* **Titik Fokus (Visual Hierarchy):** *Hero section* saat ini kurang memiliki fokus utama. Arahkan mata pengguna langsung ke *Headline* utama dan CTA. Kurangi elemen visual di sekitarnya yang bisa mendistraksi.
* **Tipografi (Line Height):** Ukuran font sudah baik, tetapi jarak antar baris (*line height*) perlu ditambah agar teks lebih mudah dibaca. Coba gunakan `line-height: 1.5` atau `1.6` pada *body text*.
* **Kontras Teks (*Color Contrast*):** Selain tombol, pastikan warna teks biasa (*body text*) juga cukup kontras terhadap warna *background* situs agar tidak menyulitkan mata.

---

## ⚙️ Perbaikan User Experience (UX)

* **Kejelasan Nilai (Conversion Clarity):** Ini adalah risiko paling kritis (skor 35/100). Pengunjung yang baru masuk tidak langsung menangkap *value proposition* (apa yang ditawarkan oleh web ini). Perjelas pesan utama di halaman depan.
* **Aksesibilitas Navigasi (Keyboard Focus):** Beberapa elemen interaktif tidak memiliki indikator fokus yang jelas. Tambahkan efek `:focus` atau `outline` pada tombol dan *link* untuk mendukung pengguna yang bernavigasi menggunakan *keyboard*.
* **Kurangi Gesekan (Friction Points):** Terlalu banyak langkah yang harus dilewati pengguna untuk melakukan aksi. Sederhanakan alur pengguna (*user flow*).
* **Navigasi Intuitif:** Label menu sudah jelas, tetapi struktur secara keseluruhan perlu dibuat lebih intuitif agar pengunjung lebih mudah menemukan apa yang mereka cari.

---
**Saran Langkah Selanjutnya:** 
Setelah mengimplementasikan poin-poin di atas (terutama 3 Prioritas Utama), segera *deploy* dan jalankan ulang pengujian di Design Meter. Skor pasti akan langsung naik secara drastis!
