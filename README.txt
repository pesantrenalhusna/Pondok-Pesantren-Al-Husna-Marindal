PANDUAN FITUR AKADEMIK — PONDOK PESANTREN AL-HUSNA

A. PEMASANGAN
1. Ekstrak ZIP.
2. Upload seluruh isi folder ke root repositori GitHub Pages (index.html, logo.png, dan dua gambar .webp).
3. Commit changes dan tunggu GitHub Pages selesai deploy.
4. Buka website, login admin, lalu masuk ke tab Data Santri dan Data Guru.

B. IMPOR DATA SANTRI
1. Admin > Data Santri > Unduh Template Santri.
2. Isi satu santri per baris pada sheet pertama.
3. Kolom wajib: NIS, Nama. Kolom lainnya: Jenis Kelamin, Kelas, TTL, Alamat, Wali.
4. Impor file .xlsx/.xls/.csv.
5. Jika NIS sudah ada, baris tersebut memperbarui data santri; jika belum, data baru ditambahkan.
6. Jaga NIS sebagai teks bila memiliki angka nol di depan.

C. IMPOR DATA GURU
1. Admin > Data Guru > Unduh Template Guru.
2. Kolom wajib: NIP, Nama, No HP.
3. Mata Pelajaran, Kelas Diajar, dan Wali Kelas dapat berisi beberapa nilai dipisahkan titik koma (;).
4. Contoh: Mata Pelajaran = Fiqih; Bahasa Arab. Kelas Diajar = VII A; VIII A. Wali Kelas = VII A.
5. Isi Password, Pendidikan, Jabatan, Bio, Foto URL sesuai kebutuhan.
6. Foto URL harus berupa alamat gambar yang dapat diakses publik. Jika kosong, kartu profil menampilkan ikon avatar.
7. Impor. NIP atau nomor HP yang sama akan memperbarui data guru.

D. LOGIN GURU & INPUT NILAI
1. Admin harus memastikan nomor HP, password, mapel, dan kelas ajar guru sudah benar.
2. Guru buka menu Portal Guru, masuk dengan nomor HP dan password.
3. Pilih mapel, kelas, dan semester/tahun ajaran.
4. Nilai bisa diisi langsung, atau unduh template Excel lalu isi kolom Nilai.
5. Template nilai memiliki kolom NIS, Nama Santri, Kelas, Nilai. Jangan mengubah judul kolom.
6. Impor nilai, periksa hasil impor, lalu klik Kirim Nilai untuk menyimpan nilai dari form.
7. Nilai akan terhimpun pada data raport/leger di browser yang sama.

E. LEGER WALI KELAS
1. Admin mengisi kolom Wali Kelas pada data guru, misalnya VII A.
2. Guru yang ditetapkan sebagai wali kelas dapat login lalu membuka menu Leger Nilai.
3. Guru hanya mendapat tampilan leger untuk kelas yang menjadi penugasan wali kelasnya.
4. Admin dapat membuka leger seluruh kelas.
5. Leger merangkum nilai semua mata pelajaran per santri, termasuk rata-rata.

F. PROFIL GURU PUBLIK
Menu Profil Guru menampilkan nama, jabatan, pendidikan, mata pelajaran, biografi, dan foto.
Data profil dilengkapi melalui impor Excel Guru. Perbarui baris guru dengan NIP yang sama untuk memperbarui profil.

G. BAHASA ARAB
Nama mata pelajaran pada raport ditampilkan bersama padanan Arab yang sudah disediakan dalam daftar mapel. Predikat nilai dan keterangan ketuntasan juga ditampilkan dalam Bahasa Arab disertai terjemahan Indonesia.

PENTING — BATASAN TEKNIS DAN KEAMANAN
Versi ini masih menggunakan GitHub Pages + localStorage (penyimpanan browser). Artinya:
- Data yang diimpor atau diinput hanya tersimpan pada browser/perangkat tersebut.
- Data tidak otomatis tersinkron antara HP guru, komputer wali kelas, dan perangkat admin.
- Akun/password dan pembatasan menu di aplikasi statis bukan autentikasi server yang aman; data di sisi browser dapat diperiksa atau dimanipulasi.
- Karena itu, login nomor HP dan pembatasan leger pada versi ini adalah prototipe alur kerja, bukan kontrol akses yang aman untuk data resmi.
- Jangan gunakan untuk data santri sensitif atau operasional lintas perangkat sebelum dipasang backend/database (misalnya Supabase/Firebase) dengan autentikasi server dan aturan akses berbasis peran (admin, guru mapel, wali kelas).


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


PEMBARUAN MODUL AKADEMIK (VERSI IMPOR & PROFIL GURU)
- Admin > Data Santri: unduh template Excel dan impor data santri secara massal. Kolom: NIS, Nama, Jenis Kelamin, Kelas, TTL, Alamat, Wali. NIS yang sudah ada akan diperbarui.
- Admin > Data Guru: unduh template dan impor guru massal. Kolom wajib: NIP, Nama, No HP. Mapel, Kelas Diajar, Wali Kelas dipisahkan titik koma.
- Login guru menggunakan nomor HP dan password. Admin dapat mengubah nomor HP, penugasan mapel/kelas, kelas wali, dan password di Data Guru.
- Guru dapat memilih beberapa mapel dan beberapa kelas sesuai penugasan untuk memasukkan atau mengimpor nilai.
- Menu Profil Guru menampilkan nama, jabatan, pendidikan, mata pelajaran, biografi, dan foto URL guru. Profil dapat dilengkapi di Data Guru atau melalui impor Excel.
- Menu Leger Nilai dibatasi pada admin dan guru yang kelasnya ditetapkan sebagai Wali Kelas.
- Predikat dan keterangan raport memakai Bahasa Arab disertai keterangan Indonesia.

PENTING — BATASAN KEAMANAN GITHUB PAGES
Website ini masih aplikasi statis berbasis localStorage. Data tersimpan hanya di browser/perangkat tempat perubahan dilakukan, bukan database bersama. Karena JavaScript dan data localStorage berada di sisi pengguna, pembatasan menu leger serta login HP ini hanya pembatasan tampilan dan TIDAK dapat dianggap sebagai keamanan sungguhan. Guru dari HP berbeda tidak akan berbagi data secara otomatis. Untuk operasional sebenarnya, wajib pasang backend/database (mis. Supabase/Firebase), autentikasi server, dan aturan akses (RLS) untuk admin, guru, dan wali kelas. Jangan masukkan data santri sensitif/nomor HP asli sampai backend aman dipasang.

FORMAT TEMPLATE
- Template impor santri: NIS, Nama, Jenis Kelamin, Kelas, TTL, Alamat, Wali.
- Template impor guru: NIP, Nama, No HP, Mata Pelajaran, Kelas Diajar, Wali Kelas, Password, Pendidikan, Jabatan, Bio, Foto URL.
- Nilai guru: NIS, Nama Santri, Kelas, Nilai (0–100).
