import {
    LayoutGrid,
    CalendarRange,
    RefreshCw,
    ListChecks,
    PiggyBank,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { index as paySchedulesIndex } from '@/routes/pay-schedules';
import { index as payCyclesIndex } from '@/routes/pay-cycles';
import { index as commitmentsIndex } from '@/routes/commitments';
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
    {
        title: 'Savers',
        href: '/savers',
        icon: PiggyBank,
    },
];
