import Heading from '@/components/heading';
import ProductForm from '@/components/product-form';
import { dashboard } from '@/routes';
import products from '@/routes/admin/products';
import type { ProductFormPageProps } from '@/types/props';

const ProductCreate = (props: ProductFormPageProps) => (
    <div className="space-y-6 p-5 md:p-8">
        <Heading
            title="Create product"
            description="Add product details, media, pricing, and inventory."
        />
        <ProductForm {...props} filterUrl={products.create.url()} />
    </div>
);

export default ProductCreate;

ProductCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Products', href: products.index() },
        { title: 'Create' },
    ],
};
