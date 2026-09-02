<?php

namespace Database\Seeders;

use App\Models\Dosen;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DosenSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dosenList = [
            ['kode_dosen' => 'QLB', 'nama_lengkap' => 'Qilbaaini Effendi Muftikhali, S.Kom., M.Kom.',   'kategori_dosen' => 'Dosen Tetap', 'nip' => '25930036'],
            ['kode_dosen' => 'SHC', 'nama_lengkap' => 'Sasmi Hidayatul Yulianing Tyas, S.Kom., M.Kom.', 'kategori_dosen' => 'Dosen Tetap', 'nip' => '25930035'],
            ['kode_dosen' => 'WHO', 'nama_lengkap' => 'Dea Wemona Rahma, S.Kom., M.T.I.',               'kategori_dosen' => 'Dosen Tetap', 'nip' => '22950047'],
            ['kode_dosen' => 'WRA', 'nama_lengkap' => 'Dwina Satrinia, S.Kom., M.T.',                   'kategori_dosen' => 'Dosen Tetap', 'nip' => '25890015'],
            ['kode_dosen' => 'DWN', 'nama_lengkap' => 'Dewi Marini Umi Atmaja, S.Kom., M.Kom.',         'kategori_dosen' => 'Dosen Tetap', 'nip' => '24960026'],
            ['kode_dosen' => 'DET', 'nama_lengkap' => 'Deki Satria, S.T., M.Kom.',                      'kategori_dosen' => 'Dosen Tetap', 'nip' => '23920014'],
            ['kode_dosen' => 'ILR', 'nama_lengkap' => 'Ilham Roni Yansyah, S.Kom., M.Kom.',             'kategori_dosen' => 'Dosen Tetap', 'nip' => '22960002'],
            ['kode_dosen' => 'MSE', 'nama_lengkap' => 'Muhammad Solehuddin, S.SI., M.Kom.',             'kategori_dosen' => 'Dosen Tetap', 'nip' => '23980030'],
            ['kode_dosen' => 'ARK', 'nama_lengkap' => 'Arif Rahman Hakim, S.Kom., M.Kom.',              'kategori_dosen' => 'Dosen Tetap', 'nip' => '24920011'],
            ['kode_dosen' => 'ZIZ', 'nama_lengkap' => 'Muhammad Aziz Kurniawan, S.SI., M.T.',           'kategori_dosen' => 'Dosen Tetap', 'nip' => '24970020'],
            ['kode_dosen' => 'YZN', 'nama_lengkap' => 'Yumna Zahran Ramadhan, S.Kom., M.Kom.',          'kategori_dosen' => 'Dosen Tetap', 'nip' => '25010009'],
            ['kode_dosen' => 'FRE', 'nama_lengkap' => 'Fadhil Rozi Hendrawan, S.Kom., M.Kom.',          'kategori_dosen' => 'Dosen Tetap', 'nip' => '25000006'],
            ['kode_dosen' => 'AIK', 'nama_lengkap' => 'Dr. Ade Rahmat Iskandar, S.Kom., M.T.',          'kategori_dosen' => 'Dosen Tetap', 'nip' => '20770002'],
            ['kode_dosen' => 'CHS', 'nama_lengkap' => 'Adelia Chitra Sazkia, S.Kom., M.Comp.Sc.',       'kategori_dosen' => 'Dosen Tetap', 'nip' => '25940043'],
            ['kode_dosen' => 'HMW', 'nama_lengkap' => 'Ahmad Ridwan Fauzi, S.Kom., M.Sc., MBA.',        'kategori_dosen' => 'Dosen Tetap', 'nip' => '25940044'],
            ['kode_dosen' => 'PRQ', 'nama_lengkap' => 'Putri Rizqiyah, S.Kom., M.Kom.',                 'kategori_dosen' => 'Dosen Tetap', 'nip' => '25970018'],
            ['kode_dosen' => 'DIS', 'nama_lengkap' => 'Muhammad Ardiansyah, S.Kom., M.M.',              'kategori_dosen' => 'Dosen Tetap', 'nip' => '25920033'],
            ['kode_dosen' => 'IPJ', 'nama_lengkap' => 'I Putu Eka Juliantara, S.T., M.Eng.',            'kategori_dosen' => 'Dosen Tetap', 'nip' => '25970023'],
            ['kode_dosen' => 'PTM', 'nama_lengkap' => 'Putri Utami Rukmana, S.Kom., M.Kom.',            'kategori_dosen' => 'Dosen Tetap', 'nip' => '26000035'],
            ['kode_dosen' => 'TRM', 'nama_lengkap' => 'Tiara Rahmania Hadiningrum, S.Kom., M.Kom.',     'kategori_dosen' => 'Dosen Tetap', 'nip' => '26010017'],
            ['kode_dosen' => 'PTH', 'nama_lengkap' => 'Puspita Parahita Anindita, S.Kom., BInfTech, MSc.','kategori_dosen' => 'Dosen Tetap', 'nip' => '26970033'],
            ['kode_dosen' => 'URD', 'nama_lengkap' => 'Dr. Nur Hadian, S.Kom., M.Kom.',                 'kategori_dosen' => 'Dosen Tetap', 'nip' => '26970035'],
            ['kode_dosen' => 'PIE', 'nama_lengkap' => 'Pietra Dorand, M.Pd.',                           'kategori_dosen' => 'Dosen Tetap'],
            ['kode_dosen' => 'VVI', 'nama_lengkap' => 'Alva Nurvina Sularso, S.Sos., M.Hum.',           'kategori_dosen' => 'Dosen Tetap'],
            ['kode_dosen' => 'MTM', 'nama_lengkap' => 'Muhammad Fakhrul Safitra, S.Kom., M.Kom.',       'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'OHO', 'nama_lengkap' => 'Hary Nugroho, S.T., M.T.',                       'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'MCG', 'nama_lengkap' => 'Monica Khoirunnisa, S.Pd., M.Pd.',               'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'SHN', 'nama_lengkap' => 'Sukrina Herman, S.Kom., M.Kom.',                 'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'CDH', 'nama_lengkap' => 'Ahmad Cecep Damanhuri, M.Pd.',                   'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'EON', 'nama_lengkap' => 'Eva Novianti, S.Kom, M.MSI.',                    'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'VYT', 'nama_lengkap' => 'Novyta, S.Si., M.Pd.',                           'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'MNN', 'nama_lengkap' => 'Masnia, M.Pd.',                                  'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'BYN', 'nama_lengkap' => 'Dr. Bony Parulian Josaphat, S.Si., M.Si.',       'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'LUK', 'nama_lengkap' => 'Lukman Medriavin Silalahi, A.Md., S.T., M.T.',   'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'LYN', 'nama_lengkap' => 'Lingga Yuliana, S.E., M.M.',                     'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'SYU', 'nama_lengkap' => 'Syukron Ma’mun, S.Kom., M.T.I.',                 'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'PCY', 'nama_lengkap' => 'Paxilla Chairany, S. Kom., M.Kom.',              'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'PDO', 'nama_lengkap' => 'Prasetyo Dwi Hatmoko, M. Pd.',                   'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'MOQ', 'nama_lengkap' => 'Dr. Mohammad Siddiq, M.Si., M.Pd.',              'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'NUN', 'nama_lengkap' => 'Ninuk Wiliani, S.Si, M.Kom, Ph.D',               'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'AYN', 'nama_lengkap' => 'Dr. Andri Ardiansyah, S.Pd.I., M.Pd.',           'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'YPS', 'nama_lengkap' => 'Yohanes Pranata Selai, S.Fil., M.Th.',           'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'PJI', 'nama_lengkap' => 'Dr. Puji Rahayu, S.Kom., M.Kom.',                'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'KIH', 'nama_lengkap' => 'Khalid Akbar, M.H.',                             'kategori_dosen' => 'LB'],
            ['kode_dosen' => 'IIM', 'nama_lengkap' => 'Iman Karim, S.H., M.H.',                         'kategori_dosen' => 'LB'],
        ];

        foreach ($dosenList as $item) {
            $email = strtolower($item['kode_dosen']) . '@telkomuniversity.ac.id';
            $passwordStr = isset($item['nip']) ? $item['nip'] : 'password';

            // Create or get user account for lecturer
            $user = \App\Models\User::firstOrCreate(
                ['email' => $email],
                [
                    'id'       => (string) Str::uuid(),
                    'name'     => $item['nama_lengkap'],
                    'password' => \Illuminate\Support\Facades\Hash::make($passwordStr),
                    'role'     => 'KOORDINATOR',
                    'status'   => 'ACTIVE',
                ]
            );

            if (isset($item['nip'])) {
                $user->update([
                    'password' => \Illuminate\Support\Facades\Hash::make($item['nip']),
                    'name'     => $item['nama_lengkap'],
                ]);
            }

            $dosen = Dosen::firstOrNew(['kode_dosen' => $item['kode_dosen']]);
            if (!$dosen->exists) {
                $dosen->id = (string) Str::uuid();
            }
            $dosen->nama_lengkap   = $item['nama_lengkap'];
            $dosen->kategori_dosen = $item['kategori_dosen'];
            $dosen->email          = $email;
            $dosen->user_id        = $user->id;
            $dosen->status         = 'ACTIVE';
            $dosen->save();
        }

        $this->command->info('✅ Berhasil menyemai data Dosen & Akun User Autentikasi dengan kata sandi NIP.');
    }
}

