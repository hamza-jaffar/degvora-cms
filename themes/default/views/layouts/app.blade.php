<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $page->meta_title ?: $page->name }}</title>
        @if ($page->meta_description)
            <meta name="description" content="{{ $page->meta_description }}">
        @endif
    </head>
    <body>
        @include('theme::components.header')

        <main>
            @yield('content')
        </main>

        @include('theme::components.footer')
    </body>
</html>
