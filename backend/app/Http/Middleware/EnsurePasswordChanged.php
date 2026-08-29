<?php

namespace App\Http\Middleware;

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
        $user = Auth::user();

        if ($user && $user->must_change_password) {
            $path = $request->path();
            $routeName = $request->route()?->getName();

            // Allow profile routes, password update routes, and logout routes
            if (
                str_starts_with($path, 'profile') ||
                str_starts_with($path, 'logout') ||
                in_array($routeName, ['profile.show', 'profile.password', 'profile.update', 'logout'])
            ) {
                return $next($request);
            }

            return redirect()->route('profile.show')->with('warning', 'Demi keamanan akun Anda, silakan ubah password default terlebih dahulu pada login pertama ini.');
        }

        return $next($request);
    }
}
