// ============================================================
// CUSTOM DIALOG SYSTEM — Replaces native alert/confirm/prompt
// ============================================================
(function() {
    const DIALOG_OVERLAY_ID = 'custom-dialog-overlay';

    function getOrCreateOverlay() {
        let el = document.getElementById(DIALOG_OVERLAY_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = DIALOG_OVERLAY_ID;
            el.style.cssText = `
                position:fixed; inset:0; z-index:99999;
                background:rgba(15,23,42,0.45);
                backdrop-filter:blur(4px);
                display:flex; align-items:center; justify-content:center;
                padding:20px; opacity:0; transition:opacity .18s ease;
                pointer-events:none;
            `;
            document.body.appendChild(el);
        }
        return el;
    }

    function showDialogEl(html) {
        const overlay = getOrCreateOverlay();
        overlay.innerHTML = html;
        overlay.style.pointerEvents = 'all';
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });
        const box = overlay.querySelector('.cdlg-box');
        if (box) {
            box.style.transform = 'scale(0.94) translateY(10px)';
            box.style.transition = 'transform .2s cubic-bezier(.16,1,.3,1)';
            requestAnimationFrame(() => { box.style.transform = 'scale(1) translateY(0)'; });
        }
    }

    function hideDialogEl() {
        const overlay = document.getElementById(DIALOG_OVERLAY_ID);
        if (!overlay) return;
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        setTimeout(() => { overlay.innerHTML = ''; }, 200);
    }

    const BOX_BASE = `
        background:#fff;
        border-radius:16px;
        width:100%;
        max-width:420px;
        box-shadow:0 20px 60px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.08);
        overflow:hidden;
        font-family:'Plus Jakarta Sans', sans-serif;
    `;

    const ICON_MAP = {
        danger:  { bg:'#fef2f2', color:'#dc2626', icon:'fa-triangle-exclamation' },
        warning: { bg:'#fffbeb', color:'#d97706', icon:'fa-circle-exclamation'   },
        info:    { bg:'#eff6ff', color:'#2563eb', icon:'fa-circle-info'           },
        success: { bg:'#f0fdf4', color:'#16a34a', icon:'fa-circle-check'         },
    };

    /**
     * Simple info/alert modal (OK button only)
     */
    window.showDialog = function(opts) {
        opts = Object.assign({ type:'info', title:'Informasi', message:'', okText:'OK' }, opts);
        const ic = ICON_MAP[opts.type] || ICON_MAP.info;
        showDialogEl(`
            <div class="cdlg-box" style="${BOX_BASE}">
                <div style="background:${ic.bg}; padding:28px 24px 20px; text-align:center;">
                    <div style="width:52px;height:52px;border-radius:50%;background:${ic.color}18;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                        <i class="fa-solid ${ic.icon}" style="color:${ic.color};font-size:22px;"></i>
                    </div>
                    <h3 style="margin:0 0 6px;font-size:16px;font-weight:800;color:#0f172a;">${opts.title}</h3>
                    <p style="margin:0;font-size:13.5px;color:#475569;line-height:1.6;">${opts.message}</p>
                </div>
                <div style="padding:16px 20px;display:flex;justify-content:center;">
                    <button id="cdlg-ok" style="padding:9px 28px;background:${ic.color};color:#fff;border:none;border-radius:9px;font-size:13.5px;font-weight:700;cursor:pointer;min-width:100px;">${opts.okText}</button>
                </div>
            </div>
        `);
        return new Promise(resolve => {
            document.getElementById('cdlg-ok').onclick = () => { hideDialogEl(); resolve(); };
        });
    };

    /**
     * Confirm modal (OK + Batal)
     */
    window.showConfirm = function(opts) {
        opts = Object.assign({ type:'danger', title:'Konfirmasi', message:'', okText:'Ya, Hapus', cancelText:'Batal' }, opts);
        const ic = ICON_MAP[opts.type] || ICON_MAP.danger;
        showDialogEl(`
            <div class="cdlg-box" style="${BOX_BASE}">
                <div style="padding:28px 24px 18px; text-align:center;">
                    <div style="width:52px;height:52px;border-radius:50%;background:${ic.color}12;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">
                        <i class="fa-solid ${ic.icon}" style="color:${ic.color};font-size:22px;"></i>
                    </div>
                    <h3 style="margin:0 0 8px;font-size:16px;font-weight:800;color:#0f172a;">${opts.title}</h3>
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.65;">${opts.message}</p>
                </div>
                <div style="padding:0 20px 20px;display:flex;gap:10px;">
                    <button id="cdlg-cancel" style="flex:1;padding:9px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;">${opts.cancelText}</button>
                    <button id="cdlg-ok"     style="flex:1;padding:9px;background:${ic.color};color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;">${opts.okText}</button>
                </div>
            </div>
        `);
        return new Promise(resolve => {
            document.getElementById('cdlg-ok').onclick     = () => { hideDialogEl(); resolve(true);  };
            document.getElementById('cdlg-cancel').onclick = () => { hideDialogEl(); resolve(false); };
        });
    };

    /**
     * Prompt-confirm modal (input text + OK + Batal)
     */
    window.showPromptConfirm = function(opts) {
        opts = Object.assign({ type:'danger', title:'Konfirmasi', message:'', inputLabel:'', expectedValue:'', okText:'Konfirmasi', cancelText:'Batal' }, opts);
        const ic = ICON_MAP[opts.type] || ICON_MAP.danger;
        showDialogEl(`
            <div class="cdlg-box" style="${BOX_BASE}">
                <div style="padding:28px 24px 16px; text-align:center;">
                    <div style="width:52px;height:52px;border-radius:50%;background:${ic.color}12;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">
                        <i class="fa-solid ${ic.icon}" style="color:${ic.color};font-size:22px;"></i>
                    </div>
                    <h3 style="margin:0 0 8px;font-size:16px;font-weight:800;color:#0f172a;">${opts.title}</h3>
                    <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.65;">${opts.message}</p>
                    <label style="display:block;text-align:left;font-size:11.5px;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">${opts.inputLabel}</label>
                    <input id="cdlg-input" type="text" autocomplete="off" placeholder="${opts.expectedValue}"
                        style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13.5px;color:#0f172a;outline:none;transition:border .15s;"
                        onfocus="this.style.borderColor='#0284c7'" onblur="this.style.borderColor='#e2e8f0'">
                </div>
                <div style="padding:0 20px 20px;display:flex;gap:10px;">
                    <button id="cdlg-cancel" style="flex:1;padding:9px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;">${opts.cancelText}</button>
                    <button id="cdlg-ok"     style="flex:1;padding:9px;background:#cbd5e1;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:not-allowed;" disabled>${opts.okText}</button>
                </div>
            </div>
        `);
        return new Promise(resolve => {
            const inp = document.getElementById('cdlg-input');
            const ok  = document.getElementById('cdlg-ok');
            inp.oninput = () => {
                const match = inp.value === opts.expectedValue;
                ok.style.background    = match ? ic.color : '#cbd5e1';
                ok.style.cursor        = match ? 'pointer' : 'not-allowed';
                ok.disabled            = !match;
            };
            ok.onclick             = () => { hideDialogEl(); resolve(true);  };
            document.getElementById('cdlg-cancel').onclick = () => { hideDialogEl(); resolve(false); };
        });
    };
})();

// GLOBAL STATE

let activeSubMenu = 'cert-gen';
let currentQRType = 's1';
let customQRBase64 = '';
let showValidation = true;
let showCap = true;

let formattedTglLahir = '04/01/2009';
let formattedTglTes = '19/12/2025';

let bapuData = null;
let currentLaporanMonthData = null;

const QR_PRESETS = {
    's1': { src: '/assets/qr_s1.png', fallback: '/static/assets/qr_s1.png', title: 'Pilihan: S1' },
    'pasca': { src: '/assets/qr_pasca.png', fallback: '/static/assets/qr_pasca.png', title: 'Pilihan: Pasca' },
    'umum': { src: '/assets/qr_umum.png', fallback: '/static/assets/qr_umum.png', title: 'Pilihan: Umum' }
};

// SUB-MENU SWITCHER
function switchSubMenu(menuKey) {
    activeSubMenu = menuKey;
    
    const navAdminHealth = document.getElementById('nav-admin-health');
    const navCertGen = document.getElementById('nav-cert-gen');
    const navBulkExcel = document.getElementById('nav-bulk-excel');
    const navCertHist = document.getElementById('nav-cert-hist');
    const navDirWa = document.getElementById('nav-dir-wa');
    const navGdrive = document.getElementById('nav-gdrive');
    const navBapu = document.getElementById('nav-bapu');
    const navLaporan = document.getElementById('nav-laporan');
    const navApiDocs = document.getElementById('nav-api-docs');
    const navUsers = document.getElementById('nav-users');
    
    const contentAdminHealth = document.getElementById('sub-menu-admin-health-content');
    const contentCertGen = document.getElementById('sub-menu-cert-gen-content');
    const contentBulkExcel = document.getElementById('sub-menu-bulk-excel-content');
    const contentCertHist = document.getElementById('sub-menu-cert-hist-content');
    const contentDirWa = document.getElementById('sub-menu-dir-wa-content');
    const contentGdrive = document.getElementById('sub-menu-gdrive-content');
    const contentBapu = document.getElementById('sub-menu-bapu-content');
    const contentLaporan = document.getElementById('sub-menu-laporan-content');
    const contentApiDocs = document.getElementById('sub-menu-api-docs-content');
    const contentUsers = document.getElementById('sub-menu-users-content');
    
    const titleEl = document.getElementById('page-header-title');

    // Reset active nav buttons
    [navAdminHealth, navCertGen, navBulkExcel, navCertHist, navDirWa, navGdrive, navBapu, navLaporan, navApiDocs, navUsers].forEach(el => el && el.classList.remove('active'));

    // Hide all content views
    [contentAdminHealth, contentCertGen, contentBulkExcel, contentCertHist, contentDirWa, contentGdrive, contentBapu, contentLaporan, contentApiDocs, contentUsers].forEach(el => el && el.classList.add('hidden'));

    // Stop polling if switching away from admin-health
    if (typeof stopHealthPolling === 'function') {
        stopHealthPolling();
    }

    if (menuKey === 'admin-health') {
        if (navAdminHealth) navAdminHealth.classList.add('active');
        if (contentAdminHealth) contentAdminHealth.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Dashboard Admin</strong> — <span>Monitoring & Status Koneksi API Real-Time</span>';
        loadAdminHealthCheck(false);
        if (typeof startHealthPolling === 'function') startHealthPolling();
    } else if (menuKey === 'cert-gen') {
        if (navCertGen) navCertGen.classList.add('active');
        if (contentCertGen) contentCertGen.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Studio Satuan</strong> — <span>Buat Sertifikat Satu Per Satu</span>';
        onFormChange();
    } else if (menuKey === 'bulk-excel') {
        if (navBulkExcel) navBulkExcel.classList.add('active');
        if (contentBulkExcel) contentBulkExcel.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Bulk Excel Studio</strong> — <span>Cetak Massal Sertifikat</span>';
    } else if (menuKey === 'cert-hist') {
        if (navCertHist) navCertHist.classList.add('active');
        if (contentCertHist) contentCertHist.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Database</strong> — <span>Riwayat & Cari Sertifikat (DB)</span>';
        loadCertHistoryData();
    } else if (menuKey === 'bapu') {
        if (navBapu) navBapu.classList.add('active');
        if (contentBapu) contentBapu.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Modul BAPU</strong> — <span>BAPU TELP Online & Presensi</span>';
    } else if (menuKey === 'laporan') {
        if (navLaporan) navLaporan.classList.add('active');
        if (contentLaporan) contentLaporan.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Jurnal Harian</strong> — <span>Laporan Harian Bulanan</span>';
        loadLaporanHarianMonth();
    } else if (menuKey === 'dir-wa') {
        if (navDirWa) navDirWa.classList.add('active');
        if (contentDirWa) contentDirWa.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Pengaturan</strong> — <span>Directory Komputer & WA Cetak</span>';
        loadDirWaSettings();
    } else if (menuKey === 'gdrive') {
        if (navGdrive) navGdrive.classList.add('active');
        if (contentGdrive) contentGdrive.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Pengaturan</strong> — <span>Integrasi Google Drive Cloud</span>';
        loadGoogleDriveSettings();
    } else if (menuKey === 'api-docs') {
        if (navApiDocs) navApiDocs.classList.add('active');
        if (contentApiDocs) contentApiDocs.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Dokumentasi API</strong> — <span>Mobile REST API & Gateway</span>';
    } else if (menuKey === 'users') {
        if (navUsers) navUsers.classList.add('active');
        if (contentUsers) contentUsers.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = '<strong>Manajemen User</strong> — <span>Kelola Akun Pengguna & Hak Akses Role</span>';
    }
}

function openAddUserModal() {
    const m = document.getElementById('modal-add-user');
    if (m) m.classList.remove('hidden');
}

function closeAddUserModal() {
    const m = document.getElementById('modal-add-user');
    if (m) m.classList.add('hidden');
}

function setQRPreset(type) {
    currentQRType = type;
    customQRBase64 = '';
    
    ['s1', 'pasca', 'umum'].forEach(k => {
        const btn = document.getElementById('btn_qr_' + k);
        if (btn) {
            if (k === type) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    const preset = QR_PRESETS[type];
    if (preset) {
        const badge = document.getElementById('qr_active_badge');
        if (badge) badge.innerText = preset.title;
        const img = document.getElementById('prev_qr_img');
        if (img) {
            img.onerror = function() {
                this.onerror = null;
                this.src = preset.fallback;
            };
            img.src = preset.src;
        }
    }
}

function setBulkQRPreset(type) {
    if (bulkRecords && bulkRecords[currentBulkIndex]) {
        bulkRecords[currentBulkIndex].qr_type = type;
    }
    
    ['s1', 'pasca', 'umum'].forEach(k => {
        const btn = document.getElementById('bulk_btn_qr_' + k);
        if (btn) {
            if (k === type) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    const preset = QR_PRESETS[type];
    if (preset) {
        const badge = document.getElementById('bulk_qr_active_badge');
        if (badge) badge.innerText = preset.title;
        const img = document.getElementById('bulk_prev_qr_img');
        if (img) {
            img.onerror = function() {
                this.onerror = null;
                this.src = preset.fallback;
            };
            img.src = preset.src;
        }
    }
}

function onCustomQRUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            customQRBase64 = e.target.result;
            currentQRType = 'custom';
            
            ['s1', 'pasca', 'umum'].forEach(k => {
                const btn = document.getElementById('btn_qr_' + k);
                if (btn) btn.classList.remove('active');
            });

            document.getElementById('qr_active_badge').innerText = 'Pilihan: Kustom (' + input.files[0].name + ')';
            document.getElementById('prev_qr_img').src = customQRBase64;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    setupDropzone();
    setupSearchInput();
    assembleCertNumber();
    onFormChange();
    loadGoogleDriveSettings();
});

// -------------------------------------------------------------
// EXACT STUDIO SATUAN JAVASCRIPT LOGIC
// -------------------------------------------------------------
function ensureDmyFormat(str) {
    if (!str) return '';
    str = String(str).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const p = str.split('-');
        return `${p[2]}/${p[1]}/${p[0]}`;
    }
    const parts = str.split(/[/-]/);
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        } else {
            return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
    }
    return str;
}

function dmyToYmd(dmyStr) {
    if (!dmyStr) return '';
    const parts = dmyStr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dmyStr;
}

function ymdToDmy(ymdStr) {
    return ensureDmyFormat(ymdStr);
}

function assembleCertNumber() {
    const kdDoc = document.getElementById('kd_doc')?.value.trim() || '135512';
    const kdLem = document.getElementById('kd_lem')?.value.trim() || 'SULCUN58';
    let noUrut = document.getElementById('no_urut')?.value.trim() || '038';
    if (/^\d+$/.test(noUrut)) {
        noUrut = noUrut.padStart(3, '0');
    }
    const inisial = document.getElementById('inisial')?.value.trim().toUpperCase() || 'GA';
    const fullNo = kdDoc + kdLem + noUrut + inisial;
    
    if (document.getElementById('live_cert_code')) document.getElementById('live_cert_code').innerText = fullNo || '-';
    if (document.getElementById('prev_cert_no')) document.getElementById('prev_cert_no').innerText = fullNo || '-';
    return fullNo;
}

function onNamaInput() {
    const namaEl = document.getElementById('nama');
    if (!namaEl) return;
    namaEl.value = namaEl.value.toUpperCase();
    
    const nama = namaEl.value.trim();
    const words = nama.split(/\s+/).filter(Boolean);
    
    // Inisial rule: First 2 letters of first word (e.g. ASEP JALAM -> AS, GAYA NAYLA -> GA)
    let inisial = '';
    if (words.length > 0 && words[0].length >= 2) {
        inisial = words[0].substring(0, 2).toUpperCase();
    } else if (words.length > 0 && words[0].length === 1) {
        inisial = (words[0] + (words[1] ? words[1][0] : 'X')).toUpperCase();
    } else {
        inisial = 'GA';
    }
    
    if (inisial && document.getElementById('inisial')) {
        document.getElementById('inisial').value = inisial;
    }
    
    onFormChange();
}

function onFormChange() {
    assembleCertNumber();
    const rawLahir = document.getElementById('tgl_lahir')?.value || '2009-01-04';
    const formattedLahir = ymdToDmy(rawLahir);
    const rawTes = document.getElementById('tgl_tes')?.value || '2025-12-19';
    const formattedTes = ymdToDmy(rawTes);

    // Auto +2 years expiry calculation
    if (rawTes) {
        const parts = rawTes.split('-');
        if (parts.length === 3) {
            const expYmd = `${parseInt(parts[0], 10) + 2}-${parts[1]}-${parts[2]}`;
            const expDmy = `${parts[2]}/${parts[1]}/${parseInt(parts[0], 10) + 2}`;
            if (document.getElementById('tgl_exp')) document.getElementById('tgl_exp').value = expDmy;
            if (document.getElementById('prev_tgl_exp')) document.getElementById('prev_tgl_exp').innerText = expDmy;
        }
    }

    if (document.getElementById('prev_nama')) document.getElementById('prev_nama').innerText = document.getElementById('nama')?.value || '-';
    if (document.getElementById('prev_tgl_lahir')) document.getElementById('prev_tgl_lahir').innerText = formattedLahir || '-';
    if (document.getElementById('prev_gender')) document.getElementById('prev_gender').innerText = document.getElementById('gender')?.value || '-';
    if (document.getElementById('prev_tgl_tes')) document.getElementById('prev_tgl_tes').innerText = formattedTes || '-';
    if (document.getElementById('prev_negara')) document.getElementById('prev_negara').innerText = document.getElementById('negara')?.value || '-';
    if (document.getElementById('prev_bahasa')) document.getElementById('prev_bahasa').innerText = document.getElementById('bahasa')?.value || '-';
    if (document.getElementById('prev_score_l')) document.getElementById('prev_score_l').innerText = document.getElementById('score_l')?.value || '-';
    if (document.getElementById('prev_score_s')) document.getElementById('prev_score_s').innerText = document.getElementById('score_s')?.value || '-';
    if (document.getElementById('prev_score_r')) document.getElementById('prev_score_r').innerText = document.getElementById('score_r')?.value || '-';
    if (document.getElementById('prev_score_o')) document.getElementById('prev_score_o').innerText = document.getElementById('score_o')?.value || '-';
}

function onToggleValidation(cb) {
    showValidation = cb.checked;
    const logo = document.getElementById('prev_val_logo');
    if (logo) logo.style.display = showValidation ? 'block' : 'none';
}

function onToggleCap(cb) {
    showCap = cb.checked;
    const stamp = document.getElementById('prev_stamp_img');
    if (stamp) stamp.style.display = showCap ? 'block' : 'none';
}

function loadSampleData() {
    if (document.getElementById('kd_doc')) document.getElementById('kd_doc').value = '135512';
    if (document.getElementById('kd_lem')) document.getElementById('kd_lem').value = 'SULCUN58';
    if (document.getElementById('no_urut')) document.getElementById('no_urut').value = '038';
    if (document.getElementById('nama')) document.getElementById('nama').value = 'GAYA NAYLA HUMAIRA HERDIAWAN';
    if (document.getElementById('inisial')) document.getElementById('inisial').value = 'GA';
    if (document.getElementById('tgl_lahir')) document.getElementById('tgl_lahir').value = '2009-01-04';
    if (document.getElementById('gender')) document.getElementById('gender').value = 'F (Female)';
    if (document.getElementById('tgl_tes')) document.getElementById('tgl_tes').value = '2025-12-19';
    if (document.getElementById('tgl_exp')) document.getElementById('tgl_exp').value = '19/12/2027';
    if (document.getElementById('negara')) document.getElementById('negara').value = 'Indonesia';
    if (document.getElementById('bahasa')) document.getElementById('bahasa').value = 'Indonesian';
    if (document.getElementById('score_l')) document.getElementById('score_l').value = '56';
        if (document.getElementById('score_o')) document.getElementById('score_o').value = '530';
    setQRPreset('s1');
    onFormChange();
    showToast('Data contoh berhasil dimuat!', 'success');
}

async function processCertificateSingle() {
    const fullCertNo = assembleCertNumber();
    const nama = document.getElementById('nama')?.value.trim().toUpperCase() || 'PESERTA';
    const rawLahir = document.getElementById('tgl_lahir')?.value || '2009-01-04';
    const rawTes = document.getElementById('tgl_tes')?.value || '2025-12-19';

    const gdriveSettings = {
        url: localStorage.getItem('telp_gdrive_url') || '',
        folder_s1: localStorage.getItem('telp_gdrive_folder_s1') || '',
        folder_pasca: localStorage.getItem('telp_gdrive_folder_pasca') || '',
        folder_umum: localStorage.getItem('telp_gdrive_folder_umum') || '',
        auto_sync: localStorage.getItem('telp_gdrive_auto_sync') === '1'
    };

    const targetFolderId = gdriveSettings[`folder_${currentQRType}`];
    const isAutoSync = gdriveSettings.auto_sync && gdriveSettings.url;
    const qrName = currentQRType === 's1' ? 'S1' : (currentQRType === 'pasca' ? 'Pascasarjana' : 'Umum');

    showLoadingToast(
        `Memproses Sertifikat ${fullCertNo}...`,
        isAutoSync 
            ? (targetFolderId 
                ? `Menyimpan Word & PDF Polos ke direktori komputer serta mengunggah PDF Resmi ke Google Drive (Folder ${qrName})...` 
                : `Menyimpan berkas ke direktori komputer lokal (ID Folder Google Drive ${qrName} belum diisi)...`)
            : `Menyimpan berkas Word & PDF Polos ke direktori komputer...`
    );

    const payload = {
        no_sertifikat: fullCertNo,
        nama: nama,
        tanggal_lahir: ymdToDmy(rawLahir),
        jenis_kelamin: document.getElementById('gender').value.trim(),
        tanggal_tes: ymdToDmy(rawTes),
        berlaku_sampai: document.getElementById('tgl_exp').value.trim(),
        negara: document.getElementById('negara').value.trim(),
        bahasa: document.getElementById('bahasa').value.trim(),
        listening: document.getElementById('score_l').value.trim(),
        structure: document.getElementById('score_s').value.trim(),
        reading: document.getElementById('score_r').value.trim(),
        overall: document.getElementById('score_o').value.trim(),
        qr_type: currentQRType,
        show_validation: showValidation,
        show_cap: showCap,
        gdrive_settings: gdriveSettings
    };

    try {
        const response = await fetch('/api/v1/certificates/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();
        if (res.success && res.data) {
            const dataObj = res.data;

            if (dataObj.gdrive_upload) {
                if (dataObj.gdrive_upload.success) {
                    showToast(`🎉 Sukses! Sertifikat ${fullCertNo} Diproses`, 'success', `Word & PDF Polos tersimpan di komputer & PDF Resmi terunggah ke Google Drive (${qrName})`);
                } else if (dataObj.gdrive_upload.error) {
                    showToast(`⚠️ Berkas Tersimpan di Komputer, namun Google Drive Belum Diunggah`, 'warning', dataObj.gdrive_upload.error);
                } else {
                    showToast(`🎉 Sertifikat ${fullCertNo} Berhasil Disimpan!`, 'success', 'Berkas Word & PDF Polos tersimpan di direktori komputer.');
                }
            } else if (isAutoSync && !targetFolderId) {
                showToast(`⚠️ Berkas Tersimpan di Komputer (Google Drive Belum Diunggah)`, 'warning', `ID Folder Google Drive untuk kategori ${qrName} belum diisi di menu Integrasi.`);
            } else {
                showToast(`🎉 Sertifikat ${fullCertNo} Berhasil Disimpan!`, 'success', 'Berkas Word & PDF Polos tersimpan di direktori komputer.');
            }
            loadCertHistoryData();
        } else {
            showToast('Gagal Memproses Sertifikat', 'error', res.error || 'Terjadi kesalahan pada server');
        }
    } catch (err) {
        showToast('Kesalahan Server', 'error', err.message);
    }
}

// -------------------------------------------------------------
// BULK EXCEL STUDIO INTERACTIVE STUDIO & REVISION ENGINE
// -------------------------------------------------------------
let bulkRecords = [];
let currentBulkIndex = 0;
let currentBulkUploadedFile = null;
let currentBulkHeaders = [];
let currentBulkColMap = {};

function handleBulkExcelUpload(input) {
    if (!input.files || !input.files[0]) return;
    currentBulkUploadedFile = input.files[0];

    const formData = new FormData();
    formData.append('file', currentBulkUploadedFile);
    formData.append('kd_doc', '135512');
    formData.append('kd_lem', 'SULCUN58');
    formData.append('start_urut', '1');
    formData.append('qr_type', 's1');

    showToast('⏳ Membaca data Excel ke Studio Editor...', 'info');

    fetch('/api/v1/certificates/bulk-parse', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.records && data.records.length > 0) {
            bulkRecords = data.records;
            currentBulkIndex = 0;
            currentBulkHeaders = data.headers || [];
            currentBulkColMap = data.col_map || {};

            document.getElementById('bulk-upload-card')?.classList.add('hidden');
            document.getElementById('bulk-workspace')?.classList.remove('hidden');

            document.getElementById('bulk-loaded-filename').innerText = data.filename || currentBulkUploadedFile.name;
            document.getElementById('bulk-total-badge').innerText = bulkRecords.length;

            populateColumnMappingDropdowns(currentBulkHeaders, currentBulkColMap);
            switchBulkTab('list');
            showToast(`✅ Berhasil memuat ${bulkRecords.length} peserta!`, 'success');
        } else {
            showToast(data.error || 'Gagal memproses file Excel', 'error');
        }
    })
    .catch(err => {
        showToast('Kesalahan: ' + err.message, 'error');
    });
}

function toggleColumnMappingPanel() {
    const panel = document.getElementById('panel-column-mapping');
    const icon = document.getElementById('icon-toggle-mapping');
    const btnText = document.getElementById('btn-toggle-mapping-text');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        if (icon) icon.className = 'fa-solid fa-chevron-up';
        if (btnText) btnText.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Tutup Pemetaan';
    } else {
        panel.classList.add('hidden');
        if (icon) icon.className = 'fa-solid fa-chevron-down';
        if (btnText) btnText.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Atur Pemetaan Kolom';
    }
}

function populateColumnMappingDropdowns(headers, colMap) {
    if (!headers || headers.length === 0) return;

    const fields = [
        { id: 'map-col-nama', key: 'nama', defaultIdx: colMap?.nama ?? 1 },
        { id: 'map-col-ttl', key: 'tgl_lahir', defaultIdx: colMap?.tgl_lahir ?? 2 },
        { id: 'map-col-gender', key: 'gender', defaultIdx: colMap?.gender ?? 3 },
        { id: 'map-col-tgl-tes', key: 'tgl_tes', defaultIdx: colMap?.tgl_tes ?? -1 },
        { id: 'map-col-lc', key: 'listening', defaultIdx: colMap?.listening ?? 4 },
        { id: 'map-col-sw', key: 'structure', defaultIdx: colMap?.structure ?? 5 },
        { id: 'map-col-rc', key: 'reading', defaultIdx: colMap?.reading ?? 6 },
        { id: 'map-col-overall', key: 'overall', defaultIdx: colMap?.overall ?? 7 }
    ];

    fields.forEach(f => {
        const select = document.getElementById(f.id);
        if (!select) return;
        select.innerHTML = '<option value="-1">-- Tidak Ada / Default --</option>' + headers.map((h, i) => `
            <option value="${i}" ${i === f.defaultIdx ? 'selected' : ''}>Kolom ${i + 1}: ${h || `(Kolom ${i+1})`}</option>
        `).join('');
    });
}

function applyCustomColumnMapping() {
    if (!currentBulkUploadedFile) {
        showToast('Tidak ada file Excel yang aktif', 'error');
        return;
    }

    const customMap = {
        nama: parseInt(document.getElementById('map-col-nama')?.value ?? -1),
        tgl_lahir: parseInt(document.getElementById('map-col-ttl')?.value ?? -1),
        gender: parseInt(document.getElementById('map-col-gender')?.value ?? -1),
        tgl_tes: parseInt(document.getElementById('map-col-tgl-tes')?.value ?? -1),
        listening: parseInt(document.getElementById('map-col-lc')?.value ?? -1),
        structure: parseInt(document.getElementById('map-col-sw')?.value ?? -1),
        reading: parseInt(document.getElementById('map-col-rc')?.value ?? -1),
        overall: parseInt(document.getElementById('map-col-overall')?.value ?? -1)
    };

    const cleanMap = {};
    for (const [k, v] of Object.entries(customMap)) {
        if (v >= 0) cleanMap[k] = v;
    }

    const formData = new FormData();
    formData.append('file', currentBulkUploadedFile);
    formData.append('kd_doc', '135512');
    formData.append('kd_lem', 'SULCUN58');
    formData.append('start_urut', '1');
    formData.append('qr_type', 's1');
    formData.append('custom_mapping', JSON.stringify(cleanMap));

    showToast('🔄 Menerapkan pemetaan kolom pilihan Anda...', 'info');

    fetch('/api/v1/certificates/bulk-parse', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.records && data.records.length > 0) {
            bulkRecords = data.records;
            currentBulkIndex = 0;
            currentBulkColMap = cleanMap;

            document.getElementById('bulk-total-badge').innerText = bulkRecords.length;

            renderBulkTable();
            if (activeBulkTab === 'studio') {
                renderBulkCurrentStudio();
            }
            toggleColumnMappingPanel();
            showToast('✅ Pemetaan kolom berhasil diterapkan!', 'success');
        } else {
            showToast(data.error || 'Gagal menerapkan pemetaan kolom', 'error');
        }
    })
    .catch(err => {
        showToast('Kesalahan: ' + err.message, 'error');
    });
}

let activeBulkTab = 'list';

function switchBulkTab(tabName) {
    activeBulkTab = tabName;
    const viewList = document.getElementById('bulk-view-list');
    const viewStudio = document.getElementById('bulk-view-studio');
    const btnTabList = document.getElementById('btn-bulk-tab-list');
    const btnTabStudio = document.getElementById('btn-bulk-tab-studio');

    if (tabName === 'list') {
        if (viewList) viewList.classList.remove('hidden');
        if (viewStudio) viewStudio.classList.add('hidden');
        if (btnTabList) {
            btnTabList.style.background = '#ffffff';
            btnTabList.style.color = '#0284c7';
            btnTabList.style.fontWeight = '800';
            btnTabList.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
        if (btnTabStudio) {
            btnTabStudio.style.background = 'transparent';
            btnTabStudio.style.color = '#64748b';
            btnTabStudio.style.fontWeight = '700';
            btnTabStudio.style.boxShadow = 'none';
        }
        renderBulkTable();
    } else {
        if (viewList) viewList.classList.add('hidden');
        if (viewStudio) viewStudio.classList.remove('hidden');
        if (btnTabStudio) {
            btnTabStudio.style.background = '#ffffff';
            btnTabStudio.style.color = '#0284c7';
            btnTabStudio.style.fontWeight = '800';
            btnTabStudio.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
        if (btnTabList) {
            btnTabList.style.background = 'transparent';
            btnTabList.style.color = '#64748b';
            btnTabList.style.fontWeight = '700';
            btnTabList.style.boxShadow = 'none';
        }
        renderBulkCurrentStudio();
    }
}

function highlightBulkTableRow(idx) {
    const tbody = document.getElementById('bulk-table-tbody');
    if (!tbody) return;
    for (let i = 0; i < tbody.children.length; i++) {
        if (i === idx) {
            tbody.children[i].style.background = '#e0f2fe';
        } else {
            tbody.children[i].style.background = '';
        }
    }
}

function renderBulkCurrentStudio() {
    if (!bulkRecords || bulkRecords.length === 0) return;
    const rec = bulkRecords[currentBulkIndex];
    if (!rec) return;

    // Navigation indicators & buttons
    const pageInd = document.getElementById('bulk-page-indicator');
    if (pageInd) pageInd.innerText = `${currentBulkIndex + 1} / ${bulkRecords.length}`;

    const btnPrev = document.getElementById('btn-bulk-prev');
    const btnNext = document.getElementById('btn-bulk-next');
    if (btnPrev) btnPrev.disabled = currentBulkIndex === 0;
    if (btnNext) btnNext.disabled = currentBulkIndex === bulkRecords.length - 1;

    // Parse cert components if available or reconstruct
    const kdDoc = rec.kd_doc || (rec.no_sertifikat ? rec.no_sertifikat.substring(0, 6) : '135512');
    const kdLem = rec.kd_lem || 'SULCUN58';
    const noUrut = rec.no_urut || String(currentBulkIndex + 1).padStart(3, '0');
    const inisial = rec.inisial || (rec.nama ? rec.nama.substring(0, 2).toUpperCase() : 'XX');

    // Form inputs
    const elKdDoc = document.getElementById('bulk-edit-kd-doc');
    if (elKdDoc) elKdDoc.value = kdDoc;

    const elKdLem = document.getElementById('bulk-edit-kd-lem');
    if (elKdLem) elKdLem.value = kdLem;

    const elNoUrut = document.getElementById('bulk-edit-no-urut');
    if (elNoUrut) elNoUrut.value = noUrut;

    const elInisial = document.getElementById('bulk-edit-inisial');
    if (elInisial) elInisial.value = inisial;

    const elLiveCode = document.getElementById('bulk_live_cert_code');
    if (elLiveCode) elLiveCode.innerText = rec.no_sertifikat || `${kdDoc}${kdLem}${noUrut}${inisial}`;

    const elNama = document.getElementById('bulk-edit-nama');
    if (elNama) elNama.value = rec.nama || '';

    const elLahir = document.getElementById('bulk-edit-tgl-lahir');
    if (elLahir) elLahir.value = dmyToYmd(rec.tanggal_lahir) || '';

    const elGender = document.getElementById('bulk-edit-gender');
    if (elGender) elGender.value = rec.jenis_kelamin || 'F (Female)';

    const elNegara = document.getElementById('bulk-edit-negara');
    if (elNegara) elNegara.value = rec.negara || 'Indonesia';

    const elBahasa = document.getElementById('bulk-edit-bahasa');
    if (elBahasa) elBahasa.value = rec.bahasa || 'Indonesian';

    const elTes = document.getElementById('bulk-edit-tgl-tes');
    if (elTes) elTes.value = dmyToYmd(rec.tanggal_tes) || '';

    const elExp = document.getElementById('bulk-edit-tgl-exp');
    if (elExp) elExp.value = rec.berlaku_sampai || '';

    const elL = document.getElementById('bulk-edit-score-l');
    if (elL) elL.value = rec.listening || '';

    const elS = document.getElementById('bulk-edit-score-s');
    if (elS) elS.value = rec.structure || '';

    const elR = document.getElementById('bulk-edit-score-r');
    if (elR) elR.value = rec.reading || '';

    const elO = document.getElementById('bulk-edit-score-o');
    if (elO) elO.value = rec.overall || '';

    const elVal = document.getElementById('bulk-edit-val');
    if (elVal) elVal.checked = rec.show_validation !== false;

    const elCap = document.getElementById('bulk-edit-cap');
    if (elCap) elCap.checked = rec.show_cap !== false;

    // Update Paper Preview
    updateBulkPaperPreview(rec);
}

function updateBulkPaperPreview(rec) {
    if (!rec) return;
    const pCertNo = document.getElementById('bulk_prev_cert_no');
    const pTglTes = document.getElementById('bulk_prev_tgl_tes');
    const pTglExp = document.getElementById('bulk_prev_tgl_exp');
    const pNama = document.getElementById('bulk_prev_nama');
    const pDob = document.getElementById('bulk_prev_tgl_lahir');
    const pNegara = document.getElementById('bulk_prev_negara');
    const pBahasa = document.getElementById('bulk_prev_bahasa');
    const pGender = document.getElementById('bulk_prev_gender');
    const pL = document.getElementById('bulk_prev_score_l');
    const pS = document.getElementById('bulk_prev_score_s');
    const pR = document.getElementById('bulk_prev_score_r');
    const pO = document.getElementById('bulk_prev_score_o');
    const pBoxVal = document.getElementById('bulk_prev_box_val');
    const pValLogo = document.getElementById('bulk_prev_val_logo');
    const pBoxSig = document.getElementById('bulk_prev_box_sig');
    const pStamp = document.getElementById('bulk_prev_stamp_img');

    if (pCertNo) pCertNo.innerText = rec.no_sertifikat || '-';
    if (pTglTes) pTglTes.innerText = ensureDmyFormat(rec.tanggal_tes) || '-';
    if (pTglExp) pTglExp.innerText = ensureDmyFormat(rec.berlaku_sampai) || '-';
    if (pNama) pNama.innerText = (rec.nama || 'NAMA PESERTA').toUpperCase();
    if (pDob) pDob.innerText = ensureDmyFormat(rec.tanggal_lahir) || '-';
    if (pNegara) pNegara.innerText = rec.negara || 'Indonesia';
    if (pBahasa) pBahasa.innerText = rec.bahasa || 'Indonesian';
    if (pGender) pGender.innerText = (rec.jenis_kelamin || 'F').startsWith('M') || (rec.jenis_kelamin || '').startsWith('L') ? 'M' : 'F';
    if (pL) pL.innerText = rec.listening || '0';
    if (pS) pS.innerText = rec.structure || '0';
    if (pR) pR.innerText = rec.reading || '0';
    if (pO) pO.innerText = rec.overall || '0';

    if (pBoxVal) pBoxVal.style.visibility = rec.show_validation !== false ? 'visible' : 'hidden';
    if (pValLogo) pValLogo.style.display = rec.show_validation !== false ? 'block' : 'none';
    if (pStamp) pStamp.style.display = rec.show_cap !== false ? 'block' : 'none';
}

function setBulkQRPreset(type) {
    const btnS1 = document.getElementById('bulk_btn_qr_s1');
    const btnPasca = document.getElementById('bulk_btn_qr_pasca');
    const btnUmum = document.getElementById('bulk_btn_qr_umum');
    const badge = document.getElementById('bulk_qr_active_badge');
    const imgQR = document.getElementById('bulk_prev_qr_img');

    [btnS1, btnPasca, btnUmum].forEach(b => b && b.classList.remove('active'));

    if (type === 's1') {
        if (btnS1) btnS1.classList.add('active');
        if (badge) badge.innerText = 'Pilihan: S1 (Sarjana)';
        if (imgQR) imgQR.src = '/assets/qr_s1.png';
    } else if (type === 'pasca') {
        if (btnPasca) btnPasca.classList.add('active');
        if (badge) badge.innerText = 'Pilihan: Pascasarjana';
        if (imgQR) imgQR.src = '/assets/qr_pasca.png';
    } else if (type === 'umum') {
        if (btnUmum) btnUmum.classList.add('active');
        if (badge) badge.innerText = 'Pilihan: Kategori Umum';
        if (imgQR) imgQR.src = '/assets/qr_umum.png';
    }

    if (bulkRecords && bulkRecords[currentBulkIndex]) {
        bulkRecords[currentBulkIndex].qr_type = type;
    }
}

function onBulkFormChange() {
    if (!bulkRecords || bulkRecords.length === 0) return;
    const rec = bulkRecords[currentBulkIndex];
    if (!rec) return;

    const kdDoc = document.getElementById('bulk-edit-kd-doc')?.value.trim() || '135512';
    const kdLem = document.getElementById('bulk-edit-kd-lem')?.value.trim() || 'SULCUN58';
    const noUrut = document.getElementById('bulk-edit-no-urut')?.value.trim() || '001';
    
    rec.nama = (document.getElementById('bulk-edit-nama')?.value || '').trim().toUpperCase();
    const inisial = rec.nama ? rec.nama.substring(0, 2).toUpperCase() : 'XX';
    const elInisial = document.getElementById('bulk-edit-inisial');
    if (elInisial) elInisial.value = inisial;

    rec.no_sertifikat = `${kdDoc}${kdLem}${noUrut}${inisial}`;
    const elLiveCode = document.getElementById('bulk_live_cert_code');
    if (elLiveCode) elLiveCode.innerText = rec.no_sertifikat;

    const rawLahir = document.getElementById('bulk-edit-tgl-lahir')?.value.trim() || '';
    rec.tanggal_lahir = ymdToDmy(rawLahir);

    rec.jenis_kelamin = document.getElementById('bulk-edit-gender')?.value || 'F (Female)';
    rec.negara = document.getElementById('bulk-edit-negara')?.value.trim() || 'Indonesia';
    rec.bahasa = document.getElementById('bulk-edit-bahasa')?.value.trim() || 'Indonesian';

    const rawTes = document.getElementById('bulk-edit-tgl-tes')?.value.trim() || '';
    rec.tanggal_tes = ymdToDmy(rawTes);

    if (rawTes) {
        const parts = rawTes.split('-');
        if (parts.length === 3) {
            rec.berlaku_sampai = `${parts[2]}/${parts[1]}/${parseInt(parts[0], 10) + 2}`;
            const elExp = document.getElementById('bulk-edit-tgl-exp');
            if (elExp) elExp.value = rec.berlaku_sampai;
        }
    }

    rec.listening = document.getElementById('bulk-edit-score-l')?.value.trim() || '';
    rec.structure = document.getElementById('bulk-edit-score-s')?.value.trim() || '';
    rec.reading = document.getElementById('bulk-edit-score-r')?.value.trim() || '';
    rec.overall = document.getElementById('bulk-edit-score-o')?.value.trim() || '';
    rec.show_validation = document.getElementById('bulk-edit-val')?.checked !== false;
    rec.show_cap = document.getElementById('bulk-edit-cap')?.checked !== false;

    // Update Paper Preview
    updateBulkPaperPreview(rec);

    // Update row in table immediately if table exists
    const rowEl = document.getElementById(`bulk-row-${currentBulkIndex}`);
    if (rowEl) {
        rowEl.children[1].innerText = rec.no_sertifikat;
        rowEl.children[2].innerText = rec.nama;
        rowEl.children[3].innerText = rec.tanggal_lahir;
        rowEl.children[4].innerText = rec.tanggal_tes;
        rowEl.children[5].innerText = rec.listening;
        rowEl.children[6].innerText = rec.structure;
        rowEl.children[7].innerText = rec.reading;
        rowEl.children[8].innerText = rec.overall;
    }
}

function prevBulkRecord() {
    if (currentBulkIndex > 0) {
        currentBulkIndex--;
        renderBulkCurrentStudio();
        highlightBulkTableRow(currentBulkIndex);
    }
}

function nextBulkRecord() {
    if (currentBulkIndex < bulkRecords.length - 1) {
        currentBulkIndex++;
        renderBulkCurrentStudio();
        highlightBulkTableRow(currentBulkIndex);
    }
}

function goToBulkRecord(index) {
    if (index >= 0 && index < bulkRecords.length) {
        currentBulkIndex = index;
        switchBulkTab('studio');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderBulkTable() {
    const tbody = document.getElementById('bulk-table-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    bulkRecords.forEach((rec, idx) => {
        const tr = document.createElement('tr');
        tr.id = `bulk-row-${idx}`;
        tr.style.cursor = 'pointer';
        tr.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
                goToBulkRecord(idx);
            }
        };

        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td><code>${rec.no_sertifikat}</code></td>
            <td><strong>${rec.nama}</strong></td>
            <td style="font-size:11px; color:#64748b;">${rec.tanggal_lahir}</td>
            <td style="font-size:11px; color:#64748b;">${rec.tanggal_tes}</td>
            <td style="text-align:center;">${rec.listening}</td>
            <td style="text-align:center;">${rec.structure}</td>
            <td style="text-align:center;">${rec.reading}</td>
            <td style="text-align:center;"><strong style="color:#d97706;">${rec.overall}</strong></td>
            <td style="text-align:right;">
                <button type="button" class="btn btn-primary btn-sm" style="padding:4px 10px; font-size:11px;" onclick="goToBulkRecord(${idx})">
                    <i class="fa-solid fa-pen-to-square"></i> Edit di Studio
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function processCurrentBulkSingle() {
    if (!bulkRecords || bulkRecords.length === 0) return;
    const rec = bulkRecords[currentBulkIndex];
    if (!rec) return;

    const gdriveSettings = {
        url: localStorage.getItem('telp_gdrive_url') || '',
        folder_s1: localStorage.getItem('telp_gdrive_folder_s1') || '',
        folder_pasca: localStorage.getItem('telp_gdrive_folder_pasca') || '',
        folder_umum: localStorage.getItem('telp_gdrive_folder_umum') || '',
        auto_sync: localStorage.getItem('telp_gdrive_auto_sync') === '1'
    };

    const isAutoSync = gdriveSettings.auto_sync && gdriveSettings.url;
    const qrType = (rec.qr_type || 's1').toUpperCase();
    const targetFolderId = gdriveSettings[`folder_${rec.qr_type || 's1'}`];

    showLoadingToast(
        `Memproses ${rec.nama}...`,
        isAutoSync 
            ? (targetFolderId 
                ? `Menyimpan Word & PDF Polos ke direktori komputer serta mengunggah PDF Resmi ke Google Drive (Folder ${qrType})...` 
                : `Menyimpan berkas ke direktori komputer lokal (ID Folder Google Drive ${qrType} belum diisi)...`)
            : `Menyimpan berkas Word & PDF Polos ke direktori komputer...`
    );

    const payload = {
        no_sertifikat: rec.no_sertifikat,
        nama: rec.nama,
        tanggal_lahir: rec.tanggal_lahir,
        jenis_kelamin: rec.jenis_kelamin,
        tanggal_tes: rec.tanggal_tes,
        berlaku_sampai: rec.berlaku_sampai,
        negara: rec.negara || 'Indonesia',
        bahasa: rec.bahasa || 'Indonesian',
        listening: rec.listening,
        structure: rec.structure,
        reading: rec.reading,
        overall: rec.overall,
        qr_type: rec.qr_type || 's1',
        show_validation: rec.show_validation !== false,
        show_cap: rec.show_cap !== false,
        gdrive_settings: gdriveSettings
    };

    try {
        const response = await fetch('/api/v1/certificates/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const res = await response.json();
        if (res.success && res.data) {
            const dataObj = res.data;

            if (dataObj.gdrive_upload) {
                if (dataObj.gdrive_upload.success) {
                    showToast(`🎉 Sukses! Berkas ${rec.nama} Diproses`, 'success', `Word & PDF Polos tersimpan di komputer & PDF Resmi terunggah ke Google Drive (${qrType})`);
                } else if (dataObj.gdrive_upload.error) {
                    showToast(`⚠️ Berkas Tersimpan di Komputer, namun Google Drive Belum Diunggah`, 'warning', dataObj.gdrive_upload.error);
                } else {
                    showToast(`🎉 Berkas ${rec.nama} Berhasil Disimpan!`, 'success', 'Word & PDF Polos tersimpan di direktori komputer.');
                }
            } else if (isAutoSync && !targetFolderId) {
                showToast(`⚠️ Berkas Tersimpan di Komputer (Google Drive Belum Diunggah)`, 'warning', `ID Folder Google Drive untuk kategori ${qrType} belum diisi di menu Integrasi.`);
            } else {
                showToast(`🎉 Berkas ${rec.nama} Berhasil Disimpan!`, 'success', 'Word & PDF Polos tersimpan di direktori komputer.');
            }
            loadCertHistoryData();
        } else {
            showToast('Gagal Memproses Berkas', 'error', res.error || 'Terjadi kesalahan pada server');
        }
    } catch (e) {
        showToast('Kesalahan Server', 'error', e.message);
    }
}

async function processAllBulkRecords() {
    if (!bulkRecords || bulkRecords.length === 0) {
        showToast('Tidak ada data peserta untuk diproses', 'error');
        return;
    }

    const gdriveSettings = {
        url: localStorage.getItem('telp_gdrive_url') || '',
        folder_s1: localStorage.getItem('telp_gdrive_folder_s1') || '',
        folder_pasca: localStorage.getItem('telp_gdrive_folder_pasca') || '',
        folder_umum: localStorage.getItem('telp_gdrive_folder_umum') || '',
        auto_sync: localStorage.getItem('telp_gdrive_auto_sync') === '1'
    };

    const isAutoSync = gdriveSettings.auto_sync && gdriveSettings.url;

    // Loading persisten selama proses bulk & cloud upload
    showLoadingToast(
        `Memproses ${bulkRecords.length} Peserta Massal...`,
        isAutoSync 
            ? `Menyimpan seluruh Word & PDF Polos ke direktori komputer serta mengunggah PDF Resmi ke 3 Folder Google Drive...` 
            : `Menyimpan seluruh berkas Word & PDF Polos ke direktori komputer...`
    );

    try {
        const response = await fetch('/api/v1/certificates/bulk-generate-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                records: bulkRecords,
                generate_pdf: true,
                generate_polos: true,
                gdrive_settings: gdriveSettings
            })
        });
        const data = await response.json();
        if (data.success) {
            if (data.gdrive_uploaded_count > 0 && !data.gdrive_skipped_count) {
                showToast(
                    `🎉 Sukses! Seluruh (${data.count}) Sertifikat Berhasil Diproses`, 
                    'success', 
                    `Word & PDF Polos tersimpan di direktori komputer & semua (${data.gdrive_uploaded_count}) PDF Resmi terunggah ke Google Drive!`
                );
            } else if (data.gdrive_uploaded_count > 0 && data.gdrive_skipped_count > 0) {
                showToast(
                    `⚠️ (${data.count}) Sertifikat Diproses (${data.gdrive_uploaded_count} Terunggah ke Drive)`, 
                    'warning', 
                    `Word & PDF Polos tersimpan di komputer, ${data.gdrive_skipped_count} berkas dilewati dari Drive karena ID Folder belum diisi.`
                );
            } else if (isAutoSync && data.gdrive_uploaded_count === 0) {
                showToast(
                    `⚠️ (${data.count}) Sertifikat Berhasil Disimpan di Komputer`, 
                    'warning', 
                    `Word & PDF Polos tersimpan di komputer, namun belum terunggah ke Google Drive karena ID Folder belum diisi.`
                );
            } else {
                showToast(
                    `🎉 Sukses! Seluruh (${data.count}) Sertifikat Berhasil Diproses`, 
                    'success', 
                    `Word & PDF Polos tersimpan di direktori komputer.`
                );
            }
            loadCertHistoryData();
        } else {
            showToast('Gagal Memproses Peserta', 'error', data.error || 'Terjadi kesalahan pada server');
        }
    } catch (e) {
        showToast('Kesalahan Server', 'error', e.message);
    }
}

function resetBulkExcel() {
    bulkRecords = [];
    currentBulkIndex = 0;
    document.getElementById('bulk-workspace')?.classList.add('hidden');
    document.getElementById('bulk-upload-card')?.classList.remove('hidden');
    const inp = document.getElementById('bulk-excel-file-input');
    if (inp) inp.value = '';
}

// -------------------------------------------------------------
// RIWAYAT & CARI SERTIFIKAT (DATABASE) & PENGHAPUSAN (ADMIN)
// -------------------------------------------------------------
let certHistoryData = [];
let certSearchTimer = null;

function debounceCertSearch() {
    clearTimeout(certSearchTimer);
    certSearchTimer = setTimeout(() => {
        loadCertHistoryData();
    }, 300);
}

async function loadCertHistoryData() {
    const q = document.getElementById('search-cert-input')?.value?.trim() || '';
    const tbody = document.getElementById('cert-history-tbody');
    const badge = document.getElementById('cert-total-badge');

    try {
        const res = await fetch(`/api/certificates/history?q=${encodeURIComponent(q)}`);
        const json = await res.json();

        if (!json.success || !json.data) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Gagal memuat data arsip sertifikat.</td></tr>`;
            return;
        }

        certHistoryData = json.data;
        if (badge) {
            badge.innerText = `Total: ${certHistoryData.length} Sertifikat`;
        }

        if (certHistoryData.length === 0) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                            <i class="fa-solid fa-folder-open" style="font-size: 28px; color: #cbd5e1; margin-bottom: 8px;"></i>
                            <div style="font-weight: 600; color: #64748b;">Tidak ada data arsip sertifikat</div>
                            <div style="font-size: 12px;">${q ? `Tidak ditemukan data dengan kata kunci "${q}"` : 'Belum ada sertifikat yang diterbitkan.'}</div>
                        </td>
                    </tr>
                `;
            }
            updateSelectedCertsUI();
            return;
        }

        const isAdmin = !!document.getElementById('btn-bulk-delete-certs');

        if (tbody) {
            tbody.innerHTML = certHistoryData.map((c, index) => {
                const noSertif = c.no_sertifikat || '-';
                const nama = c.nama || '-';
                const tglTes = c.tanggal_tes || '-';
                const listening = c.listening || '0';
                const structure = c.structure || '0';
                const reading = c.reading || '0';
                const overall = c.overall || '0';
                const kategori = (c.kategori || 's1').toUpperCase();

                const checkboxHtml = isAdmin ? `
                    <td style="text-align: center; padding: 12px 10px;">
                        <input type="checkbox" class="cert-row-checkbox" value="${c.id}" onchange="updateSelectedCertsUI()" style="cursor: pointer; width: 16px; height: 16px;">
                    </td>
                ` : '';

                const adminDeleteBtn = isAdmin ? `
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteCertificateRow(${c.id}, '${escapeJsString(nama)}', '${escapeJsString(noSertif)}')" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 5px 9px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Hapus dari Database">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                ` : '';

                return `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        ${checkboxHtml}
                        <td style="padding: 12px 16px;">
                            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 6px; font-size: 12px;">
                                ${noSertif}
                            </span>
                            <span style="font-size: 10.5px; color: #94a3b8; margin-left: 4px;">(${kategori})</span>
                        </td>
                        <td style="padding: 12px 16px; font-weight: 700; color: #1e293b;">
                            ${nama}
                        </td>
                        <td style="padding: 12px 16px; color: #64748b; font-size: 12.5px;">
                            ${tglTes}
                        </td>
                        <td style="padding: 12px 16px; text-align: center; font-size: 12px; color: #475569;">
                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">L: ${listening}</span>
                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin: 0 3px;">S: ${structure}</span>
                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">R: ${reading}</span>
                        </td>
                        <td style="padding: 12px 16px; text-align: center;">
                            <span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 999px; font-weight: 800; font-size: 13px;">
                                ${overall}
                            </span>
                        </td>
                        <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
                            <div style="display: inline-flex; gap: 6px; align-items: center;">
                                <a href="/api/v1/certificates/download/SERTIFIKAT_${encodeURIComponent(noSertif)}.docx" target="_blank" class="btn btn-sm btn-secondary" style="background: #f8fafc; color: #2563eb; border: 1px solid #cbd5e1; padding: 5px 9px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;" title="Unduh File Word (.docx)">
                                    <i class="fa-solid fa-file-word"></i>
                                </a>
                                <button type="button" class="btn btn-sm btn-primary" onclick="openCertInStudio('${escapeJsString(noSertif)}')" style="background: #0284c7; color: #fff; border: none; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Buka di Studio & Cetak">
                                    <i class="fa-solid fa-print"></i> Cetak
                                </button>
                                ${adminDeleteBtn}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        updateSelectedCertsUI();
    } catch (err) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error: ${err.message}</td></tr>`;
    }
}

function escapeJsString(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function openCertInStudio(noSertif) {
    const cert = certHistoryData.find(c => c.no_sertifikat === noSertif);
    if (!cert) return;

    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    setVal('cert-no', cert.no_sertifikat);
    setVal('cert-name', cert.nama);
    setVal('cert-dob', cert.tanggal_lahir);
    setVal('cert-gender', cert.jenis_kelamin);
    setVal('cert-test-date', cert.tanggal_tes);
    setVal('cert-expiry-date', cert.berlaku_sampai);
    setVal('cert-country', cert.negara || 'Indonesia');
    setVal('cert-lang', cert.bahasa || 'Indonesian');
    setVal('cert-score-l', cert.listening);
    setVal('cert-score-s', cert.structure);
    setVal('cert-score-r', cert.reading);
    setVal('cert-score-total', cert.overall);
    if (cert.kategori) setVal('cert-qr-type', cert.kategori);

    switchSubMenu('cert-gen');
    showToast(`Sertifikat ${cert.nama} Dimuat ke Studio!`, 'info');
}

// -------------------------------------------------------------
// DELETE CERTIFICATE ROW (SINGLE)
// -------------------------------------------------------------
async function deleteCertificateRow(id, name, noSertif) {
    const ok = await showConfirm({
        type: 'danger',
        title: 'Hapus Sertifikat?',
        message: `Anda akan menghapus data sertifikat berikut secara permanen dari database:<br><br><strong style="color:#0f172a;">${name}</strong><br><span style="font-size:12px;color:#64748b;font-family:monospace;">${noSertif}</span><br><br><span style="color:#dc2626;font-size:12px;">Tindakan ini tidak dapat dibatalkan.</span>`,
        okText: 'Ya, Hapus',
        cancelText: 'Batal'
    });
    if (!ok) return;

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    showLoadingToast('Menghapus Sertifikat...', `Sedang menghapus data ${name} dari database...`);

    try {
        const res = await fetch(`/api/certificates/history/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        });
        const json = await res.json();

        hideLoadingToast();

        if (json.success) {
            showToast('Sertifikat Berhasil Dihapus', 'success', json.message);
            loadCertHistoryData();
            if (typeof loadAdminHealthCheck === 'function') loadAdminHealthCheck(false);
        } else {
            showToast('Gagal Menghapus Sertifikat', 'error', json.message || 'Terjadi kesalahan server');
        }
    } catch (e) {
        hideLoadingToast();
        showToast('Kesalahan Jaringan', 'error', e.message);
    }
}

// -------------------------------------------------------------
// CLEAR ALL CERTIFICATES HISTORY (ADMIN ONLY)
// -------------------------------------------------------------
async function clearAllCertificatesHistory() {
    const total = certHistoryData.length;
    if (total === 0) {
        await showDialog({ type:'info', title:'Tidak Ada Data', message:'Belum ada riwayat sertifikat untuk dihapus.' });
        return;
    }

    const confirm1 = await showConfirm({
        type: 'danger',
        title: '⚠️ Hapus Semua Riwayat?',
        message: `Anda akan menghapus <strong>${total} sertifikat</strong> secara permanen dari database.<br><br>Tindakan ini <strong style="color:#dc2626;">tidak dapat dibatalkan</strong>. Lanjutkan?`,
        okText: 'Ya, Lanjutkan',
        cancelText: 'Batal'
    });
    if (!confirm1) return;

    const confirm2 = await showPromptConfirm({
        type: 'danger',
        title: 'Konfirmasi Akhir',
        message: `Ketik <strong>HAPUS SEMUA</strong> di bawah ini untuk mengonfirmasi penghapusan <strong>${total} sertifikat</strong> secara permanen.`,
        inputLabel: 'Konfirmasi teks',
        expectedValue: 'HAPUS SEMUA',
        okText: 'Hapus Sekarang',
        cancelText: 'Batal'
    });
    if (!confirm2) return;

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    showLoadingToast('Menghapus Seluruh Arsip...', 'Sedang mengosongkan seluruh riwayat sertifikat dari database...');

    try {
        const res = await fetch('/api/certificates/history/clear-all', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        });
        const json = await res.json();

        hideLoadingToast();

        if (json.success) {
            showToast('Database Sertifikat Dibersihkan', 'success', json.message);
            loadCertHistoryData();
            if (typeof loadAdminHealthCheck === 'function') loadAdminHealthCheck(false);
        } else {
            showToast('Gagal Menghapus', 'error', json.message || 'Akses ditolak atau kesalahan server');
        }
    } catch (e) {
        hideLoadingToast();
        showToast('Kesalahan Jaringan', 'error', e.message);
    }
}

// -------------------------------------------------------------
// BULK SELECTION & MULTI-DELETE (ADMIN ONLY)
// -------------------------------------------------------------
function toggleSelectAllCerts(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.cert-row-checkbox');
    checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
    updateSelectedCertsUI();
}

function updateSelectedCertsUI() {
    const checked = document.querySelectorAll('.cert-row-checkbox:checked');
    const bulkBtn = document.getElementById('btn-bulk-delete-certs');
    const bulkLabel = document.getElementById('btn-bulk-delete-label');
    const masterCb = document.getElementById('check-all-certs');

    if (bulkBtn) {
        if (checked.length > 0) {
            bulkBtn.classList.remove('hidden');
            if (bulkLabel) bulkLabel.innerText = `Hapus Terpilih (${checked.length})`;
        } else {
            bulkBtn.classList.add('hidden');
        }
    }

    const totalCbs = document.querySelectorAll('.cert-row-checkbox');
    if (masterCb && totalCbs.length > 0) {
        masterCb.checked = (checked.length === totalCbs.length);
    }
}

async function deleteSelectedCertificates() {
    const checked = Array.from(document.querySelectorAll('.cert-row-checkbox:checked')).map(cb => parseInt(cb.value));
    if (checked.length === 0) return;

    const ok = await showConfirm({
        type: 'danger',
        title: `Hapus ${checked.length} Sertifikat?`,
        message: `Anda akan menghapus <strong>${checked.length} sertifikat</strong> yang dipilih secara permanen dari database.<br><br><span style="color:#dc2626;font-size:12px;">Tindakan ini tidak dapat dibatalkan.</span>`,
        okText: 'Ya, Hapus Semua',
        cancelText: 'Batal'
    });
    if (!ok) return;

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    showLoadingToast('Menghapus Pilihan...', `Sedang menghapus ${checked.length} sertifikat...`);

    try {
        const res = await fetch('/api/certificates/history/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        });
        const json = await res.json();

        hideLoadingToast();

        if (json.success) {
            showToast('Sertifikat Terpilih Dihapus', 'success', json.message);
            loadCertHistoryData();
            if (typeof loadAdminHealthCheck === 'function') loadAdminHealthCheck(false);
        } else {
            showToast('Gagal Menghapus', 'error', json.message);
        }
    } catch (e) {
        hideLoadingToast();
        showToast('Kesalahan Jaringan', 'error', e.message);
    }
}

// -------------------------------------------------------------
// GOOGLE DRIVE CLOUD INTEGRATION HANDLER (S1, PASCA, UMUM)
// -------------------------------------------------------------
async function saveGoogleDriveSettings() {
    const url = document.getElementById('gdrive-url')?.value.trim();
    const folderS1 = document.getElementById('gdrive-folder-s1')?.value.trim();
    const folderPasca = document.getElementById('gdrive-folder-pasca')?.value.trim();
    const folderUmum = document.getElementById('gdrive-folder-umum')?.value.trim();
    const autoSync = document.getElementById('gdrive-auto-sync')?.checked !== false;

    if (url && (url.includes('script.googleusercontent.com') || url.includes('echo?user_content_key'))) {
        showToast('⚠️ URL yang dimasukkan salah (hasil redirect browser). Harap gunakan Web App URL yang berakhiran /exec dari popup Deploy Google Script!', 'error');
        alert('⚠️ PERHATIAN:\n\nURL yang Anda tempelkan adalah URL redirect sementara browser (script.googleusercontent.com).\n\nSilakan buka Google Apps Script -> Deploy (Terapkan) -> Manage deployments (Kelola penerapan) -> Salin "Web app URL" asli yang berakhiran "/exec" (Contoh: https://script.google.com/macros/s/AKfycb.../exec).');
        return;
    }

    localStorage.setItem('telp_gdrive_url', url);
    localStorage.setItem('telp_gdrive_folder_s1', folderS1);
    localStorage.setItem('telp_gdrive_folder_pasca', folderPasca);
    localStorage.setItem('telp_gdrive_folder_umum', folderUmum);
    localStorage.setItem('telp_gdrive_auto_sync', autoSync ? '1' : '0');

    try {
        await fetch('/api/v1/gdrive/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gdrive_url: url,
                gdrive_folder_s1: folderS1,
                gdrive_folder_pasca: folderPasca,
                gdrive_folder_umum: folderUmum,
                gdrive_auto_sync: autoSync
            })
        });
    } catch (e) {}

    showToast('✅ Pengaturan 3 Folder Google Drive Cloud berhasil disimpan!', 'success');
}

async function loadGoogleDriveSettings() {
    let url = localStorage.getItem('telp_gdrive_url') || '';
    let folderS1 = localStorage.getItem('telp_gdrive_folder_s1') || '';
    let folderPasca = localStorage.getItem('telp_gdrive_folder_pasca') || '';
    let folderUmum = localStorage.getItem('telp_gdrive_folder_umum') || '';
    let autoSync = localStorage.getItem('telp_gdrive_auto_sync') !== '0';

    if (!url || !folderS1) {
        try {
            const res = await fetch('/api/v1/gdrive/settings');
            const json = await res.json();
            if (json.success && json.data) {
                url = json.data.gdrive_url || url;
                folderS1 = json.data.gdrive_folder_s1 || folderS1;
                folderPasca = json.data.gdrive_folder_pasca || folderPasca;
                folderUmum = json.data.gdrive_folder_umum || folderUmum;
                autoSync = json.data.gdrive_auto_sync !== false;

                localStorage.setItem('telp_gdrive_url', url);
                localStorage.setItem('telp_gdrive_folder_s1', folderS1);
                localStorage.setItem('telp_gdrive_folder_pasca', folderPasca);
                localStorage.setItem('telp_gdrive_folder_umum', folderUmum);
                localStorage.setItem('telp_gdrive_auto_sync', autoSync ? '1' : '0');
            }
        } catch (e) {}
    }

    const urlInput = document.getElementById('gdrive-url');
    const folderS1Input = document.getElementById('gdrive-folder-s1');
    const folderPascaInput = document.getElementById('gdrive-folder-pasca');
    const folderUmumInput = document.getElementById('gdrive-folder-umum');
    const syncInput = document.getElementById('gdrive-auto-sync');

    if (urlInput && url) urlInput.value = url;
    if (folderS1Input && folderS1) folderS1Input.value = folderS1;
    if (folderPascaInput && folderPasca) folderPascaInput.value = folderPasca;
    if (folderUmumInput && folderUmum) folderUmumInput.value = folderUmum;
    if (syncInput) syncInput.checked = autoSync;
}

async function testGoogleDriveConnection(category = 's1') {
    const url = document.getElementById('gdrive-url')?.value.trim();
    let folderId = '';
    if (category === 's1') folderId = document.getElementById('gdrive-folder-s1')?.value.trim();
    else if (category === 'pasca') folderId = document.getElementById('gdrive-folder-pasca')?.value.trim();
    else if (category === 'umum') folderId = document.getElementById('gdrive-folder-umum')?.value.trim();

    const alertBox = document.getElementById('gdrive-status-alert');

    if (!url) {
        showToast('Harap masukkan Google Apps Script Web App URL terlebih dahulu', 'error');
        return;
    }

    showToast(`⏳ Menguji koneksi ke Google Drive Folder ${category.toUpperCase()}...`, 'info');
    if (alertBox) {
        alertBox.classList.remove('hidden');
        alertBox.style.background = '#fef3c7';
        alertBox.style.border = '1px solid #fde68a';
        alertBox.style.color = '#92400e';
        alertBox.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menguji koneksi Folder ${category.toUpperCase()}...`;
    }

    try {
        const response = await fetch('/api/v1/gdrive/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gdrive_url: url, folder_id: folderId })
        });
        const data = await response.json();
        if (data.success) {
            showToast(`Koneksi Folder ${category.toUpperCase()} Berhasil!`, 'success');
            if (alertBox) {
                alertBox.style.background = '#dcfce7';
                alertBox.style.border = '1px solid #bbf7d0';
                alertBox.style.color = '#166534';
                alertBox.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Terhubung Sukses (Folder ${category.toUpperCase()})!</strong><br><span style="font-size:11px;">Google Apps Script Web App merespons 200 OK.</span>`;
            }
        } else {
            showToast('Koneksi gagal: ' + (data.message || 'Error'), 'error');
            if (alertBox) {
                alertBox.style.background = '#fee2e2';
                alertBox.style.border = '1px solid #fecaca';
                alertBox.style.color = '#991b1b';
                alertBox.innerHTML = `<strong><i class="fa-solid fa-circle-xmark"></i> Gagal Terhubung</strong><br><span style="font-size:11px;">${data.message || 'Cek URL Web App dan pastikan opsi akses "Anyone".'}</span>`;
            }
        }
    } catch (err) {
        showToast('Kesalahan: ' + err.message, 'error');
        if (alertBox) {
            alertBox.style.background = '#fee2e2';
            alertBox.style.border = '1px solid #fecaca';
            alertBox.style.color = '#991b1b';
            alertBox.innerHTML = `<strong><i class="fa-solid fa-triangle-exclamation"></i> Error Jaringan:</strong> ${err.message}`;
        }
    }
}

function copyAppsScriptCode() {
    const codeEl = document.getElementById('apps-script-code');
    if (!codeEl) return;
    navigator.clipboard.writeText(codeEl.innerText).then(() => {
        showToast('📋 Kode Apps Script berhasil disalin ke clipboard!', 'success');
    }).catch(err => {
        showToast('Gagal menyalin kode', 'error');
    });
}

function saveDirWaSettings() {
    const dir = document.getElementById('setting-output-dir')?.value;
    const wa = document.getElementById('setting-wa-number')?.value;
    localStorage.setItem('telp_setting_output_dir', dir);
    localStorage.setItem('telp_setting_wa_number', wa);
    showToast('Pengaturan Directory & WA Cetak berhasil disimpan!', 'success');
}

// -------------------------------------------------------------
// LAPORAN HARIAN EXPORT & JOURNAL ENGINE
// -------------------------------------------------------------
function getLaporanYearMonth() {
    const yearEl = document.getElementById('laporan-year-select') || document.getElementById('select-year');
    const monthEl = document.getElementById('laporan-month-select') || document.getElementById('select-month');
    return {
        year: yearEl ? yearEl.value : '2026',
        month: monthEl ? monthEl.value : '8'
    };
}

function exportLaporanHarianDocx() {
    const ym = getLaporanYearMonth();
    showToast('Membuat dokumen Laporan Harian Word...', 'info');

    // Use fetch+blob because Laravel proxies export via POST to Flask
    fetch(`/api/v1/laporan-harian/export-docx?year=${ym.year}&month=${ym.month}`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error || 'Gagal ekspor'); });
        return res.blob();
    })
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LAPORAN_HARIAN_${ym.year}_${String(ym.month).padStart(2,'0')}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Laporan Harian berhasil diunduh!', 'success');
    })
    .catch(err => {
        showToast('Gagal membuat Laporan: ' + err.message, 'error');
    });
}

function loadLaporanHarianMonth() {
    const ym = getLaporanYearMonth();
    const grid = document.getElementById('days-grid-container');
    if (!grid) return;

    fetch(`/api/v1/laporan-harian/month?year=${ym.year}&month=${ym.month}`)
    .then(res => res.json())
    .then(json => {
        if (json.success) {
            currentLaporanMonthData = json.data;

            const statWork = document.getElementById('stat-working-days');
            const statPhoto = document.getElementById('stat-uploaded-photos');
            if (statWork) statWork.innerText = `${currentLaporanMonthData.working_days || 0} Hari`;
            if (statPhoto) statPhoto.innerText = `${currentLaporanMonthData.uploaded_photos_count || 0} Foto`;

            grid.innerHTML = currentLaporanMonthData.days.map(d => {
                let cardClass = 'day-card';
                if (!d.is_working_day) cardClass += ' holiday';
                if (d.has_photo) cardClass += ' has-photo';

                let actionButton = '';
                if (d.is_locked_holiday) {
                    actionButton = `<button type="button" class="btn btn-sm btn-locked mt-2" disabled title="Terkunci"><i class="fa-solid fa-lock"></i> Terkunci</button>`;
                } else if (d.is_cuti_bersama || d.is_extra_libur) {
                    actionButton = `<button type="button" class="btn btn-sm btn-secondary mt-2" style="border-color:#fca5a5; color:#dc2626;" onclick="openDayModal(${d.day})">⚙️ Ubah Cuti</button>`;
                } else {
                    actionButton = `<button type="button" class="btn btn-sm btn-secondary mt-2" onclick="openDayModal(${d.day})">📷 Kelola Foto</button>`;
                }

                let photoBadge = d.has_photo ? `<div class="badge-photo-ok"><i class="fa-solid fa-check"></i> Foto Ada</div>` : '';
                let statusText = '';
                if (d.is_working_day) {
                    statusText = d.is_sabtu_masuk ? '<span style="color:#166534; font-weight:bold;">Kerja (Sabtu Masuk)</span>' : '<span style="color:#166534; font-weight:bold;">Kerja</span>';
                } else {
                    statusText = `<span style="color:#b91c1c; font-weight:bold;">${d.holiday_reason || 'Libur'}</span>`;
                }

                return `
                    <div class="${cardClass}">
                        <div class="day-num">${d.day}</div>
                        <div class="day-name">${d.hari || ''}</div>
                        <div class="day-status">${statusText}</div>
                        ${photoBadge}
                        ${actionButton}
                    </div>
                `;
            }).join('');
        }
    })
    .catch(err => {
        console.warn('Gagal memuat laporan harian:', err);
    });
}

function openDayModal(dayNum) {
    if (!currentLaporanMonthData) return;
    const dayData = currentLaporanMonthData.days.find(d => d.day === dayNum);
    if (!dayData) return;

    if (dayData.is_locked_holiday) {
        showToast('Hari libur nasional / Minggu terkunci.', 'info');
        return;
    }

    document.getElementById('edit-day-num').value = dayNum;
    document.getElementById('modal-day-title').innerText = `${dayNum} ${currentLaporanMonthData.month_name} ${currentLaporanMonthData.year}`;
    document.getElementById('modal-day-activity').value = dayData.activity_text || '';
    document.getElementById('check-sabtu-masuk').checked = dayData.is_sabtu_masuk || false;
    document.getElementById('check-extra-libur').checked = dayData.is_extra_libur || false;
    document.getElementById('modal-day-holiday-reason').value = dayData.holiday_reason || '';

    const img = document.getElementById('modal-day-photo-img');
    if (img) {
        if (dayData.photo_url) img.src = dayData.photo_url;
        else img.src = '/assets/image2.png';
    }

    document.getElementById('modal-day-edit')?.classList.remove('hidden');
}

function closeDayModal() {
    document.getElementById('modal-day-edit')?.classList.add('hidden');
}

function saveDayDetails() {
    const dayNum = parseInt(document.getElementById('edit-day-num').value);
    const ym = getLaporanYearMonth();

    fetch('/api/v1/laporan-harian/save-day', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getLaporanCsrfToken()
        },
        body: JSON.stringify({
            year: parseInt(ym.year),
            month: parseInt(ym.month),
            day: dayNum,
            activity_text: document.getElementById('modal-day-activity').value,
            is_sabtu_masuk: document.getElementById('check-sabtu-masuk').checked,
            is_extra_libur: document.getElementById('check-extra-libur').checked,
            holiday_reason: document.getElementById('modal-day-holiday-reason').value
        })
    })
    .then(res => res.json())
    .then(data => {
        showToast('Data tanggal ' + dayNum + ' disimpan!', 'success');
        closeDayModal();
        loadLaporanHarianMonth();
    });
}

function getLaporanCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

function uploadDayPhotoSelected() {
    const fileInput = document.getElementById('modal-photo-file-input');
    if (!fileInput.files.length) return;
    const dayNum = parseInt(document.getElementById('edit-day-num').value);
    const ym = getLaporanYearMonth();

    const formData = new FormData();
    formData.append('_token', getLaporanCsrfToken());
    formData.append('year', ym.year);
    formData.append('month', ym.month);
    formData.append('day', dayNum);
    formData.append('photo', fileInput.files[0]);

    showToast('Mengompres & mengunggah WebP...', 'info');
    fetch('/api/v1/laporan-harian/upload-photo', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        if (!data.success && data.message) {
            showToast('Gagal upload: ' + data.message, 'error');
            return;
        }
        showToast('Foto WebP berhasil diunggah!', 'success');
        // Immediately refresh photo in modal
        const img = document.getElementById('modal-day-photo-img');
        if (img && data.photo_url) {
            img.src = data.photo_url + '?t=' + Date.now(); // cache-bust
        }
        // Clear file input
        fileInput.value = '';
        // Refresh grid to update badge
        loadLaporanHarianMonth();
    })
    .catch(err => {
        showToast('Error upload foto: ' + err.message, 'error');
    });
}

// -------------------------------------------------------------
// BAPU DROPZONE & ATTENDEE MANAGEMENT
// -------------------------------------------------------------
function setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('excel-file-input');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) handleFileUpload(fileInput.files[0]);
    });
}

function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    showToast('Membaca file Excel...', 'info');

    fetch('/api/upload', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            bapuData = data.data;
            document.getElementById('upload-section').classList.add('hidden');
            document.getElementById('workspace').classList.remove('hidden');
            populateBapuForm(bapuData);
            recalculateBapuStats();
            renderStudentsTable(bapuData.students);
            showToast('Excel berhasil dibaca!', 'success');
        } else {
            showToast(data.error || 'Gagal membaca file', 'error');
        }
    });
}

function populateBapuForm(data) {
    if (document.getElementById('input-hari')) document.getElementById('input-hari').value = data.hari || '';
    if (document.getElementById('input-tanggal')) document.getElementById('input-tanggal').value = data.tanggal || '';
    if (document.getElementById('input-waktu')) document.getElementById('input-waktu').value = data.waktu || '';
    if (document.getElementById('input-ruangan')) document.getElementById('input-ruangan').value = data.ruangan || '';
    if (document.getElementById('input-pengawas')) document.getElementById('input-pengawas').value = data.pengawas || '';
    if (document.getElementById('input-catatan')) document.getElementById('input-catatan').value = data.catatan || '';
}

function recalculateBapuStats() {
    if (!bapuData || !bapuData.students) return;
    const students = bapuData.students;
    const hadirCount = students.filter(s => s.hadir === 'YA').length;
    const totalCount = students.length;
    const absentCount = totalCount - hadirCount;

    bapuData.total_peserta = totalCount;
    bapuData.jumlah_hadir = hadirCount;
    bapuData.jumlah_tidak_hadir = absentCount;

    if (document.getElementById('stat-total')) document.getElementById('stat-total').innerText = totalCount;
    if (document.getElementById('stat-hadir')) document.getElementById('stat-hadir').innerText = hadirCount;
    if (document.getElementById('stat-absent')) document.getElementById('stat-absent').innerText = absentCount;
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;
    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Tidak ada data peserta</td></tr>`;
        return;
    }
    tbody.innerHTML = students.map((s, idx) => `
        <tr>
            <td class="text-center fw-bold">${idx + 1}</td>
            <td><strong>${s.nama}</strong></td>
            <td><code>${s.npm || '-'}</code></td>
            <td>
                <button type="button" class="btn btn-sm ${s.hadir === 'YA' ? 'btn-primary' : 'btn-secondary'}" style="padding:2px 8px; font-size:11px;" onclick="toggleStudentHadir(${idx})">
                    ${s.hadir === 'YA' ? '🟢 HADIR' : '🔴 TIDAK HADIR'}
                </button>
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-secondary" style="color:#ef4444; padding:2px 8px;" onclick="deleteStudent(${idx})" title="Hapus Peserta Fiktif">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function toggleStudentHadir(index) {
    if (!bapuData || !bapuData.students || !bapuData.students[index]) return;
    const current = bapuData.students[index].hadir;
    bapuData.students[index].hadir = (current === 'YA') ? 'TIDAK' : 'YA';
    recalculateBapuStats();
    renderStudentsTable(bapuData.students);
    showToast(`Status presensi ${bapuData.students[index].nama} diubah ke: ${bapuData.students[index].hadir}`, 'info');
}

function deleteStudent(index) {
    if (!bapuData || !bapuData.students || !bapuData.students[index]) return;
    const name = bapuData.students[index].nama;
    if (confirm(`Hapus peserta "${name}" dari daftar presensi (peserta fiktif/batal)?`)) {
        bapuData.students.splice(index, 1);
        recalculateBapuStats();
        renderStudentsTable(bapuData.students);
        showToast(`Peserta "${name}" berhasil dihapus.`, 'info');
    }
}

function openAddStudentModal() {
    document.getElementById('add-student-nama').value = '';
    document.getElementById('add-student-npm').value = '';
    document.getElementById('add-student-hadir').value = 'YA';
    document.getElementById('modal-add-student').classList.remove('hidden');
}

function closeAddStudentModal() {
    document.getElementById('modal-add-student').classList.add('hidden');
}

function saveNewStudent() {
    const nama = document.getElementById('add-student-nama').value.trim().toUpperCase();
    const npm = document.getElementById('add-student-npm').value.trim();
    const hadir = document.getElementById('add-student-hadir').value;

    if (!nama) {
        alert('Nama peserta wajib diisi!');
        return;
    }

    if (!bapuData) {
        bapuData = { students: [], hari: '', tanggal: '', waktu: '', ruangan: '', pengawas: '', catatan: '' };
    }
    if (!bapuData.students) bapuData.students = [];

    bapuData.students.push({
        no: bapuData.students.length + 1,
        nama: nama,
        npm: npm,
        hadir: hadir
    });

    closeAddStudentModal();
    recalculateBapuStats();
    renderStudentsTable(bapuData.students);
    showToast(`Peserta "${nama}" berhasil ditambahkan!`, 'success');
}

function downloadDocument(docType) {
    if (!bapuData) return showToast('Silakan unggah Excel BAPU terlebih dahulu', 'error');
    showToast('Membuat dokumen .docx...', 'info');

    // Sync input parameters
    bapuData.hari = document.getElementById('input-hari')?.value || bapuData.hari;
    bapuData.tanggal = document.getElementById('input-tanggal')?.value || bapuData.tanggal;
    bapuData.waktu = document.getElementById('input-waktu')?.value || bapuData.waktu;
    bapuData.ruangan = document.getElementById('input-ruangan')?.value || bapuData.ruangan;
    bapuData.pengawas = document.getElementById('input-pengawas')?.value || bapuData.pengawas;
    bapuData.catatan = document.getElementById('input-catatan')?.value || bapuData.catatan;

    fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_type: docType, data: bapuData })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BAPU_${docType}_${bapuData.tanggal || 'ujian'}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Dokumen berhasil diunduh!', 'success');
    });
}

function loadCertHistoryData() {
    const tbody = document.getElementById('cert-history-tbody');
    if (!tbody) return;
    const query = document.getElementById('search-cert-input')?.value || '';
    const isAdmin = window.currentUserRole === 'admin';

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#94a3b8;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:18px;color:#0284c7;margin-right:8px;"></i> Memuat data...
    </td></tr>`;

    fetch(`/api/v1/certificates/history?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(json => {
        const badge = document.getElementById('cert-total-badge');

        if (!json.success || !json.data) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#ef4444;">Gagal memuat data.</td></tr>`;
            return;
        }

        const data = json.data;
        if (badge) badge.innerText = `Total: ${data.length} Sertifikat`;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">
                <i class="fa-solid fa-folder-open" style="font-size:24px;color:#cbd5e1;display:block;margin-bottom:8px;"></i>
                ${query ? `Tidak ada data untuk "<strong>${query}</strong>"` : 'Belum ada sertifikat diterbitkan.'}
            </td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const noSertif  = item.no_sertifikat || '-';
            const nama      = item.nama || '-';
            const tglTes    = item.tanggal_tes || '-';
            const lis       = item.listening   || '0';
            const str       = item.structure   || '0';
            const rea       = item.reading     || '0';
            const overall   = item.overall     || '0';
            const noEscJs   = noSertif.replace(/'/g, "\\'");
            const namaEscJs = nama.replace(/'/g, "\\'");

            const scoreColor = '#059669';
            const scoreBg    = '#ecfdf5';
            const scoreBdr   = '#a7f3d0';


            const deleteBtn = isAdmin ? `
                <button onclick="deleteCertificateRow(${item.id},'${namaEscJs}','${noEscJs}')"
                    style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;background:#fff0f0;color:#dc2626;border:1px solid #fca5a5;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;"
                    title="Hapus dari Database">
                    <i class="fa-solid fa-trash-can"></i> Hapus
                </button>` : '';

            return `<tr style="border-bottom:1px solid #f1f5f9;transition:background .15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                <td style="padding:12px 14px;">
                    <span style="font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:700;color:#0369a1;background:#e0f2fe;padding:3px 8px;border-radius:5px;border:1px solid #bae6fd;">
                        ${noSertif}
                    </span>
                </td>
                <td style="padding:12px 14px;font-weight:600;color:#1e293b;">${nama}</td>
                <td style="padding:12px 14px;color:#64748b;font-size:12.5px;">${tglTes}</td>
                <td style="padding:12px 14px;text-align:center;">
                    <div style="display:inline-flex;gap:5px;align-items:center;font-size:12px;font-weight:700;">
                        <span style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;padding:2px 8px;border-radius:5px;" title="Listening">L: ${lis}</span>
                        <span style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;padding:2px 8px;border-radius:5px;" title="Structure">S: ${str}</span>
                        <span style="background:#fdf4ff;color:#9333ea;border:1px solid #e9d5ff;padding:2px 8px;border-radius:5px;" title="Reading">R: ${rea}</span>
                    </div>
                </td>
                <td style="padding:12px 14px;text-align:center;">
                    <span style="background:${scoreBg};color:${scoreColor};border:1px solid ${scoreBdr};padding:3px 12px;border-radius:20px;font-weight:800;font-size:13px;">
                        ${overall}
                    </span>
                </td>
                <td style="padding:12px 14px;text-align:right;white-space:nowrap;">
                    <div style="display:inline-flex;gap:6px;align-items:center;">
                        <button onclick="printCertPolos('${noEscJs}')"
                            style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;background:#0284c7;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;">
                            <i class="fa-solid fa-print"></i> Cetak PDF
                        </button>
                        <button onclick="window.location.href='/api/v1/certificates/download/SERTIFIKAT_${noSertif.replace(/[/\\\\]/g,'_')}.docx'"
                            style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;background:#f8fafc;color:#2563eb;border:1px solid #bfdbfe;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;"
                            title="Unduh File Word">
                            <i class="fa-solid fa-file-word"></i> Word
                        </button>
                        ${deleteBtn}
                    </div>
                </td>
            </tr>`;
        }).join('');
    })
    .catch(err => {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#ef4444;">Error: ${err.message}</td></tr>`;
    });
}

function printCertPolos(noSertifikat) {
    if (!noSertifikat) return;
    showToast('🖨️ Menyiapkan Cetak PDF Polos...', 'info', `Memuat dokumen ${noSertifikat}...`);
    
    const printUrl = `/api/v1/certificates/stream-pdf-polos?no_sertifikat=${encodeURIComponent(noSertifikat)}`;
    
    // Open in hidden iframe for instant print dialog without taking disk space on web
    let printIframe = document.getElementById('print-pdf-iframe');
    if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'print-pdf-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);
    }
    
    printIframe.src = printUrl;
    printIframe.onload = function() {
        try {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
        } catch (e) {
            window.open(printUrl, '_blank');
        }
    };
}

function saveDirWaSettings() {
    const outputDir = document.getElementById('setting-output-dir')?.value.trim() || '';
    const waNumber = document.getElementById('setting-wa-number')?.value.trim() || '';

    localStorage.setItem('telp_output_dir', outputDir);
    localStorage.setItem('telp_wa_number', waNumber);

    fetch('/api/v1/directory/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            output_dir: outputDir,
            wa_number: waNumber
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('✅ Pengaturan Directory Berhasil Disimpan!', 'success');
        } else {
            showToast('Pengaturan lokal tersimpan.', 'info');
        }
    })
    .catch(() => {
        showToast('Pengaturan lokal tersimpan.', 'info');
    });
}

function loadDirWaSettings() {
    const elDir = document.getElementById('setting-output-dir');
    const elWa = document.getElementById('setting-wa-number');

    if (elDir && localStorage.getItem('telp_output_dir')) elDir.value = localStorage.getItem('telp_output_dir');
    if (elWa && localStorage.getItem('telp_wa_number')) elWa.value = localStorage.getItem('telp_wa_number');

    fetch('/api/v1/directory/settings')
    .then(res => res.json())
    .then(res => {
        if (res.success && res.data) {
            if (elDir && res.data.output_dir) elDir.value = res.data.output_dir;
            if (elWa && res.data.wa_number) elWa.value = res.data.wa_number;
        }
    })
    .catch(() => {});
}

let toastTimer = null;

function showLoadingToast(title, subtitle = 'Sedang memproses...') {
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.className = 'toast toast-loading';
    toast.innerHTML = `
        <i class="fa-solid fa-circle-notch fa-spin toast-spinner"></i>
        <div class="toast-body">
            <div class="toast-title" id="toast-title">${title}</div>
            <div class="toast-subtitle" id="toast-subtitle">${subtitle}</div>
        </div>
    `;
    toast.classList.remove('hidden');
}

function updateLoadingToast(title, subtitle) {
    const titleEl = document.getElementById('toast-title');
    const subEl = document.getElementById('toast-subtitle');
    if (titleEl && title) titleEl.innerText = title;
    if (subEl && subtitle) subEl.innerText = subtitle;
}

function hideLoadingToast() {
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    const toast = document.getElementById('toast');
    if (toast) toast.classList.add('hidden');
}

function showToast(title, type = 'info', subtitle = '') {
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
    const toast = document.getElementById('toast');
    if (!toast) return;

    const iconMap = {
        'success': '<i class="fa-solid fa-circle-check" style="color:#10b981; font-size:18px;"></i>',
        'error': '<i class="fa-solid fa-circle-xmark" style="color:#ef4444; font-size:18px;"></i>',
        'warning': '<i class="fa-solid fa-triangle-exclamation" style="color:#f59e0b; font-size:18px;"></i>',
        'info': '<i class="fa-solid fa-circle-info" style="color:#38bdf8; font-size:18px;"></i>'
    };

    const iconHtml = iconMap[type] || iconMap['info'];
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        ${iconHtml}
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            ${subtitle ? `<div class="toast-subtitle">${subtitle}</div>` : ''}
        </div>
    `;
    toast.classList.remove('hidden');

    const duration = type === 'error' ? 5500 : 4500;
    toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

function setupSearchInput() {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!bapuData || !bapuData.students) return;
        const filtered = bapuData.students.filter(s => 
            (s.nama && s.nama.toLowerCase().includes(query)) ||
            (s.npm && s.npm.toLowerCase().includes(query))
        );
        renderStudentsTable(filtered);
    });
}

// -------------------------------------------------------------
// ADMIN HEALTH & ALL API CONNECTION DIAGNOSTICS
// -------------------------------------------------------------
function logHealthTerminal(msg, color = '#4ade80') {
    const term = document.getElementById('health-log-terminal');
    if (!term) return;
    const time = new Date().toLocaleTimeString('id-ID');
    const span = `<span style="color:${color};">[${time}] ${msg}</span>\n`;
    term.innerHTML += span;
    term.scrollTop = term.scrollHeight;
}

function loadAdminHealthCheck(showToastBool = false) {
    if (showToastBool) showToast('Memeriksa seluruh koneksi API & Microservices...', 'info');

    const btnRefresh = document.getElementById('btn-refresh-all-health');
    if (showToastBool && btnRefresh) {
        btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Memeriksa...</span>';
        btnRefresh.disabled = true;
    }

    if (showToastBool) {
        logHealthTerminal('Mengirim permintaan diagnostik instan ke /admin/health...', '#38bdf8');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch('/admin/health', { signal: controller.signal })
    .then(res => res.json())
    .then(json => {
        clearTimeout(timeoutId);
        if (json.success) {
            const s = json.services;
            const overallBadge = document.getElementById('overall-status-badge');
            const lastChecked = document.getElementById('health-last-checked');

            if (lastChecked) lastChecked.innerText = `Diperiksa: ${json.timestamp} (${json.total_check_time_ms}ms)`;

            if (json.overall_status === 'healthy') {
                if (overallBadge) {
                    overallBadge.style.background = '#10b981';
                    overallBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> SEMUA SISTEM & API ONLINE';
                }
            } else {
                if (overallBadge) {
                    overallBadge.style.background = '#f59e0b';
                    overallBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> PERINGATAN KONEKSI TERDETEKSI';
                }
            }

            // 1. Flask
            const statFlaskLatency = document.getElementById('stat-flask-latency');
            const flaskPill = document.getElementById('flask-status-pill');
            const flaskDesc = document.getElementById('flask-status-desc');
            const flaskDetailLatency = document.getElementById('flask-detail-latency');

            if (statFlaskLatency) statFlaskLatency.innerText = `${s.flask.latency_ms} ms`;
            if (flaskDetailLatency) flaskDetailLatency.innerText = `${s.flask.latency_ms} ms`;
            if (flaskDesc) flaskDesc.innerText = s.flask.message;
            if (flaskPill) {
                if (s.flask.status === 'online') {
                    flaskPill.style.background = '#dcfce7'; flaskPill.style.color = '#166534';
                    flaskPill.innerHTML = '<i class="fa-solid fa-circle-check"></i> Online';
                } else {
                    flaskPill.style.background = '#fee2e2'; flaskPill.style.color = '#991b1b';
                    flaskPill.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Offline';
                }
            }

            // 2. Database
            const statDbLatency = document.getElementById('stat-db-latency');
            const dbPill = document.getElementById('db-status-pill');
            const dbDesc = document.getElementById('db-status-desc');

            if (statDbLatency) statDbLatency.innerText = `${s.database.latency_ms} ms`;
            if (dbDesc) dbDesc.innerText = s.database.message;
            if (dbPill) {
                if (s.database.status === 'online') {
                    dbPill.style.background = '#dcfce7'; dbPill.style.color = '#166534';
                    dbPill.innerHTML = '<i class="fa-solid fa-circle-check"></i> Online';
                } else {
                    dbPill.style.background = '#fee2e2'; dbPill.style.color = '#991b1b';
                    dbPill.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Offline';
                }
            }

            if (s.database.counts) {
                const statTotalCerts = document.getElementById('stat-total-certs');
                const countUsers = document.getElementById('db-count-users');
                const countCerts = document.getElementById('db-count-certs');
                const countLaporan = document.getElementById('db-count-laporan');
                const countBapu = document.getElementById('db-count-bapu');

                if (statTotalCerts) statTotalCerts.innerText = s.database.counts.certificates || '0';
                if (countUsers) countUsers.innerText = s.database.counts.users || '0';
                if (countCerts) countCerts.innerText = s.database.counts.certificates || '0';
                if (countLaporan) countLaporan.innerText = s.database.counts.laporan_harian || '0';
                if (countBapu) countBapu.innerText = s.database.counts.bapu_history || '0';
            }

            // 3. Google Drive
            const gdrivePill = document.getElementById('gdrive-status-pill');
            const gdriveDesc = document.getElementById('gdrive-status-desc');
            if (gdriveDesc) gdriveDesc.innerText = s.google_drive.message;
            if (gdrivePill) {
                if (s.google_drive.status === 'online' || s.google_drive.status === 'ready') {
                    gdrivePill.style.background = '#fef9c3'; gdrivePill.style.color = '#854d0e';
                    gdrivePill.innerHTML = '<i class="fa-solid fa-circle-check"></i> Terhubung';
                } else {
                    gdrivePill.style.background = '#fee2e2'; gdrivePill.style.color = '#991b1b';
                    gdrivePill.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Perlu Setting';
                }
            }

            // 4. Storage & Symlink
            const storagePill = document.getElementById('storage-status-pill');
            const storageDesc = document.getElementById('storage-status-desc');
            const storageSymlink = document.getElementById('storage-symlink-detail');
            const storageCount = document.getElementById('storage-count-detail');

            if (storageDesc) storageDesc.innerText = s.storage.message;
            if (storageSymlink) {
                storageSymlink.innerHTML = s.storage.symlink_exists 
                    ? '<i class="fa-solid fa-link" style="color:#10b981;"></i> Terhubung Valid' 
                    : '<i class="fa-solid fa-link-slash" style="color:#ef4444;"></i> Symlink Putus';
            }
            if (storageCount) storageCount.innerText = `${s.storage.photo_count} Foto (${s.storage.total_size_mb} MB)`;
            if (storagePill) {
                if (s.storage.status === 'online') {
                    storagePill.style.background = '#dcfce7'; storagePill.style.color = '#166534';
                    storagePill.innerHTML = '<i class="fa-solid fa-circle-check"></i> Valid (Read/Write)';
                } else {
                    storagePill.style.background = '#fee2e2'; storagePill.style.color = '#991b1b';
                    storagePill.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Perlu Link';
                }
            }

            // 5. FCM
            const statFcmDevices = document.getElementById('stat-fcm-devices');
            const fcmCountDetail = document.getElementById('fcm-count-detail');
            if (statFcmDevices) statFcmDevices.innerText = `${s.fcm.registered_devices} Device`;
            if (fcmCountDetail) fcmCountDetail.innerText = `${s.fcm.registered_devices} Device Mobile Terhubung`;

            // Terminal Logs
            if (showToastBool) {
                logHealthTerminal(`✓ Flask Engine (Port 5000): ${s.flask.status.toUpperCase()} (${s.flask.latency_ms}ms)`, s.flask.status === 'online' ? '#4ade80' : '#ef4444');
                logHealthTerminal(`✓ MySQL Database: ${s.database.status.toUpperCase()} (${s.database.latency_ms}ms) | Total Sertifikat: ${s.database.counts?.certificates}`, '#4ade80');
                logHealthTerminal(`✓ Public Storage Symlink: ${s.storage.symlink_exists ? 'VALID' : 'MISSING'} | Photos: ${s.storage.photo_count} (${s.storage.total_size_mb} MB)`, s.storage.symlink_exists ? '#4ade80' : '#facc15');
                logHealthTerminal(`✓ Google Drive Cloud: ${s.google_drive.status.toUpperCase()} | ${s.google_drive.message}`, '#38bdf8');
                logHealthTerminal(`✓ Firebase FCM: Ready (${s.fcm.registered_devices} registered mobile devices)`, '#c084fc');
                logHealthTerminal(`[Selesai] Total waktu pemeriksaan: ${json.total_check_time_ms}ms. Server OS: ${json.server_info?.server_os}, PHP: ${json.server_info?.php_version}`, '#94a3b8');
                showToast('Diagnostik API & Sistem selesai!', 'success', `Total waktu: ${json.total_check_time_ms}ms`);
            }
        }
    })
    .catch(err => {
        clearTimeout(timeoutId);
        logHealthTerminal(`[ERROR] Gagal memuat diagnostik: ${err.message}`, '#ef4444');
        if (showToastBool) showToast('Gagal memuat status kesehatan sistem', 'error', err.message);
    })
    .finally(() => {
        if (btnRefresh) {
            btnRefresh.innerHTML = '<i class="fa-solid fa-rotate"></i> <span>⚡ Test Manual</span>';
            btnRefresh.disabled = false;
        }
    });
}

function testSingleHealthService(serviceName) {
    showToast(`Memeriksa koneksi ${serviceName}...`, 'info');
    logHealthTerminal(`Menguji koneksi layanan [${serviceName}]...`, '#38bdf8');

    fetch('/admin/health/ping', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getLaporanCsrfToken()
        },
        body: JSON.stringify({ service: serviceName })
    })
    .then(res => res.json())
    .then(json => {
        if (json.success) {
            logHealthTerminal(`✓ [${json.service}] ${json.message} (Status: ${json.status.toUpperCase()})`, '#4ade80');
            showToast(`${json.service} Online!`, 'success', json.message);
        } else {
            logHealthTerminal(`✗ [${json.service || serviceName}] Gagal: ${json.message}`, '#ef4444');
            showToast(`Gagal koneksi ${json.service || serviceName}`, 'error', json.message);
        }
    })
    .catch(err => {
        logHealthTerminal(`[ERROR] Ping ${serviceName}: ${err.message}`, '#ef4444');
        showToast(`Error ping ${serviceName}`, 'error', err.message);
    });
}

// -------------------------------------------------------------
// REAL-TIME AUTO POLLING MANAGEMENT (DEFAULT 8 SECONDS)
// -------------------------------------------------------------
let healthPollInterval = null;
let isHealthAutoPollActive = true;

function toggleHealthAutoPoll() {
    isHealthAutoPollActive = !isHealthAutoPollActive;
    const btn = document.getElementById('btn-toggle-auto-poll');
    if (isHealthAutoPollActive) {
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-satellite-dish fa-beat" style="--fa-animation-duration: 2s; color: #4ade80;"></i> <span>Live Auto: ON (15s)</span>';
            btn.style.borderColor = '#10b981';
            btn.style.background = 'rgba(16, 185, 129, 0.15)';
        }
        startHealthPolling();
        showToast('Real-time Auto Refresh Aktif', 'info', 'Status diperbarui otomatis setiap 15 detik');
    } else {
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-pause" style="color: #94a3b8;"></i> <span>Live Auto: OFF</span>';
            btn.style.borderColor = 'rgba(255,255,255,0.2)';
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
        }
        stopHealthPolling();
        showToast('Real-time Auto Refresh Dimatikan', 'warning', 'Pembaruan hanya lewat tombol Test Manual');
    }
}

function startHealthPolling() {
    stopHealthPolling();
    if (isHealthAutoPollActive) {
        healthPollInterval = setInterval(() => {
            if (activeSubMenu === 'admin-health') {
                loadAdminHealthCheck(false);
            }
        }, 15000);
    }
}

function stopHealthPolling() {
    if (healthPollInterval) {
        clearInterval(healthPollInterval);
        healthPollInterval = null;
    }
}


