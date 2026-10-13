<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureIsEnabled
{
    /**
     * Handle an incoming request.
     *
     * Aborts with a 404 if the given CMS feature is disabled in config/cms.php.
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string  $feature  The feature key (e.g. 'product', 'category', 'theme')
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        if (! config("cms.features.{$feature}", false)) {
            abort(404);
        }

        return $next($request);
    }
}
