import type { ReactNode } from "react"

export const privacyToc = [
  "Data Apa yang Kami Kumpulkan",
  "Bagaimana Kami Menggunakan Data Anda",
  "Dengan Siapa Data Dibagikan",
  "Bagaimana Kami Menyimpan dan Melindungi Data",
  "Hak-Hak Anda Sebagai Pengguna",
  "Cookie & Tracking",
  "Kebijakan Usia",
  "Perubahan Kebijakan",
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

function List({ children, ordered }: { children: ReactNode; ordered?: boolean }) {
  const cls =
    "space-y-2 pl-5 text-[15px] leading-relaxed text-neutral-700 marker:text-neutral-400"
  return ordered ? (
    <ol className={`list-decimal ${cls}`}>{children}</ol>
  ) : (
    <ul className={`list-disc ${cls}`}>{children}</ul>
  )
}

export function PrivacyContent() {
  return (
    <article>
      <div className="pb-4">
        <P>
          Kebijakan Privasi ini menjelaskan bagaimana HECTIX mengumpulkan, menggunakan, menyimpan,
          dan melindungi data pribadi ketika Anda menggunakan layanan kami sebagai User (pembeli
          tiket) maupun Merchant (penyelenggara acara). Dengan menggunakan platform HECTIX, Anda
          menyetujui praktik yang dijelaskan di bawah.
        </P>
      </div>

      <Section n={1} title="Data Apa yang Kami Kumpulkan">
        <Sub>1.1 Data yang Anda Berikan Secara Langsung</Sub>
        <P>
          Saat membuat akun, membeli tiket, atau membuat event, kami dapat mengumpulkan data seperti:
        </P>
        <List>
          <li>Nama lengkap</li>
          <li>Email</li>
          <li>Nomor ponsel</li>
          <li>Kata sandi</li>
          <li>Foto profil (jika diunggah pengguna)</li>
          <li>Data organisasi/brand (khusus Merchant)</li>
          <li>Informasi penarikan dana (rekening bank Merchant)</li>
          <li>Informasi event yang Anda buat</li>
          <li>Komentar yang Anda kirimkan di Wall Event</li>
        </List>

        <Sub>1.2 Data Transaksi</Sub>
        <P>Dari aktivitas pembelian dan pembayaran:</P>
        <List>
          <li>Detail tiket yang dibeli</li>
          <li>Pilihan metode pembayaran</li>
          <li>Status pembayaran</li>
          <li>Nominal transaksi</li>
          <li>Riwayat pembelian</li>
          <li>Data virtual account / QRIS (dikelola mitra pembayaran, bukan oleh HECTIX)</li>
        </List>

        <Sub>1.3 Data Teknis & Otomatis</Sub>
        <P>Ketika Anda menggunakan aplikasi/website:</P>
        <List>
          <li>Alamat IP</li>
          <li>Tipe perangkat</li>
          <li>Sistem operasi</li>
          <li>Browser</li>
          <li>Cookies</li>
          <li>Aktivitas penggunaan (misalnya halaman yang dikunjungi, klik, waktu akses)</li>
        </List>

        <Sub>1.4 Data dari Mitra</Sub>
        <P>Kami dapat menerima data tambahan dari:</P>
        <List>
          <li>Payment gateway (status pembayaran, kode VA/QR, dll.)</li>
          <li>Pihak keamanan transaksi (fraud detection)</li>
          <li>Mitra pemasaran (jika ada kampanye yang melibatkan tracking promosi)</li>
        </List>
      </Section>

      <Section n={2} title="Bagaimana Kami Menggunakan Data Anda">
        <P>Kami menggunakan data untuk:</P>
        <List ordered>
          <li>Memproses pembelian tiket</li>
          <li>Menyediakan akses ke akun, dashboard, dan fitur event</li>
          <li>Mengirimkan notifikasi transaksi, tiket, invoice, dan update event</li>
          <li>Menyediakan fitur sosial seperti Wall Event dan Badges</li>
          <li>Melakukan verifikasi identitas Merchant</li>
          <li>Memproses penarikan dana (withdraw)</li>
          <li>Meningkatkan keamanan platform &amp; mencegah penipuan</li>
          <li>Meningkatkan kualitas layanan, UI/UX, dan rekomendasi event</li>
          <li>Kepatuhan hukum dan permintaan otoritas (jika dibutuhkan)</li>
        </List>
        <P>
          <B>Kami tidak menjual data pribadi Anda ke pihak ketiga mana pun.</B>
        </P>
      </Section>

      <Section n={3} title="Dengan Siapa Data Dibagikan">
        <P>Kami hanya membagikan data dengan pihak berikut, sebatas diperlukan:</P>

        <Sub>3.1 Mitra Pembayaran</Sub>
        <P>Untuk memproses transaksi:</P>
        <List>
          <li>Midtrans (VA/QRIS)</li>
          <li>Bank/penyedia layanan keuangan terkait</li>
        </List>

        <Sub>3.2 Merchant Event</Sub>
        <P>Hanya data pembelian yang relevan, misalnya:</P>
        <List>
          <li>Nama pembeli</li>
          <li>Email / nomor HP (untuk keperluan check-in &amp; komunikasi penting)</li>
        </List>
        <P>Merchant tidak menerima data sensitif seperti detail pembayaran dan kata sandi.</P>

        <Sub>3.3 Penyedia Infrastruktur</Sub>
        <P>Termasuk:</P>
        <List>
          <li>Server cloud</li>
          <li>Keamanan siber</li>
          <li>Analitik aplikasi</li>
        </List>

        <Sub>3.4 Kewajiban Hukum</Sub>
        <P>Jika diminta oleh:</P>
        <List>
          <li>Penegak hukum</li>
          <li>Pengadilan</li>
          <li>Regulasi yang berlaku</li>
        </List>
      </Section>

      <Section n={4} title="Bagaimana Kami Menyimpan dan Melindungi Data">
        <P>Kami menggunakan standar keamanan yang bertujuan untuk melindungi data pribadi Anda.</P>
        <P>
          Kami berkomitmen melindungi data Anda, namun tidak ada sistem yang 100% aman. Pengguna juga
          bertanggung jawab menjaga keamanan akun sendiri (password &amp; OTP).
        </P>
      </Section>

      <Section n={5} title="Hak-Hak Anda Sebagai Pengguna">
        <P>Anda memiliki hak untuk:</P>
        <List>
          <li>Melihat data yang tersimpan</li>
          <li>Mengubah email, nomor HP, atau profil</li>
          <li>Menghapus akun (dengan konsekuensi data transaksi dibekukan sesuai regulasi)</li>
          <li>Menarik persetujuan penggunaan data tertentu</li>
          <li>Menghapus komentar di Wall Event</li>
        </List>
        <P>
          Permintaan dapat dilakukan melalui menu Akun, Pengaturan Privasi, atau menghubungi tim
          support.
        </P>
      </Section>

      <Section n={6} title="Cookie & Tracking">
        <P>Untuk meningkatkan performa dan pengalaman pengguna, kami menggunakan:</P>
        <List>
          <li>Cookies</li>
          <li>Tracking pixels</li>
          <li>Local storage</li>
        </List>
        <P>
          Anda dapat mengatur atau mematikan cookies melalui browser, namun beberapa fitur mungkin
          tidak berfungsi optimal.
        </P>
      </Section>

      <Section n={7} title="Kebijakan Usia">
        <P>
          HECTIX tidak diperuntukkan bagi pengguna di bawah usia 17 tahun tanpa pendampingan orang
          tua. Jika ditemukan pelanggaran, kami berhak menonaktifkan akun tersebut.
        </P>
      </Section>

      <Section n={8} title="Perubahan Kebijakan">
        <P>
          Kami dapat memperbarui dokumen ini sewaktu-waktu. Jika ada perubahan signifikan, kami akan
          mengirimkan pemberitahuan melalui email atau aplikasi.
        </P>
      </Section>

      <Section n={9} title="Kontak & Bantuan">
        <P>Jika membutuhkan bantuan, pengguna dapat menghubungi kami di:</P>
        <P>
          <B>Email:</B> meledaktiket@gmail.com
          <br />
          <B>WA:</B> Menyusul
        </P>
      </Section>
    </article>
  )
}
