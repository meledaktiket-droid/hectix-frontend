import type { ReactNode } from "react"

export const termsToc = [
  "Definisi",
  "Penggunaan Layanan",
  "Pembelian Tiket & Pembayaran",
  "Pengembalian & Pembatalan Event",
  "Event & Konten Merchant",
  "Fitur Sosial: Komentar & Badges",
  "Akun & Keamanan",
  "Hak Kekayaan Intelektual",
  "Batasan Tanggung Jawab",
  "Perubahan Syarat & Ketentuan",
  "Kontak & Bantuan",
]

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section id={`sec-${n}`} className="scroll-mt-28 pt-8 first:pt-0">
      <h2 className="text-2xl font-bold text-[#0C2D57]">
        {n}. {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Sub({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-lg font-bold text-[#0C2D57]">{children}</h3>
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-neutral-700">{children}</p>
}

function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-[#0C2D57]">{children}</strong>
}

function List({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-neutral-700 marker:text-neutral-400">
      {children}
    </ul>
  )
}

function Def({ term, children }: { term: string; children: ReactNode }) {
  return (
    <p className="text-[15px] leading-relaxed text-neutral-700">
      <B>{term}</B>
      <br />
      {children}
    </p>
  )
}

export function TermsContent() {
  return (
    <article>
      <div className="space-y-4 pb-4">
        <P>
          Selamat datang di <B>HECTIX</B>, platform yang menyediakan layanan pembelian tiket,
          manajemen event, interaksi komunitas melalui fitur komentar, serta sistem profil dan
          perolehan badges.
        </P>
        <P>
          Dengan menggunakan platform HECTIX, baik website maupun aplikasi, Anda menyetujui Syarat &
          Ketentuan (<B>&ldquo;S&amp;K&rdquo;</B>) ini. Kami dapat memperbarui, mengubah, atau
          memodifikasi ketentuan ini dari waktu ke waktu. Jika Anda tidak setuju dengan ketentuan
          ini, mohon untuk tidak menggunakan layanan kami.
        </P>
        <P>
          Syarat &amp; Ketentuan ini terakhir diperbarui pada <B>Mei 2026</B>.
        </P>
        <P>
          S&amp;K ini berlaku untuk <B>Pengguna (User)</B> dan{" "}
          <B>Penyelenggara Acara (Merchant/Event Manager)</B>.
        </P>
      </div>

      <Section n={1} title="Definisi">
        <Def term="Platform">HECTIX, termasuk seluruh fitur, konten, aplikasi, dan sistem.</Def>
        <Def term="Pengguna">
          Individu yang membuat akun dan/atau membeli tiket melalui HECTIX.
        </Def>
        <Def term="Merchant / Penyelenggara">
          Individu atau badan yang membuat, mengelola, dan menjual tiket event melalui HECTIX.
        </Def>
        <Def term="Event">Acara yang ditampilkan di HECTIX, baik online maupun offline.</Def>
        <Def term="Tiket Elektronik (E-Ticket)">
          Bukti pembelian berupa kode unik/QR yang digunakan untuk masuk ke event.
        </Def>
        <Def term="Biaya Platform">
          Biaya layanan yang dikenakan pada transaksi tertentu sebagai dukungan operasional platform.
        </Def>
      </Section>

      <Section n={2} title="Penggunaan Layanan">
        <Sub>2.1 Kewajiban Pengguna</Sub>
        <P>Pengguna wajib:</P>
        <List>
          <li>Memberikan informasi yang benar, akurat, dan dapat dipertanggungjawabkan.</li>
          <li>Menjaga kerahasiaan akun dan sandi.</li>
          <li>Tidak menggunakan platform untuk tindakan ilegal, penipuan, atau merugikan pihak lain.</li>
          <li>Mematuhi aturan event yang ditetapkan Merchant.</li>
        </List>

        <Sub>2.2 Larangan Pengguna</Sub>
        <P>Pengguna dilarang:</P>
        <List>
          <li>
            Mengunggah konten yang mengandung kebencian, SARA, pornografi, kekerasan, atau
            pelanggaran hukum.
          </li>
          <li>Menjual kembali tiket tanpa izin Merchant.</li>
          <li>
            Menyalahgunakan fitur komentar/wall untuk spam, promosi tanpa izin, atau pelecehan.
          </li>
          <li>
            Meretas, mencoba mengakses data yang bukan miliknya, atau melakukan perusakan sistem.
          </li>
        </List>

        <Sub>2.3 Penghentian Akses</Sub>
        <P>
          HECTIX berhak melakukan pembatasan, penangguhan, atau penghapusan akun jika pengguna
          melakukan pelanggaran terhadap S&amp;K ini.
        </P>
      </Section>

      <Section n={3} title="Pembelian Tiket & Pembayaran">
        <Sub>3.1 Metode Pembayaran</Sub>
        <P>
          HECTIX menyediakan beberapa metode pembayaran, termasuk transfer VA, QRIS, dan/atau metode
          lain yang tersedia.
        </P>

        <Sub>3.2 Status Pembayaran</Sub>
        <List>
          <li>
            <B>Pending</B>: Menunggu pembayaran dikonfirmasi oleh sistem.
          </li>
          <li>
            <B>Gagal</B>: Pembayaran tidak berhasil diproses.
          </li>
          <li>
            <B>Berhasil</B>: Tiket otomatis muncul di akun.
          </li>
        </List>

        <Sub>3.3 Biaya</Sub>
        <P>
          Beberapa transaksi dapat dikenakan <B>Platform Fee</B> dan/atau biaya dari penyedia
          pembayaran. Semua biaya akan ditampilkan sebelum checkout.
        </P>

        <Sub>3.4 E-Ticket</Sub>
        <P>
          Pengguna akan menerima E-Ticket di aplikasi/website setelah pembayaran berhasil. E-Ticket
          tidak dapat dipindahtangankan kecuali Merchant mengizinkan.
        </P>
      </Section>

      <Section n={4} title="Pengembalian & Pembatalan Event">
        <Sub>4.1 Refund oleh Pengguna</Sub>
        <P>Refund hanya dapat diproses apabila:</P>
        <List>
          <li>Event dibatalkan oleh Merchant.</li>
          <li>
            Event mengalami perubahan besar seperti tanggal atau venue, pengguna memilih untuk tidak
            hadir, dan Merchant menyediakan opsi refund.
          </li>
          <li>Kebijakan khusus refund event mengizinkan.</li>
        </List>

        <Sub>4.2 Proses Refund</Sub>
        <List>
          <li>
            Pengguna mengajukan refund melalui opsi yang disediakan oleh Merchant melalui saluran
            pribadi Merchant.
          </li>
          <li>Pengajuan diproses oleh Merchant dan diverifikasi oleh HECTIX.</li>
          <li>Dana dikembalikan sesuai metode yang ditentukan Merchant.</li>
          <li>Waktu pengembalian mengikuti kebijakan Merchant.</li>
        </List>

        <Sub>4.3 Pembatalan Event</Sub>
        <P>Jika event dibatalkan:</P>
        <List>
          <li>Merchant wajib memberitahukan melalui halaman event.</li>
          <li>Pengguna otomatis mendapatkan opsi refund.</li>
          <li>HECTIX membantu memfasilitasi proses teknis refund.</li>
        </List>
        <P>
          HECTIX tidak bertanggung jawab atas keputusan pembatalan event, namun membantu
          memfasilitasi Merchant dengan data sistem untuk menyalurkan refund sesuai kebijakan
          Merchant.
        </P>
      </Section>

      <Section n={5} title="Event & Konten Merchant">
        <Sub>5.1 Tanggung Jawab Merchant</Sub>
        <P>Merchant wajib:</P>
        <List>
          <li>Menyediakan informasi event yang akurat.</li>
          <li>Memastikan event berjalan sesuai deskripsi.</li>
          <li>Menyediakan layanan customer support untuk pertanyaan pengguna terkait event.</li>
          <li>Mengelola refund dan laporan perubahan event.</li>
        </List>

        <Sub>5.2 Hak HECTIX</Sub>
        <P>HECTIX berhak:</P>
        <List>
          <li>Menurunkan event yang terbukti melanggar hukum atau merugikan publik.</li>
          <li>Meminta dokumen legalitas event.</li>
          <li>Memblokir Merchant yang melanggar.</li>
        </List>
        <P>
          HECTIX <B>bukan penyelenggara event</B>, kecuali dinyatakan sebaliknya di halaman resmi
          event.
        </P>
      </Section>

      <Section n={6} title="Fitur Sosial: Komentar & Badges">
        <Sub>6.1 Komentar</Sub>
        <List>
          <li>Hanya pengguna yang membeli tiket yang dapat berkomentar di halaman event.</li>
          <li>Silakan berikan komentar tanpa melanggar ketentuan norma dan SARA.</li>
          <li>HECTIX dapat menghapus komentar yang melanggar pedoman komunitas.</li>
        </List>

        <Sub>6.2 Badges</Sub>
        <List>
          <li>
            Badges diberikan berdasarkan aktivitas pengguna, seperti pembelian event, keaktifan
            sosial, level pengalaman, dan lain-lain.
          </li>
          <li>Badges tidak memiliki nilai finansial dan tidak dapat dipindahtangankan.</li>
          <li>HECTIX berhak mengubah jenis atau mekanisme badges sewaktu-waktu.</li>
        </List>
      </Section>

      <Section n={7} title="Akun & Keamanan">
        <Sub>7.1 Keamanan</Sub>
        <P>
          HECTIX menggunakan standar keamanan industri, termasuk enkripsi dan verifikasi berlapis.
          Namun, risiko internet tetap ada dan pengguna harus menjaga kerahasiaan akun.
        </P>

        <Sub>7.2 Penghapusan Akun</Sub>
        <P>
          Pengguna dapat menghapus akun melalui menu pengaturan. Penghapusan akun bersifat permanen.
        </P>

        <Sub>7.3 Privasi</Sub>
        <P>
          Penggunaan data mengikuti <B>Kebijakan Privasi HECTIX</B> yang dipublikasikan secara
          terpisah.
        </P>
      </Section>

      <Section n={8} title="Hak Kekayaan Intelektual">
        <List>
          <li>
            Seluruh konten platform, termasuk desain, sistem, logo, algoritma, dan UI/UX, adalah
            milik HECTIX.
          </li>
          <li>Konten event yang diunggah Merchant tetap milik Merchant.</li>
          <li>
            Pengguna tidak diperbolehkan menyalin, memodifikasi, menjual, atau mendistribusikan
            materi platform tanpa izin tertulis.
          </li>
        </List>
      </Section>

      <Section n={9} title="Batasan Tanggung Jawab">
        <P>HECTIX tidak bertanggung jawab atas:</P>
        <List>
          <li>Kesalahan atau kegagalan event oleh Merchant.</li>
          <li>Kerugian finansial akibat pembatalan event oleh Merchant.</li>
          <li>Kelalaian pengguna dalam menjaga akun.</li>
          <li>
            Gangguan layanan akibat faktor eksternal, seperti server pihak ketiga, bencana, atau
            force majeure.
          </li>
        </List>
        <P>Namun, HECTIX bertanggung jawab untuk memastikan:</P>
        <List>
          <li>Sistem pembayaran berjalan aman.</li>
          <li>Informasi ditampilkan sesuai data dari Merchant.</li>
          <li>Pengguna dapat mengakses bantuan/resolusi masalah.</li>
        </List>
      </Section>

      <Section n={10} title="Perubahan Syarat & Ketentuan">
        <P>
          HECTIX dapat memperbarui S&amp;K ini sewaktu-waktu. Perubahan akan diberitahukan melalui
          platform. Penggunaan lanjutan berarti Anda menyetujui pembaruan tersebut.
        </P>
      </Section>

      <Section n={11} title="Kontak & Bantuan">
        <P>Jika membutuhkan bantuan, pengguna dapat menghubungi kami di:</P>
        <P>
          <B>Email:</B> meledaktiket@gmail.com
          <br />
          <B>WhatsApp:</B> Menyusul
        </P>
      </Section>
    </article>
  )
}
