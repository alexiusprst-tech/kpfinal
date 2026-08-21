<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Masuk - Sistem Verifikasi Soal Ujian Telkom University</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['src/css/app.css'])
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        /* Bright & Translucent Glassmorphism */
        .glass-card {
            background: rgba(255, 255, 255, 0.22);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.35);
            box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
        }
        .glass-card:hover {
            background: rgba(255, 255, 255, 0.32);
            border-color: rgba(255, 255, 255, 0.5);
        }
        .text-drop-shadow {
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }
    </style>
</head>
<body class="h-full bg-slate-100 flex flex-col lg:flex-row antialiased selection:bg-[#DD586F] selection:text-white">

    <!-- SISI KIRI: HERO / BANNER SECTION (Cerah & Vibrant) -->
    <div class="relative w-full lg:w-3/5 xl:w-[62%] min-h-[460px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">

        <!-- Background Image & Subtle Bright Overlay -->
        <div class="absolute inset-0 z-0">
            <img src="{{ asset('images/gedung-telkom.jpg') }}" alt="Gedung Telkom University" class="w-full h-full object-cover object-center opacity-100">
            <!-- Subtle gradient overlay so building colors stay bright and vibrant -->
            <div class="absolute inset-0 bg-gradient-to-b from-black/25 via-black/5 to-black/30"></div>
        </div>

        <!-- Content Top Layer -->
        <div class="relative z-10 my-auto py-6 max-w-xl">
            <!-- Icon Badge Top -->
            <div class="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-white mb-6 shadow-xl shadow-black/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
                </svg>
            </div>

            <!-- Title & Subtitle -->
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-3 text-drop-shadow">
                Sistem Verifikasi<br>Soal Ujian
            </h1>
            <p class="text-white/95 text-sm sm:text-base leading-relaxed mb-8 font-normal text-drop-shadow">
                Platform digital untuk mengelola, memverifikasi, dan mendokumentasikan soal ujian secara aman, cepat, dan terintegrasi di lingkungan Telkom University.
            </p>

            <!-- Feature Cards (Glassmorphism List Cerah) -->
            <div class="space-y-3.5">
                <!-- Card 1 -->
                <div class="glass-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                    <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span class="text-sm font-semibold text-white/95">Upload & Kelola Soal per Semester</span>
                </div>

                <!-- Card 2 -->
                <div class="glass-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                    <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span class="text-sm font-semibold text-white/95">Verifikasi Soal oleh PIC Terverifikasi</span>
                </div>

                <!-- Card 3 -->
                <div class="glass-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                    <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <span class="text-sm font-semibold text-white/95">Berita Acara Otomatis & Monitoring</span>
                </div>
            </div>
        </div>

        <!-- Footer Bottom Left -->
        <div class="relative z-10 pt-4">
            <p class="text-white/80 text-xs font-normal tracking-wide text-drop-shadow">
                © Telkom University • Sistem Internal
            </p>
        </div>
    </div>


    <!-- SISI KANAN: FORM LOGIN -->
    <div class="w-full lg:w-2/5 xl:w-[38%] bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen relative shadow-2xl z-20 overflow-y-auto">

        <div class="w-full max-w-sm mx-auto my-auto py-4">
            <!-- Logo Telkom University -->
            <div class="flex justify-center mb-6">
                <img src="{{ asset('images/logo-telkom.png') }}" alt="Telkom University Logo" class="h-12 max-w-[200px] w-auto object-contain">
            </div>

            <!-- Greeting Header -->
            <div class="text-center mb-6">
                <h2 class="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
                    Selamat datang kembali!
                </h2>
                <p class="text-slate-500 text-xs sm:text-sm font-normal leading-relaxed">
                    Masuk ke Sistem Verifikasi Soal dengan akun dosen Anda.
                </p>
            </div>

            <!-- Error Alert -->
            @if ($errors->any())
                <div class="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ $errors->first() }}</span>
                </div>
            @endif

            <!-- Login Form -->
            <form action="{{ url('/login') }}" method="POST" class="space-y-4">
                @csrf

                <!-- Field Email / Kode Dosen -->
                <div>
                    <label for="email" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email / Kode Dosen</label>
                    <div class="relative flex items-center">
                        <div class="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            id="email" 
                            name="email" 
                            value="{{ old('email') }}" 
                            placeholder="example@telkomuniversity.ac.id" 
                            required 
                            autocomplete="username"
                            style="padding-left: 2.75rem; padding-right: 1rem;"
                            class="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DD586F]/25 focus:border-[#DD586F] transition-all duration-200 shadow-sm"
                        >
                    </div>
                </div>

                <!-- Field Password -->
                <div>
                    <label for="password" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                    <div class="relative flex items-center">
                        <div class="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            placeholder="••••••••" 
                            required 
                            autocomplete="current-password"
                            style="padding-left: 2.75rem; padding-right: 2.75rem;"
                            class="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DD586F]/25 focus:border-[#DD586F] transition-all duration-200 shadow-sm"
                        >

                        <!-- Toggle Password Visibility -->
                        <button type="button" id="togglePassword" class="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer flex items-center">
                            <!-- Eye Icon (Show) -->
                            <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <!-- Eye Off Icon (Hide) -->
                            <svg id="eyeOffIcon" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.5 10.677a2 2 0 002.823 2.823M7.362 7.561A9.972 9.972 0 002.458 12c1.274 4.057 5.064 7 9.542 7 1.587 0 3.093-.377 4.426-1.045M17.158 16.942A9.96 9.96 0 0021.542 12c-1.274-4.057-5.064-7-9.542-7-1.12 0-2.203.188-3.21.533" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Submit Button (Vibrant Coral/Pink-Red #DD586F) -->
                <button type="submit" class="w-full bg-[#DD586F] hover:bg-[#C9485F] active:scale-[0.99] text-white font-semibold rounded-xl py-3.5 px-4 shadow-md shadow-[#DD586F]/25 hover:shadow-lg hover:shadow-[#DD586F]/30 transition-all duration-200 cursor-pointer text-sm tracking-wide mt-2 flex items-center justify-center gap-2">
                    Masuk
                </button>
            </form>

            <!-- Bottom Sub-footer -->
            <div class="mt-8 text-center">
                <p class="text-slate-400 text-xs font-normal tracking-wide">
                    Sistem Verifikasi Soal — Telkom University
                </p>
            </div>
        </div>
    </div>

    <!-- Toggle Password Script -->
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const passwordInput = document.getElementById('password');
            const togglePasswordBtn = document.getElementById('togglePassword');
            const eyeIcon = document.getElementById('eyeIcon');
            const eyeOffIcon = document.getElementById('eyeOffIcon');

            if (togglePasswordBtn && passwordInput) {
                togglePasswordBtn.addEventListener('click', function () {
                    const isPassword = passwordInput.getAttribute('type') === 'password';
                    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                    eyeIcon.classList.toggle('hidden', isPassword);
                    eyeOffIcon.classList.toggle('hidden', !isPassword);
                });
            }
        });
    </script>
</body>
</html>
