# Rencana Perbaikan UX/UI (Fix-Up Plan): chizui.dev (V2)

Skor keseluruhan website kamu naik menjadi **38/100** (UI: 48, UX: 38). Ada peningkatan, tapi beberapa masalah kritis baru terdeteksi, terutama terkait konsistensi elemen interaktif dan kejelasan navigasi.

Berikut adalah langkah-langkah *fix-up* berdasarkan hasil analisis terbaru.

## 🚨 Prioritas Utama (High Impact)
*Fokus pada perbaikan ini untuk menyelesaikan error berstatus "Critical" dan "Task Prioritas".*

### 1. Perbaiki Kontras Tombol CTA (Masih Bermasalah)
* **Masalah:** Rasio kontras tombol utama masih di angka **~2.1:1** (standar WCAG minimal 4.5:1). Ini membuat tombol sulit dilihat dan menurunkan CTR (*Click-Through Rate*).
* **Solusi:** Ubah warna latar belakang atau teks pada tombol utama agar jauh lebih mencolok. 

### 2. Tambahkan *Hover States* pada Tombol (Critical Risk)
* **Masalah:** Tombol sudah konsisten secara gaya, tapi **tidak memiliki efek hover yang jelas**. Ini masuk kategori *Severe Risk* karena membuat pengunjung ragu apakah tombol tersebut bisa diklik (kurang interaktif).
* **Solusi:** Tambahkan pseudo-class `:hover` di CSS untuk semua tombol CTA. Berikan efek perubahan warna (misalnya dibuat lebih gelap/terang), efek bayangan (*box-shadow*), atau transisi pergerakan kecil.

### 3. Perjelas Label Navigasi
* **Masalah:** Label navigasi saat ini dianggap kurang deskriptif, sehingga pengguna mungkin bingung ke mana menu tersebut akan mengarah (meningkatkan rasio pengabaian).
* **Solusi:** Ganti label menu dengan kata-kata yang lebih spesifik dan langsung ke tujuan. Misalnya, pastikan label benar-benar mencerminkan isi halamannya tanpa ambiguitas.

### 4. Rapikan Spasi di Layout Mobile
* **Masalah:** Jarak antar elemen (*spacing*) tidak konsisten, khususnya di versi *mobile*, sehingga terlihat berantakan (*cluttered*) dan penggunaan ruang (*use of space*)-nya kurang efektif.
* **Solusi:** Rapikan *margin* dan *padding* khusus untuk layar *mobile* (gunakan `@media queries`). Berikan jarak bernapas antar seksi (*sections*) agar tidak menumpuk.

---

## 🎨 Perbaikan User Interface (UI) Tambahan

* **Visual Hierarchy:** Area *hero section* masih belum punya titik fokus utama. Arahkan mata pengguna dengan urutan ukuran: *Headline* besar -> *Sub-headline* sedang -> Tombol CTA yang mencolok.
* **Color Contrast (Body Text):** Warna teks biasa melawan *background* juga belum memenuhi standar. Pastikan warna teks cukup kontras agar nyaman dibaca.

---

## ⚙️ Perbaikan User Experience (UX) Tambahan

* **Conversion Clarity (Severe Risk):** Penawaran utama atau nilai jual (*value proposition*) web kamu belum langsung bisa dipahami pengunjung saat pertama kali masuk. Perjelas kalimat di *hero section*.
* **Friction Points (Lack of Feedback):** Kurangnya umpan balik visual saat pengguna melakukan aksi. Pastikan setiap aksi (seperti klik) memberikan respons yang jelas (misalnya animasi loading atau transisi tombol).

---
**Rekomendasi Cepat:** Langsung tambahkan CSS `:hover` pada semua tombol dan ubah kontras warna tombol utamanya hari ini juga. Dua langkah sederhana ini akan langsung menghapus peringatan *Critical Risk* dari laporan!
