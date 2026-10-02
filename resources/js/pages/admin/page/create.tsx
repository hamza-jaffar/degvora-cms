import Heading from '@/components/heading';
import PageForm from '@/components/page-form';
import { dashboard } from '@/routes';
import pages from '@/routes/admin/page';
import type { PageFormPageProps } from '@/types/props';

const PageCreate = (props: PageFormPageProps) => (
    <div className="space-y-6 p-5 md:p-8">
        <Heading
            title="Create page"
            description="Add a new page with content, SEO settings, and publishing options."
        />
        <PageForm {...props} filterUrl={pages.create.url()} />
    </div>
);

export default PageCreate;

PageCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pages', href: pages.index() },
        { title: 'Create' },
    ],
};
