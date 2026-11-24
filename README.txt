PORTAL PONDOK PESANTREN AL-HUSNA MARINDAL
Versi desain modern + panel Konten & Desain Admin

ISI PAKET
- index.html : website dan panel admin
- logo.png : logo pesantren
- suasana-al-husna.webp : foto lingkungan pesantren untuk hero
- kegiatan-santri-al-husna.webp : foto kegiatan santri

FITUR DESAIN
- Ikon SVG garis minimalis, tanpa emoji pada kartu keunggulan/program.
- Tampilan modern bergaya portal universitas, responsif untuk HP dan desktop.
- Admin dapat mengubah judul/deskripsi beranda, profil, visi-misi, alamat kontak,
  kartu keunggulan, program unggulan (termasuk ikon dan warna), serta pengumuman.
- Admin dapat menambah/menghapus kartu dan pengumuman, serta ekspor/impor JSON.

PENTING - BATASAN GITHUB PAGES
Website ini tetap berupa website statis. Perubahan yang disimpan dari panel admin
tersimpan pada browser/perangkat admin tersebut (localStorage), bukan otomatis
ke browser pengunjung lain. Untuk menerbitkan perubahan ke semua pengunjung,
admin perlu ekspor JSON dan memperbarui konten di repository. Sinkronisasi langsung
antarperangkat membutuhkan backend/database (misalnya Supabase atau Firebase)
dan konfigurasi akun proyek yang sah.

LOGIN DEMO YANG SUDAH ADA
Username: admin
Password: alhusna123

Catatan keamanan: login demo ini bukan autentikasi aman untuk website publik karena
kode halaman statis dapat dilihat pengunjung. Sebelum digunakan untuk data sensitif,
gunakan autentikasi dan database backend.

PENERAPAN
1. Ekstrak ZIP.
2. Upload seluruh isi folder ke root repository GitHub Pages (index.html harus di root).
3. Pastikan kedua file foto dan logo tetap berada satu folder dengan index.html.
4. Buka website dan masuk melalui tombol Login Admin > tab Konten & Desain.
