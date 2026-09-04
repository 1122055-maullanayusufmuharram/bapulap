"""
Generate Daftar Hadir (per sesi) dari template dinamis.
Jumlah baris peserta di-pad otomatis menjadi 28 baris.

Cara pakai:
    python generate_daftar_hadir.py
"""

import os
from docxtpl import DocxTemplate

TEMPLATE_PATH = "DAFTAR_HADIR_TEMPLATE.docx"
OUTPUT_PATH = "output/daftar_hadir_hasil.docx"

# contoh data satu sesi - ganti sesuai input aplikasi
DATA = {
    "hari": "Rabu",
    "tanggal": "27 Agustus 2026",
    "jam_mulai": "09.00",
    "jam_selesai": "12.00",
    "nama_pengawas": "................................",
    "peserta": [
        {"nama": "AHMAD FAUZI", "npm": "222100011", "hadir": "YA"},
        {"nama": "SITI NURAINI", "npm": "222100022", "hadir": "TIDAK"},
        {"nama": "BAYU PRATAMA", "npm": "222100033", "hadir": "YA"},
    ],
}


def generate(data: dict, output_path: str = OUTPUT_PATH):
    base_dir = os.path.dirname(__file__)
    tpl_path = os.path.join(base_dir, TEMPLATE_PATH)
    
    doc = DocxTemplate(tpl_path)
    
    # Format list peserta & pad up to 28 rows
    peserta_input = data.get("peserta", [])
    peserta_list = []
    for idx, p in enumerate(peserta_input):
        peserta_list.append({
            "no": idx + 1,
            "nama": p.get("nama", ""),
            "npm": p.get("npm", ""),
            "hadir": p.get("hadir", "")
        })
        
    TARGET_ROWS = 28
    while len(peserta_list) < TARGET_ROWS:
        idx = len(peserta_list)
        peserta_list.append({
            "no": idx + 1,
            "nama": "",
            "npm": "",
            "hadir": ""
        })

    render_data = dict(data)
    render_data["peserta"] = peserta_list
    if not render_data.get("nama_pengawas"):
        render_data["nama_pengawas"] = "................................"

    doc.render(render_data)
    doc.save(output_path)
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    os.makedirs("output", exist_ok=True)
    generate(DATA)
