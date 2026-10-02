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
