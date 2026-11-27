/* =====================================================================
   MODUL PEMBAYARAN SPP — PONDOK PESANTREN AL-HUSNA MARINDAL
   Jenjang: MIS, SMP, SMA
   - Portal Wali (#wali): login NIS + PIN, lihat tagihan, bayar, unggah bukti
   - Admin > Pembayaran SPP: tarif per jenjang, tagihan, verifikasi, PIN wali
   Penyimpanan: localStorage (kunci alh_spp_*). Semua akses data lewat
   sppLoad() / sppSave() agar mudah diganti ke database (Supabase/Firebase).
   File ini dimuat SEBELUM skrip utama di index.html.
   ===================================================================== */

const SPP_J = ['MIS', 'SMP', 'SMA'];
const SPP_BLN = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
const SPP_EXPIRE_JAM = 48;
const SPP_W = { cur: null, pick: [], ta: null, view: 'list', pay: null, addOpen: false, mode: 'masuk' };
let sppSub = 'ringkas';
const sppF = { j: '', k: '', q: '', ta: null, vs: 'Menunggu Verifikasi', vj: '' };

/* ---------- lapisan penyimpanan ---------- */
function sppLoad(k, d) { return ld('spp_' + k, d); }
function sppSave(k, v) {
  try { localStorage.setItem('alh_spp_' + k, JSON.stringify(v)); return true; }
  catch (x) { alert('Gagal menyimpan: penyimpanan browser penuh. Ekspor data SPP lalu hapus bukti lama.'); return false; }
}

/* ---------- utilitas ---------- */
const sppRp = n => 'Rp\u00A0' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const sppPad = n => String(n).padStart(2, '0');
const sppUid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const sppSantri = id => S.find(x => String(x.id) === String(id));
const sppSMap = () => new Map(S.map(s => [String(s.id), s]));
const sppFmtDate = iso => { if (!iso) return '-'; const d = new Date(iso); return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + sppPad(d.getHours()) + ':' + sppPad(d.getMinutes()); };

function sppTerbilang(n) {
  n = Math.floor(Math.abs(n)); if (n === 0) return 'nol';
  const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const t = x => {
    if (x < 12) return s[x];
    if (x < 20) return s[x - 10] + ' belas';
    if (x < 100) return s[Math.floor(x / 10)] + ' puluh' + (x % 10 ? ' ' + s[x % 10] : '');
    if (x < 200) return 'seratus' + (x % 100 ? ' ' + t(x % 100) : '');
    if (x < 1000) return s[Math.floor(x / 100)] + ' ratus' + (x % 100 ? ' ' + t(x % 100) : '');
    if (x < 2000) return 'seribu' + (x % 1000 ? ' ' + t(x % 1000) : '');
    if (x < 1e6) return t(Math.floor(x / 1000)) + ' ribu' + (x % 1000 ? ' ' + t(x % 1000) : '');
    if (x < 1e9) return t(Math.floor(x / 1e6)) + ' juta' + (x % 1e6 ? ' ' + t(x % 1e6) : '');
    return t(Math.floor(x / 1e9)) + ' miliar' + (x % 1e9 ? ' ' + t(x % 1e9) : '');
  };
  return t(n);
}

/* ---------- jenjang ---------- */
function sppJenjang(s) {
  if (!s) return '';
  if (SPP_J.includes(s.jenjang)) return s.jenjang;
  const k = String(s.kelas || '').toUpperCase().trim();
  if (/(?:^|[^A-Z])(MIS|MI)(?![A-Z])/.test(k) || /IBTIDA/.test(k)) return 'MIS';
  if (/(?:^|[^A-Z])(SMP|MTS)(?![A-Z])/.test(k)) return 'SMP';
  if (/(?:^|[^A-Z])(SMA|MA|SMK)(?![A-Z])/.test(k)) return 'SMA';
  const RM = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  let m = k.match(/(?:^|[^A-Z])(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)(?![A-Z])/), n = null;
  if (m) n = RM[m[1]];
  else { m = k.match(/(?:^|[^0-9A-Z])(1[0-2]|[1-9])(?![0-9])/); if (m) n = Number(m[1]); }
  if (n == null) return '';
  return n <= 6 ? 'MIS' : n <= 9 ? 'SMP' : 'SMA';
}
function sppSetJenjang(id, v) {
  const s = sppSantri(id); if (!s) return;
  if (SPP_J.includes(v)) s.jenjang = v; else delete s.jenjang;
  sv('santri', S); R();
}

/* ---------- konfigurasi ---------- */
function sppCfg() {
  const d = new Date(), ta0 = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  const c = sppLoad('cfg', {}) || {};
  return Object.assign({ tahunAjaran: ta0, jatuhTempo: 10, kodeUnik: true, bank: '', noRek: '', atasNama: '', wa: '', petunjuk: '', qris: '' }, c,
    { tarif: Object.assign({ MIS: 0, SMP: 0, SMA: 0 }, c.tarif || {}) });
}
function sppMonths(ta) {
  return SPP_BLN.map((nm, i) => { const mo = (6 + i) % 12, yr = Number(ta) + (i >= 6 ? 1 : 0); return { i, ym: yr + '-' + sppPad(mo + 1), label: nm + ' ' + yr, short: nm.slice(0, 3) }; });
}
function sppLate(b, cfg) {
  if (b.status !== 'Belum') return false;
  const [y, m] = b.ym.split('-').map(Number);
  return new Date() > new Date(y, m - 1, Number(cfg.jatuhTempo) || 10, 23, 59, 59);
}
function sppBillLabel(b) { const [y, m] = b.ym.split('-').map(Number); return SPP_BLN[(m + 5) % 12] + ' ' + y; }
function sppTaLabel(ta) { return ta + '/' + (Number(ta) + 1); }
function sppWaLink(num, text) {
  let d = String(num || '').replace(/\D/g, ''); if (!d) return '';
  if (d.startsWith('0')) d = '62' + d.slice(1);
  return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
}

/* ---------- gambar ---------- */
function sppImg(file, maxW, type, q) {
  return new Promise((res, rej) => {
    if (!file || !file.type.startsWith('image/')) return rej(new Error('File harus berupa gambar.'));
    const r = new FileReader();
    r.onerror = () => rej(new Error('Gagal membaca file.'));
    r.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('Gambar tidak dapat dibuka.'));
      im.onload = () => {
        const sc = Math.min(1, maxW / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL(type, q));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/* ---------- modal & gaya ---------- */
(function () {
  const st = document.createElement('style');
  st.textContent = `
.spp-badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap}
.spp-badge.ok{background:#e3f6ea;color:#07692f}.spp-badge.wt{background:#fff4d6;color:#8a6100}.spp-badge.bl{background:#eceff1;color:#4a5560}.spp-badge.lt{background:#fde4e4;color:#a11a1a}
.spp-badge.j-MIS{background:#e0f2f1;color:#00695c}.spp-badge.j-SMP{background:#e8eaf6;color:#303f9f}.spp-badge.j-SMA{background:#fff3e0;color:#e65100}
.spp-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:14px 0}
.spp-sum>div{background:#fff;border:1px solid var(--b);border-radius:12px;padding:14px;border-left:5px solid var(--g2)}
.spp-sum small{display:block;color:var(--m);font-size:12px}.spp-sum b{font-size:19px;font-family:Lora,Georgia,serif}
.spp-sum .lt{border-left-color:#c62828}.spp-sum .wt{border-left-color:#f5a300}
.spp-kids{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.spp-kid{border:1px solid var(--b);background:#fff;border-radius:10px;padding:8px 14px;cursor:pointer;font:600 14px 'Plus Jakarta Sans',sans-serif;text-align:left}
.spp-kid.on{border-color:var(--g2);background:#e9f4ed}
.spp-pickbar{position:sticky;bottom:0;background:#fff;border-top:3px solid var(--y);padding:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between;box-shadow:0 -6px 18px rgba(0,0,0,.08);border-radius:10px}
.spp-total{font:700 30px Lora,Georgia,serif;color:var(--gd);margin:4px 0}
.spp-bank{background:#f5faf6;border:1px dashed #9dbca8;border-radius:10px;padding:14px;margin:12px 0}
.spp-c{text-align:center;cursor:pointer;font-weight:700;min-width:34px}
.spp-c.ok{background:#e3f6ea;color:#07692f}.spp-c.wt{background:#fff4d6;color:#8a6100}.spp-c.lt{background:#fde4e4;color:#a11a1a}.spp-c.bl{background:#f2f4f5;color:#8a949b}
.spp-mx th,.spp-mx td{padding:5px 6px;font-size:12.5px;white-space:nowrap}
.spp-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px}
.spp-box{background:#fff;border-radius:14px;padding:22px;max-width:520px;width:100%;max-height:90vh;overflow:auto;position:relative}
.spp-box img.big{max-width:100%;border-radius:8px}
.spp-x{position:absolute;right:10px;top:6px;border:0;background:none;font-size:28px;cursor:pointer;color:#666}
.spp-thumb{height:46px;border-radius:6px;cursor:pointer;border:1px solid var(--b)}
.spp-warn{background:#fff8e1;border:1px solid #f0d58a;color:#6b4e00;border-radius:10px;padding:10px 14px;font-size:13px;margin:10px 0}
`;
  document.head.appendChild(st);
})();
function sppModal(h) {
  sppClose();
  const d = document.createElement('div'); d.id = 'sppModal'; d.className = 'spp-modal';
  d.innerHTML = `<div class="spp-box"><button class="spp-x" onclick="sppClose()" aria-label="Tutup">×</button>${h}</div>`;
  d.addEventListener('click', ev => { if (ev.target === d) sppClose(); });
  document.body.appendChild(d);
}
function sppClose() { const d = document.getElementById('sppModal'); if (d) d.remove(); }
function sppZoom(payId) { const p = sppLoad('bayar', []).find(x => x.id === payId); if (p && p.bukti) sppModal(`<h3>Bukti Pembayaran</h3><img class="big" src="${p.bukti}" alt="Bukti pembayaran"><p class="muted-note">${e(p.id)} · ${sppRp(p.total)}</p>`); }

/* ---------- inti: tagihan & pembayaran ---------- */
function sppExpire() {
  const pays = sppLoad('bayar', []), bills = sppLoad('tagihan', []); let ch = false;
  pays.forEach(p => {
    if (p.status === 'Menunggu Bukti' && Date.now() - new Date(p.createdAt).getTime() > SPP_EXPIRE_JAM * 3600e3) {
      p.status = 'Dibatalkan'; p.alasan = 'Kedaluwarsa (bukti tidak diunggah dalam ' + SPP_EXPIRE_JAM + ' jam)';
      bills.forEach(b => { if (p.billIds.includes(b.id) && b.status === 'Menunggu') { b.status = 'Belum'; b.payId = null; } }); ch = true;
    }
  });
  if (ch) { sppSave('bayar', pays); sppSave('tagihan', bills); }
}
function sppInvoiceNo(pays) {
  const d = new Date(), ymd = d.getFullYear() + sppPad(d.getMonth() + 1) + sppPad(d.getDate());
  const n = pays.filter(p => p.id.startsWith('SPP-' + ymd)).length + 1;
  return 'SPP-' + ymd + '-' + String(n).padStart(4, '0');
}
function sppMakePay(sid, billIds, metode, status) {
  const cfg = sppCfg(), bills = sppLoad('tagihan', []), pays = sppLoad('bayar', []), s = sppSantri(sid);
  const items = bills.filter(b => billIds.includes(b.id) && String(b.sid) === String(sid) && b.status === 'Belum');
  if (!s || !items.length || items.length !== billIds.length) return null;
  const sub = items.reduce((a, b) => a + Number(b.nominal), 0);
  let unik = 0;
  if (cfg.kodeUnik && metode !== 'Tunai') {
    const used = new Set(pays.filter(p => p.status === 'Menunggu Bukti' || p.status === 'Menunggu Verifikasi').map(p => p.total));
    for (let i = 0; i < 60; i++) { const u = 1 + Math.floor(Math.random() * 499); if (!used.has(sub + u)) { unik = u; break; } }
  }
  const now = new Date().toISOString();
  const p = { id: sppInvoiceNo(pays), sid: s.id, jenjang: sppJenjang(s), billIds: items.map(b => b.id), subtotal: sub, unik, total: sub + unik, metode, status, bukti: '', createdAt: now };
  if (status === 'Lunas') { p.paidAt = now; p.verifiedAt = now; p.oleh = 'Admin'; }
  items.forEach(b => { b.status = status === 'Lunas' ? 'Lunas' : 'Menunggu'; b.payId = p.id; b.metode = metode; if (status === 'Lunas') b.paidAt = now; });
  pays.push(p);
  if (!sppSave('bayar', pays) || !sppSave('tagihan', bills)) return null;
  return p;
}
function sppReleaseBills(p, bills) { bills.forEach(b => { if (p.billIds.includes(b.id) && b.status !== 'Lunas') { b.status = 'Belum'; b.payId = null; b.metode = null; } }); }

/* =====================================================================
   PORTAL WALI SANTRI
   ===================================================================== */
/* ---------- akun wali: daftar dengan No. HP, diverifikasi admin ---------- */
const sppPhone = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('62')) d = '0' + d.slice(2); else if (d.startsWith('8')) d = '0' + d; return d; };
async function sppHash(pw, salt) {
  try { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '|' + pw)); return 'h1:' + [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (x) { return 'p0:' + pw; }
}
function sppWaliAcc() { const id = sessionStorage.alhWaliAcc; if (!id) return null; return sppLoad('wali', []).find(a => a.id === id && a.status === 'Aktif') || null; }
function sppWaliIds() { const a = sppWaliAcc(); return a ? (a.anak || []).map(String).filter(id => sppSantri(id)) : []; }
function sppNisList(v) { return [...new Set(String(v || '').split(/[,;\s]+/).map(x => x.trim()).filter(Boolean))]; }
function sppSay(t, ok) { const m = document.getElementById('sppLoginMsg'); if (m) m.innerHTML = ok ? `<div class="msg">${e(t)}</div>` : `<div class="spp-warn">${e(t)}</div>`; }

function sppLoginView() {
  const daftar = SPP_W.mode === 'daftar', cfg = sppCfg();
  const tabs = `<div class="tabs"><button class="${!daftar ? 'on' : ''}" onclick="SPP_W.mode='masuk';R()">Masuk</button><button class="${daftar ? 'on' : ''}" onclick="SPP_W.mode='daftar';R()">Daftar Akun Baru</button></div>`;
  const wa = cfg.wa ? ` <a href="${sppWaLink(cfg.wa, 'Assalamu’alaikum, saya wali santri dan lupa password Portal Wali.')}" target="_blank" rel="noopener">Hubungi via WhatsApp</a>` : '';
  if (!daftar) return `<div class="card" style="max-width:460px"><h3>Portal Wali Santri</h3>${tabs}<form onsubmit="sppWaliLogin(event);return false"><label>Nomor HP</label><input name="hp" type="tel" inputmode="tel" placeholder="08xxxxxxxxxx" required autocomplete="username"><label>Password</label><input name="pw" type="password" required autocomplete="current-password"><br><button class="btn">Masuk</button></form><div id="sppLoginMsg"></div><p class="muted-note">Belum punya akun? Pilih “Daftar Akun Baru”. Lupa password? Hubungi sekretariat pesantren untuk mendapat password baru.${wa}</p></div>`;
  return `<div class="card" style="max-width:460px"><h3>Portal Wali Santri</h3>${tabs}<form onsubmit="sppWaliRegister(event);return false"><label>Nama wali</label><input name="nama" required><label>Nomor HP (untuk masuk)</label><input name="hp" type="tel" inputmode="tel" placeholder="08xxxxxxxxxx" required><label>Buat password (min. 6 karakter)</label><input name="pw" type="password" minlength="6" required autocomplete="new-password"><label>Ulangi password</label><input name="pw2" type="password" minlength="6" required autocomplete="new-password"><label>NIS anak (pisahkan koma jika lebih dari satu)</label><input name="nis" required placeholder="mis. 2024001, 2024002"><br><button class="btn">Kirim Pendaftaran</button></form><div id="sppLoginMsg"></div><p class="muted-note">Akun aktif setelah diverifikasi sekretariat pesantren.</p></div>`;
}
async function sppWaliRegister(ev) {
  ev.preventDefault(); const f = ev.target, d = Object.fromEntries(new FormData(f)), hp = sppPhone(d.hp);
  if (hp.length < 9 || hp.length > 14) return sppSay('Nomor HP tidak valid.');
  if (String(d.pw).length < 6) return sppSay('Password minimal 6 karakter.');
  if (d.pw !== d.pw2) return sppSay('Ulangi password tidak sama.');
  const nis = sppNisList(d.nis); if (!nis.length) return sppSay('Isi NIS anak.');
  const miss = nis.filter(n => !S.some(s => String(s.nis).trim() === n)); if (miss.length) return sppSay('NIS tidak ditemukan: ' + miss.join(', ') + '. Periksa kembali.');
  const list = sppLoad('wali', []); if (list.some(a => a.hp === hp)) return sppSay('Nomor HP sudah terdaftar. Jika lupa password, hubungi sekretariat.');
  const id = sppUid('w_');
  list.push({ id, nama: String(d.nama).trim(), hp, hash: await sppHash(d.pw, id), anak: [], anakReq: nis, status: 'Menunggu', createdAt: new Date().toISOString() });
  if (!sppSave('wali', list)) return;
  f.reset(); sppSay('Pendaftaran terkirim. Mohon tunggu verifikasi sekretariat, lalu masuk dengan nomor HP dan password Anda.', true);
}
async function sppWaliLogin(ev) {
  ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target)), hp = sppPhone(d.hp);
  let fail = {}; try { fail = JSON.parse(sessionStorage.alhWaliFail || '{}'); } catch (x) { }
  if (fail.until && Date.now() < fail.until) return sppSay('Terlalu banyak percobaan gagal. Coba lagi beberapa menit lagi.');
  const a = sppLoad('wali', []).find(x => x.hp === hp);
  if (!a || (await sppHash(d.pw, a.id)) !== a.hash) {
    fail.n = (fail.n || 0) + 1; if (fail.n >= 5) fail = { n: 0, until: Date.now() + 5 * 60e3 };
    sessionStorage.alhWaliFail = JSON.stringify(fail); return sppSay('Nomor HP atau password salah.');
  }
  sessionStorage.alhWaliFail = '{}';
  if (a.status === 'Menunggu') return sppSay('Akun Anda masih menunggu verifikasi sekretariat.');
  if (a.status !== 'Aktif') return sppSay('Akun tidak aktif. Hubungi sekretariat pesantren.');
  sessionStorage.alhWaliAcc = a.id; SPP_W.cur = null; SPP_W.view = 'list'; SPP_W.pick = []; SPP_W.addOpen = false; R();
}
function sppWaliLogout() { sessionStorage.removeItem('alhWaliAcc'); SPP_W.cur = null; SPP_W.pick = []; SPP_W.view = 'list'; R(); }
function sppPwView(forced) {
  return `<div class="card" style="margin-top:14px;max-width:460px"><h3>${forced ? 'Buat Password Baru' : 'Ganti Password'}</h3>${forced ? '<p class="muted-note">Password Anda baru direset oleh sekretariat. Buat password baru untuk melanjutkan.</p>' : ''}<form onsubmit="sppWaliChangePw(event);return false">${forced ? '' : '<label>Password saat ini</label><input name="old" type="password" required>'}<label>Password baru (min. 6 karakter)</label><input name="pw" type="password" minlength="6" required autocomplete="new-password"><label>Ulangi password baru</label><input name="pw2" type="password" minlength="6" required autocomplete="new-password"><br><button class="btn">Simpan</button>${forced ? '' : ' <button type="button" class="btn o" onclick="SPP_W.view=\'list\';R()">Batal</button>'}</form><div id="sppLoginMsg"></div></div>`;
}
async function sppWaliChangePw(ev) {
  ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target)), list = sppLoad('wali', []), a = list.find(x => x.id === sessionStorage.alhWaliAcc); if (!a) return;
  if (!a.mustChange && (await sppHash(d.old, a.id)) !== a.hash) return sppSay('Password saat ini salah.');
  if (String(d.pw).length < 6) return sppSay('Password minimal 6 karakter.'); if (d.pw !== d.pw2) return sppSay('Ulangi password tidak sama.');
  a.hash = await sppHash(d.pw, a.id); a.mustChange = false; if (!sppSave('wali', list)) return;
  alert('Password berhasil diganti.'); SPP_W.view = 'list'; R();
}
function sppWaliAddKid(ev) {
  ev.preventDefault(); const nis = String(new FormData(ev.target).get('nis') || '').trim(), list = sppLoad('wali', []), a = list.find(x => x.id === sessionStorage.alhWaliAcc); if (!a || !nis) return;
  const s = S.find(x => String(x.nis).trim() === nis); if (!s) return sppSay('NIS tidak ditemukan.');
  if ((a.anak || []).map(String).includes(String(s.id))) return sppSay('Anak ini sudah terhubung ke akun Anda.');
  a.anakReq = a.anakReq || []; if (a.anakReq.includes(nis)) return sppSay('Pengajuan untuk NIS ini sedang menunggu verifikasi.');
  a.anakReq.push(nis); if (!sppSave('wali', list)) return; SPP_W.addOpen = false; alert('Pengajuan terkirim. Anak akan muncul setelah diverifikasi sekretariat.'); R();
}
function sppWaliSel(id) { SPP_W.cur = String(id); SPP_W.pick = []; SPP_W.view = 'list'; SPP_W.ta = null; R(); }
function sppWaliTa(v) { SPP_W.ta = Number(v); SPP_W.pick = []; R(); }

function waliPortal() {
  const acc = sppWaliAcc();
  if (!acc) { sessionStorage.removeItem('alhWaliAcc'); return sppLoginView(); }
  const ids = sppWaliIds();
  if (acc.mustChange) return `<div class="card"><b>${e(acc.nama)}</b></div>` + sppPwView(true);
  const reqN = (acc.anakReq || []).length, addForm = `<form onsubmit="sppWaliAddKid(event);return false" class="f2" style="align-items:end"><div><label>NIS anak yang ingin ditambahkan</label><input name="nis" required></div><div><button class="btn">Ajukan</button></div></form><div id="sppLoginMsg"></div>`;
  if (!ids.length) return `<div class="card"><h3 style="margin:0">Assalamu’alaikum, ${e(acc.nama)}</h3><p>${reqN ? 'Data anak Anda masih menunggu verifikasi sekretariat.' : 'Belum ada anak yang terhubung ke akun ini.'}</p>${addForm}<br><button class="btn s r" onclick="sppWaliLogout()">Keluar</button></div>`;
  sppExpire();
  if (!SPP_W.cur || !ids.includes(String(SPP_W.cur))) SPP_W.cur = ids[0];
  const s = sppSantri(SPP_W.cur), cfg = sppCfg(), j = sppJenjang(s);
  const kids = ids.map(id => { const k = sppSantri(id); return `<button class="spp-kid ${String(id) === String(SPP_W.cur) ? 'on' : ''}" onclick="sppWaliSel('${id}')">${e(k.nama)}<br><small>${e(k.kelas)} · ${e(sppJenjang(k) || '-')}</small></button>`; }).join('');
  const head = `<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><h3 style="margin:0">Assalamu’alaikum, ${e(acc.nama)}</h3><span class="muted-note">Data pembayaran SPP putra/putri Anda${reqN ? ' · ' + reqN + ' pengajuan anak menunggu verifikasi' : ''}</span></div><div class="noprint"><button class="btn s o" onclick="SPP_W.addOpen=!SPP_W.addOpen;R()">+ Tambah anak</button> <button class="btn s o" onclick="SPP_W.view='pw';R()">Ganti password</button> <button class="btn s r" onclick="sppWaliLogout()">Keluar</button></div></div>
<div class="spp-kids">${kids}</div>
${SPP_W.addOpen ? addForm : ''}</div>`;
  if (SPP_W.view === 'pw') return head + sppPwView(false);
  if (SPP_W.view === 'pay' && SPP_W.pay) return head + sppPayView(SPP_W.pay);

  const bills = sppLoad('tagihan', []).filter(b => String(b.sid) === String(s.id));
  const tas = [...new Set(bills.map(b => b.ta))].sort((a, b) => b - a);
  if (!SPP_W.ta || !tas.includes(SPP_W.ta)) SPP_W.ta = tas.includes(cfg.tahunAjaran) ? cfg.tahunAjaran : (tas[0] || cfg.tahunAjaran);
  const list = bills.filter(b => b.ta === SPP_W.ta).sort((a, b) => a.ym.localeCompare(b.ym));
  const sum = { lunas: 0, tunggu: 0, tunggak: 0, sisa: 0 };
  list.forEach(b => { const n = Number(b.nominal); if (b.status === 'Lunas') sum.lunas += n; else if (b.status === 'Menunggu') sum.tunggu += n; else { sum.sisa += n; if (sppLate(b, cfg)) sum.tunggak += n; } });
  const rows = list.map(b => {
    const late = sppLate(b, cfg), st = b.status === 'Lunas' ? '<span class="spp-badge ok">Lunas</span>' : b.status === 'Menunggu' ? '<span class="spp-badge wt">Menunggu verifikasi</span>' : late ? '<span class="spp-badge lt">Terlambat</span>' : '<span class="spp-badge bl">Belum dibayar</span>';
    const [y, m] = b.ym.split('-').map(Number), due = sppPad(cfg.jatuhTempo) + ' ' + SPP_BLN[(m + 5) % 12].slice(0, 3) + ' ' + y;
    const act = b.status === 'Belum' ? `<input type="checkbox" ${SPP_W.pick.includes(b.id) ? 'checked' : ''} onchange="sppPick('${b.id}',this.checked)" aria-label="Pilih ${e(sppBillLabel(b))}" style="width:auto">`
      : b.status === 'Menunggu' ? `<button class="btn s o" onclick="SPP_W.view='pay';SPP_W.pay='${b.payId}';R()">Lihat</button>`
        : `<button class="btn s o" onclick="sppReceipt('${b.payId}')">Kwitansi</button>`;
    return `<tr><td><b>${e(sppBillLabel(b))}</b><br><small class="muted-note">Jatuh tempo ${due}</small></td><td>${sppRp(b.nominal)}</td><td>${st}</td><td style="text-align:center">${act}</td></tr>`;
  }).join('');
  const hist = sppLoad('bayar', []).filter(p => String(p.sid) === String(s.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sm = { 'Lunas': 'ok', 'Menunggu Verifikasi': 'wt', 'Menunggu Bukti': 'wt', 'Ditolak': 'lt', 'Dibatalkan': 'bl' };
  const histRows = hist.map(p => `<tr><td>${e(p.id)}</td><td>${sppFmtDate(p.createdAt)}</td><td>${p.billIds.length} bulan</td><td>${sppRp(p.total)}</td><td>${e(p.metode)}</td><td><span class="spp-badge ${sm[p.status] || 'bl'}">${e(p.status)}</span></td><td>${p.status === 'Lunas' ? `<button class="btn s o" onclick="sppReceipt('${p.id}')">Kwitansi</button>` : (p.status === 'Menunggu Bukti' || p.status === 'Menunggu Verifikasi') ? `<button class="btn s o" onclick="SPP_W.view='pay';SPP_W.pay='${p.id}';R()">Lihat</button>` : ''}</td></tr>`).join('');
  const metodeOpt = (cfg.bank || cfg.noRek ? '<option>Transfer Bank</option>' : '') + (cfg.qris ? '<option>QRIS</option>' : '');
  return head + `<div class="card"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between"><div><b>${e(s.nama)}</b> <span class="spp-badge j-${j}">${e(j || '-')}</span><br><span class="muted-note">NIS ${e(s.nis)} · Kelas ${e(s.kelas)}</span></div>
<div><label style="margin:0">Tahun Ajaran</label><select onchange="sppWaliTa(this.value)" style="min-width:150px">${(tas.length ? tas : [SPP_W.ta]).map(t => `<option value="${t}" ${t === SPP_W.ta ? 'selected' : ''}>${sppTaLabel(t)}</option>`).join('')}</select></div></div>
<div class="spp-sum"><div><small>Sudah dibayar</small><b>${sppRp(sum.lunas)}</b></div><div class="wt"><small>Menunggu verifikasi</small><b>${sppRp(sum.tunggu)}</b></div><div class="lt"><small>Tunggakan (lewat jatuh tempo)</small><b>${sppRp(sum.tunggak)}</b></div><div><small>Belum dibayar (total)</small><b>${sppRp(sum.sisa)}</b></div></div>
${list.length ? `<div class="sc"><table><tr><th>Bulan</th><th>Nominal</th><th>Status</th><th style="text-align:center">Pilih</th></tr>${rows}</table></div>` : `<div class="spp-warn">Tagihan SPP tahun ajaran ini belum diterbitkan oleh sekretariat.</div>`}
${list.some(b => b.status === 'Belum') ? (metodeOpt ? `<div class="spp-pickbar noprint"><div>Terpilih: <b id="sppPickN">0</b> bulan · Total <b id="sppPickT">${sppRp(0)}</b></div><div style="display:flex;gap:8px;align-items:center"><select id="sppMetode" style="width:auto">${metodeOpt}</select><button class="btn" onclick="sppWaliProceed()">Bayar Sekarang</button></div></div>` : `<div class="spp-warn">Pembayaran online belum diaktifkan. Silakan bayar langsung di sekretariat pesantren.</div>`) : ''}</div>
<div class="card" style="margin-top:14px"><h3>Riwayat Pembayaran</h3>${hist.length ? `<div class="sc"><table><tr><th>No. Invoice</th><th>Tanggal</th><th>Item</th><th>Total</th><th>Metode</th><th>Status</th><th></th></tr>${histRows}</table></div>` : '<p class="muted-note">Belum ada pembayaran.</p>'}</div>`;
}
function sppPick(id, on) {
  const i = SPP_W.pick.indexOf(id);
  if (on && i < 0) SPP_W.pick.push(id); if (!on && i >= 0) SPP_W.pick.splice(i, 1);
  const bills = sppLoad('tagihan', []), tot = bills.filter(b => SPP_W.pick.includes(b.id)).reduce((a, b) => a + Number(b.nominal), 0);
  const n = document.getElementById('sppPickN'), t = document.getElementById('sppPickT');
  if (n) n.textContent = SPP_W.pick.length; if (t) t.textContent = sppRp(tot);
}
function sppWaliProceed() {
  if (!SPP_W.pick.length) { alert('Pilih minimal satu bulan yang akan dibayar.'); return; }
  const m = document.getElementById('sppMetode'), metode = m ? m.value : 'Transfer Bank';
  const p = sppMakePay(SPP_W.cur, SPP_W.pick.slice(), metode, 'Menunggu Bukti');
  if (!p) { alert('Tagihan tidak dapat diproses. Muat ulang halaman lalu coba lagi.'); SPP_W.pick = []; R(); return; }
  SPP_W.pick = []; SPP_W.view = 'pay'; SPP_W.pay = p.id; R();
}
function sppPayView(payId) {
  const p = sppLoad('bayar', []).find(x => x.id === payId), cfg = sppCfg();
  if (!p || String(p.sid) !== String(SPP_W.cur)) { SPP_W.view = 'list'; return '<div class="card">Pembayaran tidak ditemukan.</div>'; }
  const bills = sppLoad('tagihan', []).filter(b => p.billIds.includes(b.id)), months = bills.map(sppBillLabel).join(', ');
  const back = `<button class="btn s o noprint" onclick="SPP_W.view='list';R()">← Kembali ke tagihan</button>`;
  const wa = cfg.wa ? `<a class="btn s o" target="_blank" rel="noopener" href="${sppWaLink(cfg.wa, 'Assalamu’alaikum, saya wali dari ' + (sppSantri(p.sid) || {}).nama + '. Konfirmasi pembayaran SPP ' + p.id)}">Hubungi sekretariat (WhatsApp)</a>` : '';
  let body = '';
  if (p.status === 'Menunggu Bukti') {
    const exp = new Date(new Date(p.createdAt).getTime() + SPP_EXPIRE_JAM * 3600e3);
    const dest = p.metode === 'QRIS' && cfg.qris ? `<div class="spp-bank" style="text-align:center"><b>Scan QRIS</b><br><img src="${cfg.qris}" alt="QRIS" style="max-width:260px;width:100%"></div>`
      : `<div class="spp-bank"><b>Transfer ke rekening:</b><br>${e(cfg.bank)} · <b style="font-size:18px">${e(cfg.noRek)}</b><br>a.n. ${e(cfg.atasNama)}</div>`;
    body = `<p>Lakukan pembayaran sesuai nominal di bawah${p.unik ? ' <b>(termasuk 3 digit kode unik)</b>' : ''}, lalu unggah bukti pembayaran.</p><div class="spp-total">${sppRp(p.total)}</div>${p.unik ? `<span class="muted-note">SPP ${sppRp(p.subtotal)} + kode unik ${p.unik}</span>` : ''}${dest}${cfg.petunjuk ? `<p class="muted-note">${e(cfg.petunjuk).replace(/\n/g, '<br>')}</p>` : ''}
<form onsubmit="return sppSubmitBukti(event,'${p.id}')"><div class="f2"><div><label>Nama pengirim / pemilik rekening</label><input name="pengirim" required></div><div><label>Tanggal pembayaran</label><input name="tgl" type="date" value="${new Date().toISOString().slice(0, 10)}" required></div></div><label>Foto / screenshot bukti pembayaran</label><input name="bukti" type="file" accept="image/*" required><br><button class="btn">Kirim Bukti Pembayaran</button> <button type="button" class="btn r" onclick="sppWaliCancel('${p.id}')">Batalkan</button></form><p class="muted-note">Batas unggah bukti: ${sppFmtDate(exp.toISOString())}. Setelah lewat, tagihan kembali berstatus belum dibayar.</p>`;
  } else if (p.status === 'Menunggu Verifikasi') {
    body = `<div class="msg" style="background:#fff4d6;color:#8a6100">Bukti pembayaran sudah diterima. Sekretariat akan memverifikasi pembayaran Anda.</div><div class="spp-total">${sppRp(p.total)}</div><p>Pengirim: <b>${e(p.pengirim || '-')}</b> · Tgl bayar: ${e(p.tglBayar || '-')}</p>${p.bukti ? `<img class="spp-thumb" style="height:90px" src="${p.bukti}" onclick="sppZoom('${p.id}')" alt="Bukti">` : ''}<p>${wa}</p>`;
  } else if (p.status === 'Lunas') {
    body = `<div class="msg">Pembayaran telah diverifikasi dan dinyatakan <b>LUNAS</b>. Jazakumullahu khairan.</div><div class="spp-total">${sppRp(p.total)}</div><button class="btn" onclick="sppReceipt('${p.id}')">Cetak Kwitansi</button>`;
  } else if (p.status === 'Ditolak') {
    body = `<div class="spp-warn" style="background:#fde4e4;border-color:#f1b0b0;color:#8a1a1a"><b>Pembayaran ditolak.</b><br>Alasan: ${e(p.alasan || '-')}</div><p>Tagihan kembali berstatus belum dibayar. Silakan lakukan pembayaran ulang atau hubungi sekretariat.</p><p>${wa}</p>`;
  } else {
    body = `<div class="spp-warn">Pembayaran ini dibatalkan${p.alasan ? ': ' + e(p.alasan) : ''}.</div>`;
  }
  return `<div class="card" style="margin-top:14px">${back}<h3 style="margin-top:14px">Pembayaran ${e(p.id)}</h3><p class="muted-note">${e(months)} · ${e(p.metode)} · <span class="spp-badge ${p.status === 'Lunas' ? 'ok' : p.status === 'Ditolak' ? 'lt' : 'wt'}">${e(p.status)}</span></p>${body}</div>`;
}
async function sppSubmitBukti(ev, payId) {
  ev.preventDefault(); const f = ev.target, d = new FormData(f), file = d.get('bukti'), btn = f.querySelector('button.btn');
  if (btn) btn.disabled = true;
  try {
    const img = await sppImg(file, 1000, 'image/jpeg', 0.72), pays = sppLoad('bayar', []), p = pays.find(x => x.id === payId);
    if (!p || p.status !== 'Menunggu Bukti') { alert('Status pembayaran sudah berubah.'); R(); return false; }
    p.bukti = img; p.pengirim = String(d.get('pengirim') || '').trim(); p.tglBayar = d.get('tgl'); p.status = 'Menunggu Verifikasi'; p.buktiAt = new Date().toISOString();
    if (!sppSave('bayar', pays)) { if (btn) btn.disabled = false; return false; }
    R();
  } catch (err) { alert(err.message || 'Gagal memproses gambar.'); if (btn) btn.disabled = false; }
  return false;
}
function sppWaliCancel(payId) {
  if (!confirm('Batalkan pembayaran ini? Tagihan akan kembali berstatus belum dibayar.')) return;
  const pays = sppLoad('bayar', []), bills = sppLoad('tagihan', []), p = pays.find(x => x.id === payId);
  if (!p || p.status !== 'Menunggu Bukti') return;
  p.status = 'Dibatalkan'; p.alasan = 'Dibatalkan oleh wali'; sppReleaseBills(p, bills);
  sppSave('bayar', pays); sppSave('tagihan', bills); SPP_W.view = 'list'; R();
}

/* ---------- kwitansi ---------- */
function sppReceipt(payId) {
  const p = sppLoad('bayar', []).find(x => x.id === payId); if (!p || p.status !== 'Lunas') { alert('Kwitansi hanya tersedia untuk pembayaran lunas.'); return; }
  const s = sppSantri(p.sid) || {}, bills = sppLoad('tagihan', []).filter(b => p.billIds.includes(b.id)).sort((a, b) => a.ym.localeCompare(b.ym));
  const logo = new URL('logo.png', location.href).href, ta = bills.length ? sppTaLabel(bills[0].ta) : '';
  const items = bills.map(b => `<tr><td>SPP ${e(sppBillLabel(b))} (${e(p.jenjang || '')})</td><td style="text-align:right">${sppRp(b.nominal)}</td></tr>`).join('') + (p.unik ? `<tr><td>Kode unik transfer</td><td style="text-align:right">${sppRp(p.unik)}</td></tr>` : '');
  const w = window.open('', '_blank'); if (!w) { alert('Izinkan pop-up untuk mencetak kwitansi.'); return; }
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  w.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Kwitansi ${e(p.id)}</title><style>@page{size:A5 landscape;margin:10mm}body{font-family:Arial,sans-serif;font-size:13px;color:#111}.h{display:flex;gap:12px;align-items:center;border-bottom:3px double #064626;padding-bottom:8px}.h img{height:60px}.h b{font-size:16px;color:#064626}table{width:100%;border-collapse:collapse;margin:10px 0}td{padding:4px 6px;border-bottom:1px solid #ddd}.t td{border:0;padding:2px 6px}.tot{font-size:16px;font-weight:700}.sg{display:flex;justify-content:space-between;margin-top:18px}.stamp{border:3px solid #0b6b3a;color:#0b6b3a;font-weight:700;padding:2px 14px;transform:rotate(-8deg);display:inline-block;font-size:18px}</style></head><body>
<div class="h"><img src="${logo}"><div><b>PONDOK PESANTREN AL-HUSNA MARINDAL</b><br>Jl. Pelajar Pasar III Dusun X, Marindal I, Patumbak, Deli Serdang</div></div>
<h3 style="text-align:center;margin:10px 0">KWITANSI PEMBAYARAN SPP</h3>
<table class="t"><tr><td width="28%">No. Kwitansi</td><td>: ${e(p.id)}</td></tr><tr><td>Telah terima dari</td><td>: Wali santri <b>${e(s.nama || '-')}</b> (NIS ${e(s.nis || '-')})</td></tr><tr><td>Kelas / Jenjang</td><td>: ${e(s.kelas || '-')} / ${e(p.jenjang || '-')}</td></tr><tr><td>Tahun Ajaran</td><td>: ${e(ta)}</td></tr><tr><td>Metode</td><td>: ${e(p.metode)}</td></tr></table>
<table>${items}<tr><td class="tot">Total</td><td class="tot" style="text-align:right">${sppRp(p.total)}</td></tr></table>
<p><i>Terbilang: ${e(cap(sppTerbilang(p.total)))} rupiah</i></p>
<div class="sg"><div><span class="stamp">LUNAS</span><br><small>${sppFmtDate(p.paidAt)}</small></div><div style="text-align:center">Bendahara Pesantren<br><br><br><br>( ......................... )</div></div>
<script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
}

/* =====================================================================
   ADMIN > PEMBAYARAN SPP
   ===================================================================== */
function pSPP() {
  sppExpire();
  const cfg = sppCfg(), bills = sppLoad('tagihan', []), pays = sppLoad('bayar', []);
  if (!sppF.ta) sppF.ta = cfg.tahunAjaran;
  const pend = pays.filter(p => p.status === 'Menunggu Verifikasi').length, pw = sppLoad('wali', []).filter(a => a.status === 'Menunggu' || (a.anakReq || []).length).length;
  const subs = [['ringkas', 'Ringkasan'], ['tagihan', 'Tagihan & Status'], ['verif', 'Verifikasi' + (pend ? ' (' + pend + ')' : '')], ['atur', 'Pengaturan & Tarif'], ['akses', 'Akun Wali' + (pw ? ' (' + pw + ')' : '')]];
  const nav = `<div class="tabs noprint">${subs.map(t => `<button class="${sppSub === t[0] ? 'on' : ''}" onclick="sppSub='${t[0]}';T()">${t[1]}</button>`).join('')}</div>`;
  const banner = `<div class="spp-warn noprint"><b>Mode penyimpanan: browser.</b> Data SPP tersimpan di perangkat ini saja. Wali yang membuka website dari HP lain <u>tidak</u> akan melihat data ini sampai website dihubungkan ke database (lihat README-SPP.txt).</div>`;
  const pg = ({ ringkas: sppTabRingkas, tagihan: sppTabTagihan, verif: sppTabVerif, atur: sppTabAtur, akses: sppTabAkses }[sppSub] || sppTabRingkas)(cfg, bills, pays);
  return `<h3>Pembayaran SPP</h3>${banner}${nav}${pg}`;
}
function sppTaSelect() {
  const cfg = sppCfg(), bills = sppLoad('tagihan', []), set = new Set([cfg.tahunAjaran, cfg.tahunAjaran + 1, ...bills.map(b => b.ta)]);
  return `<select onchange="sppF.ta=Number(this.value);T()" style="width:auto">${[...set].sort((a, b) => b - a).map(t => `<option value="${t}" ${t === sppF.ta ? 'selected' : ''}>TA ${sppTaLabel(t)}</option>`).join('')}</select>`;
}

/* --- Ringkasan --- */
function sppStats(bills, ta, cfg) {
  const sm = sppSMap(), out = {}; SPP_J.forEach(j => out[j] = { santri: new Set(), tagih: 0, lunas: 0, tunggu: 0, tunggak: 0 });
  bills.filter(b => b.ta == ta).forEach(b => {
    const o = out[b.jenjang]; if (!o || !sm.has(String(b.sid))) return; const n = Number(b.nominal);
    o.santri.add(String(b.sid)); o.tagih += n;
    if (b.status === 'Lunas') o.lunas += n; else if (b.status === 'Menunggu') o.tunggu += n; else if (sppLate(b, cfg)) o.tunggak += n;
  });
  return out;
}
function sppTabRingkas(cfg, bills, pays) {
  const st = sppStats(bills, sppF.ta, cfg), pend = pays.filter(p => p.status === 'Menunggu Verifikasi').length;
  const cards = SPP_J.map(j => { const o = st[j], pct = o.tagih ? Math.round(o.lunas / o.tagih * 100) : 0; return `<div class="card"><span class="spp-badge j-${j}">${j}</span> <small class="muted-note">${o.santri.size} santri · tarif ${sppRp(cfg.tarif[j])}/bulan</small>
<div class="spp-sum" style="grid-template-columns:1fr 1fr"><div><small>Total tagihan</small><b>${sppRp(o.tagih)}</b></div><div><small>Terbayar (${pct}%)</small><b>${sppRp(o.lunas)}</b></div><div class="wt"><small>Menunggu verifikasi</small><b>${sppRp(o.tunggu)}</b></div><div class="lt"><small>Tunggakan</small><b>${sppRp(o.tunggak)}</b></div></div></div>`; }).join('');
  const noJ = S.filter(s => !sppJenjang(s)).length;
  return `<div class="noprint" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0">${sppTaSelect()}<button class="btn s o" onclick="sppExportRekap()">Unduh Rekap Excel</button></div>
${pend ? `<div class="spp-warn"><b>${pend} pembayaran</b> menunggu verifikasi. <button class="btn s" onclick="sppSub='verif';T()">Buka Verifikasi</button></div>` : ''}
${noJ ? `<div class="spp-warn">${noJ} santri belum terdeteksi jenjangnya (kelas tidak dikenali). Atur jenjang di menu Data Santri.</div>` : ''}
<div class="f2">${cards}</div>`;
}

/* --- Tagihan & status --- */
function sppTabTagihan(cfg, bills, pays) {
  const months = sppMonths(sppF.ta), idx = {};
  bills.forEach(b => { if (b.ta == sppF.ta) idx[b.sid + '|' + b.ym] = b; });
  const kelas = [...new Set(S.map(s => s.kelas).filter(Boolean))].sort();
  const list = S.filter(s => (!sppF.j || sppJenjang(s) === sppF.j) && (!sppF.k || s.kelas === sppF.k) && (!sppF.q || (s.nama + ' ' + s.nis).toLowerCase().includes(sppF.q.toLowerCase())));
  const rows = list.map(s => {
    let sisa = 0;
    const cells = months.map(m => {
      const b = idx[s.id + '|' + m.ym]; if (!b) return '<td style="text-align:center;color:#ccc">–</td>';
      const late = sppLate(b, cfg), cls = b.status === 'Lunas' ? 'ok' : b.status === 'Menunggu' ? 'wt' : late ? 'lt' : 'bl', ic = b.status === 'Lunas' ? '✓' : b.status === 'Menunggu' ? '⏳' : late ? '!' : '•';
      if (b.status !== 'Lunas') sisa += Number(b.nominal);
      return `<td class="spp-c ${cls}" onclick="sppCell('${b.id}')" title="${e(m.label)} · ${sppRp(b.nominal)} · ${e(b.status)}">${ic}</td>`;
    }).join('');
    return `<tr><td><b>${e(s.nama)}</b><br><small>${e(s.nis)}</small></td><td>${e(s.kelas)}</td><td><span class="spp-badge j-${sppJenjang(s)}">${e(sppJenjang(s) || '-')}</span></td>${cells}<td style="text-align:right">${sppRp(sisa)}</td></tr>`;
  }).join('');
  return `<div class="import-panel noprint"><b>Terbitkan Tagihan SPP</b><p class="muted-note">Membuat tagihan 12 bulan (Juli–Juni) sesuai tarif jenjang. Tagihan yang sudah ada tidak diduplikasi, jadi aman dijalankan lagi untuk santri baru.</p>
<form onsubmit="return sppGenerate(this)" class="f2" style="align-items:end"><div><label>Jenjang</label><select name="j"><option value="">Semua jenjang</option>${SPP_J.map(j => `<option>${j}</option>`).join('')}</select></div><div><label>Mulai bulan</label><select name="mulai">${SPP_BLN.map((b, i) => `<option value="${i}">${b}</option>`).join('')}</select></div><div><button class="btn">Terbitkan TA ${sppTaLabel(sppF.ta)}</button></div></form></div>
<div class="f2 noprint" style="align-items:end"><div><label>Tahun ajaran</label>${sppTaSelect()}</div><div><label>Jenjang</label><select onchange="sppF.j=this.value;T()"><option value="">Semua</option>${SPP_J.map(j => `<option ${sppF.j === j ? 'selected' : ''}>${j}</option>`).join('')}</select></div><div><label>Kelas</label><select onchange="sppF.k=this.value;T()"><option value="">Semua</option>${kelas.map(k => `<option ${sppF.k === k ? 'selected' : ''}>${e(k)}</option>`).join('')}</select></div><div><label>Cari</label><input value="${e(sppF.q)}" placeholder="Nama / NIS" onchange="sppF.q=this.value;T()"></div></div>
<p class="muted-note">Klik kotak bulan untuk mencatat bayar tunai, mengubah nominal, atau melihat detail. ✓ lunas · ⏳ menunggu verifikasi · ! terlambat · • belum.</p>
<div class="sc"><table class="spp-mx"><tr><th>Santri</th><th>Kelas</th><th>Jenjang</th>${months.map(m => `<th title="${e(m.label)}">${m.short}</th>`).join('')}<th>Sisa</th></tr>${rows || '<tr><td colspan="16">Tidak ada santri.</td></tr>'}</table></div>`;
}
function sppGenerate(f) {
  const d = Object.fromEntries(new FormData(f)), cfg = sppCfg(), bills = sppLoad('tagihan', []), months = sppMonths(sppF.ta), mulai = Number(d.mulai) || 0;
  const have = new Set(bills.map(b => b.sid + '|' + b.ym)); let add = 0, noJ = 0, noT = new Set();
  S.forEach(s => {
    const j = sppJenjang(s); if (!j) { noJ++; return; } if (d.j && d.j !== j) return;
    if (!(Number(cfg.tarif[j]) > 0)) { noT.add(j); return; }
    months.slice(mulai).forEach(m => { const k = s.id + '|' + m.ym; if (have.has(k)) return; have.add(k); bills.push({ id: sppUid('b_'), sid: s.id, ym: m.ym, ta: sppF.ta, jenjang: j, nominal: Number(cfg.tarif[j]), status: 'Belum', payId: null }); add++; });
  });
  if (add && !sppSave('tagihan', bills)) return false;
  alert(`Tagihan baru dibuat: ${add}` + (noJ ? `\nSantri tanpa jenjang (dilewati): ${noJ}` : '') + (noT.size ? `\nTarif belum diisi untuk: ${[...noT].join(', ')} (atur di Pengaturan & Tarif)` : ''));
  T(); return false;
}
function sppCell(id) {
  const cfg = sppCfg(), b = sppLoad('tagihan', []).find(x => x.id === id); if (!b) return;
  const s = sppSantri(b.sid) || {}, p = b.payId ? sppLoad('bayar', []).find(x => x.id === b.payId) : null;
  let acts = '';
  if (b.status === 'Belum') acts = `<label>Nominal (Rp)</label><input id="sppNom" type="number" min="0" value="${b.nominal}"><br><button class="btn s" onclick="sppSetNominal('${id}')">Simpan nominal</button> <button class="btn" onclick="sppCash('${id}')">Catat Bayar Tunai (Lunas)</button> <button class="btn s r" onclick="sppDelBill('${id}')">Hapus tagihan</button>`;
  else if (b.status === 'Menunggu') acts = `<p>Pembayaran <b>${e(b.payId)}</b> menunggu verifikasi.</p><button class="btn" onclick="sppClose();sppSub='verif';sppF.vs='Menunggu Verifikasi';T()">Buka Verifikasi</button>`;
  else acts = `<p>Lunas · ${sppFmtDate(b.paidAt)} · ${e(b.metode || '')}</p><button class="btn s o" onclick="sppReceipt('${b.payId}')">Cetak Kwitansi</button> <button class="btn s r" onclick="sppRevert('${id}')">Batalkan Pelunasan</button>`;
  sppModal(`<h3>${e(sppBillLabel(b))}</h3><p><b>${e(s.nama || '-')}</b> · ${e(s.kelas || '')} <span class="spp-badge j-${b.jenjang}">${e(b.jenjang)}</span><br>Status: <b>${e(b.status)}</b> · Nominal ${sppRp(b.nominal)}</p>${acts}`);
}
function sppSetNominal(id) {
  const v = Number(document.getElementById('sppNom').value); if (!(v >= 0)) { alert('Nominal tidak valid.'); return; }
  const bills = sppLoad('tagihan', []), b = bills.find(x => x.id === id); if (!b || b.status !== 'Belum') return;
  b.nominal = v; sppSave('tagihan', bills); sppClose(); T();
}
function sppDelBill(id) {
  if (!confirm('Hapus tagihan ini?')) return;
  const bills = sppLoad('tagihan', []), b = bills.find(x => x.id === id); if (!b || b.status !== 'Belum') return;
  sppSave('tagihan', bills.filter(x => x.id !== id)); sppClose(); T();
}
function sppCash(id) {
  const b = sppLoad('tagihan', []).find(x => x.id === id); if (!b || b.status !== 'Belum') return;
  if (!confirm('Catat pembayaran TUNAI ' + sppRp(b.nominal) + ' untuk ' + sppBillLabel(b) + '?')) return;
  const p = sppMakePay(b.sid, [id], 'Tunai', 'Lunas'); sppClose();
  if (p && confirm('Tersimpan. Cetak kwitansi sekarang?')) sppReceipt(p.id);
  T();
}
function sppRevert(id) {
  if (!confirm('Batalkan pelunasan bulan ini? Status kembali menjadi belum dibayar.')) return;
  const bills = sppLoad('tagihan', []), pays = sppLoad('bayar', []), b = bills.find(x => x.id === id); if (!b) return;
  const p = pays.find(x => x.id === b.payId);
  if (p) { p.billIds = p.billIds.filter(x => x !== id); p.subtotal -= Number(b.nominal); p.total -= Number(b.nominal); p.catatan = (p.catatan || '') + ` Pelunasan ${sppBillLabel(b)} dibatalkan admin.`; if (!p.billIds.length) { p.status = 'Dibatalkan'; p.alasan = 'Pelunasan dibatalkan admin'; } }
  b.status = 'Belum'; b.payId = null; b.paidAt = null; b.metode = null;
  sppSave('bayar', pays); sppSave('tagihan', bills); sppClose(); T();
}

/* --- Verifikasi --- */
function sppTabVerif(cfg, bills, pays) {
  const sm = sppSMap(), bm = new Map(bills.map(b => [b.id, b]));
  const sts = ['Menunggu Verifikasi', 'Menunggu Bukti', 'Lunas', 'Ditolak', 'Dibatalkan'];
  const list = pays.filter(p => (!sppF.vs || p.status === sppF.vs) && (!sppF.vj || p.jenjang === sppF.vj)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = list.map(p => {
    const s = sm.get(String(p.sid)) || {}, ms = p.billIds.map(id => bm.get(id)).filter(Boolean).map(sppBillLabel).join(', ');
    const act = p.status === 'Menunggu Verifikasi' ? `<button class="btn s" onclick="sppVerify('${p.id}')">Verifikasi</button> <button class="btn s r" onclick="sppReject('${p.id}')">Tolak</button>` : p.status === 'Lunas' ? `<button class="btn s o" onclick="sppReceipt('${p.id}')">Kwitansi</button>` : '';
    return `<tr><td>${e(p.id)}<br><small>${sppFmtDate(p.createdAt)}</small></td><td><b>${e(s.nama || '-')}</b><br><small>${e(s.kelas || '')}</small></td><td><span class="spp-badge j-${p.jenjang}">${e(p.jenjang || '-')}</span></td><td style="max-width:200px;white-space:normal">${e(ms)}</td><td><b>${sppRp(p.total)}</b><br><small>${e(p.metode)}${p.unik ? ' · unik ' + p.unik : ''}</small></td><td>${p.bukti ? `<img class="spp-thumb" src="${p.bukti}" onclick="sppZoom('${p.id}')" alt="Bukti"><br><small>${e(p.pengirim || '')} ${e(p.tglBayar || '')}</small>` : '-'}</td><td>${e(p.status)}${p.alasan ? '<br><small>' + e(p.alasan) + '</small>' : ''}</td><td>${act}</td></tr>`;
  }).join('');
  return `<div class="f2 noprint"><div><label>Status</label><select onchange="sppF.vs=this.value;T()"><option value="">Semua</option>${sts.map(s => `<option ${sppF.vs === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div><label>Jenjang</label><select onchange="sppF.vj=this.value;T()"><option value="">Semua</option>${SPP_J.map(j => `<option ${sppF.vj === j ? 'selected' : ''}>${j}</option>`).join('')}</select></div></div>
<div class="sc" style="margin-top:12px"><table><tr><th>Invoice</th><th>Santri</th><th>Jenjang</th><th>Bulan</th><th>Total</th><th>Bukti</th><th>Status</th><th></th></tr>${rows || '<tr><td colspan="8">Tidak ada data.</td></tr>'}</table></div>`;
}
function sppVerify(id) {
  const pays = sppLoad('bayar', []), bills = sppLoad('tagihan', []), p = pays.find(x => x.id === id); if (!p || p.status !== 'Menunggu Verifikasi') return;
  if (!confirm('Pastikan dana ' + sppRp(p.total) + ' sudah masuk ke rekening. Verifikasi sebagai LUNAS?')) return;
  const now = new Date().toISOString(); p.status = 'Lunas'; p.paidAt = now; p.verifiedAt = now; p.oleh = 'Admin';
  bills.forEach(b => { if (p.billIds.includes(b.id)) { b.status = 'Lunas'; b.paidAt = now; b.metode = p.metode; } });
  sppSave('bayar', pays); sppSave('tagihan', bills); T();
}
function sppReject(id) {
  const alasan = prompt('Alasan penolakan (akan terlihat oleh wali):', 'Dana belum diterima / nominal tidak sesuai'); if (alasan === null) return;
  const pays = sppLoad('bayar', []), bills = sppLoad('tagihan', []), p = pays.find(x => x.id === id); if (!p || p.status !== 'Menunggu Verifikasi') return;
  p.status = 'Ditolak'; p.alasan = alasan.trim() || '-'; sppReleaseBills(p, bills);
  sppSave('bayar', pays); sppSave('tagihan', bills); T();
}

/* --- Pengaturan & tarif --- */
function sppTabAtur(cfg) {
  return `<div class="card"><h4>Tarif SPP per Jenjang (per bulan)</h4><div class="f2">${SPP_J.map(j => `<div><label><span class="spp-badge j-${j}">${j}</span> Tarif</label><input id="sppT_${j}" type="number" min="0" step="1000" value="${cfg.tarif[j]}"></div>`).join('')}</div>
<div class="f2"><div><label>Tahun ajaran aktif (tahun mulai)</label><input id="sppTA" type="number" value="${cfg.tahunAjaran}"></div><div><label>Jatuh tempo (tanggal tiap bulan)</label><input id="sppDue" type="number" min="1" max="28" value="${cfg.jatuhTempo}"></div></div>
<h4 style="margin-top:20px">Tujuan Pembayaran</h4><div class="f2"><div><label>Nama bank</label><input id="sppBank" value="${e(cfg.bank)}" placeholder="mis. Bank Syariah Indonesia"></div><div><label>Nomor rekening</label><input id="sppRek" value="${e(cfg.noRek)}"></div><div><label>Atas nama</label><input id="sppAn" value="${e(cfg.atasNama)}"></div><div><label>No. WhatsApp sekretariat</label><input id="sppWa" value="${e(cfg.wa)}" placeholder="08xxxxxxxxxx"></div></div>
<label>Petunjuk tambahan untuk wali</label><textarea id="sppPet" rows="3">${e(cfg.petunjuk)}</textarea>
<label>Gambar QRIS (opsional)</label><input type="file" accept="image/*" onchange="sppQris(this)">${cfg.qris ? `<p><img src="${cfg.qris}" style="max-width:140px" alt="QRIS"> <button class="btn s r" onclick="sppDelQris()">Hapus QRIS</button></p>` : ''}
<label style="display:flex;gap:8px;align-items:center"><input id="sppUnik" type="checkbox" style="width:auto" ${cfg.kodeUnik ? 'checked' : ''}> Tambahkan kode unik 1–499 pada nominal transfer agar mudah dicocokkan</label><br><button class="btn" onclick="sppSaveCfg()">Simpan Pengaturan</button></div>
<div class="import-panel"><b>Cadangan Data SPP</b><p class="muted-note">Ekspor seluruh pengaturan, tagihan, pembayaran, dan akun wali ke file JSON (tanpa data santri). Impor akan <u>menggantikan</u> data SPP di browser ini.</p><button class="btn s o" onclick="sppBackup()">Ekspor JSON</button> <label class="btn s o" style="cursor:pointer">Impor JSON<input type="file" accept="application/json" hidden onchange="sppRestore(this)"></label></div>`;
}
function sppSaveCfg() {
  const g = id => document.getElementById(id), c = { tarif: {} };
  SPP_J.forEach(j => c.tarif[j] = Math.max(0, Number(g('sppT_' + j).value) || 0));
  c.tahunAjaran = Number(g('sppTA').value) || sppCfg().tahunAjaran; c.jatuhTempo = Math.min(28, Math.max(1, Number(g('sppDue').value) || 10));
  c.bank = g('sppBank').value.trim(); c.noRek = g('sppRek').value.trim(); c.atasNama = g('sppAn').value.trim(); c.wa = g('sppWa').value.trim(); c.petunjuk = g('sppPet').value; c.kodeUnik = g('sppUnik').checked; c.qris = sppCfg().qris;
  if (sppSave('cfg', c)) { sppF.ta = c.tahunAjaran; alert('Pengaturan tersimpan. Tarif baru berlaku untuk tagihan yang diterbitkan setelah ini; tagihan lama tidak berubah.'); T(); }
}
async function sppQris(input) {
  try { const img = await sppImg(input.files[0], 700, 'image/png'); const c = sppCfg(); c.qris = img; if (sppSave('cfg', c)) T(); } catch (err) { alert(err.message); }
  input.value = '';
}
function sppDelQris() { const c = sppCfg(); c.qris = ''; sppSave('cfg', c); T(); }
function sppBackup() {
  const data = { versi: 1, dibuat: new Date().toISOString(), cfg: sppLoad('cfg', {}), tagihan: sppLoad('tagihan', []), bayar: sppLoad('bayar', []), wali: sppLoad('wali', []) };
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })); a.download = 'al-husna-data-spp.json'; a.click(); URL.revokeObjectURL(a.href);
}
function sppRestore(input) {
  const f = input.files && input.files[0]; if (!f) return; const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result); if (!Array.isArray(d.tagihan) || !Array.isArray(d.bayar)) throw Error('format');
      if (!confirm('Data SPP di browser ini akan DIGANTI dengan isi file. Lanjutkan?')) return;
      sppSave('cfg', d.cfg || {}); sppSave('tagihan', d.tagihan); sppSave('bayar', d.bayar); sppSave('wali', Array.isArray(d.wali) ? d.wali : []); alert('Data SPP dipulihkan.'); T();
    } catch (x) { alert('File tidak valid.'); }
  }; r.readAsText(f); input.value = '';
}

/* --- Akun wali --- */
function sppRandPin() { const a = new Uint32Array(1); crypto.getRandomValues(a); return String(a[0] % 1000000).padStart(6, '0'); }
function sppAnakInfo(nis) { const s = S.find(x => String(x.nis).trim() === String(nis).trim()); return s ? `<b>${e(s.nama)}</b> (${e(s.kelas)}, ${e(sppJenjang(s) || '-')}) · wali tercatat: ${e(s.wali || '-')}` : `<span style="color:#a11a1a">NIS ${e(nis)} tidak ditemukan</span>`; }
function sppTabAkses() {
  const list = sppLoad('wali', []), pend = list.filter(a => a.status === 'Menunggu' || (a.anakReq || []).length);
  const pRows = pend.map(a => `<tr><td><b>${e(a.nama)}</b><br><small>${e(a.hp)}</small><br><small>${a.status === 'Menunggu' ? 'Akun baru' : 'Tambah anak'} · ${sppFmtDate(a.createdAt)}</small></td><td style="white-space:normal">${(a.anakReq || []).map(n => '• ' + sppAnakInfo(n)).join('<br>')}</td><td><button class="btn s" onclick="sppWaliApprove('${a.id}')">Setujui</button> <button class="btn s r" onclick="sppWaliRejectReq('${a.id}')">Tolak</button></td></tr>`).join('');
  const rows = list.map(a => `<tr><td><b>${e(a.nama)}</b><br><small>${e(a.hp)}</small></td><td style="white-space:normal">${(a.anak || []).map(id => { const s = sppSantri(id); return s ? `${e(s.nama)} <span class="spp-badge j-${sppJenjang(s)}">${e(sppJenjang(s) || '-')}</span> <a href="#" title="Lepas" onclick="sppWaliDelAnak('${a.id}','${id}');return false">✕</a>` : ''; }).join('<br>') || '<small>-</small>'}</td><td>${e(a.status)}</td><td><button class="btn s o" onclick="sppWaliReset('${a.id}')">Reset password</button> <button class="btn s o" onclick="sppWaliAddAnak('${a.id}')">+ Anak</button> <button class="btn s o" onclick="sppWaliToggle('${a.id}')">${a.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button> <button class="btn s r" onclick="sppWaliDel('${a.id}')">Hapus</button></td></tr>`).join('');
  return `<p class="muted-note">Wali mendaftar sendiri di menu <b>Portal Wali</b> memakai nomor HP, password, dan NIS anak. Periksa kesesuaian data (nama wali dan anak) sebelum menyetujui. Jika wali lupa password, gunakan <b>Reset password</b> lalu kirimkan password baru ke wali.</p>
<h4>Menunggu verifikasi (${pend.length})</h4><div class="sc"><table><tr><th>Pendaftar</th><th>Anak yang diajukan (NIS)</th><th></th></tr>${pRows || '<tr><td colspan="3">Tidak ada pendaftaran baru.</td></tr>'}</table></div>
<h4 style="margin-top:22px">Semua akun wali (${list.length})</h4><div class="sc"><table><tr><th>Wali</th><th>Anak terhubung</th><th>Status</th><th></th></tr>${rows || '<tr><td colspan="4">Belum ada akun wali.</td></tr>'}</table></div>`;
}
function sppWaliSave(list) { return sppSave('wali', list); }
function sppWaliApprove(id) {
  const list = sppLoad('wali', []), a = list.find(x => x.id === id); if (!a) return;
  const found = [], miss = [];
  (a.anakReq || []).forEach(n => { const s = S.find(x => String(x.nis).trim() === String(n).trim()); s ? found.push(s) : miss.push(n); });
  if (!found.length && a.status === 'Menunggu') { alert('Tidak ada NIS yang cocok dengan data santri. Tolak pendaftaran ini.'); return; }
  if (!confirm(`Setujui ${a.nama} sebagai wali dari: ${found.map(s => s.nama).join(', ') || '-'}?` + (miss.length ? `\nNIS tidak ditemukan (dilewati): ${miss.join(', ')}` : ''))) return;
  a.anak = [...new Set([...(a.anak || []).map(String), ...found.map(s => String(s.id))])]; a.anakReq = []; a.status = 'Aktif'; a.approvedAt = new Date().toISOString();
  if (sppWaliSave(list)) T();
}
function sppWaliRejectReq(id) {
  const list = sppLoad('wali', []), a = list.find(x => x.id === id); if (!a || !confirm('Tolak pengajuan ini?')) return;
  if (a.status === 'Menunggu') a.status = 'Ditolak'; a.anakReq = [];
  if (sppWaliSave(list)) T();
}
async function sppWaliReset(id) {
  const list = sppLoad('wali', []), a = list.find(x => x.id === id); if (!a) return;
  if (!confirm('Buat password baru untuk ' + a.nama + '? Password lama tidak berlaku lagi.')) return;
  const pw = sppRandPin(); a.hash = await sppHash(pw, a.id); a.mustChange = true; if (!sppWaliSave(list)) return;
  const url = location.origin + location.pathname + '#wali', link = sppWaLink(a.hp, 'Assalamu’alaikum ' + a.nama + '. Password baru Portal Wali Al-Husna: ' + pw + '\nMasuk di ' + url + ' dengan nomor HP ini, lalu Anda akan diminta membuat password baru.');
  sppModal(`<h3>Password baru</h3><p><b>${e(a.nama)}</b> · ${e(a.hp)}</p><div class="spp-total" style="font-family:monospace">${pw}</div><p class="muted-note">Password ini hanya tampil sekali. Wali akan diminta menggantinya saat masuk.</p><a class="btn" target="_blank" rel="noopener" href="${link}">Kirim lewat WhatsApp</a>`);
  T();
}
function sppWaliToggle(id) { const list = sppLoad('wali', []), a = list.find(x => x.id === id); if (!a) return; a.status = a.status === 'Aktif' ? 'Nonaktif' : 'Aktif'; if (sppWaliSave(list)) T(); }
function sppWaliDel(id) { if (!confirm('Hapus akun wali ini?')) return; if (sppWaliSave(sppLoad('wali', []).filter(x => x.id !== id))) T(); }
function sppWaliDelAnak(id, sid) { if (!confirm('Lepas anak ini dari akun wali?')) return; const list = sppLoad('wali', []), a = list.find(x => x.id === id); if (!a) return; a.anak = (a.anak || []).filter(x => String(x) !== String(sid)); if (sppWaliSave(list)) T(); }
function sppWaliAddAnak(id) {
  const nis = prompt('NIS anak yang akan dihubungkan:'); if (!nis) return;
  const s = S.find(x => String(x.nis).trim() === nis.trim()); if (!s) { alert('NIS tidak ditemukan.'); return; }
  const list = sppLoad('wali', []), a = list.find(x => x.id === id); if (!a) return;
  a.anak = [...new Set([...(a.anak || []).map(String), String(s.id)])]; if (sppWaliSave(list)) T();
}

/* --- Excel --- */
function sppXlsxOk() { if (typeof XLSX === 'undefined') { alert('Pustaka Excel belum termuat. Pastikan perangkat terhubung internet.'); return false; } return true; }
function sppExportRekap() {
  if (!sppXlsxOk()) return;
  const cfg = sppCfg(), bills = sppLoad('tagihan', []).filter(b => b.ta == sppF.ta), months = sppMonths(sppF.ta), wb = XLSX.utils.book_new();
  SPP_J.forEach(j => {
    const head = ['NIS', 'Nama', 'Kelas'].concat(months.map(m => m.label), ['Total Tagihan', 'Terbayar', 'Sisa']), rows = [head];
    S.filter(s => sppJenjang(s) === j).forEach(s => {
      const mine = bills.filter(b => String(b.sid) === String(s.id)); let tg = 0, lu = 0;
      const cells = months.map(m => { const b = mine.find(x => x.ym === m.ym); if (!b) return ''; tg += Number(b.nominal); if (b.status === 'Lunas') lu += Number(b.nominal); return b.status === 'Lunas' ? 'Lunas' : b.status === 'Menunggu' ? 'Menunggu' : sppLate(b, cfg) ? 'Terlambat' : 'Belum'; });
      rows.push([String(s.nis), s.nama, s.kelas].concat(cells, [tg, lu, tg - lu]));
    });
    const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = head.map((_, i) => ({ wch: i === 1 ? 28 : 12 })); XLSX.utils.book_append_sheet(wb, ws, j);
  });
  const sm = sppSMap(), pr = [['Invoice', 'Tanggal', 'NIS', 'Nama', 'Jenjang', 'Jumlah Bulan', 'Total', 'Metode', 'Status']].concat(sppLoad('bayar', []).map(p => { const s = sm.get(String(p.sid)) || {}; return [p.id, p.createdAt, String(s.nis || ''), s.nama || '', p.jenjang, p.billIds.length, p.total, p.metode, p.status]; }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pr), 'Pembayaran');
  XLSX.writeFile(wb, 'Rekap_SPP_' + sppF.ta + '-' + (sppF.ta + 1) + '.xlsx');
}
