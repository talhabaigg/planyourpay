import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-3 py-1">
            <SidebarMenu className="mt-2 space-y-1">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="rounded-full px-4 py-5 text-base font-medium gap-3 data-[active=true]:bg-primary/15 data-[active=true]:text-primary hover:bg-sidebar-accent group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2"
                        >
                            <Link href={item.href} prefetch className="flex w-full items-center gap-3">
                                {item.icon && <item.icon className="h-5 w-5" />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
