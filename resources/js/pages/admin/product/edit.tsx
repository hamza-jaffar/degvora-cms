import Heading from '@/components/heading';
import ProductForm from '@/components/product-form';
import { dashboard } from '@/routes';
import products from '@/routes/admin/products';
import type { ProductFormPageProps } from '@/types/props';

const ProductEdit = (props: ProductFormPageProps) => (
    <div className="space-y-6 p-5 md:p-8">
        <Heading
            title="Edit product"
            description={`Update ${props.product?.name ?? 'product'} details, media, pricing, and inventory.`}
        />
        {props.product && (
            <ProductForm
                {...props}
                filterUrl={products.edit(props.product.slug).url}
                cancelHref={products.index.url()}
            />
        )}
    </div>
);

export default ProductEdit;

ProductEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Products', href: products.index() },
        { title: 'Edit' },
    ],
};
