import sqlite3
import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IS_VERCEL = bool(os.environ.get('VERCEL'))
DB_PATH = '/tmp/bapu_database.db' if IS_VERCEL else os.path.join(BASE_DIR, 'bapu_database.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Daily Reports Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            day INTEGER NOT NULL,
            date_str TEXT NOT NULL,
            activity_text TEXT DEFAULT '',
            photo_filename TEXT DEFAULT '',
            is_sabtu_masuk INTEGER DEFAULT 0,
            is_extra_libur INTEGER DEFAULT 0,
            holiday_reason TEXT DEFAULT '',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(year, month, day)
        )
    ''')
    
    # 2. Monthly Settings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS monthly_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            sabtu_masuk_json TEXT DEFAULT '[]',
            extra_libur_json TEXT DEFAULT '[]',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(year, month)
        )
    ''')

    # 3. BAPU History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bapu_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            report_type TEXT DEFAULT 'BAPU',
            title TEXT NOT NULL,
            year INTEGER DEFAULT 0,
            month INTEGER DEFAULT 0,
            hari TEXT DEFAULT '',
            tanggal TEXT DEFAULT '',
            waktu TEXT DEFAULT '',
            ruangan TEXT DEFAULT '',
            pengawas TEXT DEFAULT '',
            catatan TEXT DEFAULT '',
            total_peserta INTEGER DEFAULT 0,
            jumlah_hadir INTEGER DEFAULT 0,
            students_json TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 4. Certificates History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            no_sertifikat TEXT UNIQUE NOT NULL,
            nama TEXT NOT NULL,
            tanggal_lahir TEXT DEFAULT '',
            jenis_kelamin TEXT DEFAULT '',
            tanggal_tes TEXT DEFAULT '',
            berlaku_sampai TEXT DEFAULT '',
            negara TEXT DEFAULT 'Indonesia',
            bahasa TEXT DEFAULT 'Indonesian',
            score_listening TEXT DEFAULT '',
            score_structure TEXT DEFAULT '',
            score_reading TEXT DEFAULT '',
            score_overall TEXT DEFAULT '',
            qr_type TEXT DEFAULT 's1',
            show_validation_logo INTEGER DEFAULT 1,
            show_cap_ttd INTEGER DEFAULT 1,
            docx_path TEXT DEFAULT '',
            pdf_path TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. App Settings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT DEFAULT '',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 6. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nama_lengkap TEXT NOT NULL,
            role TEXT DEFAULT 'pengawas',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (username, password, nama_lengkap, role) VALUES ('admin', 'admin123', 'Administrator UPA Bahasa', 'admin')")
        cursor.execute("INSERT INTO users (username, password, nama_lengkap, role) VALUES ('pengawas1', 'pengawas123', 'Pengawas Ujian UPA Bahasa', 'pengawas')")
        cursor.execute("INSERT INTO users (username, password, nama_lengkap, role) VALUES ('cetak1', 'cetak123', 'Petugas Cetak Sertifikat', 'cetak_sertifikat')")

    conn.commit()
    conn.close()

# ---------------- CERTIFICATE FUNCTIONS ----------------
def save_certificate_db(data: dict) -> int:
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO certificates (
            user_id, no_sertifikat, nama, tanggal_lahir, jenis_kelamin, tanggal_tes, berlaku_sampai,
            negara, bahasa, score_listening, score_structure, score_reading, score_overall,
            qr_type, show_validation_logo, show_cap_ttd, docx_path, pdf_path, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(no_sertifikat) DO UPDATE SET
            nama=excluded.nama,
            tanggal_lahir=excluded.tanggal_lahir,
            jenis_kelamin=excluded.jenis_kelamin,
            tanggal_tes=excluded.tanggal_tes,
            berlaku_sampai=excluded.berlaku_sampai,
            negara=excluded.negara,
            bahasa=excluded.bahasa,
            score_listening=excluded.score_listening,
            score_structure=excluded.score_structure,
            score_reading=excluded.score_reading,
            score_overall=excluded.score_overall,
            qr_type=excluded.qr_type,
            show_validation_logo=excluded.show_validation_logo,
            show_cap_ttd=excluded.show_cap_ttd,
            docx_path=excluded.docx_path,
            pdf_path=excluded.pdf_path,
            created_at=CURRENT_TIMESTAMP
    ''', (
        data.get('user_id', 1),
        data.get('no_sertifikat', ''),
        data.get('nama', '').upper(),
        data.get('tanggal_lahir', ''),
        data.get('jenis_kelamin', ''),
        data.get('tanggal_tes', ''),
        data.get('berlaku_sampai', ''),
        data.get('negara', 'Indonesia'),
        data.get('bahasa', 'Indonesian'),
        str(data.get('listening', '')),
        str(data.get('structure', '')),
        str(data.get('reading', '')),
        str(data.get('overall', '')),
        data.get('qr_type', 's1'),
        1 if data.get('show_validation_logo', True) else 0,
        1 if data.get('show_cap_ttd', True) else 0,
        data.get('docx_path', ''),
        data.get('pdf_path', '')
    ))

    cert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return cert_id

def get_certificates_history_db(query: str = '') -> list:
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    if query:
        q = f"%{query.strip()}%"
        cursor.execute("SELECT * FROM certificates WHERE nama LIKE ? OR no_sertifikat LIKE ? ORDER BY id DESC", (q, q))
    else:
        cursor.execute("SELECT * FROM certificates ORDER BY id DESC")

    rows = cursor.fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result

def get_certificate_by_no_db(no_sertifikat: str) -> dict:
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM certificates WHERE no_sertifikat = ? ORDER BY id DESC LIMIT 1", (no_sertifikat,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# ---------------- LAPORAN HARIAN FUNCTIONS ----------------
def get_month_reports_db(year, month):
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM daily_reports WHERE year=? AND month=?', (int(year), int(month)))
    rows = cursor.fetchall()
    
    cursor.execute('SELECT * FROM monthly_settings WHERE year=? AND month=?', (int(year), int(month)))
    settings_row = cursor.fetchone()
    
    conn.close()
    
    reports_map = {}
    for r in rows:
        reports_map[r['day']] = {
            'id': r['id'],
            'day': r['day'],
            'activity_text': r['activity_text'] or '',
            'photo_filename': r['photo_filename'] or '',
            'photo_url': f"/static/uploads/photos/{r['photo_filename']}" if r['photo_filename'] else '',
            'is_sabtu_masuk': bool(r['is_sabtu_masuk']),
            'is_extra_libur': bool(r['is_extra_libur']),
            'holiday_reason': r['holiday_reason'] or ''
        }
        
    sabtu_masuk = json.loads(settings_row['sabtu_masuk_json']) if settings_row else []
    extra_libur = json.loads(settings_row['extra_libur_json']) if settings_row else []
    
    return {
        'reports': reports_map,
        'sabtu_masuk': sabtu_masuk,
        'extra_libur': extra_libur
    }

def save_day_report_db(year, month, day, activity_text='', photo_filename='', is_sabtu_masuk=0, is_extra_libur=0, holiday_reason=''):
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    
    y = int(year)
    m = int(month)
    d = int(day)
    date_str = f"{y:04d}-{m:02d}-{d:02d}"
    
    cursor.execute('''
        INSERT INTO daily_reports (year, month, day, date_str, activity_text, photo_filename, is_sabtu_masuk, is_extra_libur, holiday_reason, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(year, month, day) DO UPDATE SET
            activity_text=excluded.activity_text,
            photo_filename=CASE WHEN excluded.photo_filename != '' THEN excluded.photo_filename ELSE daily_reports.photo_filename END,
            is_sabtu_masuk=excluded.is_sabtu_masuk,
            is_extra_libur=excluded.is_extra_libur,
            holiday_reason=excluded.holiday_reason,
            updated_at=CURRENT_TIMESTAMP
    ''', (y, m, d, date_str, activity_text, photo_filename, int(is_sabtu_masuk), int(is_extra_libur), holiday_reason))
    
    conn.commit()
    conn.close()
    return True

# ---------------- BAPU HISTORY FUNCTIONS ----------------
def save_bapu_history_db(hari, tanggal, waktu, ruangan, pengawas, catatan, total_peserta, jumlah_hadir, students_json, user_id=1):
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    
    title = f"BAPU TELP - {hari}, {tanggal} ({ruangan})"
    
    cursor.execute('''
        INSERT INTO bapu_history (user_id, report_type, title, hari, tanggal, waktu, ruangan, pengawas, catatan, total_peserta, jumlah_hadir, students_json, created_at)
        VALUES (?, 'BAPU', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ''', (user_id, title, hari, tanggal, waktu, ruangan, pengawas, catatan, int(total_peserta), int(jumlah_hadir), students_json))
    
    conn.commit()
    history_id = cursor.lastrowid
    conn.close()
    return history_id

def get_bapu_history_db():
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM bapu_history ORDER BY id DESC')
    rows = cursor.fetchall()
# ---------------- APP SETTINGS (GDRIVE, SYSTEM) ----------------
def save_app_setting(key: str, val: str):
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
            value=excluded.value,
            updated_at=CURRENT_TIMESTAMP
    ''', (key, str(val)))
    conn.commit()
    conn.close()
    return True

def get_all_app_settings():
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT key, value FROM app_settings')
    rows = cursor.fetchall()
    conn.close()
    return {r['key']: r['value'] for r in rows}

if __name__ == '__main__':
    init_db()
    print("Database checked & initialized!")
