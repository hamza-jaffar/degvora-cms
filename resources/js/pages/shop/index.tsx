import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Heart,
    Search,
    ShoppingCart,
    SlidersHorizontal,
    Star,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Product } from '@/types/data';
import type { ShopFilters, ShopIndexPageProps } from '@/types/props';

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating = 4, count = 0 }: { rating?: number; count?: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`size-3.5 ${
                            star <= Math.round(rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                ))}
            </div>
            {count > 0 && (
                <span className="text-sm text-gray-500">
                    {rating} &middot; {count.toLocaleString()} reviews
                </span>
            )}
        </div>
    );
}

// ─── Quick View Modal ─────────────────────────────────────────────────────────

function QuickViewModal({
    product,
    onClose,
}: {
    product: Product | null;
    onClose: () => void;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!product) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); }
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [product, onClose]);

    if (!product) return null;

    const price = Number(product.price).toFixed(2);
    const comparePrice = product.compare_at_price
        ? Number(product.compare_at_price).toFixed(2)
        : null;
    const discount =
        comparePrice && Number(product.compare_at_price) > Number(product.price)
            ? Math.round(
                  ((Number(product.compare_at_price) - Number(product.price)) /
                      Number(product.compare_at_price)) *
                      100,
              )
            : null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === overlayRef.current) { onClose(); }
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Close quick view"
                >
                    <X className="size-4" />
                </button>

                <div className="flex flex-col sm:flex-row">
                    {/* Product image */}
                    <div className="flex shrink-0 items-center justify-center bg-gray-50 sm:w-64">
                        {product.main_image_url ? (
                            <img
                                src={product.main_image_url}
                                alt={product.name}
                                className="h-64 w-full object-contain p-6 sm:h-80"
                            />
                        ) : (
                            <div className="flex h-64 w-full items-center justify-center sm:h-80">
                                <ShoppingCart className="size-16 text-gray-300" />
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col p-6">
                        {product.vendor && (
                            <p className="mb-1 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                                {product.vendor}
                            </p>
                        )}

                        <h2 className="mb-3 text-xl font-bold leading-snug text-gray-900">
                            {product.name}
                        </h2>

                        <StarRating count={0} />

                        <div className="mt-4 mb-5 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                                ${price}
                            </span>
                            {comparePrice && discount && (
                                <>
                                    <span className="text-sm text-gray-400 line-through">
                                        ${comparePrice}
                                    </span>
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                        -{discount}%
                                    </span>
                                </>
                            )}
                        </div>

                        {product.short_description && (
                            <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-gray-500">
                                {product.short_description}
                            </p>
                        )}

                        <div className="mt-auto space-y-2">
                            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98]">
                                <ShoppingCart className="size-4" />
                                Add to Cart
                            </button>
                            <Link
                                href={`/shop/${product.slug}`}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
                            >
                                View Details
                                <ChevronRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
    product,
    onQuickView,
}: {
    product: Product;
    onQuickView: (product: Product) => void;
}) {
    const price = Number(product.price).toFixed(2);
    const comparePrice = product.compare_at_price
        ? Number(product.compare_at_price).toFixed(2)
        : null;
    const discount =
        comparePrice && Number(product.compare_at_price) > Number(product.price)
            ? Math.round(
                  ((Number(product.compare_at_price) - Number(product.price)) /
                      Number(product.compare_at_price)) *
                      100,
              )
            : null;
    const isOutOfStock =
        product.track_inventory && product.quantity === 0 && !product.allow_backorder;

    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            {/* Image */}
            <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1 / 1' }}>
                {product.main_image_url ? (
                    <img
                        src={product.main_image_url}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ShoppingCart className="size-12 text-gray-300" />
                    </div>
                )}

                {/* Badges – top-left */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    {discount && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                            -{discount}%
                        </span>
                    )}
                    {product.is_featured && (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                            Featured
                        </span>
                    )}
                    {isOutOfStock && (
                        <span className="rounded-full bg-gray-600 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                            Sold Out
                        </span>
                    )}
                </div>

                {/* Action buttons – top-right, only on hover */}
                <div className="absolute top-2.5 right-2.5 flex translate-x-2 flex-col gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                    <button
                        onClick={() => onQuickView(product)}
                        className="flex size-8 items-center justify-center rounded-full bg-white shadow-md text-gray-700 transition hover:bg-gray-900 hover:text-white"
                        aria-label={`Quick view ${product.name}`}
                        title="Quick view"
                    >
                        <Eye className="size-3.5" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-full bg-white shadow-md text-gray-700 transition hover:bg-red-500 hover:text-white"
                        aria-label={`Wishlist ${product.name}`}
                        title="Add to wishlist"
                    >
                        <Heart className="size-3.5" />
                    </button>
                </div>

                {/* Add to cart – bottom overlay, slides up on hover */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                    <button
                        disabled={isOutOfStock}
                        className="flex w-full items-center justify-center gap-2 bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        <ShoppingCart className="size-3.5" />
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>

            {/* Card body */}
            <div className="p-3.5">
                {product.category && (
                    <p className="mb-0.5 truncate text-xs text-gray-400">
                        {product.category.name}
                    </p>
                )}

                <Link
                    href={`/shop/${product.slug}`}
                    className="block truncate text-sm font-semibold text-gray-900 transition hover:text-gray-600"
                    title={product.name}
                >
                    {product.name}
                </Link>

                {product.vendor && (
                    <p className="mt-0.5 truncate text-xs text-gray-400">by {product.vendor}</p>
                )}

                <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-gray-900">${price}</span>
                    {comparePrice && (
                        <span className="text-xs text-gray-400 line-through">${comparePrice}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

function FilterSidebar({
    filters,
    categories,
    vendors,
    brands,
    priceRange,
    onApply,
    onReset,
    isOpen,
    onClose,
}: {
    filters: ShopFilters;
    categories: ShopIndexPageProps['categories'];
    vendors: string[];
    brands: string[];
    priceRange: { min: number; max: number };
    onApply: (changes: Partial<ShopFilters>) => void;
    onReset: () => void;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [localMinPrice, setLocalMinPrice] = useState(filters.min_price);
    const [localMaxPrice, setLocalMaxPrice] = useState(filters.max_price);

    useEffect(() => {
        setLocalMinPrice(filters.min_price);
        setLocalMaxPrice(filters.max_price);
    }, [filters.min_price, filters.max_price]);

    const applyPrice = () => { onApply({ min_price: localMinPrice, max_price: localMaxPrice }); };

    const activeFiltersCount = [
        filters.category_id,
        filters.vendor,
        filters.brand,
        filters.in_stock,
        filters.min_price,
        filters.max_price,
    ].filter(Boolean).length;

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={[
                    'fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-white shadow-xl transition-transform duration-300',
                    'lg:static lg:z-auto lg:block lg:w-64 lg:translate-x-0 lg:shadow-none lg:rounded-xl lg:border lg:border-gray-100',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                ].join(' ')}
            >
                {/* Mobile header */}
                <div className="flex items-center justify-between border-b p-4 lg:hidden">
                    <span className="font-semibold text-gray-900">Filters</span>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-500 hover:text-gray-900"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="space-y-6 p-4">
                    {/* Heading + clear */}
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-1.5 font-semibold text-gray-900">
                            <SlidersHorizontal className="size-4" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="inline-flex size-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </h2>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={onReset}
                                className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-900"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div>
                            <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                Category
                            </h3>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                                            !filters.category_id
                                                ? 'bg-gray-900 font-semibold text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        onClick={() => onApply({ category_id: '' })}
                                    >
                                        All Categories
                                    </button>
                                </li>
                                {categories.map((cat) => (
                                    <li key={cat.id}>
                                        <button
                                            className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                                                filters.category_id === String(cat.id)
                                                    ? 'bg-gray-900 font-semibold text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                            onClick={() => onApply({ category_id: String(cat.id) })}
                                        >
                                            {cat.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Price Range */}
                    <div>
                        <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                            Price Range
                        </h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={priceRange.min}
                                max={priceRange.max}
                                step="0.01"
                                placeholder={`${priceRange.min}`}
                                value={localMinPrice}
                                onChange={(e) => setLocalMinPrice(e.target.value)}
                                className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                            />
                            <span className="shrink-0 text-xs text-gray-400">–</span>
                            <input
                                type="number"
                                min={priceRange.min}
                                max={priceRange.max}
                                step="0.01"
                                placeholder={`${priceRange.max}`}
                                value={localMaxPrice}
                                onChange={(e) => setLocalMaxPrice(e.target.value)}
                                className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                            />
                        </div>
                        <button
                            onClick={applyPrice}
                            className="mt-2 w-full rounded-md bg-gray-100 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-900 hover:text-white"
                        >
                            Apply Price
                        </button>
                    </div>

                    {/* Availability */}
                    <div>
                        <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                            Availability
                        </h3>
                        <label className="flex cursor-pointer items-center gap-2.5">
                            <input
                                type="checkbox"
                                checked={filters.in_stock === '1'}
                                onChange={(e) => onApply({ in_stock: e.target.checked ? '1' : '' })}
                                className="size-4 rounded border-gray-300 accent-gray-900"
                            />
                            <span className="text-sm text-gray-700">In Stock Only</span>
                        </label>
                    </div>

                    {/* Vendors */}
                    {vendors.length > 0 && (
                        <div>
                            <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                Vendor
                            </h3>
                            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
                                {vendors.map((vendor) => (
                                    <li key={vendor}>
                                        <button
                                            className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                                                filters.vendor === vendor
                                                    ? 'bg-gray-900 font-semibold text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                            onClick={() =>
                                                onApply({ vendor: filters.vendor === vendor ? '' : vendor })
                                            }
                                        >
                                            {vendor}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Brands */}
                    {brands.length > 0 && (
                        <div>
                            <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                Brand
                            </h3>
                            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
                                {brands.map((brand) => (
                                    <li key={brand}>
                                        <button
                                            className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                                                filters.brand === brand
                                                    ? 'bg-gray-900 font-semibold text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                            onClick={() =>
                                                onApply({ brand: filters.brand === brand ? '' : brand })
                                            }
                                        >
                                            {brand}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
    currentPage,
    lastPage,
    from,
    to,
    total,
    onPage,
}: {
    currentPage: number;
    lastPage: number;
    from: number;
    to: number;
    total: number;
    onPage: (page: number) => void;
}) {
    if (lastPage <= 1) return null;

    const delta = 2;
    const pages: (number | '...')[] = [];

    for (let i = 1; i <= lastPage; i++) {
        if (
            i === 1 ||
            i === lastPage ||
            (i >= currentPage - delta && i <= currentPage + delta)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-gray-500">
                {from}–{to} of {total.toLocaleString()} products
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="size-4" />
                </button>

                {pages.map((page, idx) =>
                    page === '...' ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className="flex size-9 items-center justify-center text-sm text-gray-400"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPage(page as number)}
                            className={`flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition ${
                                page === currentPage
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:text-gray-900'
                            }`}
                            aria-label={`Page ${page}`}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    ),
                )}

                <button
                    onClick={() => onPage(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShopIndex({
    products,
    filters,
    categories,
    vendors,
    brands,
    priceRange,
}: ShopIndexPageProps) {
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const applyFilters = useCallback(
        (changes: Partial<ShopFilters>) => {
            router.get(
                '/shop',
                { ...filters, ...changes, page: 1 },
                { preserveState: true, preserveScroll: false, replace: true },
            );
        },
        [filters],
    );

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchDebounceRef.current) { clearTimeout(searchDebounceRef.current); }
        searchDebounceRef.current = setTimeout(() => {
            applyFilters({ search: value });
        }, 350);
    };

    const handlePage = (page: number) => {
        router.get(
            '/shop',
            { ...filters, page },
            { preserveState: true, preserveScroll: false, replace: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        router.get('/shop', {}, { preserveState: false, replace: true });
    };

    const sortOptions: [string, string][] = [
        ['created_at:desc', 'Newest'],
        ['created_at:asc', 'Oldest'],
        ['price:asc', 'Price: Low to High'],
        ['price:desc', 'Price: High to Low'],
        ['name:asc', 'Name A–Z'],
        ['name:desc', 'Name Z–A'],
    ];

    const currentSort = `${filters.sort}:${filters.direction}`;

    return (
        <>
            <Head title="Shop" />

            <QuickViewModal
                product={quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
            />

            <div className="min-h-screen bg-gray-50">
                {/* Top bar */}
                <div className="border-b bg-white px-4 py-4 sm:px-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative min-w-48 flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    placeholder="Search products…"
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900"
                                />
                            </div>

                            {/* Mobile filter toggle */}
                            <button
                                onClick={() => setFilterOpen(true)}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 lg:hidden"
                            >
                                <Filter className="size-4" />
                                Filters
                            </button>

                            {/* Sort */}
                            <select
                                value={currentSort}
                                onChange={(e) => {
                                    const [sort, direction] = e.target.value.split(':');
                                    applyFilters({ sort, direction });
                                }}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                aria-label="Sort products"
                            >
                                {sortOptions.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                            {/* Per page */}
                            <select
                                value={filters.per_page}
                                onChange={(e) => applyFilters({ per_page: Number(e.target.value) })}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                aria-label="Products per page"
                            >
                                {[16, 32, 48].map((n) => (
                                    <option key={n} value={n}>
                                        {n} per page
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main body */}
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                    <div className="flex gap-6">
                        {/* Sidebar */}
                        <FilterSidebar
                            filters={filters}
                            categories={categories}
                            vendors={vendors}
                            brands={brands}
                            priceRange={priceRange}
                            onApply={applyFilters}
                            onReset={handleReset}
                            isOpen={filterOpen}
                            onClose={() => setFilterOpen(false)}
                        />

                        {/* Products */}
                        <div className="min-w-0 flex-1">
                            <p className="mb-4 text-sm text-gray-500">
                                {products.total > 0
                                    ? `Showing ${products.from}–${products.to} of ${products.total.toLocaleString()} products`
                                    : 'No products found'}
                            </p>

                            {products.data.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                                    {products.data.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onQuickView={setQuickViewProduct}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
                                        <Search className="size-8 text-gray-400" />
                                    </div>
                                    <h3 className="mb-1 text-lg font-semibold text-gray-900">
                                        No products found
                                    </h3>
                                    <p className="mb-6 text-sm text-gray-500">
                                        Try adjusting your filters or search term.
                                    </p>
                                    <button
                                        onClick={handleReset}
                                        className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}

                            {products.last_page > 1 && (
                                <div className="mt-8">
                                    <Pagination
                                        currentPage={products.current_page}
                                        lastPage={products.last_page}
                                        from={products.from}
                                        to={products.to}
                                        total={products.total}
                                        onPage={handlePage}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
