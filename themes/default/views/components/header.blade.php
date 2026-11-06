<header>
    <a href="{{ route('home') }}">DegvoraCMS</a>
    @php
        $headerMenu = $theme->menu()->get('Main Menu') ?? $theme->menu()->get('header') ?? $theme->menu()->get('primary');
    @endphp
    @if($headerMenu && $headerMenu->menuItems->isNotEmpty())
        <nav>
            <ul>
                @foreach($headerMenu->menuItems as $item)
                    <li>
                        <a href="{{ $item->href }}" @if(!empty($item->target) && $item->target !== '_self') target="{{ $item->target }}" @endif>{{ $item->label }}</a>
                        @if($item->children->isNotEmpty())
                            <ul>
                                @foreach($item->children as $child)
                                    <li>
                                        <a href="{{ $child->href }}" @if(!empty($child->target) && $child->target !== '_self') target="{{ $child->target }}" @endif>{{ $child->label }}</a>
                                    </li>
                                @endforeach
                            </ul>
                        @endif
                    </li>
                @endforeach
            </ul>
        </nav>
    @endif
</header>
