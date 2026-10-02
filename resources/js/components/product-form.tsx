import GalleryImagePicker from "@/components/gallery-image-picker";
import type { GalleryImage } from "@/components/gallery-image-picker";
import Heading from "@/components/heading";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductVariantEditor } from "@/components/product-variant-editor";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import products from "@/routes/admin/products";
import type { ProductCategoryOption } from "@/types/data";
import type { ProductFormPageProps } from "@/types/props";
import { Form, Link } from "@inertiajs/react";
import JoditEditor from "jodit-react";
import { Check, Search, X } from "lucide-react";
import { useState } from "react";

type ProductFormProps = Omit<ProductFormPageProps, "categories"> & {
    categories: ProductCategoryOption[];
    filterUrl: string;
    cancelHref?: string;
};

const formatJson = (value: unknown): string =>
    value == null ? "" : JSON.stringify(value, null, 2);

const ProductForm = ({
    product,
    categories,
    media,
    counts,
    filter,
    search,
    filterUrl,
    cancelHref,
}: ProductFormProps) => {
    const [mainImage, setMainImage] = useState<GalleryImage | null>(
        product?.main_image_asset ?? null,
    );
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(
        product?.gallery_assets ?? [],
    );
    const [ogImage, setOgImage] = useState<GalleryImage | null>(
        product?.og_image_asset ?? null,
    );
    const [categoryId, setCategoryId] = useState(
        product?.category_id ? String(product.category_id) : "none",
    );
    const [categorySearch, setCategorySearch] = useState("");
    const [status, setStatus] = useState<"draft" | "active" | "archived">(
        product?.status ?? "active",
    );
    const [tags, setTags] = useState<string[]>(product?.tags ?? []);
    const [tagDraft, setTagDraft] = useState("");
    const visibleCategories = categories.filter((category) =>
        category.name
            .toLowerCase()
            .includes(categorySearch.trim().toLowerCase()),
    );
    const action = product
        ? { action: products.update.url(product.slug), method: "put" as const }
        : products.store.form();

    return (
        <Form {...action} className="space-y-5">
            {({ errors, processing }) => (
                <>
                    <input type="hidden" name="status" value={status} />
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
                        <div className="min-w-0 space-y-5">
                            <section className="space-y-4 rounded-lg border bg-background p-4">
                                <Heading
                                    title="Product details"
                                    description="Set the product name, organization, and customer-facing descriptions."
                                    variant="small"
                                />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field
                                        label="Product name"
                                        error={errors.name}
                                        help="The name customers see in your catalog."
                                    >
                                        <Input
                                            name="name"
                                            defaultValue={product?.name ?? ""}
                                            maxLength={255}
                                            required
                                        />
                                    </Field>
                                    <Field
                                        label="Subtitle"
                                        error={errors.subtitle}
                                        help="Optional supporting line shown with the product name."
                                    >
                                        <Input
                                            name="subtitle"
                                            defaultValue={
                                                product?.subtitle ?? ""
                                            }
                                            maxLength={255}
                                        />
                                    </Field>
                                    <Field
                                        label="Barcode"
                                        error={errors.barcode}
                                        help="Add a UPC, EAN, or other barcode when available."
                                    >
                                        <Input
                                            name="barcode"
                                            defaultValue={
                                                product?.barcode ?? ""
                                            }
                                            maxLength={255}
                                        />
                                    </Field>
                                    <div className="flex flex-col gap-2 md:flex-row">
                                        <Field
                                            label="Category"
                                            error={errors.category_id}
                                            help="Assign a category so customers can browse and filter products."
                                        >
                                            <Select
                                                value={categoryId}
                                                onValueChange={(value) => {
                                                    setCategoryId(value);
                                                    setCategorySearch("");
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div
                                                        className="border-b p-2"
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key !==
                                                                "Escape"
                                                            ) {
                                                                event.stopPropagation();
                                                            }
                                                        }}
                                                        onPointerDown={(
                                                            event,
                                                        ) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        <div className="relative">
                                                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                                            <Input
                                                                autoFocus
                                                                value={
                                                                    categorySearch
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setCategorySearch(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Search categories..."
                                                                aria-label="Search product categories"
                                                                className="h-8 pl-8"
                                                            />
                                                        </div>
                                                    </div>
                                                    <SelectItem value="none">
                                                        Uncategorized
                                                    </SelectItem>
                                                    {visibleCategories.map(
                                                        (category) => (
                                                            <SelectItem
                                                                key={
                                                                    category.id
                                                                }
                                                                value={String(
                                                                    category.id,
                                                                )}
                                                            >
                                                                {category.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                    {visibleCategories.length ===
                                                        0 && (
                                                        <div className="px-2 py-3 text-sm text-muted-foreground">
                                                            No categories found.
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                name="category_id"
                                                value={
                                                    categoryId === "none"
                                                        ? ""
                                                        : categoryId
                                                }
                                            />
                                        </Field>
                                        <Field
                                            label="Product type"
                                            error={errors.product_type}
                                            help="Physical products can require shipping; digital products and services do not."
                                        >
                                            <Select
                                                name="product_type"
                                                defaultValue={
                                                    product?.product_type ??
                                                    "physical"
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="physical">
                                                        Physical
                                                    </SelectItem>
                                                    <SelectItem value="digital">
                                                        Digital
                                                    </SelectItem>
                                                    <SelectItem value="service">
                                                        Service
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                    <Field
                                        label="Vendor"
                                        error={errors.vendor}
                                        help="The manufacturer, supplier, or store name."
                                    >
                                        <Input
                                            name="vendor"
                                            defaultValue={product?.vendor ?? ""}
                                            maxLength={255}
                                        />
                                    </Field>
                                    <Field
                                        label="Brand"
                                        error={errors.brand}
                                        help="The brand customers associate with this product."
                                    >
                                        <Input
                                            name="brand"
                                            defaultValue={product?.brand ?? ""}
                                            maxLength={255}
                                        />
                                    </Field>
                                    <div className="flex flex-col gap-2 md:flex-row">
                                        <Field
                                            label="Condition"
                                            error={errors.condition}
                                            help="Describe whether the item is new, used, or refurbished."
                                        >
                                            <Select
                                                name="condition"
                                                defaultValue={
                                                    product?.condition ?? "new"
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="new">
                                                        New
                                                    </SelectItem>
                                                    <SelectItem value="used">
                                                        Used
                                                    </SelectItem>
                                                    <SelectItem value="refurbished">
                                                        Refurbished
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="short_description">
                                        Short description
                                    </Label>
                                    <textarea
                                        id="short_description"
                                        name="short_description"
                                        defaultValue={
                                            product?.short_description ?? ""
                                        }
                                        maxLength={2000}
                                        rows={3}
                                        className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError
                                        message={errors.short_description}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        A plain-text summary for compact product
                                        cards and previews.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <JoditEditor
                                        id="description"
                                        name="description"
                                        value={product?.description ?? ""}
                                    />
                                    <InputError message={errors.description} />
                                    <p className="text-xs text-muted-foreground">
                                        Use the editor toolbar for formatting,
                                        links, and lists.
                                    </p>
                                </div>
                            </section>

                            <ProductVariantEditor
                                product={product}
                                errors={errors}
                            />

                            <section className="space-y-4 rounded-lg border bg-background p-4">
                                <Heading title="Inventory" variant="small" />
                                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    <ToggleField
                                        label="Track inventory"
                                        name="track_inventory"
                                        checked={
                                            product?.track_inventory ?? true
                                        }
                                        help="Turn off when stock is managed outside this catalog."
                                    />

                                    <ToggleField
                                        label="Allow backorders"
                                        name="allow_backorder"
                                        checked={
                                            product?.allow_backorder ?? false
                                        }
                                    />
                                    <ToggleField
                                        label="Requires shipping"
                                        name="requires_shipping"
                                        checked={
                                            product?.requires_shipping ?? true
                                        }
                                    />
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                                    <Field
                                        label="Weight"
                                        error={errors.weight}
                                        help="Used to estimate shipping charges."
                                    >
                                        <Input
                                            type="number"
                                            name="weight"
                                            min="0"
                                            step="0.001"
                                            defaultValue={product?.weight ?? ""}
                                        />
                                    </Field>
                                    <Field
                                        label="Weight unit"
                                        error={errors.weight_unit}
                                        help="Unit used by the weight value."
                                    >
                                        <Select
                                            name="weight_unit"
                                            defaultValue={
                                                product?.weight_unit ?? "kg"
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kg">
                                                    kg
                                                </SelectItem>
                                                <SelectItem value="g">
                                                    g
                                                </SelectItem>
                                                <SelectItem value="lb">
                                                    lb
                                                </SelectItem>
                                                <SelectItem value="oz">
                                                    oz
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field
                                        label="Dimensions unit"
                                        error={errors.dimension_unit}
                                        help="Unit used by length, width, and height."
                                    >
                                        <Select
                                            name="dimension_unit"
                                            defaultValue={
                                                product?.dimension_unit ?? "cm"
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cm">
                                                    cm
                                                </SelectItem>
                                                <SelectItem value="mm">
                                                    mm
                                                </SelectItem>
                                                <SelectItem value="in">
                                                    in
                                                </SelectItem>
                                                <SelectItem value="ft">
                                                    ft
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    {(
                                        ["length", "width", "height"] as const
                                    ).map((dimension) => (
                                        <Field
                                            key={dimension}
                                            label={
                                                dimension[0].toUpperCase() +
                                                dimension.slice(1)
                                            }
                                            error={errors[dimension]}
                                            help="Leave blank when the dimension does not apply."
                                        >
                                            <Input
                                                type="number"
                                                name={dimension}
                                                min="0"
                                                step="0.01"
                                                defaultValue={
                                                    product?.[dimension] ?? ""
                                                }
                                            />
                                        </Field>
                                    ))}
                                    <Field
                                        label="Low stock threshold"
                                        error={errors.low_stock_threshold}
                                        help="Products at or below this quantity appear in the low-stock filter."
                                    >
                                        <Input
                                            type="number"
                                            name="low_stock_threshold"
                                            min="0"
                                            step="1"
                                            defaultValue={
                                                product?.low_stock_threshold ??
                                                ""
                                            }
                                        />
                                    </Field>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-lg border bg-background p-4">
                                <Heading
                                    title="Variants and organization"
                                    variant="small"
                                />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <ToggleField
                                        label="Featured product"
                                        name="is_featured"
                                        checked={product?.is_featured ?? false}
                                        help="Highlights this product in featured placements."
                                    />
                                    <Field
                                        label="Sort order"
                                        error={errors.sort_order}
                                        help="Lower numbers are ordered first in storefront listings."
                                    >
                                        <Input
                                            type="number"
                                            name="sort_order"
                                            min="0"
                                            step="1"
                                            defaultValue={
                                                product?.sort_order ?? 0
                                            }
                                            required
                                        />
                                    </Field>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Tags</Label>
                                        <input
                                            type="hidden"
                                            name="tags_text"
                                            value={tags.join(", ")}
                                        />
                                        <div className="flex min-h-9 flex-wrap gap-1.5">
                                            {tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 rounded-md border bg-muted/40 py-1 pr-1 pl-2 text-xs font-medium"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground"
                                                        aria-label={`Remove tag ${tag}`}
                                                        onClick={() =>
                                                            setTags((current) =>
                                                                current.filter(
                                                                    (item) =>
                                                                        item !==
                                                                        tag,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tagDraft}
                                                maxLength={80}
                                                placeholder="Type a tag and press Enter"
                                                onChange={(event) =>
                                                    setTagDraft(
                                                        event.target.value,
                                                    )
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        addTag(
                                                            tagDraft,
                                                            tags,
                                                            setTags,
                                                            setTagDraft,
                                                        );
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Add tag"
                                                title="Add tag"
                                                disabled={!tagDraft.trim()}
                                                onClick={() =>
                                                    addTag(
                                                        tagDraft,
                                                        tags,
                                                        setTags,
                                                        setTagDraft,
                                                    )
                                                }
                                            >
                                                <Check />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Tags are only added after you
                                            confirm them.
                                        </p>
                                        <InputError
                                            message={errors.tags_text}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-lg border bg-background p-4">
                                <Heading
                                    title="Search engine metadata"
                                    variant="small"
                                />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field
                                        label="Meta title"
                                        error={errors.meta_title}
                                        help="Search result title; keep it concise and relevant."
                                    >
                                        <Input
                                            name="meta_title"
                                            defaultValue={
                                                product?.meta_title ?? ""
                                            }
                                            maxLength={255}
                                        />
                                    </Field>
                                    <Field
                                        label="Canonical URL"
                                        error={errors.canonical_url}
                                        help="Optional preferred URL for duplicate or syndicated pages."
                                    >
                                        <Input
                                            type="url"
                                            name="canonical_url"
                                            defaultValue={
                                                product?.canonical_url ?? ""
                                            }
                                            maxLength={2048}
                                        />
                                    </Field>
                                    <Field
                                        label="Open Graph title"
                                        error={errors.og_title}
                                    >
                                        <Input
                                            name="og_title"
                                            defaultValue={
                                                product?.og_title ?? ""
                                            }
                                            maxLength={255}
                                        />
                                    </Field>
                                    <Field
                                        label="Robots"
                                        error={errors.robots}
                                        help="Controls whether search engines index the page or follow its links."
                                    >
                                        <Select
                                            name="robots"
                                            defaultValue={
                                                product?.robots ??
                                                "index,follow"
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="index,follow">
                                                    index,follow
                                                </SelectItem>
                                                <SelectItem value="noindex,follow">
                                                    noindex,follow
                                                </SelectItem>
                                                <SelectItem value="index,nofollow">
                                                    index,nofollow
                                                </SelectItem>
                                                <SelectItem value="noindex,nofollow">
                                                    noindex,nofollow
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field
                                        label="Publish date"
                                        error={errors.published_at}
                                        help="Leave blank to publish immediately when status is active."
                                    >
                                        <Input
                                            type="datetime-local"
                                            name="published_at"
                                            defaultValue={
                                                product?.published_at?.slice(
                                                    0,
                                                    16,
                                                ) ?? ""
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Meta description"
                                        error={errors.meta_description}
                                        className="sm:col-span-2"
                                        help="A short summary that may appear below the search result title."
                                    >
                                        <textarea
                                            name="meta_description"
                                            defaultValue={
                                                product?.meta_description ?? ""
                                            }
                                            maxLength={5000}
                                            rows={3}
                                            className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                    </Field>
                                    <Field
                                        label="Open Graph description"
                                        error={errors.og_description}
                                        className="sm:col-span-2"
                                        help="Summary used when this product is shared on social platforms."
                                    >
                                        <textarea
                                            name="og_description"
                                            defaultValue={
                                                product?.og_description ?? ""
                                            }
                                            maxLength={5000}
                                            rows={3}
                                            className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                    </Field>
                                    <Field
                                        label="Metadata (JSON)"
                                        error={errors.metadata_json}
                                        className="sm:col-span-2"
                                        help="Optional custom key/value data for integrations."
                                    >
                                        <JsonInput
                                            name="metadata_json"
                                            value={formatJson(
                                                product?.metadata,
                                            )}
                                            rows={4}
                                        />
                                    </Field>
                                </div>
                            </section>
                        </div>

                        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                            <section className="space-y-4 rounded-lg border bg-background p-4">
                                <Heading title="Media" variant="small" />
                                <div className="space-y-3">
                                    <Label>Main image</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Used as the primary catalog and product
                                        detail image.
                                    </p>
                                    <input
                                        type="hidden"
                                        name="main_image"
                                        value={mainImage?.path ?? ""}
                                    />
                                    {mainImage && (
                                        <img
                                            src={mainImage.url}
                                            alt={
                                                mainImage.alt || mainImage.name
                                            }
                                            className="aspect-square w-full rounded-md border object-cover"
                                        />
                                    )}
                                    <GalleryImagePicker
                                        id="product-main-image"
                                        media={media}
                                        counts={counts}
                                        filter={filter}
                                        search={search}
                                        filterUrl={filterUrl}
                                        selectedImage={mainImage}
                                        onSelect={setMainImage}
                                    />
                                    {mainImage && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setMainImage(null)}
                                        >
                                            Remove main image
                                        </Button>
                                    )}
                                    <InputError message={errors.main_image} />
                                </div>
                                <div className="space-y-3">
                                    <Label>Gallery</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Add alternate product views from your
                                        gallery library.
                                    </p>
                                    {galleryImages.length === 0 && (
                                        <input
                                            type="hidden"
                                            name="gallery"
                                            value=""
                                        />
                                    )}
                                    {galleryImages.map((image, index) => (
                                        <div
                                            key={image.id}
                                            className="flex items-center gap-2 rounded-md border p-2"
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.alt || image.name}
                                                className="size-12 rounded object-cover"
                                            />
                                            <span className="min-w-0 flex-1 truncate text-sm">
                                                {image.name}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setGalleryImages(
                                                        (current) =>
                                                            current.filter(
                                                                (
                                                                    _,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex !==
                                                                    index,
                                                            ),
                                                    )
                                                }
                                            >
                                                Remove
                                            </Button>
                                            <input
                                                type="hidden"
                                                name={`gallery[${index}]`}
                                                value={image.path}
                                            />
                                        </div>
                                    ))}
                                    <GalleryImagePicker
                                        id="product-gallery-images"
                                        media={media}
                                        counts={counts}
                                        filter={filter}
                                        search={search}
                                        filterUrl={filterUrl}
                                        selectedImage={null}
                                        onSelect={() => undefined}
                                        multiple
                                        selectedImages={galleryImages}
                                        onSelectMultiple={setGalleryImages}
                                    />
                                    <InputError message={errors.gallery} />
                                </div>
                                <div className="space-y-3">
                                    <Label>Open Graph image</Label>
                                    <input
                                        type="hidden"
                                        name="og_image"
                                        value={ogImage?.path ?? ""}
                                    />
                                    {ogImage && (
                                        <img
                                            src={ogImage.url}
                                            alt={ogImage.alt || ogImage.name}
                                            className="aspect-video w-full rounded-md border object-cover"
                                        />
                                    )}
                                    <GalleryImagePicker
                                        id="product-og-image"
                                        media={media}
                                        counts={counts}
                                        filter={filter}
                                        search={search}
                                        filterUrl={filterUrl}
                                        selectedImage={ogImage}
                                        onSelect={setOgImage}
                                    />
                                    {ogImage && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOgImage(null)}
                                        >
                                            Remove OG image
                                        </Button>
                                    )}
                                    <InputError message={errors.og_image} />
                                </div>
                            </section>
                        </aside>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
                        {cancelHref && (
                            <Button asChild type="button" variant="outline">
                                <Link href={cancelHref}>Cancel</Link>
                            </Button>
                        )}
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={processing}
                            onClick={() => setStatus("draft")}
                        >
                            Save as draft
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            onClick={() => setStatus("active")}
                        >
                            {processing ? (
                                <>
                                    <Spinner /> Saving...
                                </>
                            ) : product ? (
                                "Save product"
                            ) : (
                                "Create product"
                            )}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
};

function Field({
    label,
    error,
    help,
    className,
    children,
}: {
    label: string;
    error?: string;
    help?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`space-y-2 ${className ?? ""}`}>
            <Label>{label}</Label>
            {children}
            {help && <p className="text-xs text-muted-foreground">{help}</p>}
            <InputError message={error} />
        </div>
    );
}

function addTag(
    draft: string,
    tags: string[],
    setTags: (tags: string[]) => void,
    setDraft: (draft: string) => void,
) {
    const tag = draft.trim();

    if (!tag) {
        return;
    }

    if (
        !tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())
    ) {
        setTags([...tags, tag]);
    }

    setDraft("");
}

function ToggleField({
    label,
    name,
    checked,
    help,
}: {
    label: string;
    name: string;
    checked: boolean;
    help?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="min-w-0 space-y-1">
                <span className="block text-sm font-medium">{label}</span>
                {help && (
                    <span className="block text-xs text-muted-foreground">
                        {help}
                    </span>
                )}
            </div>
            <Switch
                name={name}
                value="1"
                defaultChecked={checked}
                aria-label={label}
            />
        </div>
    );
}

function JsonInput({
    name,
    value,
    rows,
}: {
    name: string;
    value: string;
    rows: number;
}) {
    return (
        <textarea
            name={name}
            defaultValue={value}
            rows={rows}
            spellCheck={false}
            className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
    );
}

export default ProductForm;
