import CategoryForm, {
    type CategoryFormProps,
} from '@/components/category-form';
import Heading from '@/components/heading';
import { dashboard } from '@/routes';
import category from '@/routes/admin/category';

type CreateCategoryProps = Pick<
    CategoryFormProps,
    'media' | 'counts' | 'filter' | 'search' | 'pickerAsset'
> & {
    parent_categories: CategoryFormProps['parentCategories'];
    initial_parent_id: number | null;
    parent_category_slug: string;
};

const CreateCategory = ({
    media,
    counts,
    filter,
    search,
    pickerAsset,
    parent_categories,
    initial_parent_id,
    parent_category_slug,
}: CreateCategoryProps) => {
    return (
        <div className="p-8">
            <Heading
                title="Create Category"
                description="Add a new category and configure its details."
            />
            <CategoryForm
                media={media}
                counts={counts}
                filter={filter}
                search={search}
                pickerAsset={pickerAsset}
                parentCategories={parent_categories}
                initialParentId={initial_parent_id}
                filterUrl={
                    parent_category_slug
                        ? category.create.url({
                              query: {
                                  parent_category_slug,
                              },
                          })
                        : category.create.url()
                }
            />
        </div>
    );
};

export default CreateCategory;

CreateCategory.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Categories',
            href: category.index(),
        },
        {
            title: 'Create',
        },
    ],
};
