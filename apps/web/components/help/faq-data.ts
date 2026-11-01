export type FaqItem = {
  q: string
  intro?: string
  steps?: string[]
  outro?: string
}

export type FaqSection = {
  title: string
  items: FaqItem[]
}

export const faqSections: FaqSection[] = [
  {
    title: "Tiket & Pembelian",
    items: [
      {
        q: "Bagaimana cara membeli tiket?",
        steps: [
          "Pilih event yang ingin di hadiri.",
          "Tentukan kategori tiket dan jumlahnya.",
          "Masuk/login ke AKUN (jika belum masuk/login).",
          "Pilih metode pembayaran.",
          "Selesaikan pembayaran sesuai intruksi.",
        ],
        outro: "Setelah pembayaran berhasil, tiket otomatis muncul di HISTORI (Dibeli).",
      },
      {
        q: "Kenapa pembayaran saya pending?",
        intro: "Status pending biasanya terjadi karena:",
        steps: [
          "Sistem bank mengalami antrean.",
          "Anda belum menyelesaikan pembayaran.",
          "Pembayaran sedang menunggu konfirmasi dari pihak penyedia.",
        ],
        outro:
          "Jika status tidak berubah setelah 10-15 menit, cek riwayat transaksi anda atau hubungi bantuan.",
      },
      {
        q: "VA/QRIS tidak muncul. Apa yang harus dilakukan?",
        steps: [
          "Coba refresh halaman pembayaran.",
          "Pastikan koneksi internet anda stabil.",
          "Coba gunakan browser lain.",
          "Jika masih tidak muncul dalam 5 menit, ulangi pemesanan.",
        ],
        outro: "Tidak ada dana yang terpotong sebelum anda menyelesaikan pembayaran.",
      },
      {
        q: "Bagaimana cara melihat tiket saya?",
        steps: ["Masuk ke platform HECTIX.ID.", "Pilih profil → histori."],
        outro:
          "Semua tiket yang dibeli akan tampil dengan status aktif/selesai, dan juga tiket yang disukai (favorit).",
      },
      {
        q: "Bagaimana cara mendownload tiket saya?",
        steps: ["Masuk ke Histori → Pilih tiket yang ingin dicetak → cetak tiket."],
        outro: "Tiket dapat diunduh dalam format PDF.",
      },
      {
        q: "Bagaimana cara masuk/check-in saat event?",
        steps: [
          "Buka Histori → tiket aktif → pilih tiket. atau buka tiket yang telah anda download.",
          "Tunjukkan QR Code ke petugas.",
          "Petugas akan melakukan scanning.",
        ],
        outro: "Setelah tiket discan, akan muncul notifikasi Check-in Berhasil.",
      },
    ],
  },
  {
    title: "Pembayaran",
    items: [
      {
        q: "Metode pembayaran apa saja yang tersedia?",
        steps: ["Transfer bank (Virtual Account).", "QRIS."],
        outro: "Metode yang tersedia bisa berbeda tergantung event atau penyedia.",
      },
      {
        q: "Berapa biaya platform fee?",
        steps: [
          "Platform fee mencakup biaya layanan, sistem ticketing, dan operasional pembayaran.",
          "Besarnya fee ditampilkan secara transparan sebelum Anda menyelesaikan transaksi.",
        ],
      },
      {
        q: "Kenapa pembelian tiket saya gagal?",
        intro: "Beberapa penyebab umum:",
        steps: [
          "Saldo tidak cukup.",
          "Limit kartu habis.",
          "Koneksi internet tidak stabil.",
          "Server bank sementara mengalami gangguan.",
          "Anda melewati batas waktu pembayaran.",
        ],
        outro:
          "Jika saldo terpotong tetapi tiket tidak masuk, sistem otomatis melakukan pengecekan dan akan mengembalikan dana dalam 1×24 jam.",
      },
      {
        q: "Bagaimana proses refund?",
        intro: "Jika event membatalkan atau menyediakan opsi refund:",
        steps: [
          "Buka Histori → Tiket aktif → Pilih tiket.",
          "Muncul status “acara dibatalkan” di tiket.",
          "Pilih ajukan refund.",
          "Isi nomor rekening penerimaan refund.",
        ],
        outro:
          "Informasi mengenai proses dan estimasi waktu refund akan di konfirmasi melalui email. menyesuaikan kebijakan dari pihak penyelenggara.",
      },
    ],
  },
  {
    title: "Akun",
    items: [
      {
        q: "Bagaimana cara mengganti email/no HP?",
        steps: [
          "Masuk ke pengaturan akun.",
          "Pilih ganti email untuk mengganti email.",
          "Pilih ganti nomor telepon untuk mengganti nomor telepon.",
        ],
        outro:
          "Verifikasi perubahan melalui kode OTP (untuk nomor telepon), dan melalui link (untuk mengganti email).",
      },
      {
        q: "Bagaimana cara verifikasi akun?",
        steps: ["Masukan kode OTP yang kami kirim.", "Atau klik link verifikasi yang kami kirim."],
        outro: "Akun terverifikasi memberi keamanan ekstra dan mempercepat proses pembelian/refund.",
      },
      {
        q: "Bagaimana cara menghapus akun?",
        steps: ["Masuk ke pengaturan → akun → hapus akun.", "Verifikasi penghapusan akun."],
        outro: "Penghapusan bersifat permanen dan tidak dapat dipulihkan.",
      },
    ],
  },
  {
    title: "Event",
    items: [
      {
        q: "Bagaimana cara melihat update event?",
        steps: ["Masuk ke notifikasi."],
        outro:
          "Semua update event yang di informasikan oleh penyelenggara akan anda terima di notifikasi.",
      },
      {
        q: "Event pindah venue, apa yang harus saya lakukan?",
        steps: [
          "Anda tidak perlu melakukan apa-apa.",
          "Tiket anda tetap valid selama tidak ada pemberitahuan lain dari penyelenggara.",
        ],
        outro: "Jika anda tidak bisa hadir, cek apakah penyelenggara menyediakan opsi refund.",
      },
      {
        q: "Event dibatalkan, apakah saya mendapatkan refund?",
        steps: [
          "Kebijakan refund sepenuhnya menjadi keputusan dari pihak penyelenggara.",
          "Bentuk refund dapat bervariasi tergantung kebijakan dari penyelenggara.",
        ],
        outro: "Kami bertugas untuk memfasilitasi dan menindak lanjuti keputusan dari pihak terkait.",
      },
    ],
  },
  {
    title: "Profil & Wall",
    items: [
      {
        q: "Bagaimana cara memberikan komentar?",
        steps: [
          "Masuk ke halaman event.",
          "Pilih tulis komentar → anda akan diarahkan ke tembok acara.",
          "Tulis komentar anda.",
          "Pilih kirim komentar.",
        ],
        outro: "Anda dapat menuliskan komentar sampai dengan 145 karakter.",
      },
      {
        q: "Kenapa saya tidak bisa memberikan komentar?",
        steps: [
          "Komentar hanya bisa diberikan jika anda sudah melakukan pembelian tiket.",
          "kemungkinan anda melanggar pedoman komunitas.",
          "Event membatasi komentar.",
        ],
        outro: "Tembok acara adalah tempat dimana anda bisa merasakan crowd ambience sebelum acara.",
      },
      {
        q: "Apa itu badges, dan apa fungsinya?",
        intro:
          "Badges adalah tanda pencapaian dan status khusus di profile anda. Badges bisa didapatkan dari aktivasi tertentu seperti:",
        steps: [
          "Pembeli aktif di platform HECTIX.",
          "Hadir di beberapa event/event khusus.",
          "Early supporter.",
          "Dan beberapa kemungkinan tertentu.",
        ],
        outro: "Badges memberikan identitas dan meningkatkan kredibilitas anda di komunitas.",
      },
    ],
  },
]
