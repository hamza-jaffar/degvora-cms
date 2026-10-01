import CategoryForm, {
    type CategoryFormProps,
} from '@/components/category-form';
import Heading from '@/components/heading';
import { dashboard } from '@/routes';
import categoryRoutes from '@/routes/admin/category';
import type { GalleryImage } from '@/components/gallery-image-picker';
import type { Category } from '@/types/data';

type EditCategoryProps = {
    category: Category;
    media: CategoryFormProps['media'];
    counts: CategoryFormProps['counts'];
    filter: CategoryFormProps['filter'];
    search: string;
    pickerAsset?: GalleryImage | null;
    initialImage?: GalleryImage | null;
    parent_categories: CategoryFormProps['parentCategories'];
};

const EditCategory = ({
    category,
    media,
    counts,
    filter,
    search,
    pickerAsset,
    initialImage,
    parent_categories,
}: EditCategoryProps) => {
    return (
        <div className="space-y-6 p-5 md:p-8">
            <Heading
                title="Edit category"
                description={`Update the details for ${category.name}.`}
            />

            <div>
                <CategoryForm
                    category={category}
                    media={media}
                    counts={counts}
                    filter={filter}
                    search={search}
                    pickerAsset={pickerAsset}
                    initialImage={initialImage}
                    parentCategories={parent_categories}
                    filterUrl={categoryRoutes.edit.url(category.slug)}
                    cancelHref={categoryRoutes.index.url()}
                />
            </div>
        </div>
    );
};

export default EditCategory;

EditCategory.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Categories', href: categoryRoutes.index() },
        { title: 'Edit category' },
    ],
};
