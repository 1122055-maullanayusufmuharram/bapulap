import os
import tempfile
import json
import uuid
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import generator
import db
import laporan_engine
import cert_engine

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024  # 64 MB limit

# Initialize DB on startup
db.init_db()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IS_VERCEL = bool(os.environ.get('VERCEL'))
OUTPUT_DIR = '/tmp/output' if IS_VERCEL else os.path.join(BASE_DIR, 'output')
UPLOAD_PHOTO_DIR = '/tmp/uploads/photos' if IS_VERCEL else os.path.join(BASE_DIR, 'static', 'uploads', 'photos')
LOGO_PATH = os.path.join(BASE_DIR, 'static', 'assets', 'logo_unsil.png')

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(UPLOAD_PHOTO_DIR, exist_ok=True)

@app.route('/')
@app.route('/login')
def index():
    return render_template('index.html')

# ==========================================
# FLUTTER MOBILE & REST API GATEWAY (v1)
# ==========================================

@app.route('/api/v1/config.json', methods=['GET'])
def get_python_config_json():
    """Dynamic API Gateway Resolver Endpoint for Mobile Flutter"""
    return jsonify({
        'config_version': 1,
        'api_base_url': request.host_url.rstrip('/') + '/api/v1',
        'app_status': 'online',
        'min_app_version': '1.0.0',
        'announcement': 'Portal Terpadu UPA Bahasa UNSIL Active',
        'updated_at': '2026-08-28 16:00:00'
    })

@app.route('/api/v1/holidays', methods=['GET'])
def api_get_holidays():
    """Get official Indonesian national holidays for a specific year"""
    from datetime import datetime
    import holidays as id_holidays_pkg
    year = int(request.args.get('year', datetime.now().year))
    result = {}
    try:
        id_h = id_holidays_pkg.Indonesia(years=[year])
        for h_date, h_name in id_h.items():
            mmdd = f"{h_date.month:02d}-{h_date.day:02d}"
            result[mmdd] = h_name
    except Exception as e:
        pass
    return jsonify({'success': True, 'year': year, 'holidays': result})

@app.route('/api/v1/auth/login', methods=['POST'])
def api_python_login():
    """Mobile & Web API Auth Login"""
    payload = request.json or {}
    username = payload.get('username', '')
    password = payload.get('password', '')

    if username and password:
        return jsonify({
            'success': True,
            'message': 'Login berhasil',
            'token': f"token_{uuid.uuid4().hex}",
            'user': {
                'id': 1,
                'username': username,
                'name': 'Pengawas Ujian UPA Bahasa',
                'role': 'admin' if username == 'admin' else 'pengawas'
            }
        })
    return jsonify({'success': False, 'message': 'Username atau password tidak boleh kosong'}), 400

# ==========================================
# AUTO SERTIFIKAT API (DOCX GENERATOR ENGINE)
# ==========================================

@app.route('/api/v1/certificates/generate', methods=['POST'])
@app.route('/api/certificates/generate', methods=['POST'])
def api_generate_certificate():
    try:
        req_data = request.json or {}
        no_sertifikat = req_data.get('no_sertifikat')
        nama = req_data.get('nama', '').upper()
        tanggal_lahir = req_data.get('tanggal_lahir', '04/01/2009')
        jenis_kelamin = req_data.get('jenis_kelamin', 'F (Female)')
        negara = req_data.get('negara', 'Indonesia')
        bahasa = req_data.get('bahasa', 'Indonesian')
        tanggal_tes = req_data.get('tanggal_tes', '19/12/2025')
        berlaku_sampai = req_data.get('berlaku_sampai', '19/12/2027')
        listening = str(req_data.get('listening', 56))
        structure = str(req_data.get('structure', 53))
        reading = str(req_data.get('reading', 50))
        overall = str(req_data.get('overall', 530))
        qr_type = req_data.get('qr_type', 's1')
        show_validation = req_data.get('show_validation', True)
        show_cap = req_data.get('show_cap', True)

        if not no_sertifikat or not nama:
            return jsonify({'error': 'Nomor sertifikat dan nama peserta wajib diisi'}), 400

        cert_data = {
            'no_sertifikat': no_sertifikat,
            'nama': nama,
            'tanggal_lahir': tanggal_lahir,
            'jenis_kelamin': jenis_kelamin,
            'negara': negara,
            'bahasa': bahasa,
            'tanggal_tes': tanggal_tes,
            'berlaku_sampai': berlaku_sampai,
            'listening': listening,
            'structure': structure,
            'reading': reading,
            'overall': overall,
            'qr_type': qr_type,
            'show_validation_logo': show_validation,
            'show_cap_ttd': show_cap
        }

        gdrive_settings = req_data.get('gdrive_settings')
        res = cert_engine.generate_certificate_full(
            cert_data,
            generate_pdf=True,
            generate_polos=True,
            gdrive_settings=gdrive_settings
        )

        return jsonify({
            'success': True,
            'message': f'Sertifikat {no_sertifikat} berhasil dibuat & tersimpan!',
            'filename': res['docx_resmi']['filename'],
            'download_url': res['docx_resmi']['url'],
            'pdf_url': res['pdf_resmi']['url'] if res.get('pdf_resmi') else None,
            'pdf_filename': res['pdf_resmi']['filename'] if res.get('pdf_resmi') else None,
            'data': res
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/certificates/bulk-upload', methods=['POST'])
def api_bulk_upload_certificates():
    """Bulk Excel Studio: Upload student Excel and generate batch certificates in ZIP"""
    if 'file' not in request.files:
        return jsonify({'error': 'File Excel tidak ditemukan'}), 400

    file = request.files['file']
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        return jsonify({'error': 'Format file harus .xlsx atau .xls'}), 400

    temp_path = os.path.join(OUTPUT_DIR, f"bulk_{uuid.uuid4().hex[:6]}_{file.filename}")
    file.save(temp_path)

    try:
        kd_doc = request.form.get('kd_doc', '135512')
        kd_lem = request.form.get('kd_lem', 'SULCUN58')
        start_urut = int(request.form.get('start_urut', 1))
        qr_type = request.form.get('qr_type', 's1')
        show_val = request.form.get('show_validation', '1') == '1'
        show_cap = request.form.get('show_cap', '1') == '1'

        res = cert_engine.generate_bulk_certificates_from_excel(
            temp_path,
            kd_doc=kd_doc,
            kd_lem=kd_lem,
            start_urut=start_urut,
            qr_type=qr_type,
            show_validation=show_val,
            show_cap=show_cap
        )
        return jsonify(res)
    except Exception as e:
        return jsonify({'error': f"Gagal memproses Bulk Excel: {str(e)}"}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/v1/certificates/bulk-parse', methods=['POST'])
def api_bulk_parse_certificates():
    """Bulk Excel Studio: Parse Excel and return editable records array for interactive studio"""
    if 'file' not in request.files:
        return jsonify({'error': 'File Excel tidak ditemukan'}), 400

    file = request.files['file']
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        return jsonify({'error': 'Format file harus .xlsx atau .xls'}), 400

    temp_path = os.path.join(OUTPUT_DIR, f"parse_{uuid.uuid4().hex[:6]}_{file.filename}")
    file.save(temp_path)

    try:
        kd_doc = request.form.get('kd_doc', '135512')
        kd_lem = request.form.get('kd_lem', 'SULCUN58')
        start_urut = int(request.form.get('start_urut', 1))
        qr_type = request.form.get('qr_type', 's1')

        custom_mapping_raw = request.form.get('custom_mapping', '')
        custom_col_map = None
        if custom_mapping_raw:
            try:
                custom_col_map = json.loads(custom_mapping_raw)
            except Exception:
                pass

        header_idx_raw = request.form.get('header_idx', '')
        custom_header_idx = int(header_idx_raw) if header_idx_raw.isdigit() else None

        parse_res = cert_engine.parse_bulk_excel(
            temp_path,
            kd_doc=kd_doc,
            kd_lem=kd_lem,
            start_urut=start_urut,
            qr_type=qr_type,
            custom_col_map=custom_col_map,
            custom_header_idx=custom_header_idx
        )
        return jsonify({
            'success': True,
            'count': len(parse_res['records']),
            'filename': file.filename,
            'records': parse_res['records'],
            'headers': parse_res.get('headers', []),
            'col_map': parse_res.get('col_map', {}),
            'header_idx': parse_res.get('header_idx', 0)
        })
    except Exception as e:
        return jsonify({'error': f"Gagal membaca file Excel: {str(e)}"}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/v1/certificates/bulk-generate-records', methods=['POST'])
def api_bulk_generate_records():
    """Bulk Excel Studio: Generate all certificates from revised records list and zip"""
    try:
        payload = request.json or {}
        records = payload.get('records', [])
        if not records:
            return jsonify({'error': 'Daftar peserta tidak boleh kosong'}), 400

        gdrive_settings = payload.get('gdrive_settings')
        res = cert_engine.generate_bulk_from_records(
            records,
            generate_pdf=True,
            generate_polos=True,
            gdrive_settings=gdrive_settings
        )
        return jsonify(res)
    except Exception as e:
        return jsonify({'error': f"Gagal membuat paket sertifikat: {str(e)}"}), 500

@app.route('/api/v1/gdrive/settings', methods=['GET', 'POST'])
def api_gdrive_settings():
    """Get or Save Google Drive 3-Folder Settings in Database"""
    if request.method == 'POST':
        payload = request.json or {}
        db.save_app_setting('gdrive_url', str(payload.get('gdrive_url') or '').strip())
        db.save_app_setting('gdrive_folder_s1', str(payload.get('gdrive_folder_s1') or '').strip())
        db.save_app_setting('gdrive_folder_pasca', str(payload.get('gdrive_folder_pasca') or '').strip())
        db.save_app_setting('gdrive_folder_umum', str(payload.get('gdrive_folder_umum') or '').strip())
        db.save_app_setting('gdrive_auto_sync', '1' if payload.get('gdrive_auto_sync', True) else '0')
        return jsonify({'success': True, 'message': 'Pengaturan Google Drive 3 Folder berhasil disimpan!'})
    else:
        settings = db.get_all_app_settings()
        return jsonify({
            'success': True,
            'data': {
                'gdrive_url': settings.get('gdrive_url', ''),
                'gdrive_folder_s1': settings.get('gdrive_folder_s1', ''),
                'gdrive_folder_pasca': settings.get('gdrive_folder_pasca', ''),
                'gdrive_folder_umum': settings.get('gdrive_folder_umum', ''),
                'gdrive_auto_sync': settings.get('gdrive_auto_sync', '1') == '1'
            }
        })

@app.route('/api/v1/gdrive/test', methods=['POST'])
def api_test_gdrive_connection():
    """Test connection to Google Apps Script Web App for Cloud Drive sync"""
    import requests
    payload = request.json or {}
    gdrive_url = str(payload.get('gdrive_url') or '').strip()
    folder_id = str(payload.get('folder_id') or '').strip()

    if not gdrive_url:
        return jsonify({'success': False, 'message': 'Google Apps Script Web App URL belum diisi'}), 400

    clean_folder = cert_engine.extract_gdrive_folder_id(folder_id)

    try:
        # Check GET (returns ready message in user's script)
        r_get = requests.get(gdrive_url, timeout=12)
        
        # Check POST
        r_post = requests.post(gdrive_url, json={'action': 'ping', 'folder_id': clean_folder}, timeout=15)
        
        is_ok = r_get.status_code == 200 or r_post.status_code == 200
        msg = 'Koneksi ke Google Apps Script Cloud Web App BERHASIL!'
        
        return jsonify({
            'success': is_ok,
            'status_code': r_post.status_code if r_post.status_code == 200 else r_get.status_code,
            'message': msg,
            'response': r_get.text[:200]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Gagal menghubungi Google Apps Script: {str(e)}'
        }), 500

@app.route('/api/v1/certificates/download/<path:filename>', methods=['GET'])
def download_cert_file(filename):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document' if filename.endswith('.docx') else 'application/zip'
        )
    return jsonify({'error': 'Berkas tidak ditemukan'}), 404

@app.route('/api/v1/certificates/history', methods=['GET'])
@app.route('/api/certificates/history', methods=['GET'])
def api_get_cert_history():
    query = request.args.get('q', '')
    history = db.get_certificates_history_db(query)
    return jsonify({'success': True, 'data': history})

@app.route('/api/v1/certificates/stream-pdf-polos', methods=['GET'])
def api_stream_pdf_polos():
    """On-demand dynamic stream of plain PDF for web printing without consuming web storage"""
    no_sertifikat = request.args.get('no_sertifikat', '').strip()
    if not no_sertifikat:
        return jsonify({'error': 'Parameter no_sertifikat wajib diisi'}), 400

    cert = db.get_certificate_by_no_db(no_sertifikat)
    if not cert:
        cert = {'no_sertifikat': no_sertifikat, 'nama': request.args.get('nama', 'PESERTA')}
    
    cert_data = dict(cert)
    cert_data['show_validation_logo'] = False
    cert_data['show_cap_ttd'] = False
    
    pdf_path = cert_engine.generate_pdf_polos_stream(cert_data)
    if pdf_path and os.path.exists(pdf_path):
        return send_file(
            pdf_path,
            as_attachment=False,
            mimetype='application/pdf',
            download_name=os.path.basename(pdf_path)
        )
    return jsonify({'error': 'Gagal merender PDF Polos'}), 500

@app.route('/api/v1/directory/settings', methods=['GET', 'POST'])
def api_directory_settings():
    """Get or Save Custom Output Directory & WhatsApp Settings"""
    if request.method == 'POST':
        payload = request.json or {}
        output_dir = str(payload.get('output_dir') or '').strip()
        wa_number = str(payload.get('wa_number') or '').strip()

        db.save_app_setting('output_dir', output_dir)
        db.save_app_setting('wa_number', wa_number)

        return jsonify({'success': True, 'message': 'Pengaturan Directory & WhatsApp berhasil disimpan!'})
    else:
        settings = db.get_all_app_settings()
        default_dir = os.path.join(OUTPUT_DIR, 'arsip_sertifikat')
        return jsonify({
            'success': True,
            'data': {
                'output_dir': settings.get('output_dir', default_dir),
                'wa_number': settings.get('wa_number', '')
            }
        })

# ==========================================
# LAPORAN HARIAN API (DOCX TEMPLATE ENGINE)
# ==========================================

@app.route('/api/v1/laporan-harian/month', methods=['GET'])
def api_laporan_month():
    try:
        year = int(request.args.get('year', 2026))
        month = int(request.args.get('month', 8))
        month_data = laporan_engine.get_month_working_days(year, month)
        return jsonify({'success': True, 'data': month_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/laporan-harian/save-day', methods=['POST'])
def api_laporan_save():
    try:
        req_data = request.json or {}
        year = int(req_data.get('year', 2026))
        month = int(req_data.get('month', 8))
        day = int(req_data.get('day', 1))
        activity_text = req_data.get('activity_text', '')
        is_sabtu_masuk = 1 if req_data.get('is_sabtu_masuk') else 0
        is_extra_libur = 1 if req_data.get('is_extra_libur') else 0
        holiday_reason = req_data.get('holiday_reason', '')

        db.save_day_report_db(year, month, day, activity_text=activity_text, is_sabtu_masuk=is_sabtu_masuk, is_extra_libur=is_extra_libur, holiday_reason=holiday_reason)
        return jsonify({'success': True, 'message': f'Data tanggal {day} berhasil disimpan.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/laporan-harian/upload-photo', methods=['POST'])
def api_laporan_upload_photo():
    """Upload photo with auto WebP compression (Space Saver)"""
    try:
        year = int(request.form.get('year', 2026))
        month = int(request.form.get('month', 8))
        day = int(request.form.get('day', 1))
        file = request.files.get('photo')

        if not file:
            return jsonify({'error': 'Tidak ada foto yang diunggah'}), 400

        filename = f"photo_{year:04d}_{month:02d}_{day:02d}_{uuid.uuid4().hex[:8]}.webp"
        filepath = os.path.join(UPLOAD_PHOTO_DIR, filename)

        from PIL import Image
        img = Image.open(file.stream)
        img.save(filepath, 'WEBP', quality=80)

        db.save_day_report_db(year, month, day, photo_filename=filename)
        return jsonify({
            'success': True,
            'message': 'Foto WebP berhasil diunggah',
            'filename': filename,
            'photo_url': f"/static/uploads/photos/{filename}"
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/laporan-harian/export-docx', methods=['GET', 'POST'])
def api_export_laporan_docx():
    """Exports official Laporan Harian Word document matching LAPORAN_TEMPLATE.docx
    
    Accepts:
    - POST with full month_data JSON from Laravel (preferred - uses correct MySQL data + correct photo paths)
    - GET with year/month params (legacy - reads from SQLite, no user_id awareness)
    """
    try:
        if request.method == 'POST':
            # Laravel sends full month data with absolute photo paths
            month_data = request.json or {}
            out_path, file_size = laporan_engine.generate_laporan_harian_docx_from_data(month_data)
        else:
            # Legacy GET (reads from SQLite - no user_id awareness)
            year = int(request.args.get('year', 2026))
            month = int(request.args.get('month', 8))
            out_path, file_size = laporan_engine.generate_laporan_harian_docx(year, month)

        filename = os.path.basename(out_path)
        return send_file(
            out_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        return jsonify({'error': f'Gagal mengekspor Laporan Harian: {str(e)}'}), 500

# ==========================================
# BAPU TELP ONLINE API
# ==========================================

@app.route('/api/upload', methods=['POST'])
def upload_bapu_file():
    if 'file' not in request.files:
        return jsonify({'error': 'File tidak ditemukan'}), 400
    
    file = request.files['file']
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        return jsonify({'error': 'Format file harus .xlsx'}), 400

    temp_path = os.path.join(OUTPUT_DIR, f"temp_{file.filename}")
    file.save(temp_path)

    try:
        data = generator.parse_excel_bapu(temp_path)
        students = data.get('students', [])
        hadir_count = sum(1 for s in students if s.get('hadir') == 'YA')
        data['total_peserta'] = len(students)
        data['jumlah_hadir'] = hadir_count
        data['jumlah_tidak_hadir'] = len(students) - hadir_count
        
        try:
            history_id = db.save_bapu_history_db(
                hari=data.get('hari', ''),
                tanggal=data.get('tanggal', ''),
                waktu=data.get('waktu', ''),
                ruangan=data.get('ruangan', ''),
                pengawas=data.get('pengawas', ''),
                catatan=data.get('catatan', ''),
                total_peserta=data['total_peserta'],
                jumlah_hadir=data['jumlah_hadir'],
                students_json=json.dumps(students)
            )
            data['history_id'] = history_id
        except Exception:
            pass

        return jsonify({'success': True, 'filename': file.filename, 'data': data})
    except Exception as e:
        return jsonify({'error': f'Gagal membaca Excel: {str(e)}'}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/generate', methods=['POST'])
def generate_bapu_doc():
    try:
        req_data = request.json or {}
        doc_type = req_data.get('doc_type', 'paket_lengkap')
        data = req_data.get('data', {})
        students = data.get('students', [])
        hadir_count = sum(1 for s in students if s.get('hadir') == 'YA')
        
        data['total_peserta'] = len(students)
        data['jumlah_hadir'] = hadir_count
        data['jumlah_tidak_hadir'] = len(students) - hadir_count
        filename_prefix = data.get('tanggal', 'BAPU').replace(' ', '_')
        
        if doc_type == 'berita_acara':
            out_filename = f"BERITA_ACARA_{filename_prefix}.docx"
            out_path = os.path.join(OUTPUT_DIR, out_filename)
            generator.generate_berita_acara_docx(data, out_path, LOGO_PATH)
        elif doc_type == 'daftar_hadir':
            out_filename = f"DAFTAR_HADIR_{filename_prefix}.docx"
            out_path = os.path.join(OUTPUT_DIR, out_filename)
            generator.generate_daftar_hadir_docx(data, out_path, LOGO_PATH)
        else:
            out_filename = f"BAPU_PAKET_LENGKAP_{filename_prefix}.docx"
            out_path = os.path.join(OUTPUT_DIR, out_filename)
            generator.generate_paket_lengkap_bapu_docx(data, out_path, LOGO_PATH)

        return send_file(
            out_path,
            as_attachment=True,
            download_name=out_filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        return jsonify({'error': f'Gagal membuat dokumen: {str(e)}'}), 500

if __name__ == '__main__':
    print("=" * 70)
    print(" PORTAL TERPADU UPA BAHASA UNSIL - PYTHON SERVICES HOSTING ENGINE")
    print(" Active URL: http://127.0.0.1:5000")
    print("=" * 70)
    app.run(host='0.0.0.0', port=5000, debug=True)
