PORTAL PONDOK PESANTREN AL-HUSNA MARINDAL
Pembaruan modul raport dan pengiriman nilai guru

FITUR RAPORT
- Daftar mata pelajaran dengan nama Indonesia, terjemahan Arab, kelompok kurikulum, dan KKM.
- Admin dapat menambah, mengubah, dan menghapus mata pelajaran serta KKM.
- Setiap guru memiliki akun Portal Guru dan hanya mengirim nilai untuk mata pelajaran yang diampu.
- Guru dapat mengisi nilai langsung atau mengunduh template Excel, mengisi kolom Nilai, lalu mengimpor kembali.
- Template dibuat otomatis sesuai kelas yang dipilih, dengan kolom NIS, Nama Santri, Kelas, dan Nilai.
- Nilai yang dikirim guru masuk ke lembar raport santri.
- Raport menampilkan kop Al-Husna, identitas santri, nama mapel Indonesia-Arab, KKM, nilai, predikat, keterangan tuntas/belum tuntas, rata-rata, kehadiran, dan kolom tanda tangan.
- Admin dapat melihat ringkasan status pengiriman nilai guru pada tab Raport.

AKSES
- Admin: masuk melalui Portal Admin seperti sebelumnya.
- Guru: pilih menu Portal Guru atau buka #guru.
- Akun guru: username awal adalah NIP/ID; password awal adalah 123456.
- Admin dapat mengganti username/password pada tab Data Guru.
- Guru yang sudah ada di daftar awal menggunakan NIP sebagai username dan 123456 sebagai password.

PENTING TENTANG PENYIMPANAN
Website ini masih menggunakan localStorage browser sebagaimana versi GitHub Pages sebelumnya. Artinya data guru, nilai, impor Excel, dan raport tersimpan pada browser/perangkat yang digunakan. Data belum otomatis tersinkron antar HP/laptop atau antar guru. Untuk operasional banyak guru dari perangkat berbeda, perlu menghubungkan database/backend (misalnya Supabase atau Firebase) dan autentikasi server. Jangan gunakan data produksi lintas perangkat sebelum backend tersebut dipasang.

EXCEL
Unduh template dari Portal Guru setelah memilih kelas. Jangan mengubah judul kolom NIS, Nama Santri, Kelas, Nilai. Isi nilai 0-100 pada kolom Nilai. Pustaka SheetJS dimuat melalui CDN sehingga impor/ekspor Excel memerlukan koneksi internet.
