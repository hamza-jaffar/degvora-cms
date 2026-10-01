import { Category } from './data';
import { CategoryIndexPagination } from './paginations';

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
