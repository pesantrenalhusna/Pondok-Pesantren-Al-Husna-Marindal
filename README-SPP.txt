FITUR PEMBAYARAN SPP — PONDOK PESANTREN AL-HUSNA
Jenjang: MIS, SMP, SMA

A. PEMASANGAN
1. Upload seluruh isi folder ke GitHub Pages. File baru: spp.js (wajib ikut diupload bersama index.html).
2. Buka website > Portal Admin > tab "Pembayaran SPP".

B. LANGKAH ADMIN (sekali di awal)
1. Data Santri: setiap santri punya kolom Jenjang. Jika dikosongkan, jenjang dideteksi dari kelas
   (kelas 1-6 / I-VI = MIS, VII-IX = SMP, X-XII = SMA, atau tulisan MIS/SMP/SMA/MTs/MA pada nama kelas).
   Jenjang bisa diubah langsung di tabel Data Santri atau lewat kolom "Jenjang" di template Excel.
2. Pembayaran SPP > Pengaturan & Tarif: isi tarif per bulan untuk MIS, SMP, SMA, tanggal jatuh tempo,
   rekening bank (dan gambar QRIS bila ada). Klik Simpan.
3. Pembayaran SPP > Tagihan & Status: pilih tahun ajaran, klik "Terbitkan". Tagihan 12 bulan (Juli-Juni)
   dibuat sesuai tarif jenjang masing-masing. Aman dijalankan ulang untuk santri baru (tidak duplikat).
   Santri baru di tengah tahun: pilih "Mulai bulan" sesuai bulan masuk.
4. Pembayaran SPP > Akses Wali: klik "Buat PIN untuk yang belum punya", lalu unduh daftar akses (Excel)
   dan bagikan PIN ke masing-masing wali secara pribadi.

C. LANGKAH WALI SANTRI
1. Buka menu "Portal Wali", masuk dengan NIS santri + PIN. Wali yang punya beberapa anak dapat menekan
   "+ Tambah anak" (NIS + PIN anak berikutnya).
2. Lihat tagihan per bulan (Lunas / Menunggu verifikasi / Belum / Terlambat) dan riwayat pembayaran.
3. Centang bulan yang ingin dibayar > Bayar Sekarang > transfer sesuai nominal (ada kode unik 3 digit
   agar mudah dicocokkan) > unggah foto bukti.
4. Setelah admin verifikasi, status menjadi Lunas dan wali dapat mencetak kwitansi.
   Pembayaran yang bukti-nya tidak diunggah dalam 48 jam dibatalkan otomatis.

D. LANGKAH ADMIN HARIAN
- Tab Verifikasi: cek bukti dan mutasi rekening, lalu Verifikasi (Lunas) atau Tolak (isi alasan, terlihat wali).
- Tab Tagihan & Status: klik kotak bulan untuk catat bayar TUNAI, ubah nominal, hapus tagihan, cetak kwitansi
  atau batalkan pelunasan. Filter per jenjang, kelas, atau nama.
- Tab Ringkasan: total tagihan, terbayar, menunggu, dan tunggakan per jenjang. Rekap Excel per jenjang
  (satu sheet MIS, SMP, SMA, dan sheet Pembayaran) dapat diunduh.

E. BATASAN PENTING (BACA SEBELUM DIPAKAI NYATA)
Seperti modul lain di website ini, data SPP tersimpan di localStorage browser:
- Data yang diinput admin hanya ada di browser admin. Wali yang membuka dari HP-nya TIDAK melihat data itu,
  dan bukti yang diunggah wali TIDAK sampai ke admin. Jadi alur wali <-> admin baru berjalan nyata
  setelah website dihubungkan ke database bersama.
- PIN dan login hanya pembatas tampilan, bukan keamanan server. Jangan dipakai untuk uang/data asli
  sebelum ada backend.
- Pembayaran masih manual (transfer/QRIS statis + verifikasi admin). Pembayaran otomatis (Midtrans, Xendit,
  dsb.) membutuhkan server untuk membuat transaksi dan menerima notifikasi pembayaran; tidak bisa dari
  GitHub Pages saja.

F. LANGKAH BERIKUTNYA UNTUK PENGGUNAAN NYATA
- Pasang database + autentikasi server (mis. Supabase) dengan aturan akses: wali hanya membaca tagihan
  anaknya, admin/bendahara mengelola semuanya.
- Semua akses data SPP dipusatkan di dua fungsi (sppLoad dan sppSave di spp.js) sehingga penggantian
  penyimpanan ke database tidak mengubah tampilan.
- Opsional: payment gateway dengan webhook agar status Lunas otomatis.
