import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboard } from "@/routes";
import productsRoute from "@/routes/admin/products";
import type { ProductShowPageProps } from "@/types/props";
import { Link } from "@inertiajs/react";
import { ArrowLeft, Pencil, Star } from "lucide-react";

const ProductShow = ({ product }: ProductShowPageProps) => {
    const description = product.description
        ?.replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return (
        <div className="space-y-6 p-5 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        aria-label="Back to products"
                    >
                        <Link href={productsRoute.index()}>
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <Heading
                        title={product.name}
                        description={
                            product.sku ? `SKU ${product.sku}` : product.slug
                        }
                    />
                </div>
                <Button asChild>
                    <Link href={productsRoute.edit(product.slug)}>
                        <Pencil /> Edit product
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-6">
                    <section className="grid gap-5 rounded-lg border bg-background p-5 sm:grid-cols-3">
                        <Detail
                            label={
                                product.variants?.pricing_mode === "variants"
                                    ? "Starting price"
                                    : "Price"
                            }
                            value={`${product.currency} ${Number(product.price).toFixed(2)}`}
                        />
                        <Detail
                            label="Status"
                            value={
                                <Badge variant="outline">
                                    {product.status}
                                </Badge>
                            }
                        />
                        <Detail
                            label="Inventory"
                            value={
                                product.track_inventory
                                    ? `${product.quantity} units`
                                    : "Not tracked"
                            }
                        />
                        <Detail
                            label="Category"
                            value={product.category?.name ?? "Uncategorized"}
                        />
                        <Detail label="Type" value={product.product_type} />
                        <Detail
                            label="Vendor / brand"
                            value={
                                [product.vendor, product.brand]
                                    .filter(Boolean)
                                    .join(" · ") || "—"
                            }
                        />
                        <Detail label="Condition" value={product.condition} />
                        <Detail
                            label="Barcode"
                            value={product.barcode || "—"}
                        />
                        <Detail
                            label="Featured"
                            value={
                                product.is_featured ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Star className="size-4 fill-amber-400 text-amber-500" />{" "}
                                        Featured
                                    </span>
                                ) : (
                                    "No"
                                )
                            }
                        />
                    </section>

                    {product.short_description && (
                        <section className="space-y-2 rounded-lg border bg-background p-5">
                            <h2 className="text-sm font-semibold">
                                Short description
                            </h2>
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {product.short_description}
                            </p>
                        </section>
                    )}

                    {description && (
                        <section className="space-y-2 rounded-lg border bg-background p-5">
                            <h2 className="text-sm font-semibold">
                                Description
                            </h2>
                            <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                                {description}
                            </p>
                        </section>
                    )}

                    {product.variants?.pricing_mode === "variants" && (
                        <section className="space-y-4 rounded-lg border bg-background p-5">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="text-sm font-semibold">
                                    Variations
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {product.variants.items.length} combinations
                                    · {product.quantity} units total
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Price varies by{" "}
                                {product.variants.price_options.length > 0
                                    ? product.variants.price_options.join(" + ")
                                    : "all options together"}
                                .
                            </p>
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full min-w-[700px] text-left text-sm">
                                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2">
                                                Options
                                            </th>
                                            <th className="px-3 py-2">Price</th>
                                            <th className="px-3 py-2">
                                                Compare-at
                                            </th>
                                            <th className="px-3 py-2">SKU</th>
                                            <th className="px-3 py-2">
                                                Quantity
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {product.variants.items.map(
                                            (variant, index) => (
                                                <tr
                                                    key={`${index}-${variant.sku ?? ""}`}
                                                >
                                                    <td className="px-3 py-3">
                                                        {Object.entries(
                                                            variant.options,
                                                        )
                                                            .map(
                                                                ([
                                                                    name,
                                                                    value,
                                                                ]) =>
                                                                    `${name}: ${value}`,
                                                            )
                                                            .join(" · ")}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap tabular-nums">
                                                        {product.currency}{" "}
                                                        {Number(
                                                            variant.price,
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                                                        {variant.compare_at_price ==
                                                        null
                                                            ? "—"
                                                            : `${product.currency} ${Number(variant.compare_at_price).toFixed(2)}`}
                                                    </td>
                                                    <td className="px-3 py-3 text-muted-foreground">
                                                        {variant.sku || "—"}
                                                    </td>
                                                    <td className="px-3 py-3 tabular-nums">
                                                        {variant.quantity}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    <section className="grid gap-5 rounded-lg border bg-background p-5 sm:grid-cols-2">
                        <Detail
                            label="Compare-at price"
                            value={
                                product.compare_at_price
                                    ? `${product.currency} ${Number(product.compare_at_price).toFixed(2)}`
                                    : "—"
                            }
                        />
                        <Detail
                            label="Cost per item"
                            value={
                                product.cost_per_item
                                    ? `${product.currency} ${Number(product.cost_per_item).toFixed(2)}`
                                    : "—"
                            }
                        />
                        <Detail
                            label="Backorders"
                            value={
                                product.allow_backorder
                                    ? "Allowed"
                                    : "Not allowed"
                            }
                        />
                        <Detail
                            label="Low stock threshold"
                            value={product.low_stock_threshold ?? "—"}
                        />
                        <Detail
                            label="Shipping"
                            value={
                                product.requires_shipping
                                    ? "Required"
                                    : "Not required"
                            }
                        />
                        <Detail
                            label="Weight"
                            value={
                                product.weight
                                    ? `${product.weight} ${product.weight_unit}`
                                    : "—"
                            }
                        />
                        <Detail
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
                        <Detail
                            label="Published"
                            value={product.published_at ?? "Not published"}
                        />
                        <Detail
                            label="Tags"
                            value={product.tags?.join(", ") || "—"}
                        />
                    </section>
                </div>

                <aside className="space-y-5">
                    <section className="space-y-4 rounded-lg border bg-background p-5">
                        <h2 className="text-sm font-semibold">Media</h2>
                        {product.main_image_asset ? (
                            <img
                                src={product.main_image_asset.url}
                                alt={
                                    product.main_image_asset.alt ||
                                    product.main_image_asset.name
                                }
                                className="aspect-square w-full rounded-md border object-cover"
                            />
                        ) : (
                            <div className="flex aspect-square items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
                                No main image
                            </div>
                        )}
                        {product.gallery_assets &&
                            product.gallery_assets.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {product.gallery_assets.map((image) => (
                                        <img
                                            key={image.path}
                                            src={image.url}
                                            alt={image.alt || image.name}
                                            className="aspect-square w-full rounded border object-cover"
                                        />
                                    ))}
                                </div>
                            )}
                    </section>

                    <section className="space-y-3 rounded-lg border bg-background p-5">
                        <h2 className="text-sm font-semibold">SEO</h2>
                        <Detail
                            label="Meta title"
                            value={product.meta_title || "—"}
                        />
                        <Detail
                            label="Meta description"
                            value={product.meta_description || "—"}
                        />
                        <Detail
                            label="Canonical URL"
                            value={product.canonical_url || "—"}
                        />
                        <Detail label="Robots" value={product.robots} />
                    </section>
                </aside>
            </div>
        </div>
    );
};

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="text-sm break-words">{value}</div>
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
