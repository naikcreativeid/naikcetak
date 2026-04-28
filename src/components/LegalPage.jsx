import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';

const SECTIONS = [
  { id: 'terms', label: 'Syarat & Ketentuan', icon: FileText },
  { id: 'privacy', label: 'Kebijakan Privasi', icon: ShieldCheck },
  { id: 'refund', label: 'Kebijakan Refund', icon: RefreshCw },
  { id: 'contact', label: 'Layanan Pelanggan', icon: Mail },
];

const MERCHANT = {
  name: 'NaikCetak',
  legalOwner: 'Faizal Nur Apriyadi',
  email: 'admin@naikcetak.com',
  whatsapp: '+62 822-6103-9601',
  whatsappLink: 'https://wa.me/6282261039601',
  domain: 'naikcetak.com',
  appUrl: 'https://app.naikcetak.com',
  companyType: 'Platform software berbasis web untuk manajemen percetakan',
};

const LAST_UPDATED = '25 April 2026';

function H2({ children }) {
  return <h2 className="mt-8 mb-3 text-xl font-bold text-zinc-900">{children}</h2>;
}

function H3({ children }) {
  return <h3 className="mt-5 mb-2 text-base font-bold text-zinc-800">{children}</h3>;
}

function P({ children }) {
  return <p className="mb-3 text-[15px] leading-7 text-zinc-700">{children}</p>;
}

function UL({ children }) {
  return <ul className="mb-3 list-disc space-y-1.5 pl-6 text-[15px] leading-7 text-zinc-700">{children}</ul>;
}

function TermsContent() {
  return (
    <div>
      <P>
        Halaman ini memuat syarat dan ketentuan penggunaan layanan {MERCHANT.name}. Dengan
        mengakses, mendaftar, melakukan pembayaran, atau menggunakan layanan {MERCHANT.name},
        Anda menyatakan telah membaca, memahami, dan menyetujui seluruh isi dokumen ini.
        Apabila Anda tidak menyetujui isi dokumen ini, Anda wajib menghentikan penggunaan
        layanan.
      </P>

      <H2>1. Kondisi Penggunaan</H2>
      <P>
        {MERCHANT.name} adalah {MERCHANT.companyType} yang ditawarkan kepada Anda dengan
        syarat bahwa Anda menerima seluruh ketentuan, kondisi, pemberitahuan, kebijakan,
        dan aturan lain yang tercantum di situs ini atau yang dirujuk dari situs ini.
        Setiap penggunaan situs dan aplikasi merupakan persetujuan Anda terhadap dokumen
        legal yang berlaku.
      </P>

      <H2>2. Gambaran Umum Layanan</H2>
      <P>
        {MERCHANT.name} menyediakan produk digital berbentuk Software-as-a-Service (SaaS)
        untuk membantu operasional usaha percetakan, termasuk namun tidak terbatas pada
        kalkulator HPP, invoice, quotation, surat jalan, purchase order supplier, tracking
        order, halaman toko online, laporan keuangan, dan fitur pendukung lainnya.
      </P>
      <P>
        Produk yang dijual melalui situs ini adalah <strong>barang/jasa digital</strong>,
        bukan barang fisik. Karena itu, tidak ada proses pengiriman fisik, retur barang,
        ataupun penukaran produk dalam bentuk fisik.
      </P>

      <H2>3. Perubahan Situs dan Syarat</H2>
      <P>
        {MERCHANT.name} berhak mengubah, memperbarui, menambah, mengurangi, atau menghentikan
        bagian mana pun dari situs, fitur, harga, konten, maupun syarat dan ketentuan ini
        kapan saja tanpa pemberitahuan terpisah, kecuali diwajibkan lain oleh hukum yang
        berlaku. Dengan tetap menggunakan layanan setelah perubahan dilakukan, Anda dianggap
        menyetujui versi terbaru dari syarat ini.
      </P>

      <H2>4. Akun dan Kelayakan Pengguna</H2>
      <UL>
        <li>Pengguna wajib memberikan data yang benar, lengkap, dan terbaru saat registrasi.</li>
        <li>Pengguna bertanggung jawab menjaga kerahasiaan email login, kata sandi, dan akses akun.</li>
        <li>Seluruh aktivitas yang terjadi melalui akun dianggap dilakukan oleh pemilik akun.</li>
        <li>Pengguna wajib berusia minimal 18 tahun atau telah memiliki kewenangan hukum untuk membuat perikatan.</li>
        <li>{MERCHANT.name} berhak menolak pendaftaran atau menonaktifkan akun yang datanya tidak valid atau terindikasi disalahgunakan.</li>
      </UL>

      <H2>5. Pemberian Lisensi</H2>
      <P>
        Selama masa langganan aktif, {MERCHANT.name} memberikan kepada Anda lisensi terbatas,
        non-eksklusif, tidak dapat dialihkan, dan dapat dicabut sewaktu-waktu untuk mengakses
        dan menggunakan platform semata-mata untuk kebutuhan internal bisnis Anda.
      </P>
      <UL>
        <li>memodifikasi, menyalin, menjual ulang, atau mengeksploitasi bagian layanan tanpa izin tertulis;</li>
        <li>melakukan reverse engineering, dekompilasi, atau membongkar sistem;</li>
        <li>memberikan akses layanan kepada pihak ketiga di luar izin paket yang berlaku;</li>
        <li>menggunakan layanan untuk aktivitas yang melanggar hukum atau merugikan pihak lain.</li>
      </UL>

      <H2>6. Hak Kekayaan Intelektual</H2>
      <P>
        Seluruh hak cipta, merek, logo, desain, database, source code, tampilan antarmuka,
        dokumentasi, dan materi lain dalam layanan {MERCHANT.name} adalah milik
        {MERCHANT.legalOwner} dan/atau pemberi lisensinya. Penggunaan layanan tidak
        mengalihkan hak kepemilikan apa pun kepada Pengguna.
      </P>

      <H2>7. Harga, Biaya, dan Pembayaran</H2>
      <UL>
        <li>Paket Starter tersedia gratis dengan batas fitur tertentu.</li>
        <li>Paket Pro Bulanan saat ini dikenakan biaya Rp 149.000 per bulan.</li>
        <li>Paket Pro Tahunan saat ini dikenakan biaya Rp 948.000 per tahun.</li>
        <li>Harga dapat berubah dari waktu ke waktu dan akan ditampilkan di halaman harga sebelum pembayaran dilakukan.</li>
      </UL>
      <P>
        Pembayaran diproses melalui transfer bank, QRIS, atau kanal pembayaran resmi lain yang
        kami sediakan. Dengan melakukan pembayaran, Anda juga tunduk pada ketentuan bank, QRIS,
        dompet digital, atau kanal pembayaran lain yang Anda gunakan. {MERCHANT.name} tidak
        menyimpan data kartu kredit, nomor kartu, CVV, PIN, atau kredensial pembayaran sensitif.
      </P>
      <P>
        Langganan atau aktivasi fitur berbayar akan diproses setelah sistem menerima verifikasi
        pembayaran yang sah dari admin atau metode verifikasi internal yang sah.
        Apabila pembayaran gagal, tertunda, kedaluwarsa, dibatalkan, ditolak, atau terindikasi
        fraud, maka akses berbayar dapat ditunda, tidak diaktifkan, atau dihentikan.
      </P>

      <H2>8. Produk Digital, Aktivasi, dan Pengiriman</H2>
      <P>
        Karena layanan yang dijual berupa produk digital, pemenuhan pesanan dilakukan melalui
        aktivasi akun, pembaruan hak akses, atau pemberian akses fitur di dalam dashboard
        {MERCHANT.name}. Tidak ada pengiriman barang fisik. Bukti aktivasi dapat berupa:
      </P>
      <UL>
        <li>status paket aktif di akun pengguna;</li>
        <li>notifikasi email atau tampilan dashboard bahwa pembayaran berhasil;</li>
        <li>nomor order atau transaksi dari Midtrans.</li>
      </UL>

      <H2>9. Perpanjangan, Pembatalan, dan Penurunan Paket</H2>
      <P>
        Langganan tidak diperpanjang otomatis kecuali dinyatakan lain pada kanal pembayaran
        tertentu. Sebelum masa aktif berakhir, pengguna dapat menerima pengingat perpanjangan.
        Jika pembayaran baru tidak dilakukan, akun dapat diturunkan ke Paket Starter setelah
        masa aktif dan masa tenggang berakhir.
      </P>
      <P>
        Pembatalan paket berbayar menghentikan perpanjangan berikutnya, namun tidak menghapus
        manfaat yang sudah diperoleh sampai akhir periode aktif yang telah dibayar, kecuali
        akun ditangguhkan karena pelanggaran.
      </P>

      <H2>10. Kebijakan Refund, Retur, dan Pembatalan Pesanan</H2>
      <P>
        Karena produk yang disediakan berupa layanan digital, maka <strong>retur atau
        pengembalian barang fisik tidak berlaku</strong>. Refund hanya dapat diajukan sesuai
        kebijakan refund pada halaman ini dan akan diproses setelah verifikasi internal.
      </P>
      <UL>
        <li>Refund penuh tersedia dalam 7 hari kalender sejak pembayaran berhasil, sesuai syarat pada halaman Kebijakan Refund.</li>
        <li>Permintaan refund di luar periode tersebut akan dinilai secara kasus per kasus.</li>
        <li>Biaya yang timbul dari chargeback sepihak, fraud, atau pelanggaran syarat dapat dibebankan kepada pengguna sesuai hukum yang berlaku.</li>
        <li>Jika refund disetujui, akses ke fitur berbayar dapat dihentikan atau diturunkan.</li>
      </UL>

      <H2>11. Kewajiban Pengguna</H2>
      <P>Pengguna setuju untuk:</P>
      <UL>
        <li>menggunakan layanan secara sah, wajar, dan tidak melanggar peraturan perundang-undangan;</li>
        <li>tidak mengunggah malware, virus, spam, phishing, atau kode berbahaya lainnya;</li>
        <li>tidak melakukan penipuan pembayaran, penyalahgunaan promo, atau manipulasi referral/komisi;</li>
        <li>tidak menggunakan layanan untuk menyimpan atau menyebarkan konten yang melanggar hukum, cabul, memfitnah, atau merugikan pihak lain;</li>
        <li>bertanggung jawab penuh atas data pelanggan, invoice, quotation, dan informasi bisnis yang dimasukkan ke dalam sistem.</li>
      </UL>

      <H2>12. Data dan Konten Pengguna</H2>
      <P>
        Data yang Anda unggah atau input ke dalam layanan tetap menjadi milik Anda.
        Namun, Anda memberikan izin terbatas kepada {MERCHANT.name} untuk menyimpan,
        memproses, menampilkan, dan mengelola data tersebut sepanjang diperlukan untuk
        menyediakan layanan, dukungan teknis, keamanan sistem, dan kepatuhan hukum.
      </P>

      <H2>13. Penangguhan dan Penghentian</H2>
      <P>
        {MERCHANT.name} dapat menangguhkan, membatasi, atau mengakhiri akses akun secara
        sepihak dengan atau tanpa pemberitahuan terlebih dahulu apabila:
      </P>
      <UL>
        <li>terdapat dugaan penyalahgunaan sistem, pelanggaran keamanan, atau fraud pembayaran;</li>
        <li>pengguna melanggar syarat dan ketentuan ini;</li>
        <li>pengguna menggunakan layanan untuk tindakan yang dapat merugikan {MERCHANT.name}, pengguna lain, atau pihak ketiga;</li>
        <li>diperlukan untuk memenuhi kewajiban hukum, perintah regulator, atau permintaan aparat yang sah.</li>
      </UL>

      <H2>14. Batasan Garansi dan Tanggung Jawab</H2>
      <P>
        Layanan disediakan sebagaimana adanya (<em>as is</em>) dan sebagaimana tersedia
        (<em>as available</em>). {MERCHANT.name} berupaya secara wajar menjaga layanan tetap
        stabil, aman, dan dapat diakses, namun tidak menjamin layanan akan selalu bebas dari
        kesalahan, keterlambatan, gangguan, atau downtime.
      </P>
      <P>
        Sepanjang diizinkan oleh hukum, {MERCHANT.name} tidak bertanggung jawab atas kerugian
        tidak langsung, kehilangan keuntungan, kehilangan data, kehilangan pelanggan, atau
        kerusakan konsekuensial lain yang timbul dari penggunaan atau ketidakmampuan menggunakan
        layanan. Tanggung jawab maksimum {MERCHANT.name} terbatas pada jumlah biaya yang telah
        dibayarkan pengguna kepada {MERCHANT.name} dalam 12 bulan terakhir sebelum klaim.
      </P>

      <H2>15. Kebijakan Privasi dan Keamanan</H2>
      <P>
        Penggunaan layanan juga tunduk pada Kebijakan Privasi. {MERCHANT.name} menerapkan
        langkah-langkah keamanan yang wajar untuk melindungi data pengguna, namun pengguna
        memahami bahwa tidak ada sistem elektronik yang sepenuhnya bebas risiko.
      </P>

      <H2>16. Hukum yang Berlaku dan Sengketa</H2>
      <P>
        Syarat dan ketentuan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia.
        Setiap perselisihan akan diupayakan terlebih dahulu melalui musyawarah. Jika tidak
        tercapai penyelesaian, sengketa akan diselesaikan melalui pengadilan yang berwenang
        di Indonesia.
      </P>

      <H2>17. Kontak dan Pengaduan</H2>
      <P>
        Untuk pertanyaan, permintaan klarifikasi, komplain, atau pengajuan refund, Anda dapat
        menghubungi kami melalui email{' '}
        <a href={`mailto:${MERCHANT.email}`} className="text-blue-600 underline">
          {MERCHANT.email}
        </a>{' '}
        atau WhatsApp{' '}
        <a href={MERCHANT.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          {MERCHANT.whatsapp}
        </a>
        .
      </P>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div>
      <P>
        Kebijakan Privasi ini menjelaskan bagaimana {MERCHANT.name} mengumpulkan,
        menggunakan, menyimpan, melindungi, dan mengungkapkan data pribadi pengguna
        sehubungan dengan penggunaan situs dan layanan kami.
      </P>

      <H2>1. Jenis Data yang Dikumpulkan</H2>
      <H3>a. Data yang Anda berikan langsung</H3>
      <UL>
        <li>nama lengkap, email, nomor WhatsApp, nama usaha atau percetakan;</li>
        <li>data profil akun dan preferensi penggunaan;</li>
        <li>data operasional yang Anda masukkan ke sistem seperti invoice, klien, supplier, quotation, dan kalkulasi;</li>
        <li>data komunikasi ketika Anda menghubungi dukungan pelanggan.</li>
      </UL>

      <H3>b. Data yang dikumpulkan otomatis</H3>
      <UL>
        <li>alamat IP, jenis perangkat, browser, sistem operasi, dan log aktivitas;</li>
        <li>cookies atau teknologi serupa untuk login, keamanan, dan preferensi penggunaan;</li>
        <li>data transaksi pembayaran dari Midtrans yang relevan untuk verifikasi pesanan, seperti order ID, status pembayaran, dan metode pembayaran.</li>
      </UL>

      <H2>2. Tujuan Penggunaan Data</H2>
      <UL>
        <li>membuat dan mengelola akun pengguna;</li>
        <li>menyediakan fitur layanan dan meningkatkan kualitas sistem;</li>
        <li>memproses aktivasi paket, verifikasi pembayaran, dan pencatatan transaksi;</li>
        <li>memberikan bantuan pelanggan, notifikasi layanan, dan pengingat langganan;</li>
        <li>mencegah penipuan, penyalahgunaan, dan pelanggaran keamanan;</li>
        <li>memenuhi kewajiban hukum, pajak, pembukuan, dan audit internal.</li>
      </UL>

      <H2>3. Dasar Pengungkapan kepada Pihak Ketiga</H2>
      <P>
        Kami tidak menjual data pribadi pengguna. Data hanya dibagikan kepada pihak ketiga
        sejauh diperlukan untuk menjalankan layanan, antara lain:
      </P>
      <UL>
        <li><strong>Supabase</strong> untuk autentikasi dan database aplikasi;</li>
        <li><strong>Midtrans</strong> untuk pemrosesan dan verifikasi pembayaran;</li>
        <li><strong>Vercel</strong> atau penyedia hosting lain untuk menjalankan aplikasi;</li>
        <li><strong>penyedia AI dan analitik</strong> untuk fitur tambahan yang relevan, dengan pembatasan data seperlunya;</li>
        <li><strong>otoritas berwenang</strong> jika diwajibkan oleh hukum atau perintah yang sah.</li>
      </UL>

      <H2>4. Keamanan Data</H2>
      <UL>
        <li>komunikasi data dilindungi oleh protokol HTTPS/TLS;</li>
        <li>autentikasi akun dikelola melalui sistem yang menggunakan penyimpanan kredensial terenkripsi;</li>
        <li>akses data dibatasi berdasarkan otorisasi pengguna dan kebijakan keamanan sistem;</li>
        <li>data pembayaran sensitif tidak disimpan di server {MERCHANT.name} dan diproses melalui Midtrans.</li>
      </UL>

      <H2>5. Penyimpanan dan Retensi Data</H2>
      <P>
        Data disimpan selama akun Anda aktif atau selama diperlukan untuk penyediaan layanan,
        penyelesaian sengketa, pemenuhan kewajiban hukum, dan pencatatan transaksi. Setelah
        akun ditutup, sebagian data dapat tetap disimpan selama jangka waktu yang diwajibkan
        oleh hukum atau kebutuhan audit.
      </P>

      <H2>6. Hak Pengguna</H2>
      <UL>
        <li>meminta akses atas data pribadi yang kami simpan;</li>
        <li>memperbarui atau memperbaiki data yang tidak akurat;</li>
        <li>meminta penghapusan data sejauh dimungkinkan oleh hukum dan kebutuhan operasional;</li>
        <li>meminta penghentian pengiriman komunikasi pemasaran, jika ada.</li>
      </UL>

      <H2>7. Cookies</H2>
      <P>
        Cookies digunakan untuk menjaga sesi login, mengenali perangkat, menyimpan preferensi,
        dan meningkatkan keamanan layanan. Dengan terus menggunakan situs ini, Anda menyetujui
        penggunaan cookies yang diperlukan untuk operasional layanan.
      </P>

      <H2>8. Perubahan Kebijakan Privasi</H2>
      <P>
        Kebijakan Privasi ini dapat diperbarui dari waktu ke waktu. Perubahan akan berlaku
        setelah versi terbaru dipublikasikan di halaman ini.
      </P>

      <H2>9. Kontak Privasi</H2>
      <P>
        Untuk pertanyaan terkait privasi atau permintaan data, hubungi{' '}
        <a href={`mailto:${MERCHANT.email}`} className="text-blue-600 underline">
          {MERCHANT.email}
        </a>
        .
      </P>
    </div>
  );
}

function RefundContent() {
  return (
    <div>
      <P>
        Kebijakan refund ini berlaku untuk seluruh transaksi berbayar di {MERCHANT.name}
        yang diproses melalui Midtrans atau kanal pembayaran resmi lain yang kami sediakan.
      </P>

      <H2>1. Karakter Produk Digital</H2>
      <P>
        Layanan {MERCHANT.name} adalah produk digital berbasis langganan. Oleh karena itu,
        tidak terdapat pengembalian barang fisik. Permintaan refund akan diperlakukan sebagai
        pembatalan manfaat atas akses digital yang telah dibeli.
      </P>

      <H2>2. Refund Penuh 7 Hari</H2>
      <P>
        Pengguna dapat mengajukan refund penuh 100% dalam waktu 7 hari kalender sejak
        pembayaran berhasil, sepanjang tidak ditemukan indikasi penyalahgunaan, fraud,
        atau pelanggaran syarat penggunaan.
      </P>

      <H2>3. Kondisi Setelah Lewat 7 Hari</H2>
      <UL>
        <li>paket bulanan umumnya tidak dapat direfund setelah hari ke-7;</li>
        <li>paket tahunan dapat dipertimbangkan prorata secara kasus per kasus;</li>
        <li>biaya administrasi, biaya gateway, atau potongan pihak ketiga dapat diperhitungkan dalam nominal refund jika diizinkan hukum.</li>
      </UL>

      <H2>4. Kondisi yang Tidak Memenuhi Syarat Refund</H2>
      <UL>
        <li>akun telah menggunakan layanan secara berlebihan atau untuk tujuan yang melanggar hukum;</li>
        <li>akun ditangguhkan karena pelanggaran syarat dan ketentuan;</li>
        <li>pembayaran terindikasi fraud, chargeback sepihak, atau dispute yang tidak kooperatif;</li>
        <li>permohonan diajukan di luar batas waktu tanpa alasan yang dapat diterima;</li>
        <li>pengguna telah menerima manfaat komersial yang substansial dari layanan dan secara wajar tidak dapat dipulihkan.</li>
      </UL>

      <H2>5. Cara Mengajukan Refund</H2>
      <P>
        Pengajuan refund dapat dilakukan melalui email{' '}
        <a href={`mailto:${MERCHANT.email}`} className="text-blue-600 underline">
          {MERCHANT.email}
        </a>{' '}
        dengan menyertakan:
      </P>
      <UL>
        <li>nama dan email akun terdaftar;</li>
        <li>tanggal transaksi dan jumlah pembayaran;</li>
        <li>order ID atau nomor transaksi Midtrans;</li>
        <li>alasan pengajuan refund;</li>
        <li>informasi rekening tujuan bila dibutuhkan untuk proses pengembalian dana.</li>
      </UL>

      <H2>6. Proses Refund</H2>
      <UL>
        <li>konfirmasi penerimaan permohonan maksimal 1 hari kerja;</li>
        <li>verifikasi dan keputusan maksimal 3 hari kerja;</li>
        <li>pencairan dana mengikuti SLA bank, Midtrans, atau kanal pembayaran terkait, umumnya 3-7 hari kerja.</li>
      </UL>
      <P>
        Setelah refund disetujui, manfaat langganan atau akses fitur berbayar dapat dihentikan
        seluruhnya atau sebagian.
      </P>

      <H2>7. Chargeback dan Sengketa Pembayaran</H2>
      <P>
        Jika pengguna mengajukan chargeback atau sengketa pembayaran langsung ke bank,
        penerbit kartu, atau penyedia pembayaran tanpa terlebih dahulu menghubungi
        {MERCHANT.name}, kami berhak menangguhkan akun selama proses investigasi. Kami
        sangat menyarankan pengguna menghubungi tim kami lebih dulu agar penyelesaian dapat
        dilakukan dengan cepat dan proporsional.
      </P>
    </div>
  );
}

function ContactContent() {
  return (
    <div>
      <P>
        Jika Anda membutuhkan bantuan terkait penggunaan layanan, pembayaran, refund,
        privasi, atau masalah legal lainnya, silakan hubungi kami melalui kanal resmi
        berikut.
      </P>

      <H2>Email Resmi</H2>
      <P>
        <a href={`mailto:${MERCHANT.email}`} className="text-lg font-semibold text-blue-600 underline">
          {MERCHANT.email}
        </a>
        <br />
        <span className="text-sm text-zinc-500">Respons rata-rata: 1 x 24 jam kerja</span>
      </P>

      <H2>WhatsApp</H2>
      <P>
        <a
          href={MERCHANT.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-blue-600 underline"
        >
          {MERCHANT.whatsapp}
        </a>
        <br />
        <span className="text-sm text-zinc-500">Senin - Sabtu, 09.00 - 18.00 WIB</span>
      </P>

      <H2>Identitas Penanggung Jawab</H2>
      <UL>
        <li><strong>Nama usaha:</strong> {MERCHANT.name}</li>
        <li><strong>Penanggung jawab:</strong> {MERCHANT.legalOwner}</li>
        <li><strong>Domain resmi:</strong> {MERCHANT.domain}</li>
        <li><strong>Aplikasi:</strong> {MERCHANT.appUrl}</li>
        <li><strong>Jenis usaha:</strong> {MERCHANT.companyType}</li>
        <li><strong>Wilayah operasi:</strong> Indonesia</li>
      </UL>

      <H2>Jenis Permintaan yang Dapat Diajukan</H2>
      <UL>
        <li>pertanyaan umum tentang layanan dan paket;</li>
        <li>kendala pembayaran atau verifikasi Midtrans;</li>
        <li>permintaan refund atau komplain transaksi;</li>
        <li>permintaan penghapusan data dan pertanyaan privasi;</li>
        <li>laporan keamanan, penyalahgunaan, atau pelanggaran akun.</li>
      </UL>
    </div>
  );
}

function getInitialSection() {
  if (typeof window === 'undefined') return 'terms';
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (['terms', 'privacy', 'refund', 'contact'].includes(path)) return path;
  return 'terms';
}

export default function LegalPage() {
  const [active, setActive] = useState(getInitialSection);

  useEffect(() => {
    const newPath = `/${active}`;
    if (window.location.pathname !== newPath) {
      window.history.replaceState({}, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  const ActiveContent = {
    terms: TermsContent,
    privacy: PrivacyContent,
    refund: RefundContent,
    contact: ContactContent,
  }[active];

  const activeMeta = SECTIONS.find((section) => section.id === active);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a href="/" className="group flex items-center gap-2.5">
            <BrandLogo
              markClassName="h-9 w-9 shrink-0"
              textClassName="text-base text-zinc-900"
            />
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft size={14} /> Kembali
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-extrabold text-zinc-900 lg:text-4xl">
            Halaman Legal
          </h1>
          <p className="text-sm text-zinc-500">
            Dokumen ini berlaku untuk seluruh pengguna {MERCHANT.name}. Terakhir diperbarui:{' '}
            <strong>{LAST_UPDATED}</strong>.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-zinc-200 bg-white p-1.5 md:grid-cols-4">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all md:text-sm ${
                active === id ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <article className="rounded-2xl border border-zinc-200 bg-white p-6 lg:p-10">
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-zinc-900">
            {activeMeta && <activeMeta.icon size={20} className="text-blue-600" />}
            {activeMeta?.label}
          </h2>
          <p className="mb-6 text-xs text-zinc-400">Berlaku sejak {LAST_UPDATED}</p>
          <ActiveContent />
        </article>

        <div className="mt-8 text-center text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} {MERCHANT.name} · Dokumen ini disediakan untuk
          transparansi, kepatuhan, dan perlindungan bisnis serta pelanggan.
        </div>
      </div>
    </div>
  );
}
