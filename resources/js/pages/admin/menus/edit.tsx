import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import menus from '@/routes/admin/menus';
import menuItems from '@/routes/admin/menus/items';
import MenuForm from '@/components/menu-form';

type MenuRecord = {
    id: number;
    name: string;
    location: string | null;
};

export default function MenuEdit({ menu }: { menu: MenuRecord }) {
    return (
        <>
            <Head title={`Edit ${menu.name}`} />
            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={`Edit ${menu.name}`}
                        description="Update the menu details or continue to manage its links."
                    />
                    <Button asChild variant="outline">
                        <Link href={menuItems.index(menu.id)}>
                            Manage menu items
                        </Link>
                    </Button>
                </div>
                <MenuForm menu={menu} />
            </div>
        </>
    );
}

MenuEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Menus', href: menus.index() },
        { title: 'Edit' },
    ],
};
