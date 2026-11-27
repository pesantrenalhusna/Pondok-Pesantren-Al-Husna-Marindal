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
4. Umumkan ke wali: buka menu "Portal Wali" > "Daftar Akun Baru" di website. Tidak perlu kirim PIN satu per satu.

B2. IMPOR EXCEL (BENDAHARA)
Admin > Pembayaran SPP > Impor Excel.
1. Klik "Unduh Template". Satu baris = satu santri. Kolom: NIS, Nama, Kelas, Jenjang, Wali, No HP Wali,
   Tarif/Bulan (opsional), lalu Juli sampai Juni.
2. Isi kolom bulan: Lunas / tanda centang / nominal yang dibayar / tanggal bayar = sudah dibayar.
   Kosong atau Belum = belum dibayar (tagihan tetap dibuat). Tanda "-" = tidak ada tagihan bulan itu.
3. Pilih tahun ajaran, pilih file, lalu periksa PRATINJAU (santri baru, tagihan baru, ditandai lunas, catatan).
   Belum ada yang tersimpan sampai tombol "Terapkan Impor" ditekan.
4. Setelah diterapkan, tagihan langsung terbaca di Portal Wali. Wali hanya melihat bulan yang masih belum lunas.
Catatan:
- Santri dengan NIS yang belum ada ditambahkan otomatis (bisa dimatikan lewat kotak centang).
- Jenjang kosong dideteksi dari kelas. Tarif kosong memakai tarif jenjang di Pengaturan & Tarif.
- Nominal kurang dari tarif tidak dianggap lunas (cicilan belum didukung) dan ditandai di catatan.
- Bulan yang sudah lunas tidak diubah menjadi belum. Bulan yang sedang menunggu verifikasi wali dilewati.
- Impor aman diulang: data yang sama tidak digandakan. "Unduh Data Saat Ini" menghasilkan file berformat sama.
- Pembayaran dari impor tercatat dengan metode "Impor Excel" dan kwitansinya bisa dicetak.
- No HP Wali membantu verifikasi akun wali (muncul tanda centang bila nomor sesuai saat wali mendaftar).
- Membutuhkan koneksi internet (pustaka Excel dimuat dari CDN).

C. LANGKAH WALI SANTRI
1. Pertama kali: Portal Wali > Daftar Akun Baru. Isi nama, nomor HP, password (min. 6 karakter), dan NIS anak
   (boleh lebih dari satu, pisahkan koma). Akun aktif setelah diverifikasi admin.
2. Setelah disetujui: masuk dengan nomor HP + password. Anak lain dapat diajukan lewat "+ Tambah anak"
   (perlu persetujuan admin). Password dapat diganti lewat "Ganti password".
3. Lupa password: hubungi sekretariat. Admin menekan "Reset password", lalu mengirim password baru ke wali
   (tersedia tombol kirim lewat WhatsApp). Saat masuk, wali diminta membuat password baru sendiri.
4. Lihat tagihan per bulan (Lunas / Menunggu verifikasi / Belum / Terlambat) dan riwayat pembayaran.
5. Centang bulan yang ingin dibayar > Bayar Sekarang > transfer sesuai nominal (ada kode unik 3 digit
   agar mudah dicocokkan) > unggah foto bukti.
6. Setelah admin verifikasi, status menjadi Lunas dan wali dapat mencetak kwitansi.
   Pembayaran yang bukti-nya tidak diunggah dalam 48 jam dibatalkan otomatis.

D. LANGKAH ADMIN HARIAN
- Tab Akun Wali: setujui/tolak pendaftaran (cocokkan nama wali dan anak dengan data santri), reset password,
  hubungkan atau lepas anak, nonaktifkan akun.
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
- Login (nomor HP + password, disimpan terenkripsi hash di browser) hanya pembatas tampilan, bukan keamanan server. Jangan dipakai untuk uang/data asli
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
