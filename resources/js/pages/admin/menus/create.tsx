import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { dashboard } from '@/routes';
import menus from '@/routes/admin/menus';
import MenuForm from '@/components/menu-form';

export default function MenuCreate() {
    return (
        <>
            <Head title="Create menu" />
            <div className="space-y-6 p-4 md:p-8">
                <Heading
                    title="Create menu"
                    description="Create a navigation menu, then add and arrange its links."
                />
                <MenuForm />
            </div>
        </>
    );
}

MenuCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Menus', href: menus.index() },
        { title: 'Create' },
    ],
};
