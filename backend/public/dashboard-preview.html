<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Overview - Sistem Verifikasi Soal</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --sidebar-bg: #801720;
            --sidebar-hover: rgba(255, 255, 255, 0.12);
            --sidebar-active: rgba(255, 255, 255, 0.2);
            --bg-body: #F0F3F8;
            --card-bg: #FFFFFF;
            --text-dark: #1E293B;
            --text-muted: #64748B;
            --text-light: #94A3B8;
            --border-color: #E2E8F0;

            --color-orange: #F97316;
            --color-yellow: #EAB308;
            --color-green: #10B981;
            --color-red: #EF4444;
            --color-blue: #3B82F6;
            --color-purple: #A855F7;
        }

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-body);
            color: var(--text-dark);
            display: flex;
            min-height: 100vh;
            font-size: 13px;
            -webkit-font-smoothing: antialiased;
        }

        /* ─── SIDEBAR ─────────────────────────────── */
        .sidebar {
            width: 240px;
            background-color: var(--sidebar-bg);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 100;
            overflow-y: auto;
            color: white;
        }

        .sidebar-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 24px 20px 20px;
        }

        .brand-icon {
            width: 38px;
            height: 38px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .brand-icon svg {
            width: 20px;
            height: 20px;
            fill: white;
        }

        .brand-title {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.2;
            color: white;
        }

        .sidebar-menu {
            flex: 1;
            padding: 10px 12px;
        }

        .menu-category {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: rgba(255, 255, 255, 0.45);
            text-transform: uppercase;
            padding: 16px 12px 6px;
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.15s ease;
            margin-bottom: 2px;
        }

        .menu-item:hover {
            background-color: var(--sidebar-hover);
            color: white;
        }

        .menu-item.active {
            background-color: var(--sidebar-active);
            color: white;
            font-weight: 700;
        }

        .menu-item svg {
            width: 18px;
            height: 18px;
            opacity: 0.85;
            flex-shrink: 0;
        }

        .menu-item.active svg {
            opacity: 1;
        }

        .sidebar-footer {
            padding: 14px;
            margin: 12px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 14px;
        }

        .user-card {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .user-avatar {
            width: 36px;
            height: 36px;
            background: #E57373;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 13px;
            color: white;
            flex-shrink: 0;
        }

        .user-details {
            flex: 1;
            min-width: 0;
        }

        .user-name {
            font-size: 12px;
            font-weight: 700;
            color: white;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-email {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.6);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-settings-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .user-settings-btn:hover {
            color: white;
        }

        .period-pill {
            margin-top: 10px;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 20px;
            padding: 4px 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.85);
            font-weight: 600;
        }

        .dot-online {
            width: 6px;
            height: 6px;
            background-color: #22C55E;
            border-radius: 50%;
        }

        /* ─── MAIN CONTENT ───────────────────────── */
        .main-wrapper {
            margin-left: 240px;
            flex: 1;
            padding: 28px 36px;
            min-height: 100vh;
        }

        /* HEADER SECTION */
        .header-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .header-title-area h1 {
            font-size: 22px;
            font-weight: 800;
            color: var(--text-dark);
            letter-spacing: -0.02em;
        }

        .header-title-area p {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .icon-btn-notif {
            position: relative;
            width: 38px;
            height: 38px;
            background: white;
            border: 1px solid var(--border-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .icon-btn-notif svg {
            width: 18px;
            height: 18px;
            color: var(--text-dark);
        }

        .notif-badge-count {
            position: absolute;
            top: -2px;
            right: -2px;
            background: var(--color-red);
            color: white;
            font-size: 10px;
            font-weight: 700;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
        }

        .btn-generate-report {
            background: #1E293B;
            color: white;
            border: none;
            padding: 9px 18px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            transition: background 0.15s;
        }

        .btn-generate-report:hover {
            background: #0F172A;
        }

        /* QUICK ACTION BUTTONS ROW */
        .quick-action-buttons {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 24px;
        }

        .qa-btn {
            background: white;
            border: 1px solid var(--border-color);
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            text-decoration: none;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            transition: all 0.15s;
        }

        .qa-btn:hover {
            border-color: #CBD5E1;
            background: #F8FAFC;
        }

        .qa-btn svg {
            width: 15px;
            height: 15px;
            color: #64748B;
        }

        /* ─── ROW 1: TOP STATS CARDS (6 Cards) ────── */
        .top-stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 16px;
            margin-bottom: 16px;
        }

        .stat-box {
            background: white;
            border-radius: 16px;
            padding: 18px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            border: 1px solid rgba(226, 232, 240, 0.7);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 130px;
        }

        .stat-box-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .stat-icon-wrapper {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .stat-icon-wrapper svg {
            width: 20px;
            height: 20px;
        }

        .pill-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .pill-green { background: #DCFCE7; color: #15803D; }
        .pill-gray { background: #F1F5F9; color: #64748B; }
        .pill-pink { background: #FEE2E2; color: #DC2626; font-size: 10px; }

        .stat-number {
            font-size: 26px;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 1.1;
            margin-bottom: 4px;
        }

        .stat-title {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 500;
        }

        .stat-extra {
            font-size: 11px;
            font-weight: 700;
            margin-top: 6px;
        }

        /* ─── ROW 2: STATUS CARDS (4 Cards) ────────── */
        .status-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }

        .status-box {
            background: white;
            border-radius: 16px;
            padding: 16px 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            border: 1px solid rgba(226, 232, 240, 0.7);
            position: relative;
            overflow: hidden;
        }

        .status-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .status-name {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .status-val {
            font-size: 30px;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 1;
            margin-bottom: 4px;
        }

        .status-pct-text {
            font-size: 12px;
            font-weight: 700;
        }

        .sparkline-graphic {
            position: absolute;
            right: 12px;
            bottom: 12px;
            width: 80px;
            height: 36px;
            opacity: 0.4;
        }

        /* ─── MAIN CONTENT GRID (2 Columns) ────────── */
        .content-layout-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 20px;
        }

        .card-panel {
            background: white;
            border-radius: 16px;
            padding: 22px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            border: 1px solid rgba(226, 232, 240, 0.7);
            margin-bottom: 20px;
        }

        .card-panel:last-child {
            margin-bottom: 0;
        }

        .panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .panel-title {
            font-size: 15px;
            font-weight: 800;
            color: var(--text-dark);
        }

        .panel-subtitle {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .select-pill {
            background: #F8FAFC;
            border: 1px solid var(--border-color);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-dark);
            cursor: pointer;
        }

        .chart-legend-custom {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }

        .legend-chip {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
        }

        .chip-square {
            width: 12px;
            height: 12px;
            border-radius: 3px;
        }

        /* Perhatian LIST */
        .attention-item-box {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 12px;
            background: #FAFAFA;
            margin-bottom: 10px;
        }

        .attention-item-box:last-child {
            margin-bottom: 0;
        }

        .item-icon-sq {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .item-content {
            flex: 1;
            min-width: 0;
        }

        .item-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .item-name {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-dark);
        }

        .item-count-badge {
            font-size: 12px;
            font-weight: 800;
        }

        .item-subtext {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .footer-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #DC2626;
            font-size: 12px;
            font-weight: 700;
            text-decoration: none;
            margin-top: 14px;
        }

        .footer-link:hover {
            text-decoration: underline;
        }

        /* AKTIVITAS TERKINI TIMELINE */
        .timeline-container {
            position: relative;
            padding-left: 20px;
        }

        .timeline-line {
            position: absolute;
            left: 5px;
            top: 10px;
            bottom: 10px;
            width: 2px;
            background: #E2E8F0;
        }

        .timeline-item {
            position: relative;
            margin-bottom: 16px;
        }

        .timeline-item:last-child {
            margin-bottom: 0;
        }

        .timeline-dot {
            position: absolute;
            left: -20px;
            top: 12px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10B981;
            border: 2px solid white;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .timeline-card-box {
            background: #F8FAFC;
            border: 1px solid #F1F5F9;
            border-radius: 12px;
            padding: 12px 14px;
        }

        .timeline-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .timeline-title-text {
            font-size: 12px;
            font-weight: 700;
            color: var(--text-dark);
        }

        .timeline-time-text {
            font-size: 10px;
            color: var(--text-light);
            font-weight: 600;
        }

        .timeline-file-text {
            font-size: 11px;
            color: var(--text-muted);
        }

        /* RESPONSIVE */
        @media (max-width: 1200px) {
            .top-stats-grid { grid-template-columns: repeat(3, 1fr); }
            .content-layout-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
            .sidebar { width: 70px; }
            .brand-title, .menu-category, .menu-item span, .sidebar-footer { display: none; }
            .main-wrapper { margin-left: 70px; padding: 16px; }
            .top-stats-grid { grid-template-columns: repeat(2, 1fr); }
            .status-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>

<!-- ─── SIDEBAR (DARK RED MAROON) ───────────────────── -->
<aside class="sidebar">
    <div class="sidebar-brand">
        <div class="brand-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm-1 14l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z"/>
            </svg>
        </div>
        <div class="brand-title">Sistem<br>Verifikasi Soal</div>
    </div>

    <div class="sidebar-menu">
        <a href="#" class="menu-item active">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span>Dashboard</span>
        </a>

        <div class="menu-category">Master Data</div>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Dosen</span>
        </a>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span>Mata Kuliah</span>
        </a>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <span>PLO</span>
        </a>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>CLO</span>
        </a>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <span>Kategori Soal</span>
        </a>

        <div class="menu-category">Periode</div>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Tahun Ajaran</span>
        </a>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Periode Verifikasi</span>
        </a>

        <div class="menu-category">Penugasan</div>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            <span>Koordinator MK</span>
        </a>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Dosen Verifikator</span>
        </a>

        <div class="menu-category">Monitoring</div>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span>Status Verifikasi</span>
        </a>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>Riwayat Aktivitas</span>
        </a>

        <div class="menu-category">Laporan</div>
        <a href="#" class="menu-item">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Berita Acara</span>
        </a>
    </div>

    <!-- USER FOOTER CARD -->
    <div class="sidebar-footer">
        <div class="user-card">
            <div class="user-avatar">SA</div>
            <div class="user-details">
                <div class="user-name">Super Admin</div>
                <div class="user-email">superadmin@univ.ac.id</div>
            </div>
            <button class="user-settings-btn">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:16px;height:16px"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
        </div>
        <div class="period-pill">
            <div class="dot-online"></div>
            <span>Periode: 2026/2027 Ganjil</span>
        </div>
    </div>
</aside>

<!-- ─── MAIN CONTENT ────────────────────────────────── -->
<main class="main-wrapper">

    <!-- HEADER TOP -->
    <div class="header-top">
        <div class="header-title-area">
            <h1>Dashboard Overview</h1>
            <p>Pantau statistik dan aktivitas verifikasi soal secara real-time.</p>
        </div>
        <div class="header-actions">
            <button class="icon-btn-notif">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span class="notif-badge-count">3</span>
            </button>
            <button class="btn-generate-report">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Generate Laporan
            </button>
        </div>
    </div>

    <!-- QUICK ACTIONS BUTTONS -->
    <div class="quick-action-buttons">
        <a href="#" class="qa-btn">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Tambah Dosen
        </a>
        <a href="#" class="qa-btn">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Import Data
        </a>
        <a href="#" class="qa-btn">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
            Tetapkan Penugasan
        </a>
        <a href="#" class="qa-btn">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Pengaturan Periode
        </a>
    </div>

    <!-- ROW 1: 6 STAT CARDS -->
    <div class="top-stats-grid">

        <!-- Card 1: Total Dosen -->
        <div class="stat-box">
            <div class="stat-box-top">
                <div class="stat-icon-wrapper" style="background:#EFF6FF">
                    <svg fill="none" stroke="#3B82F6" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
                </div>
                <span class="pill-badge pill-green">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:11px;height:11px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    12%
                </span>
            </div>
            <div>
                <div class="stat-number">128</div>
                <div class="stat-title">Total Dosen</div>
                <div class="stat-extra" style="color:#2563EB">Aktif <span style="font-weight:800">115</span></div>
            </div>
        </div>

        <!-- Card 2: Total Mata Kuliah -->
        <div class="stat-box">
            <div class="stat-box-top">
                <div class="stat-icon-wrapper" style="background:#F3E8FF">
                    <svg fill="none" stroke="#A855F7" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <span class="pill-badge pill-gray">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:11px;height:11px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    0%
                </span>
            </div>
            <div>
                <div class="stat-number">86</div>
                <div class="stat-title">Total Mata Kuliah</div>
                <div class="stat-extra" style="color:#9333EA">Aktif <span style="font-weight:800">80</span></div>
            </div>
        </div>

        <!-- Card 3: Total PLO -->
        <div class="stat-box">
            <div class="stat-box-top">
                <div class="stat-icon-wrapper" style="background:#E0F2FE">
                    <svg fill="none" stroke="#0284C7" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                </div>
            </div>
            <div>
                <div class="stat-number">24</div>
                <div class="stat-title">Total PLO</div>
                <div class="stat-extra" style="color:#0284C7">Program Outcome</div>
            </div>
        </div>

        <!-- Card 4: Total CLO -->
        <div class="stat-box">
            <div class="stat-box-top">
                <div class="stat-icon-wrapper" style="background:#F0FDF4">
                    <svg fill="none" stroke="#16A34A" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
            </div>
            <div>
                <div class="stat-number">126</div>
                <div class="stat-title">Total CLO</div>
                <div class="stat-extra" style="color:#16A34A">Course Outcome</div>
            </div>
        </div>

        <!-- Card 5: Total Bank Soal -->
        <div class="stat-box">
            <div class="stat-box-top">
                <div class="stat-icon-wrapper" style="background:#FEE2E2">
                    <svg fill="none" stroke="#EF4444" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span class="pill-badge pill-green">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:11px;height:11px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    24%
                </span>
            </div>
            <div>
                <div class="stat-number">1.245</div>
                <div class="stat-title">Total Bank Soal</div>
                <div class="stat-extra" style="color:#DC2626">Terverifikasi 672</div>
            </div>
        </div>

        <!-- Card 6: Progress Verifikasi -->
        <div class="stat-box">
            <div class="stat-box-top">
                <span style="font-size:11px;font-weight:700;color:var(--text-dark)">Progress Verifikasi</span>
                <span class="pill-badge pill-pink">Periode Aktif</span>
            </div>
            <div>
                <div style="display:flex;align-items:baseline;gap:6px;margin-top:4px">
                    <span style="font-size:26px;font-weight:800;color:var(--text-dark)">54%</span>
                    <span style="font-size:12px;color:var(--text-muted);font-weight:600">Selesai</span>
                </div>
                <!-- Progress bar -->
                <div style="background:#E2E8F0;border-radius:10px;height:8px;margin-top:8px;overflow:hidden">
                    <div style="width:54%;background:#801720;height:100%;border-radius:10px"></div>
                </div>
            </div>
        </div>

    </div>

    <!-- ROW 2: 4 STATUS CARDS -->
    <div class="status-grid">

        <!-- MENUNGGU -->
        <div class="status-box">
            <div class="status-header">
                <div class="status-dot" style="background:#F97316"></div>
                <span class="status-name" style="color:#F97316">MENUNGGU</span>
            </div>
            <div class="status-val">312</div>
        </div>

        <!-- REVISI -->
        <div class="status-box">
            <div class="status-header">
                <div class="status-dot" style="background:#EAB308"></div>
                <span class="status-name" style="color:#CA8A04">REVISI</span>
            </div>
            <div class="status-val">189</div>
        </div>

        <!-- DISETUJUI -->
        <div class="status-box">
            <div class="status-header">
                <div class="status-dot" style="background:#10B981"></div>
                <span class="status-name" style="color:#10B981">DISETUJUI</span>
            </div>
            <div class="status-val">672</div>
        </div>

        <!-- DITOLAK -->
        <div class="status-box">
            <div class="status-header">
                <div class="status-dot" style="background:#EF4444"></div>
                <span class="status-name" style="color:#EF4444">DITOLAK</span>
            </div>
            <div class="status-val">72</div>
        </div>

    </div>

    <!-- MAIN CONTENT LAYOUT (2 Columns) -->
    <div class="content-layout-grid">

        <!-- LEFT COLUMN: TREN VERIFIKASI CHART -->
        <div>
            <div class="card-panel">
                <div class="panel-header">
                    <div>
                        <div class="panel-title">Tren Verifikasi Soal</div>
                        <div class="panel-subtitle">Berdasarkan status dalam 30 hari terakhir</div>
                    </div>
                    <button class="select-pill">30 Hari Terakhir</button>
                </div>

                <div class="chart-legend-custom">
                    <div class="legend-chip">
                        <div class="chip-square" style="background:#F97316"></div>
                        <span>Menunggu</span>
                    </div>
                    <div class="legend-chip">
                        <div class="chip-square" style="background:#10B981"></div>
                        <span>Disetujui</span>
                    </div>
                </div>

                <!-- Bar Chart Canvas -->
                <div style="position:relative;height:260px">
                    <canvas id="barTrendChart"></canvas>
                </div>
            </div>
        </div>

        <!-- RIGHT COLUMN: Perhatian & AKTIVITAS TERKINI -->
        <div>

            <!-- Perhatian CARD -->
            <div class="card-panel">
                <div class="panel-header" style="margin-bottom:12px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <svg fill="none" stroke="#DC2626" stroke-width="2" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span class="panel-title">Perhatian</span>
                    </div>
                    <span class="pill-badge pill-pink">4 Tugas</span>
                </div>

                <!-- Item 1 -->
                <div class="attention-item-box">
                    <div class="item-icon-sq" style="background:#FFEDD5">
                        <svg fill="none" stroke="#EA580C" stroke-width="2" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div class="item-content">
                        <div class="item-title-row">
                            <span class="item-name">Sistem Informasi (UTS)</span>
                            <span class="item-count-badge" style="color:#EA580C">24</span>
                        </div>
                        <div class="item-subtext">Menunggu Verifikasi Koordinator</div>
                    </div>
                </div>

                <!-- Item 2 -->
                <div class="attention-item-box">
                    <div class="item-icon-sq" style="background:#FEF3C7">
                        <svg fill="none" stroke="#D97706" stroke-width="2" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div class="item-content">
                        <div class="item-title-row">
                            <span class="item-name">Pemrograman Web</span>
                            <span class="item-count-badge" style="color:#D97706">12</span>
                        </div>
                        <div class="item-subtext">Perlu Revisi Dosen Pembuat</div>
                    </div>
                </div>

                <!-- Item 3 -->
                <div class="attention-item-box">
                    <div class="item-icon-sq" style="background:#FFEDD5">
                        <svg fill="none" stroke="#EA580C" stroke-width="2" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div class="item-content">
                        <div class="item-title-row">
                            <span class="item-name">Basis Data (UAS)</span>
                            <span class="item-count-badge" style="color:#EA580C">18</span>
                        </div>
                        <div class="item-subtext">Menunggu Verifikasi Dosen</div>
                    </div>
                </div>

                <a href="#" class="footer-link">
                    <span>Lihat Semua Tugas</span>
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:14px;height:14px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
            </div>

            <!-- AKTIVITAS TERKINI CARD -->
            <div class="card-panel">
                <div class="panel-header" style="margin-bottom:14px">
                    <span class="panel-title">Aktivitas Terkini</span>
                </div>

                <div class="timeline-container">
                    <div class="timeline-line"></div>

                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-card-box">
                            <div class="timeline-header-row">
                                <span class="timeline-title-text">Import PLO berhasil</span>
                                <span class="timeline-time-text">2m</span>
                            </div>
                            <div class="timeline-file-text">plo_2026_06_17.xlsx • Super Admin</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    </div>

</main>

<script>
// CHART JS - Grouped Bar Chart matching Image 2
const ctx = document.getElementById('barTrendChart').getContext('2d');

new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['20 Mei', '27 Mei', '3 Jun', '10 Jun', '17 Jun'],
        datasets: [
            {
                label: 'Menunggu',
                data: [220, 185, 150, 180, 160],
                backgroundColor: '#F97316',
                borderRadius: 4,
                barPercentage: 0.35,
                categoryPercentage: 0.5,
            },
            {
                label: 'Disetujui',
                data: [60, 75, 110, 90, 90],
                backgroundColor: '#10B981',
                borderRadius: 4,
                barPercentage: 0.35,
                categoryPercentage: 0.5,
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1E293B',
                padding: 10,
                titleFont: { size: 12, weight: 'bold' },
                bodyFont: { size: 11 },
                cornerRadius: 6,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#64748B', font: { size: 11, family: 'Plus Jakarta Sans' } }
            },
            y: {
                min: 0,
                max: 400,
                ticks: { stepSize: 100, color: '#94A3B8', font: { size: 11, family: 'Plus Jakarta Sans' } },
                grid: { color: '#F1F5F9' }
            }
        }
    }
});
</script>

</body>
</html>
