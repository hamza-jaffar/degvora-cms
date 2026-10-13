import { Category } from './data';
import { CategoryIndexPagination } from './paginations';
import { Product } from './data';
import { ProductIndexPagination } from './paginations';

export type CategoryIndexPageProps = {
    categories: CategoryIndexPagination;
    filters: {
        search: string;
        per_page: number;
        parent_category_slug: string;
        is_featured: string;
        status: string;
    };
    parent_categories: Category[];
};

export type ProductFilters = {
    search: string;
    category_id: string;
    status: string;
    trashed: string;
    product_type: string;
    vendor: string;
    brand: string;
    is_featured: string;
    stock: string;
    min_price: string;
    max_price: string;
    sort: string;
    direction: string;
    per_page: number;
};

export type ProductIndexPageProps = {
    products: ProductIndexPagination;
    filters: ProductFilters;
    categories: Pick<Category, 'id' | 'name'>[];
    vendors: string[];
    brands: string[];
};

export type ProductFormPageProps = {
    product: Product | null;
    categories: Pick<Category, 'id' | 'name'>[];
    media: { data: import('./data').ProductImage[] };
    counts: Record<'all' | 'image' | 'video' | 'other', number>;
    filter: 'all' | 'image' | 'video' | 'other';
    search: string;
    presetVariations?: import('./data').ProductVariantOption[];
};

export type ProductShowPageProps = {
    product: Product;
};

import { GalleryImage, Page } from './data';
import { PageIndexPagination } from './paginations';

export type PageFilters = {
    search: string;
    status: string;
    trashed: string;
    sort: string;
    direction: string;
    per_page: number;
};

export type PageIndexPageProps = {
    pages: PageIndexPagination;
    filters: PageFilters;
};

export type PageFormPageProps = {
    page: Page | null;
    parentPages: Pick<Page, 'id' | 'name' | 'slug'>[];
    media: { data: GalleryImage[] };
    counts: Record<'all' | 'image' | 'video' | 'other', number>;
    filter: 'all' | 'image' | 'video' | 'other';
    search: string;
};

export type ShopFilters = {
    search: string;
    category_id: string;
    vendor: string;
    brand: string;
    in_stock: string;
    min_price: string;
    max_price: string;
    sort: string;
    direction: string;
    per_page: number;
};

export type ShopIndexPageProps = {
    products: ProductIndexPagination;
    filters: ShopFilters;
    categories: Pick<Category, 'id' | 'name' | 'slug'>[];
    vendors: string[];
    brands: string[];
    priceRange: { min: number; max: number };
};

import { Post } from './data';
import { PostIndexPagination } from './paginations';

export type PostFilters = {
    search: string;
    category_id: string;
    status: string;
    trashed: string;
    is_featured: string;
    sort: string;
    direction: string;
    per_page: number;
};

export type PostIndexPageProps = {
    posts: PostIndexPagination;
    filters: PostFilters;
    categories: Pick<Category, 'id' | 'name' | 'slug'>[];
};

export type PostFormPageProps = {
    post: Post | null;
    categories: Pick<Category, 'id' | 'name' | 'slug'>[];
    media: { data: GalleryImage[] };
    counts: Record<'all' | 'image' | 'video' | 'other', number>;
    filter: 'all' | 'image' | 'video' | 'other';
    search: string;
};


