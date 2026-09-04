import os
import calendar
from datetime import datetime
from PIL import Image
from docxtpl import DocxTemplate, InlineImage
from docx.shared import Mm
import db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IS_VERCEL = bool(os.environ.get('VERCEL'))
LAPORAN_TEMPLATE_PATH = os.path.join(BASE_DIR, "laporan harian", "LAPORAN_TEMPLATE.docx")
OUTPUT_DIR = '/tmp/output' if IS_VERCEL else os.path.join(BASE_DIR, "output")
UPLOAD_PHOTO_DIR = '/tmp/uploads/photos' if IS_VERCEL else os.path.join(BASE_DIR, "static", "uploads", "photos")
PLACEHOLDER_PHOTO = os.path.join(BASE_DIR, "static", "assets", "placeholder.jpg")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(UPLOAD_PHOTO_DIR, exist_ok=True)

HARI_INDONESIA = {
    'Monday': 'Senin',
    'Tuesday': 'Selasa',
    'Wednesday': 'Rabu',
    'Thursday': 'Kamis',
    'Friday': 'Jumat',
    'Saturday': 'Sabtu',
    'Sunday': 'Minggu'
}

BULAN_INDONESIA = {
    1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
    5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
    9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
}

CUTI_BERSAMA = {
    2025: {
        '01-28': 'Cuti Bersama Tahun Baru Imlek',
        '03-28': 'Cuti Bersama Hari Suci Nyepi',
        '04-02': 'Cuti Bersama Idul Fitri 1446 H',
        '04-03': 'Cuti Bersama Idul Fitri 1446 H',
        '04-04': 'Cuti Bersama Idul Fitri 1446 H',
        '04-07': 'Cuti Bersama Idul Fitri 1446 H',
        '05-13': 'Cuti Bersama Hari Raya Waisak',
        '05-30': 'Cuti Bersama Kenaikan Yesus Kristus',
        '06-09': 'Cuti Bersama Hari Raya Idul Adha',
        '12-26': 'Cuti Bersama Hari Raya Natal',
    },
    2026: {
        '02-16': 'Cuti Bersama Tahun Baru Imlek',
        '03-18': 'Cuti Bersama Hari Suci Nyepi',
        '03-20': 'Cuti Bersama Idul Fitri 1447 H',
        '03-23': 'Cuti Bersama Idul Fitri 1447 H',
        '03-24': 'Cuti Bersama Idul Fitri 1447 H',
        '05-15': 'Cuti Bersama Kenaikan Yesus Kristus',
        '05-28': 'Cuti Bersama Hari Raya Idul Adha',
        '12-24': 'Cuti Bersama Hari Raya Natal',
        '12-26': 'Cuti Bersama Hari Raya Natal',
    },
    2027: {
        '02-05': 'Cuti Bersama Tahun Baru Imlek',
        '03-11': 'Cuti Bersama Idul Fitri 1448 H',
        '03-12': 'Cuti Bersama Idul Fitri 1448 H',
        '03-15': 'Cuti Bersama Idul Fitri 1448 H',
        '05-07': 'Cuti Bersama Kenaikan Yesus Kristus',
        '12-24': 'Cuti Bersama Hari Raya Natal',
    }
}

import holidays as id_holidays_pkg
from datetime import timedelta

def get_year_cuti_bersama(year):
    """
    Mengambil daftar Cuti Bersama resmi (SKB 3 Menteri).
    Jika tahun > 2027 belum terbit SKB resmi, sistem secara otomatis
    menghitung Cuti Bersama perkiraan (Idul Fitri H-1/H+2/H+3, Natal, dll.)
    """
    if year in CUTI_BERSAMA:
        return CUTI_BERSAMA[year]
    
    # Auto-calculate dynamic Cuti Bersama for any future year (2028-2050+)
    dyn_cuti = {}
    try:
        id_h = id_holidays_pkg.Indonesia(years=[year])
        for h_date, h_name in id_h.items():
            if 'Idul Fitri' in h_name and 'kedua' not in h_name:
                for offset, label in [(-1, 'Cuti Bersama Idul Fitri (H-1)'), (2, 'Cuti Bersama Idul Fitri (H+2)'), (3, 'Cuti Bersama Idul Fitri (H+3)')]:
                    c_date = h_date + timedelta(days=offset)
                    if c_date.year == year and c_date.weekday() < 5:
                        dyn_cuti[f"{c_date.month:02d}-{c_date.day:02d}"] = f"{label} {year}"
            elif 'Natal' in h_name:
                c_date = h_date - timedelta(days=1)
                if c_date.year == year and c_date.weekday() < 5:
                    dyn_cuti[f"{c_date.month:02d}-{c_date.day:02d}"] = f"Cuti Bersama Hari Raya Natal {year}"
    except Exception:
        pass
    return dyn_cuti

def get_month_working_days(year, month):
    """
    Menghitung kalender kerja bulanan:
    - Libur Nasional Resmi & Minggu: Terkunci ('is_locked_holiday = True')
    - Sabtu & Cuti Bersama: Default Merah/Libur, tapi bisa diatur Masuk Kerja
    """
    db_data = db.get_month_reports_db(year, month)
    reports = db_data.get('reports', {})
    year_cuti = get_year_cuti_bersama(year)

    # Fetch official Indonesian national holidays (Islamic, Christian, State, Buddhist, Hindu, Chinese)
    year_holidays = {}
    try:
        id_h = id_holidays_pkg.Indonesia(years=[year])
        for h_date, h_name in id_h.items():
            mmdd = f"{h_date.month:02d}-{h_date.day:02d}"
            year_holidays[mmdd] = h_name
    except Exception:
        pass

    num_days = calendar.monthrange(year, month)[1]
    days_list = []
    working_days_count = 0
    photos_count = 0

    for day in range(1, num_days + 1):
        dt = datetime(year, month, day)
        weekday_en = dt.strftime('%A')
        hari_id = HARI_INDONESIA.get(weekday_en, weekday_en)
        date_str = dt.strftime('%Y-%m-%d')
        tanggal_id = f"{day} {BULAN_INDONESIA.get(month)} {year}"
        month_day_key = f"{month:02d}-{day:02d}"

        rep = reports.get(day, {})
        is_auto_cuti = month_day_key in year_cuti
        is_sabtu_masuk = rep.get('is_sabtu_masuk', False)
        is_extra_libur = rep.get('is_extra_libur', False) or is_auto_cuti
        holiday_reason = rep.get('holiday_reason', '')
        activity_text = rep.get('activity_text', '')
        photo_filename = rep.get('photo_filename', '')
        photo_url = rep.get('photo_url', '')

        # Working day determination
        if month_day_key in year_holidays:
            is_working_day = False
            is_locked_holiday = True
            holiday_reason = year_holidays[month_day_key]
        elif weekday_en == 'Sunday':
            is_working_day = False
            is_locked_holiday = True
            if not holiday_reason:
                holiday_reason = 'Hari Minggu'
        elif weekday_en == 'Saturday':
            is_locked_holiday = False
            if is_sabtu_masuk and not is_extra_libur:
                is_working_day = True
                holiday_reason = 'Sabtu Masuk'
            else:
                is_working_day = False
                if not holiday_reason:
                    holiday_reason = 'Hari Sabtu'
        elif is_extra_libur:
            is_locked_holiday = False
            if is_sabtu_masuk:
                is_working_day = True
                holiday_reason = 'Kerja (Masuk Cuti Bersama)'
            else:
                is_working_day = False
                if not holiday_reason:
                    holiday_reason = year_cuti.get(month_day_key, 'Cuti Bersama')
        else:
            is_locked_holiday = False
            is_working_day = True

        has_photo = bool(photo_filename)

        if is_working_day:
            working_days_count += 1
        if has_photo:
            photos_count += 1

        days_list.append({
            'day': day,
            'hari': hari_id,
            'date_str': date_str,
            'tanggal': tanggal_id,
            'is_working_day': is_working_day,
            'is_locked_holiday': is_locked_holiday,
            'is_sabtu_masuk': is_sabtu_masuk,
            'is_extra_libur': is_extra_libur,
            'holiday_reason': holiday_reason,
            'activity_text': activity_text,
            'photo_filename': photo_filename,
            'photo_url': photo_url,
            'has_photo': has_photo
        })

    return {
        'year': year,
        'month': month,
        'month_name': BULAN_INDONESIA.get(month),
        'total_days': num_days,
        'working_days_count': working_days_count,
        'photos_count': photos_count,
        'days': days_list
    }

from PIL import Image, ImageOps

def get_safe_image_for_docx(photo_path: str, doc: DocxTemplate) -> InlineImage:
    """
    Ensures the image is in PNG or JPEG format supported by python-docx,
    applies EXIF orientation transpose, and forces landscape orientation (width > height)
    so that photos inserted into the Word report document are ALWAYS horizontal/landscape.
    """
    if not photo_path or not os.path.exists(photo_path):
        photo_path = PLACEHOLDER_PHOTO

    if not os.path.exists(photo_path):
        photo_path = os.path.join(BASE_DIR, "web_assets", "image1.png")

    if not os.path.exists(photo_path):
        img = Image.new("RGB", (400, 225), color=(241, 245, 249))
        photo_path = os.path.join(OUTPUT_DIR, "_temp_default_placeholder.jpg")
        img.save(photo_path, "JPEG")

    # Force auto-rotate to landscape format
    landscape_path = os.path.join(OUTPUT_DIR, f"_landscape_{os.path.basename(photo_path)}.jpg")
    try:
        with Image.open(photo_path) as im:
            im = ImageOps.exif_transpose(im)
            im = im.convert("RGB")
            # If photo is portrait (height > width), rotate 270 degrees to landscape
            if im.height > im.width:
                im = im.rotate(270, expand=True)
            im.save(landscape_path, "JPEG", quality=90)
            photo_path = landscape_path
    except Exception as e:
        print(f"Landscape conversion note for {photo_path}: {e}")

    try:
        return InlineImage(doc, photo_path, width=Mm(52), height=Mm(30))
    except Exception:
        fallback_img = Image.new("RGB", (400, 225), color=(241, 245, 249))
        fallback_path = os.path.join(OUTPUT_DIR, "_temp_fallback.jpg")
        fallback_img.save(fallback_path, "JPEG")
        return InlineImage(doc, fallback_path, width=Mm(52), height=Mm(30))

def generate_laporan_harian_docx(year: int, month: int, output_filename: str = None) -> tuple:
    """
    Generates official Laporan Harian Word document from LAPORAN_TEMPLATE.docx
    Table loop: {%tr for item in hari_kerja %}
    Columns: loop.index | item.hari | item.tanggal | item.gambar
    """
    if not os.path.exists(LAPORAN_TEMPLATE_PATH):
        raise FileNotFoundError(f"Template Laporan Harian tidak ditemukan di: {LAPORAN_TEMPLATE_PATH}")

    month_data = get_month_working_days(year, month)
    doc = DocxTemplate(LAPORAN_TEMPLATE_PATH)

    working_days = [d for d in month_data['days'] if d['is_working_day']]

    hari_kerja_render = []
    for item in working_days:
        photo_path = None
        if item['photo_filename']:
            p_candidate = os.path.join(UPLOAD_PHOTO_DIR, item['photo_filename'])
            if os.path.exists(p_candidate):
                photo_path = p_candidate

        inline_img = get_safe_image_for_docx(photo_path, doc)

        hari_kerja_render.append({
            'hari': item['hari'],
            'tanggal': item['tanggal'],
            'activity_text': item['activity_text'] or 'Melaksanakan tugas pengawasan dan pelayanan bahasa.',
            'gambar': inline_img
        })

    context = {
        'bulan': month_data['month_name'],
        'tahun': year,
        'total_hari_kerja': month_data['working_days_count'],
        'hari_kerja': hari_kerja_render
    }

    doc.render(context)

    if not output_filename:
        output_filename = f"Laporan_Harian_{month_data['month_name']}_{year}.docx"

    out_path = os.path.join(OUTPUT_DIR, output_filename)
    doc.save(out_path)

    return out_path, os.path.getsize(out_path)


def generate_laporan_harian_docx_from_data(month_data: dict, output_filename: str = None) -> tuple:
    """
    Generates official Laporan Harian Word document from pre-fetched month data
    sent by Laravel (uses MySQL data with correct per-user photo_abs_path).
    
    month_data keys expected:
      - year, month, month_name, user_name, user_id
      - working_days / working_days_count
      - days: list of day dicts with:
          day, hari, tanggal, is_working_day, activity_text,
          photo_filename, photo_abs_path (absolute path on server filesystem)
    """
    if not os.path.exists(LAPORAN_TEMPLATE_PATH):
        raise FileNotFoundError(f"Template Laporan Harian tidak ditemukan di: {LAPORAN_TEMPLATE_PATH}")

    year = month_data.get('year', 2026)
    month = month_data.get('month', 8)
    month_name = month_data.get('month_name', BULAN_INDONESIA.get(int(month), 'Bulan'))
    user_name = month_data.get('user_name', 'Pegawai UPA Bahasa')
    working_days_count = month_data.get('working_days') or month_data.get('working_days_count', 0)

    doc = DocxTemplate(LAPORAN_TEMPLATE_PATH)

    # Build working days list with photos from Laravel storage paths
    all_days = month_data.get('days', [])
    working_days = [d for d in all_days if d.get('is_working_day')]

    hari_kerja_render = []
    for item in working_days:
        # Use absolute path from Laravel (photo_abs_path) if available
        photo_path = item.get('photo_abs_path') or None

        # Fallback: try UPLOAD_PHOTO_DIR (Flask static) if photo_filename exists
        if not photo_path and item.get('photo_filename'):
            p_candidate = os.path.join(UPLOAD_PHOTO_DIR, item['photo_filename'])
            if os.path.exists(p_candidate):
                photo_path = p_candidate

        # Network fallback: If Laravel and Flask are on separate hosting, fetch from photo_url
        if (not photo_path or not os.path.exists(photo_path)) and item.get('photo_url'):
            p_url = item['photo_url']
            if p_url.startswith('http://') or p_url.startswith('https://'):
                try:
                    import requests
                    r = requests.get(p_url, timeout=10)
                    if r.status_code == 200 and len(r.content) > 100:
                        tmp_name = f"_dl_{item.get('photo_filename', 'photo.webp')}"
                        tmp_path = os.path.join(OUTPUT_DIR, tmp_name)
                        with open(tmp_path, 'wb') as f:
                            f.write(r.content)
                        photo_path = tmp_path
                except Exception as e:
                    print(f"Note: Could not download remote photo from {p_url}: {e}")

        inline_img = get_safe_image_for_docx(photo_path, doc)

        # Format tanggal from date_str if 'tanggal' key missing
        tanggal_str = item.get('tanggal', '')
        if not tanggal_str and item.get('date_str'):
            try:
                dt = datetime.strptime(item['date_str'], '%Y-%m-%d')
                tanggal_str = f"{dt.day} {BULAN_INDONESIA.get(dt.month)} {dt.year}"
            except Exception:
                tanggal_str = item.get('date_str', '')

        hari_kerja_render.append({
            'hari': item.get('hari', item.get('day_name', '')),
            'tanggal': tanggal_str,
            'activity_text': item.get('activity_text') or 'Melaksanakan tugas pengawasan dan pelayanan bahasa.',
            'gambar': inline_img
        })

    context = {
        'bulan': month_name,
        'tahun': year,
        'nama_pegawai': user_name,
        'total_hari_kerja': working_days_count,
        'hari_kerja': hari_kerja_render
    }

    doc.render(context)

    if not output_filename:
        safe_name = ''.join(c if c.isalnum() or c in '_-' else '_' for c in user_name)
        output_filename = f"Laporan_Harian_{month_name}_{year}_{safe_name}.docx"

    out_path = os.path.join(OUTPUT_DIR, output_filename)
    doc.save(out_path)

    return out_path, os.path.getsize(out_path)
