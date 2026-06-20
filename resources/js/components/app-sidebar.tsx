import { Link } from '@inertiajs/react';
import { LayoutGrid, CalendarRange, RefreshCw, ListChecks } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import { index as paySchedulesIndex } from '@/routes/pay-schedules';
import { index as payCyclesIndex } from '@/routes/pay-cycles';
import { index as commitmentsIndex } from '@/routes/commitments';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Pay schedules',
        href: paySchedulesIndex(),
        icon: CalendarRange,
    },
    {
        title: 'Pay cycles',
        href: payCyclesIndex(),
        icon: RefreshCw,
    },
    {
        title: 'Commitments',
        href: commitmentsIndex(),
        icon: ListChecks,
    },
];


export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
