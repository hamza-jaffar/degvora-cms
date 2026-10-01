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
