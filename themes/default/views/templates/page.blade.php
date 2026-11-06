@extends('theme::layouts.app')

@section('content')
    <h1>{{ $page->name }}</h1>

    @if ($page->excerpt)
        <p>{{ $page->excerpt }}</p>
    @endif

    <div>
        {!! $page->content !!}
    </div>
@endsection
