import Heading from '@/components/heading';
import PageForm from '@/components/page-form';
import { dashboard } from '@/routes';
import pages from '@/routes/admin/page';
import type { PageFormPageProps } from '@/types/props';

const PageEdit = (props: PageFormPageProps) => (
    <div className="space-y-6 p-5 md:p-8">
        <Heading
            title="Edit page"
            description={`Update ${props.page?.name ?? 'page'} content, SEO settings, and publishing options.`}
        />
        {props.page && (
            <PageForm
                {...props}
                filterUrl={pages.edit(props.page.slug).url}
                cancelHref={pages.index.url()}
            />
        )}
    </div>
);

export default PageEdit;

PageEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pages', href: pages.index() },
        { title: 'Edit' },
    ],
};
