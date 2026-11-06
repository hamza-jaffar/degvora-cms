import { Link, usePage } from '@inertiajs/react';
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
    Newspaper,
    Inbox,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import users from '@/routes/admin/users';
import gallery from '@/routes/admin/gallery';
import category from '@/routes/admin/category';
import products from '@/routes/admin/products';
import pages from '@/routes/admin/page';
import themes from '@/routes/admin/themes';
import menus from '@/routes/admin/menus';
import posts from '@/routes/admin/posts';

const allNavItems: NavItem[] = [
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
        feature: 'category',
    },
    {
        title: 'Products',
        href: products.index(),
        icon: Package,
        feature: 'product',
    },
    {
        title: 'Blog',
        href: posts.index(),
        icon: Newspaper,
        feature: 'blog',
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
        feature: 'theme',
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
    const { cmsFeatures, navForms } = usePage().props;
    const { isCurrentUrl } = useCurrentUrl();

    const mainNavItems = allNavItems.filter(
        (item) => !item.feature || cmsFeatures[item.feature] === true,
    );

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

                {cmsFeatures.form !== false && navForms && navForms.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel className="flex items-center justify-between">
                            <span>Forms</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                                {navForms.length} active
                            </span>
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {navForms.map((item) => {
                                const href = `/admin/forms/${item.slug}`;
                                return (
                                    <SidebarMenuItem key={item.slug}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isCurrentUrl(href, undefined, true)}
                                            tooltip={{ children: item.name }}
                                        >
                                            <Link href={href} prefetch>
                                                <Inbox className="size-4 shrink-0" />
                                                <span className="truncate">{item.name}</span>
                                                {typeof item.unread_count === 'number' && item.unread_count > 0 && (
                                                    <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                                                        {item.unread_count > 99 ? '99+' : item.unread_count}
                                                    </span>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
