<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = Auth::user();

        if ($user instanceof User && $user->isMustChangePasswordEnforced()) {
            // Block non-GET mutation requests if password is not changed yet (except password update and logout)
            if (!$request->isMethod('GET')) {
                $path = $request->path();
                $routeName = $request->route()?->getName();

                if (
                    !in_array($routeName, ['profile.password', 'logout']) &&
                    !str_starts_with($path, 'logout') &&
                    !str_starts_with($path, 'profile/password')
                ) {
                    return back()->with('error', 'Silakan ganti password Anda terlebih dahulu.');
                }
            }
        }

        return $next($request);
    }
}

