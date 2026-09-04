"""
Generate Laporan Kegiatan Bulanan dari template dinamis.

- Hari Minggu otomatis di-skip (selalu libur).
- Tanggal merah (hari libur nasional) otomatis di-skip, dideteksi pakai
  library `holidays` (paket: pip install holidays).
- Hari Sabtu bersifat opsional: cuma tanggal yang lo masukin ke
  SABTU_MASUK yang akan muncul di laporan; Sabtu lain otomatis di-skip.
- "Cuti bersama" (bridge day) kadang belum kecover otomatis oleh
  library holidays, jadi ada slot EXTRA_LIBUR buat nambahin manual kalau perlu.

Setiap baris butuh 1 foto dokumentasi (path file lokal). Kalau belum ada
fotonya, baris itu bisa dilewat dulu / diisi placeholder.

Cara pakai:
    python generate_laporan.py
"""

import calendar
from datetime import date

import holidays
from docxtpl import DocxTemplate, InlineImage
from docx.shared import Mm

TEMPLATE_PATH = "LAPORAN_TEMPLATE.docx"
OUTPUT_PATH = "output/laporan_hasil.docx"

HARI_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
BULAN_ID = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]


def format_tanggal_id(d: date) -> str:
    return f"{d.day} {BULAN_ID[d.month]} {d.year}"


def build_hari_kerja(
    year: int,
    month: int,
    sabtu_masuk: set[int] | None = None,
    extra_libur: set[int] | None = None,
    foto_per_tanggal: dict[int, str] | None = None,
    placeholder_image: str | None = None,
    doc: DocxTemplate | None = None,
):
    """
    sabtu_masuk       : set tanggal (int) Sabtu yang MASUK kerja, misal {2, 16}
    extra_libur       : set tanggal (int) libur tambahan/cuti bersama di luar
                        yang otomatis kedeteksi oleh library holidays
    foto_per_tanggal  : dict {tanggal(int): path_foto} dokumentasi tiap hari
    placeholder_image : dipakai kalau tanggal tsb belum ada fotonya
    """
    sabtu_masuk = sabtu_masuk or set()
    extra_libur = extra_libur or set()
    foto_per_tanggal = foto_per_tanggal or {}

    id_holidays = holidays.Indonesia(years=year)
    _, n_days = calendar.monthrange(year, month)

    hari_kerja = []
    for day_num in range(1, n_days + 1):
        d = date(year, month, day_num)
        weekday = d.weekday()  # 0=Senin ... 5=Sabtu, 6=Minggu

        if weekday == 6:  # Minggu -> selalu skip
            continue
        if d in id_holidays or day_num in extra_libur:  # tanggal merah / cuti bersama
            continue
        if weekday == 5 and day_num not in sabtu_masuk:  # Sabtu opsional
            continue

        foto_path = foto_per_tanggal.get(day_num, placeholder_image)
        gambar = InlineImage(doc, foto_path, width=Mm(50)) if (doc and foto_path) else ""

        hari_kerja.append(
            {
                "hari": HARI_ID[weekday],
                "tanggal": format_tanggal_id(d),
                "gambar": gambar,
            }
        )

    return hari_kerja


def generate(
    year: int,
    month: int,
    sabtu_masuk: set[int] | None = None,
    extra_libur: set[int] | None = None,
    foto_per_tanggal: dict[int, str] | None = None,
    placeholder_image: str | None = None,
    output_path: str = OUTPUT_PATH,
):
    doc = DocxTemplate(TEMPLATE_PATH)
    hari_kerja = build_hari_kerja(
        year, month, sabtu_masuk, extra_libur, foto_per_tanggal, placeholder_image, doc
    )
    doc.render({"hari_kerja": hari_kerja})
    doc.save(output_path)
    print(f"Saved: {output_path} ({len(hari_kerja)} hari kerja)")
    for h in hari_kerja:
        print(" -", h["hari"], h["tanggal"])


if __name__ == "__main__":
    import os

    os.makedirs("output", exist_ok=True)

    # contoh: laporan Mei 2026, Sabtu yang masuk cuma tanggal 2
    generate(
        year=2026,
        month=5,
        sabtu_masuk={2},
        extra_libur={15, 28},  # contoh cuti bersama tambahan (opsional)
        foto_per_tanggal={
            # 2: "foto/02_mei.jpg",
            # 4: "foto/04_mei.jpg",
            # isi sesuai foto dokumentasi yang lo punya
        },
        placeholder_image="placeholder.jpg",
    )
