import { LayoutGrid, RefreshCw, PiggyBank } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as payCyclesIndex } from '@/routes/pay-cycles';
import type { NavItem } from '@/types/navigation';

/**
 * Primary destinations, shared between the desktop sidebar and the
 * mobile bottom tab bar so the two never drift apart.
 */
export const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Pay cycles',
        href: payCyclesIndex(),
        icon: RefreshCw,
    },
    {
        title: 'Savers',
        href: '/savers',
        icon: PiggyBank,
    },
];
