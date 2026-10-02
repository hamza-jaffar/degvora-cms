import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import type { ProductImage, ProductVariantItem } from "@/types/data";
import type { ProductShowPageProps } from "@/types/props";
import { Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Boxes,
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    DollarSign,
    Eye,
    Globe,
    Grid,
    Image as ImageIcon,
    Layers,
    List,
    Maximize2,
    Package,
    Pencil,
    Search,
    Star,
    Tag,
    Truck,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type TabType = "overview" | "variations" | "inventory" | "media" | "seo";

const ProductShow = ({ product }: ProductShowPageProps) => {
    const hasVariants = product.variants?.pricing_mode === "variants";
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    // All available image assets
    const images: ProductImage[] = useMemo(() => {
        const list: ProductImage[] = [];
        if (product.main_image_asset) {
            list.push(product.main_image_asset);
        }
        if (product.gallery_assets && product.gallery_assets.length > 0) {
            product.gallery_assets.forEach((img) => {
                if (!list.some((existing) => existing.path === img.path)) {
                    list.push(img);
                }
            });
        }
        return list;
    }, [product]);

    const [selectedImage, setSelectedImage] = useState<ProductImage | null>(
        images[0] ?? null,
    );
    const [lightboxImage, setLightboxImage] = useState<ProductImage | null>(
        null,
    );
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        toast.success(`Copied ${label} to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Variations state
    const [varSearch, setVarSearch] = useState("");
    const [selectedOptionFilter, setSelectedOptionFilter] =
        useState<string>("all");
    const [varPage, setVarPage] = useState(1);
    const [varPerPage, setVarPerPage] = useState<number>(10);
    const [varViewMode, setVarViewMode] = useState<"table" | "grouped">(
        "table",
    );

    const variantItems = useMemo(
        () => product.variants?.items ?? [],
        [product.variants],
    );

    // Variation Stats
    const variantStats = useMemo(() => {
        if (!variantItems.length) return null;
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let totalStock = 0;

        variantItems.forEach((item) => {
            const priceNum = Number(item.price);
            if (priceNum < minPrice) minPrice = priceNum;
            if (priceNum > maxPrice) maxPrice = priceNum;
            totalStock += Number(item.quantity || 0);
        });

        return {
            totalItems: variantItems.length,
            minPrice: minPrice === Infinity ? 0 : minPrice,
            maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
            totalStock,
        };
    }, [variantItems]);

    // Available variation options for quick filter pills
    const optionFilters = useMemo(() => {
        if (!product.variants?.options) return [];
        const filters: {
            key: string;
            label: string;
            name: string;
            value: string;
        }[] = [];
        product.variants.options.forEach((opt) => {
            opt.values.forEach((val) => {
                filters.push({
                    key: `${opt.name}:${val}`,
                    label: `${opt.name}: ${val}`,
                    name: opt.name,
                    value: val,
                });
            });
        });
        return filters;
    }, [product.variants]);

    // Filtered variation items
    const filteredVariants = useMemo(() => {
        return variantItems.filter((item) => {
            if (selectedOptionFilter !== "all") {
                const [optName, optVal] = selectedOptionFilter.split(":");
                if (item.options[optName] !== optVal) return false;
            }

            if (varSearch.trim() !== "") {
                const term = varSearch.toLowerCase();
                const skuMatch = item.sku?.toLowerCase().includes(term);
                const optionMatch = Object.entries(item.options).some(
                    ([k, v]) =>
                        k.toLowerCase().includes(term) ||
                        v.toLowerCase().includes(term),
                );
                const priceMatch = String(item.price).includes(term);
                return skuMatch || optionMatch || priceMatch;
            }

            return true;
        });
    }, [variantItems, selectedOptionFilter, varSearch]);

    // Paginated variation items
    const totalVarPages =
        varPerPage === 0 ? 1 : Math.ceil(filteredVariants.length / varPerPage);
    const paginatedVariants = useMemo(() => {
        if (varPerPage === 0) return filteredVariants;
        const start = (varPage - 1) * varPerPage;
        return filteredVariants.slice(start, start + varPerPage);
    }, [filteredVariants, varPage, varPerPage]);

    // Grouped variation items by primary option name
    const groupedVariants = useMemo(() => {
        const primaryOptionName = product.variants?.options[0]?.name;
        if (!primaryOptionName) return {};
        const groups: Record<string, ProductVariantItem[]> = {};

        filteredVariants.forEach((item) => {
            const groupKey = item.options[primaryOptionName] ?? "Other";
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(item);
        });

        return groups;
    }, [filteredVariants, product.variants]);

    // Cost & Profit calculations
    const priceNum = Number(product.price);
    const costNum = product.cost_per_item
        ? Number(product.cost_per_item)
        : null;
    const comparePriceNum = product.compare_at_price
        ? Number(product.compare_at_price)
        : null;

    const profit = costNum !== null ? priceNum - costNum : null;
    const profitMargin =
        profit !== null && priceNum > 0 ? (profit / priceNum) * 100 : null;

    const formattedDescription = useMemo(() => {
        if (!product.description) return null;
        return product.description;
    }, [product.description]);

    return (
        <div className="space-y-6 p-5 md:p-8">
            {/* Top Action Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="shrink-0 rounded-lg"
                        aria-label="Back to products"
                    >
                        <Link href={productsRoute.index()}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                {product.name}
                            </h1>
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
                                {product.deleted_at
                                    ? "Deleted"
                                    : product.status}
                            </Badge>

                            {product.is_featured && (
                                <Badge
                                    variant="secondary"
                                    className="gap-1 bg-amber-100 text-amber-900 border-amber-300"
                                >
                                    <Star className="size-3 fill-amber-500 text-amber-500" />{" "}
                                    Featured
                                </Badge>
                            )}

                            <Badge variant="outline" className="capitalize">
                                {product.product_type}
                            </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>SKU: {product.sku || "N/A"}</span>
                            {product.sku && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(product.sku!, "SKU")
                                    }
                                    className="inline-flex items-center text-primary hover:underline"
                                >
                                    {copiedField === "SKU" ? (
                                        <Check className="size-3 text-emerald-600" />
                                    ) : (
                                        <Copy className="size-3" />
                                    )}
                                </button>
                            )}
                            <span>·</span>
                            <span>Slug: {product.slug}</span>
                            <button
                                type="button"
                                onClick={() => handleCopy(product.slug, "Slug")}
                                className="inline-flex items-center text-primary hover:underline"
                            >
                                {copiedField === "Slug" ? (
                                    <Check className="size-3 text-emerald-600" />
                                ) : (
                                    <Copy className="size-3" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="default" className="gap-2">
                        <Link href={productsRoute.edit(product.slug)}>
                            <Pencil className="size-4" /> Edit Product
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Metrics Stat Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            {hasVariants ? "Starting Price" : "Price"}
                        </span>
                        <DollarSign className="size-4 text-emerald-600" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-medium tracking-tight text-foreground">
                            {product.currency} {priceNum.toFixed(2)}
                        </span>
                        {comparePriceNum && comparePriceNum > priceNum && (
                            <span className="text-xs text-muted-foreground line-through">
                                {product.currency} {comparePriceNum.toFixed(2)}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {profitMargin !== null ? (
                            <span className="text-emerald-600 font-medium">
                                Margin: {profitMargin.toFixed(1)}%
                            </span>
                        ) : comparePriceNum && comparePriceNum > priceNum ? (
                            <span className="text-emerald-600 font-medium">
                                Save{" "}
                                {(
                                    100 -
                                    (priceNum / comparePriceNum) * 100
                                ).toFixed(0)}
                                %
                            </span>
                        ) : (
                            "Standard selling price"
                        )}
                    </p>
                </Card>

                <Card className="p-4 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            Inventory
                        </span>
                        <Boxes className="size-4 text-blue-600" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-medium tracking-tight text-foreground">
                            {product.track_inventory ? product.quantity : "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {product.track_inventory
                                ? "units in stock"
                                : "Not tracked"}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {product.track_inventory ? (
                            product.quantity === 0 ? (
                                <span className="text-red-600 font-semibold">
                                    Out of Stock
                                </span>
                            ) : product.quantity <=
                              (product.low_stock_threshold ?? 5) ? (
                                <span className="text-amber-600 font-semibold">
                                    Low Stock Warning
                                </span>
                            ) : (
                                <span className="text-emerald-600 font-semibold">
                                    In Stock
                                </span>
                            )
                        ) : (
                            "Stock tracking disabled"
                        )}
                    </p>
                </Card>

                <Card className="p-4 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            Category & Vendor
                        </span>
                        <Tag className="size-4 text-purple-600" />
                    </div>
                    <div className="mt-2 truncate text-base font-medium text-foreground">
                        {product.category?.name ?? "Uncategorized"}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                        {[product.vendor, product.brand]
                            .filter(Boolean)
                            .join(" · ") || "No brand/vendor set"}
                    </p>
                </Card>

                <Card className="p-4 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            Product Structure
                        </span>
                        <Layers className="size-4 text-indigo-600" />
                    </div>
                    <div className="mt-2 text-base font-medium text-foreground">
                        {hasVariants
                            ? `${variantItems.length} Variations`
                            : "Single Product"}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {hasVariants && variantStats
                            ? `${product.currency} ${variantStats.minPrice.toFixed(2)} - ${product.currency} ${variantStats.maxPrice.toFixed(2)}`
                            : `Condition: ${product.condition}`}
                    </p>
                </Card>
            </div>

            {/* Navigation Tabs Header */}
            <div className="border-b bg-background/95 backdrop-blur-xs sticky top-0 z-10 pt-2">
                <nav
                    className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar"
                    aria-label="Tabs"
                >
                    <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className={`flex items-center gap-2 border-b-2 py-3 px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === "overview"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                        }`}
                    >
                        <Package className="size-4" />
                        Overview
                    </button>

                    {hasVariants && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("variations")}
                            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === "variations"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                            }`}
                        >
                            <Layers className="size-4" />
                            Variations
                            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {variantItems.length}
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setActiveTab("inventory")}
                        className={`flex items-center gap-2 border-b-2 py-3 px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === "inventory"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                        }`}
                    >
                        <Boxes className="size-4" />
                        Inventory & Logistics
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("media")}
                        className={`flex items-center gap-2 border-b-2 py-3 px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === "media"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                        }`}
                    >
                        <ImageIcon className="size-4" />
                        Media & Gallery
                        {images.length > 0 && (
                            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {images.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("seo")}
                        className={`flex items-center gap-2 border-b-2 py-3 px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === "seo"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                        }`}
                    >
                        <Globe className="size-4" />
                        SEO & Search
                    </button>
                </nav>
            </div>

            {/* TAB CONTENT SECTIONS */}

            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Interactive Gallery & Main Image Preview */}
                        <Card className="overflow-hidden p-5">
                            <h3 className="text-sm font-semibold mb-3">
                                Product Media
                            </h3>
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted/30">
                                {selectedImage ? (
                                    <div className="group relative h-full w-full flex items-center justify-center bg-black/5">
                                        <img
                                            src={selectedImage.url}
                                            alt={
                                                selectedImage.alt ||
                                                product.name
                                            }
                                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-102"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setLightboxImage(selectedImage)
                                            }
                                            className="absolute top-3 right-3 rounded-full bg-background/80 p-2 text-foreground shadow-xs hover:bg-background transition-opacity"
                                            title="View Fullscreen"
                                        >
                                            <Maximize2 className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        No image uploaded
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Selector Strip */}
                            {images.length > 1 && (
                                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={img.path || idx}
                                            type="button"
                                            onClick={() =>
                                                setSelectedImage(img)
                                            }
                                            className={`relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                                                selectedImage?.path === img.path
                                                    ? "border-primary ring-2 ring-primary/20"
                                                    : "border-transparent opacity-70 hover:opacity-100"
                                            }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={
                                                    img.alt ||
                                                    `Thumbnail ${idx + 1}`
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Short Description */}
                        {product.short_description && (
                            <Card className="p-5">
                                <h3 className="text-sm font-semibold mb-2">
                                    Short Description
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {product.short_description}
                                </p>
                            </Card>
                        )}

                        {/* Full Rich Description */}
                        {product.description && (
                            <Card className="p-5">
                                <h3 className="text-sm font-semibold mb-3">
                                    Full Product Description
                                </h3>
                                <div
                                    className="prose prose-sm max-w-none text-muted-foreground leading-relaxed overflow-x-auto"
                                    dangerouslySetInnerHTML={{
                                        __html: formattedDescription || "",
                                    }}
                                />
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Overview Details */}
                    <div className="space-y-6">
                        <Card className="p-5 space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2">
                                Product Specifications
                            </h3>
                            <div className="space-y-3">
                                <DetailItem
                                    label="Barcode"
                                    value={product.barcode || "—"}
                                />
                                <DetailItem
                                    label="Condition"
                                    value={product.condition}
                                />
                                <DetailItem
                                    label="Currency"
                                    value={product.currency}
                                />
                                <DetailItem
                                    label="Weight"
                                    value={
                                        product.weight
                                            ? `${product.weight} ${product.weight_unit}`
                                            : "—"
                                    }
                                />
                                <DetailItem
                                    label="Dimensions"
                                    value={
                                        [
                                            product.length,
                                            product.width,
                                            product.height,
                                        ].some(Boolean)
                                            ? `${product.length ?? "—"} × ${product.width ?? "—"} × ${product.height ?? "—"} ${product.dimension_unit}`
                                            : "—"
                                    }
                                />
                            </div>
                        </Card>

                        <Card className="p-5 space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2">
                                Tags & Categorization
                            </h3>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Tags
                                </p>
                                {product.tags && product.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {product.tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        No tags specified.
                                    </p>
                                )}
                            </div>
                            <DetailItem
                                label="Publish Date"
                                value={
                                    product.published_at
                                        ? new Date(
                                              product.published_at,
                                          ).toLocaleDateString()
                                        : "Draft / Unscheduled"
                                }
                            />
                            <DetailItem
                                label="Created At"
                                value={new Date(
                                    product.created_at,
                                ).toLocaleDateString()}
                            />
                        </Card>
                    </div>
                </div>
            )}

            {/* 2. VARIATIONS TAB */}
            {activeTab === "variations" && hasVariants && (
                <div className="space-y-6">
                    {/* Variation Banner Stats */}
                    <Card className="p-5 bg-linear-to-r from-muted/50 via-background to-muted/50">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Product Combinations & Pricing
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Price varies by{" "}
                                    <span className="font-semibold text-foreground">
                                        {product.variants?.price_options.length
                                            ? product.variants.price_options.join(
                                                  " + ",
                                              )
                                            : "all options together"}
                                    </span>
                                </p>
                            </div>
                            {variantStats && (
                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                    <div className="rounded-lg border bg-background px-3 py-1.5 text-center">
                                        <div className="text-muted-foreground">
                                            Total Options
                                        </div>
                                        <div className="font-bold text-foreground text-sm">
                                            {variantStats.totalItems}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border bg-background px-3 py-1.5 text-center">
                                        <div className="text-muted-foreground">
                                            Price Range
                                        </div>
                                        <div className="font-bold text-foreground text-sm">
                                            {product.currency}{" "}
                                            {variantStats.minPrice.toFixed(2)} -{" "}
                                            {product.currency}{" "}
                                            {variantStats.maxPrice.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border bg-background px-3 py-1.5 text-center">
                                        <div className="text-muted-foreground">
                                            Total Variant Stock
                                        </div>
                                        <div className="font-bold text-foreground text-sm">
                                            {variantStats.totalStock} units
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Filter & Search Bar */}
                    <Card className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 items-center gap-2">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by SKU or option..."
                                        value={varSearch}
                                        onChange={(e) => {
                                            setVarSearch(e.target.value);
                                            setVarPage(1);
                                        }}
                                        className="pl-9 h-9 text-xs"
                                    />
                                    {varSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setVarSearch("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    )}
                                </div>

                                {optionFilters.length > 0 && (
                                    <Select
                                        value={selectedOptionFilter}
                                        onValueChange={(val) => {
                                            setSelectedOptionFilter(val);
                                            setVarPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 w-44 text-xs bg-background">
                                            <SelectValue placeholder="All option values" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Option Values
                                            </SelectItem>
                                            {optionFilters.map((opt) => (
                                                <SelectItem
                                                    key={opt.key}
                                                    value={opt.key}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                                <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                                    <button
                                        type="button"
                                        onClick={() => setVarViewMode("table")}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                                            varViewMode === "table"
                                                ? "bg-background shadow-xs text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <List className="size-3.5" /> Table
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setVarViewMode("grouped")
                                        }
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                                            varViewMode === "grouped"
                                                ? "bg-background shadow-xs text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Grid className="size-3.5" /> Grouped
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        Show:
                                    </span>
                                    <Select
                                        value={String(varPerPage)}
                                        onValueChange={(val) => {
                                            setVarPerPage(Number(val));
                                            setVarPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-20 text-xs bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">
                                                10
                                            </SelectItem>
                                            <SelectItem value="25">
                                                25
                                            </SelectItem>
                                            <SelectItem value="50">
                                                50
                                            </SelectItem>
                                            <SelectItem value="100">
                                                100
                                            </SelectItem>
                                            <SelectItem value="0">
                                                All
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* VIEW MODE: TABLE */}
                    {varViewMode === "table" && (
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left text-sm">
                                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">
                                                Variant Combination
                                            </th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3">
                                                Compare At
                                            </th>
                                            <th className="px-4 py-3">SKU</th>
                                            <th className="px-4 py-3">
                                                Inventory
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {paginatedVariants.length > 0 ? (
                                            paginatedVariants.map(
                                                (variant, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="hover:bg-muted/20 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 font-medium">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {Object.entries(
                                                                    variant.options,
                                                                ).map(
                                                                    ([
                                                                        k,
                                                                        v,
                                                                    ]) => (
                                                                        <Badge
                                                                            key={
                                                                                k
                                                                            }
                                                                            variant="outline"
                                                                            className="text-xs bg-background font-normal"
                                                                        >
                                                                            <span className="text-muted-foreground mr-1">
                                                                                {
                                                                                    k
                                                                                }

                                                                                :
                                                                            </span>
                                                                            <span className="font-semibold text-foreground">
                                                                                {
                                                                                    v
                                                                                }
                                                                            </span>
                                                                        </Badge>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-foreground tabular-nums">
                                                            {product.currency}{" "}
                                                            {Number(
                                                                variant.price,
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                                                            {variant.compare_at_price
                                                                ? `${product.currency} ${Number(variant.compare_at_price).toFixed(2)}`
                                                                : "—"}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                            {variant.sku || "—"}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap tabular-nums font-medium">
                                                            {variant.quantity}{" "}
                                                            units
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {variant.quantity >
                                                            0 ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
                                                                >
                                                                    In Stock
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-red-200 bg-red-50 text-red-700 text-xs"
                                                                >
                                                                    Out of Stock
                                                                </Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-8 text-center text-muted-foreground text-xs"
                                                >
                                                    No variations found matching
                                                    filter criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination controls */}
                            {varPerPage > 0 && totalVarPages > 1 && (
                                <div className="flex items-center justify-between border-t px-4 py-3">
                                    <div className="text-xs text-muted-foreground">
                                        Showing{" "}
                                        {Math.min(
                                            (varPage - 1) * varPerPage + 1,
                                            filteredVariants.length,
                                        )}{" "}
                                        to{" "}
                                        {Math.min(
                                            varPage * varPerPage,
                                            filteredVariants.length,
                                        )}{" "}
                                        of {filteredVariants.length} entries
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={varPage <= 1}
                                            onClick={() =>
                                                setVarPage((p) =>
                                                    Math.max(p - 1, 1),
                                                )
                                            }
                                            className="h-8 gap-1 text-xs"
                                        >
                                            <ChevronLeft className="size-3.5" />{" "}
                                            Previous
                                        </Button>
                                        <span className="text-xs font-medium px-2">
                                            {varPage} / {totalVarPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={varPage >= totalVarPages}
                                            onClick={() =>
                                                setVarPage((p) =>
                                                    Math.min(
                                                        p + 1,
                                                        totalVarPages,
                                                    ),
                                                )
                                            }
                                            className="h-8 gap-1 text-xs"
                                        >
                                            Next{" "}
                                            <ChevronRight className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* VIEW MODE: GROUPED */}
                    {varViewMode === "grouped" && (
                        <div className="space-y-4">
                            {Object.keys(groupedVariants).length > 0 ? (
                                Object.entries(groupedVariants).map(
                                    ([groupName, items]) => (
                                        <Card
                                            key={groupName}
                                            className="p-4 space-y-3"
                                        >
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                    <Badge variant="secondary">
                                                        {product.variants
                                                            ?.options[0]
                                                            ?.name || "Group"}
                                                    </Badge>
                                                    {groupName}
                                                </h3>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {items.length} items · Total
                                                    Stock:{" "}
                                                    {items.reduce(
                                                        (acc, i) =>
                                                            acc +
                                                            Number(i.quantity),
                                                        0,
                                                    )}{" "}
                                                    units
                                                </span>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {items.map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="rounded-lg border p-3 bg-muted/20 space-y-1.5"
                                                    >
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(
                                                                item.options,
                                                            ).map(([k, v]) => (
                                                                <span
                                                                    key={k}
                                                                    className="text-xs text-muted-foreground"
                                                                >
                                                                    <strong className="text-foreground">
                                                                        {k}:
                                                                    </strong>{" "}
                                                                    {v}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-baseline justify-between pt-1">
                                                            <span className="text-sm font-bold text-foreground">
                                                                {
                                                                    product.currency
                                                                }{" "}
                                                                {Number(
                                                                    item.price,
                                                                ).toFixed(2)}
                                                            </span>
                                                            <span className="text-xs font-semibold text-muted-foreground">
                                                                Qty:{" "}
                                                                {item.quantity}
                                                            </span>
                                                        </div>
                                                        {item.sku && (
                                                            <p className="text-[11px] font-mono text-muted-foreground">
                                                                SKU: {item.sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ),
                                )
                            ) : (
                                <Card className="p-8 text-center text-xs text-muted-foreground">
                                    No variation groups found.
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 3. INVENTORY & LOGISTICS TAB */}
            {activeTab === "inventory" && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="p-5 space-y-5">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center gap-2">
                            <Boxes className="size-4 text-blue-600" /> Inventory
                            Tracking Rules
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                <div>
                                    <p className="text-sm font-medium">
                                        Inventory Tracking
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Track available quantity for order
                                        fulfillment
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        product.track_inventory
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {product.track_inventory
                                        ? "Enabled"
                                        : "Disabled"}
                                </Badge>
                            </div>

                            <DetailItem
                                label="Total Available Quantity"
                                value={`${product.quantity} units`}
                            />

                            <DetailItem
                                label="Low Stock Warning Threshold"
                                value={`${product.low_stock_threshold ?? 5} units`}
                            />

                            <DetailItem
                                label="Backorder Policy"
                                value={
                                    product.allow_backorder ? (
                                        <span className="text-emerald-600 font-medium">
                                            Allow purchases when out of stock
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Stop selling when out of stock
                                        </span>
                                    )
                                }
                            />
                        </div>
                    </Card>

                    <Card className="p-5 space-y-5">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center gap-2">
                            <Truck className="size-4 text-emerald-600" />{" "}
                            Shipping & Physical Measurements
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                <div>
                                    <p className="text-sm font-medium">
                                        Requires Shipping
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Calculates shipping rates at checkout
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        product.requires_shipping
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {product.requires_shipping
                                        ? "Required"
                                        : "Not Required"}
                                </Badge>
                            </div>

                            <DetailItem
                                label="Package Weight"
                                value={
                                    product.weight
                                        ? `${product.weight} ${product.weight_unit}`
                                        : "Not specified"
                                }
                            />

                            <DetailItem
                                label="Package Dimensions (L × W × H)"
                                value={
                                    [
                                        product.length,
                                        product.width,
                                        product.height,
                                    ].some(Boolean)
                                        ? `${product.length ?? "—"} × ${product.width ?? "—"} × ${product.height ?? "—"} ${product.dimension_unit}`
                                        : "Not specified"
                                }
                            />

                            {costNum !== null && (
                                <div className="mt-4 p-3 rounded-lg border bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20">
                                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                                        Profit & Margins
                                    </p>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">
                                                Cost Per Item:
                                            </span>{" "}
                                            <strong>
                                                {product.currency}{" "}
                                                {costNum.toFixed(2)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Est. Profit/Unit:
                                            </span>{" "}
                                            <strong className="text-emerald-700">
                                                {product.currency}{" "}
                                                {(profit ?? 0).toFixed(2)}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* 4. MEDIA & GALLERY TAB */}
            {activeTab === "media" && (
                <Card className="p-5 space-y-6">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                Media Assets
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                All uploaded images for this product listing (
                                {images.length} files)
                            </p>
                        </div>
                    </div>

                    {images.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {images.map((img, idx) => (
                                <div
                                    key={img.path || idx}
                                    className="group relative rounded-lg border bg-card p-2 space-y-2 shadow-xs hover:shadow-md transition-shadow"
                                >
                                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                                        <img
                                            src={img.url}
                                            alt={img.alt || img.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setLightboxImage(img)
                                            }
                                            className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                                        >
                                            <Eye className="size-4" />
                                        </button>
                                        {idx === 0 && (
                                            <span className="absolute bottom-2 left-2 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                                Main Image
                                            </span>
                                        )}
                                    </div>
                                    <div className="px-1 text-xs">
                                        <p className="truncate font-medium text-foreground">
                                            {img.name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {img.mimeType}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground text-sm">
                            No media assets associated with this product.
                        </div>
                    )}
                </Card>
            )}

            {/* 5. SEO & SEARCH TAB */}
            {activeTab === "seo" && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Real-time Google Search Result Preview */}
                    <Card className="p-5 space-y-4">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center gap-2">
                            <Search className="size-4 text-blue-500" /> Google
                            Search Result Preview
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Simulated representation of how this product appears
                            in search engine listings.
                        </p>
                        <div className="rounded-lg border p-4 bg-background space-y-1 font-sans">
                            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 truncate">
                                <span>
                                    https://yourstore.com › products ›{" "}
                                    {product.slug}
                                </span>
                            </div>
                            <h4 className="text-base font-medium text-blue-800 dark:text-blue-400 hover:underline cursor-pointer truncate">
                                {product.meta_title || product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {product.meta_description ||
                                    product.short_description ||
                                    product.description?.replace(
                                        /<[^>]*>/g,
                                        " ",
                                    ) ||
                                    "No meta description set. Search engines will extract content automatically."}
                            </p>
                        </div>
                    </Card>

                    {/* SEO Metadata Details */}
                    <Card className="p-5 space-y-4">
                        <h3 className="text-base font-semibold border-b pb-2 flex items-center gap-2">
                            <Globe className="size-4 text-purple-600" /> Meta
                            Information & Directives
                        </h3>
                        <div className="space-y-3 text-xs">
                            <DetailItem
                                label="Meta Title"
                                value={
                                    product.meta_title ||
                                    "Fallback to Product Name"
                                }
                            />
                            <DetailItem
                                label="Meta Description"
                                value={
                                    product.meta_description ||
                                    "Fallback to Short Description"
                                }
                            />
                            <DetailItem
                                label="Canonical URL"
                                value={
                                    product.canonical_url ||
                                    "Default product permalink"
                                }
                            />
                            <DetailItem
                                label="Search Engine Robots Directive"
                                value={
                                    <Badge variant="outline">
                                        {product.robots}
                                    </Badge>
                                }
                            />
                        </div>
                    </Card>
                </div>
            )}

            {/* LIGHTBOX FULLSCREEN MODAL */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-background shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="size-5" />
                        </button>
                        <img
                            src={lightboxImage.url}
                            alt={lightboxImage.alt || product.name}
                            className="max-h-[85vh] max-w-[85vw] object-contain"
                        />
                        <div className="p-3 bg-background border-t text-center text-xs text-muted-foreground">
                            {lightboxImage.name}{" "}
                            {lightboxImage.alt && `· ${lightboxImage.alt}`}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between border-b border-muted/50 pb-2 last:border-0 last:pb-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-semibold text-foreground break-words sm:text-right">
                {value}
            </span>
        </div>
    );
}

export default ProductShow;

ProductShow.layout = {
    breadcrumbs: [
        { title: "Dashboard", href: dashboard() },
        { title: "Products", href: productsRoute.index() },
        { title: "Details" },
    ],
};
