<?php

namespace App\Http\Middleware;

use App\Models\PeriodeVerifikasi;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $activePeriod = PeriodeVerifikasi::where('status', 'ACTIVE')->first();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id'    => $request->user()->id,
                    'name'  => $request->user()->name,
                    'email' => $request->user()->email,
                    'role'  => $request->user()->role,
                    'dosen' => $request->user()->dosen ? [
                        'id'          => $request->user()->dosen->id,
                        'kode_dosen'  => $request->user()->dosen->kode_dosen,
                        'nama_lengkap'=> $request->user()->dosen->nama_lengkap,
                    ] : null,
                ] : null,
            ],
            'activePeriod' => $activePeriod ? [
                'id'              => $activePeriod->id,
                'nama'            => $activePeriod->nama,
                'deadline_upload' => $activePeriod->deadline_upload,
                'status'          => $activePeriod->status,
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
