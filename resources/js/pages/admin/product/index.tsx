import ConfirmationModal from "@/components/confirmation-modal";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { FilterCard } from "@/components/filter-card";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { dashboard } from "@/routes";
import productsRoute from "@/routes/admin/products";
import type { Product } from "@/types/data";
import type { ProductFilters, ProductIndexPageProps } from "@/types/props";
import { Link, router } from "@inertiajs/react";
import {
    ArrowDownUp,
    Eye,
    PackagePlus,
    Pencil,
    RotateCcw,
    Search,
    Star,
    Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

const pageSizes = [10, 25, 50, 100];

const ProductIndex = ({
    products,
    filters,
    categories,
    vendors,
    brands,
}: ProductIndexPageProps) => {
    const [search, setSearch] = useState(filters.search);
    const [minPrice, setMinPrice] = useState(filters.min_price);
    const [maxPrice, setMaxPrice] = useState(filters.max_price);
    const [productToDelete, setProductToDelete] = useState<Product | null>(
        null,
    );
    const [productToRestore, setProductToRestore] = useState<Product | null>(
        null,
    );
    const [productToForceDelete, setProductToForceDelete] =
        useState<Product | null>(null);

    useEffect(() => setSearch(filters.search), [filters.search]);
    useEffect(() => setMinPrice(filters.min_price), [filters.min_price]);
    useEffect(() => setMaxPrice(filters.max_price), [filters.max_price]);
    useEffect(() => {
        if (search === filters.search) return;
        const timeout = window.setTimeout(() => applyFilters({ search }), 350);
        return () => window.clearTimeout(timeout);
    }, [search, filters]);

    const applyFilters = (changes: Partial<ProductFilters>) => {
        router.get(
            productsRoute.index.url(),
            { ...filters, ...changes, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns: DataTableColumn<Product>[] = [
        {
            key: "product",
            header: "Product",
            render: (product) => (
                <Link
                    href={productsRoute.show(product.slug)}
                    className="flex min-w-0 items-center gap-3 text-left"
                >
                    {product.main_image_url ? (
                        <img
                            src={product.main_image_url}
                            alt=""
                            loading="lazy"
                            className="size-11 shrink-0 rounded-md border object-cover"
                        />
                    ) : (
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                            <PackagePlus className="size-5" />
                        </div>
                    )}
                    <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground hover:underline">
                            {product.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {product.sku || product.slug}
                        </span>
                    </span>
                </Link>
            ),
        },
        {
            key: "category",
            header: "Category",
            render: (product) => (
                <span className="text-muted-foreground">
                    {product.category?.name ?? "Uncategorized"}
                </span>
            ),
        },
        {
            key: "price",
            header: "Price",
            render: (product) => (
                <span className="font-medium whitespace-nowrap tabular-nums">
                    {product.variants?.pricing_mode === "variants" && (
                        <span className="mr-1 text-xs font-normal text-muted-foreground">
                            From
                        </span>
                    )}
                    {product.currency} {Number(product.price).toFixed(2)}
                </span>
            ),
        },
        {
            key: "inventory",
            header: "Inventory",
            render: (product) => (
                <span className="text-muted-foreground">
                    {product.track_inventory
                        ? `${product.quantity} in stock`
                        : "Not tracked"}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            render: (product) => (
                <Badge
                    variant="outline"
                    className={
                        product.deleted_at
                            ? "border-red-200 bg-red-50 text-red-700"
                            : product.status === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : product.status === "archived"
                                ? "border-zinc-200 bg-zinc-100 text-zinc-600"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                    }
                >
                    {product.deleted_at ? "deleted" : product.status}
                </Badge>
            ),
        },
        {
            key: "featured",
            header: "Featured",
            render: (product) =>
                product.is_featured ? (
                    <Star className="size-4 fill-amber-400 text-amber-500" />
                ) : (
                    <span className="text-muted-foreground">No</span>
                ),
        },
        {
            key: "actions",
            header: "Actions",
            className: "w-36 text-right",
            render: (product) => (
                <div className="flex items-center justify-end gap-1">
                    {product.deleted_at ? (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-emerald-600 hover:text-emerald-700"
                                aria-label={`Restore ${product.name}`}
                                title="Restore product"
                                onClick={() => setProductToRestore(product)}
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                aria-label={`Permanently delete ${product.name}`}
                                title="Permanently delete product"
                                onClick={() => setProductToForceDelete(product)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <IconLink
                                href={productsRoute.show.url(product.slug)}
                                label={`View ${product.name}`}
                            >
                                <Eye />
                            </IconLink>
                            <IconLink
                                href={productsRoute.edit.url(product.slug)}
                                label={`Edit ${product.name}`}
                            >
                                <Pencil />
                            </IconLink>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                aria-label={`Delete ${product.name}`}
                                title="Delete product"
                                onClick={() => setProductToDelete(product)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 p-5 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <Heading
                    title="Product Management"
                    description="Manage product content, pricing, inventory, and publishing."
                />
                <Link href={productsRoute.create()} className="shrink-0">
                    <Button>
                        <PackagePlus /> Add product
                    </Button>
                </Link>
            </div>

            <FilterCard>
                <FilterCard.Left className="min-w-0">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Search products"
                            placeholder="Name, SKU, barcode, vendor..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <SearchableFilterSelect
                        label="Filter by category"
                        value={filters.category_id || "all"}
                        onValueChange={(value) =>
                            applyFilters({
                                category_id: value === "all" ? "" : value,
                            })
                        }
                        allLabel="All categories"
                        searchPlaceholder="Search categories..."
                        options={categories.map((category) => [
                            String(category.id),
                            category.name,
                        ])}
                    />
                    <FilterSelect
                        label="Filter by product type"
                        value={filters.product_type || "all"}
                        onValueChange={(value) =>
                            applyFilters({
                                product_type: value === "all" ? "" : value,
                            })
                        }
                        allLabel="All types"
                        options={[
                            ["physical", "Physical"],
                            ["digital", "Digital"],
                            ["service", "Service"],
                        ]}
                    />
                    <FilterSelect
                        label="Filter by status"
                        value={filters.status || "all"}
                        onValueChange={(value) =>
                            applyFilters({
                                status: value === "all" ? "" : value,
                            })
                        }
                        allLabel="All statuses"
                        options={[
                            ["draft", "Draft"],
                            ["active", "Active"],
                            ["archived", "Archived"],
                        ]}
                    />
                    <FilterSelect
                        label="Filter by deleted status"
                        value={filters.trashed || "all"}
                        onValueChange={(value) =>
                            applyFilters({
                                trashed: value === "all" ? "" : value,
                            })
                        }
                        allLabel="Active products"
                        options={[
                            ["with", "Include deleted"],
                            ["only", "Only deleted"],
                        ]}
                    />
                    <FilterSelect
                        label="Filter by featured status"
                        value={filters.is_featured || "all"}
                        onValueChange={(value) =>
                            applyFilters({
                                is_featured: value === "all" ? "" : value,
                            })
                        }
                        allLabel="Featured and standard"
                        options={[
                            ["1", "Featured"],
                            ["0", "Not featured"],
                        ]}
                    />
                    <FilterSelect
                        label="Filter by inventory"
                        value={filters.stock || "all"}
                        onValueChange={(value) =>
                            applyFilters({
                                stock: value === "all" ? "" : value,
                            })
                        }
                        allLabel="All inventory"
                        options={[
                            ["in_stock", "In stock"],
                            ["out_of_stock", "Out of stock"],
                            ["low_stock", "Low stock"],
                            ["not_tracked", "Not tracked"],
                        ]}
                    />
                    <SearchableFilterSelect
                        label="Filter by vendor"
                        value={filters.vendor || "all"}
                        onValueChange={(value) =>
                            applyFilters({
                                vendor: value === "all" ? "" : value,
                            })
                        }
                        allLabel="All vendors"
                        searchPlaceholder="Search vendors..."
                        options={vendors.map((vendor) => [vendor, vendor])}
                    />
                    <SearchableFilterSelect
                        label="Filter by brand"
                        value={filters.brand || "all"}
                        onValueChange={(value) =>
                            applyFilters({
                                brand: value === "all" ? "" : value,
                            })
                        }
                        allLabel="All brands"
                        searchPlaceholder="Search brands..."
                        options={brands.map((brand) => [brand, brand])}
                    />
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <Input
                            aria-label="Minimum product price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Min price"
                            value={minPrice}
                            onChange={(event) =>
                                setMinPrice(event.target.value)
                            }
                            className="w-full sm:w-28"
                        />
                        <Input
                            aria-label="Maximum product price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Max price"
                            value={maxPrice}
                            onChange={(event) =>
                                setMaxPrice(event.target.value)
                            }
                            className="w-full sm:w-28"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Apply price range"
                            title="Apply price range"
                            onClick={() =>
                                applyFilters({
                                    min_price: minPrice,
                                    max_price: maxPrice,
                                })
                            }
                        >
                            <ArrowDownUp />
                        </Button>
                    </div>
                    <FilterSelect
                        label="Sort products"
                        value={`${filters.sort}:${filters.direction}`}
                        onValueChange={(value) => {
                            const [sort, direction] = value.split(":");
                            applyFilters({ sort, direction });
                        }}
                        allLabel="Recently updated"
                        options={[
                            ["created_at:desc", "Recently updated"],
                            ["name:asc", "Name A-Z"],
                            ["name:desc", "Name Z-A"],
                            ["price:asc", "Price low-high"],
                            ["price:desc", "Price high-low"],
                            ["quantity:asc", "Inventory low-high"],
                        ]}
                    />
                    <Button
                        onClick={() => {
                            setSearch("");
                            setMinPrice("");
                            setMaxPrice("");
                            router.get(
                                productsRoute.index.url(),
                                {},
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true,
                                },
                            );
                        }}
                    >
                        Reset filters
                    </Button>
                </FilterCard.Left>
            </FilterCard>

            <DataTable
                rows={products.data}
                columns={columns}
                pagination={products}
                pageSizes={pageSizes}
                onPageSizeChange={(perPage) =>
                    applyFilters({ per_page: perPage })
                }
                emptyMessage="No products match these filters."
            />

            <ConfirmationModal
                open={productToDelete !== null}
                onOpenChange={(open) => !open && setProductToDelete(null)}
                title="Delete product?"
                description={
                    <>
                        This will move{" "}
                        <span className="font-medium text-foreground">
                            {productToDelete?.name}
                        </span>{" "}
                        to the deleted products list.
                    </>
                }
                confirmLabel="Delete product"
                destructive
                onConfirm={() => {
                    if (!productToDelete) return;
                    router.delete(
                        productsRoute.destroy(productToDelete.slug).url,
                        {
                            preserveScroll: true,
                            onSuccess: () => setProductToDelete(null),
                        },
                    );
                }}
            />

            <ConfirmationModal
                open={productToRestore !== null}
                onOpenChange={(open) => !open && setProductToRestore(null)}
                title="Restore product?"
                description={
                    <>
                        This will restore{" "}
                        <span className="font-medium text-foreground">
                            {productToRestore?.name}
                        </span>{" "}
                        back to your active catalog.
                    </>
                }
                confirmLabel="Restore product"
                onConfirm={() => {
                    if (!productToRestore) return;
                    router.post(
                        productsRoute.restore(productToRestore.id).url,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => setProductToRestore(null),
                        },
                    );
                }}
            />

            <ConfirmationModal
                open={productToForceDelete !== null}
                onOpenChange={(open) => !open && setProductToForceDelete(null)}
                title="Permanently delete product?"
                description={
                    <>
                        This action cannot be undone. This will permanently
                        delete{" "}
                        <span className="font-medium text-foreground">
                            {productToForceDelete?.name}
                        </span>{" "}
                        and remove all associated data.
                    </>
                }
                confirmLabel="Permanently delete"
                destructive
                onConfirm={() => {
                    if (!productToForceDelete) return;
                    router.delete(
                        productsRoute.forceDelete(productToForceDelete.id).url,
                        {
                            preserveScroll: true,
                            onSuccess: () => setProductToForceDelete(null),
                        },
                    );
                }}
            />
        </div>
    );
};

function FilterSelect({
    label,
    value,
    onValueChange,
    allLabel,
    options,
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    allLabel: string;
    options: [string, string][];
}) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger
                aria-label={label}
                className="w-full bg-background sm:w-44"
            >
                <SelectValue placeholder={allLabel} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{allLabel}</SelectItem>
                {options.map(([optionValue, optionLabel]) => (
                    <SelectItem key={optionValue} value={optionValue}>
                        {optionLabel}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function SearchableFilterSelect({
    label,
    value,
    onValueChange,
    allLabel,
    options,
    searchPlaceholder = "Search...",
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    allLabel: string;
    options: [string, string][];
    searchPlaceholder?: string;
}) {
    const [search, setSearch] = useState("");
    const filteredOptions = options.filter(([_, text]) =>
        text.toLowerCase().includes(search.trim().toLowerCase()),
    );

    return (
        <Select
            value={value}
            onValueChange={(val) => {
                onValueChange(val);
                setSearch("");
            }}
        >
            <SelectTrigger
                aria-label={label}
                className="w-full bg-background sm:w-44"
            >
                <SelectValue placeholder={allLabel} />
            </SelectTrigger>
            <SelectContent>
                <div
                    className="border-b p-2"
                    onKeyDown={(event) => {
                        if (event.key !== "Escape") {
                            event.stopPropagation();
                        }
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder}
                            className="h-8 pl-8"
                        />
                    </div>
                </div>
                <SelectItem value="all">{allLabel}</SelectItem>
                {filteredOptions.map(([optionValue, optionLabel]) => (
                    <SelectItem key={optionValue} value={optionValue}>
                        {optionLabel}
                    </SelectItem>
                ))}
                {filteredOptions.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                        No matches found.
                    </div>
                )}
            </SelectContent>
        </Select>
    );
}

function IconLink({
    href,
    label,
    children,
}: {
    href: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href={href} aria-label={label} title={label}>
                {children}
            </Link>
        </Button>
    );
}

export default ProductIndex;

ProductIndex.layout = {
    breadcrumbs: [
        { title: "Dashboard", href: dashboard() },
        { title: "Products" },
    ],
};
