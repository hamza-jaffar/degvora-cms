export type GalleryImage = {
    id: number;
    name: string;
    alt: string;
    path: string;
    url: string;
    type: 'image' | 'video' | 'other';
    mimeType: string;
};

export type Page = {
    id: number;
    name: string;
    slug: string;
    path: string;
    excerpt: string | null;
    content: string | null;
    parent_id: number | null;
    parent?: Pick<Page, 'id' | 'name' | 'slug'> | null;
    meta_title: string | null;
    meta_description: string | null;
    canonical_url: string | null;
    robots: string;
    status: 'draft' | 'published' | 'scheduled' | 'archived';
    visibility: 'public' | 'private' | 'password';
    password: string | null;
    published_at: string | null;
    template: string;
    sort_order: number;
    is_featured: boolean;
    featured_media: string | null;
    featured_media_asset?: GalleryImage | null;
    created_at: string;
    deleted_at?: string | null;
};

export type Category = {
    id: number;
    parent_id: number | null;
    parent?: Pick<Category, 'id' | 'name' | 'slug'> | null;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    image_url?: string | null;
    is_active: boolean;
    is_featured: boolean;
    meta_title: string | null;
    meta_description: string | null;
};

export type ProductImage = {
    id: number;
    name: string;
    alt: string;
    path: string;
    url: string;
    type: 'image' | 'video' | 'other';
    mimeType: string;
};

export type ProductCategoryOption = Pick<Category, 'id' | 'name'>;

export type ProductVariantOption = {
    name: string;
    values: string[];
};

export type ProductVariantItem = {
    options: Record<string, string>;
    price: string | number;
    compare_at_price: string | number | null;
    sku: string | null;
    quantity: number;
};

export type ProductVariants = {
    pricing_mode: 'variants';
    options: ProductVariantOption[];
    price_options: string[];
    items: ProductVariantItem[];
};

export type Product = {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    barcode: string | null;
    category_id: number | null;
    category?: ProductCategoryOption | null;
    subtitle: string | null;
    description: string | null;
    short_description: string | null;
    product_type: 'physical' | 'digital' | 'service';
    vendor: string | null;
    brand: string | null;
    condition: 'new' | 'used' | 'refurbished';
    price: string | number;
    compare_at_price: string | number | null;
    cost_per_item: string | number | null;
    currency: string;
    main_image: string | null;
    main_image_url?: string | null;
    main_image_asset?: ProductImage | null;
    gallery: string[] | null;
    gallery_assets?: ProductImage[];
    variants: ProductVariants | null;
    track_inventory: boolean;
    quantity: number;
    allow_backorder: boolean;
    low_stock_threshold: number | null;
    requires_shipping: boolean;
    weight: string | number | null;
    weight_unit: string;
    length: string | number | null;
    width: string | number | null;
    height: string | number | null;
    dimension_unit: string;
    is_featured: boolean;
    sort_order: number;
    tags: string[] | null;
    meta_title: string | null;
    meta_description: string | null;
    canonical_url: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image: string | null;
    og_image_asset?: ProductImage | null;
    robots: string;
    status: 'draft' | 'active' | 'archived';
    published_at: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    deleted_at?: string | null;
};
