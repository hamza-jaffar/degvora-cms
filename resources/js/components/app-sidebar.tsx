import { Link } from '@inertiajs/react';
import {
    BookOpen,
    FileText,
    Folder,
    FolderGit2,
    LayoutGrid,
    ListTree,
    Package,
    Tags,
    Paintbrush,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import users from '@/routes/admin/users';
import gallery from '@/routes/admin/gallery';
import category from '@/routes/admin/category';
import products from '@/routes/admin/products';
import pages from '@/routes/admin/page';
import themes from '@/routes/admin/themes';
import menus from '@/routes/admin/menus';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Pages',
        href: pages.index(),
        icon: FileText,
    },
    {
        title: 'Menus',
        href: menus.index(),
        icon: ListTree,
    },
    {
        title: 'Category',
        href: category.index(),
        icon: Tags,
    },
    {
        title: 'Products',
        href: products.index(),
        icon: Package,
    },
    {
        title: 'Gallery',
        href: gallery.index(),
        icon: Folder,
    },
    {
        title: 'Themes',
        href: themes.index(),
        icon: Paintbrush,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
