<footer>
    @php
        $footerMenu = $theme->menu()->get('Footer Menu') ?? $theme->menu()->get('footer');
    @endphp
    @if($footerMenu && $footerMenu->menuItems->isNotEmpty())
        <ul>
            @foreach($footerMenu->menuItems as $item)
                <li><a href="{{ $item->href }}">{{ $item->label }}</a></li>
            @endforeach
        </ul>
    @endif
    <p>&copy; {{ date('Y') }} DegvoraCMS</p>
</footer>
