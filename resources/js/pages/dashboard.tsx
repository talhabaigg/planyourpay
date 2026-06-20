import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, CalendarClock, CheckCircle2, ListChecks, PiggyBank, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as commitmentsIndex } from '@/routes/commitments';
import { index as payCyclesIndex } from '@/routes/pay-cycles';
import { index as paySchedulesIndex } from '@/routes/pay-schedules';

const currency = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
});

function formatDue(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

interface UpcomingItem {
    id: number;
    name: string;
    amount: number;
    category: string | null;
    due: string | null;
}

interface DashboardProps {
    income: number | null;
    committed: number;
    surplus: number | null;
    primaryName: string | null;
    payPeriodStart: string | null;
    payPeriodEnd: string | null;
    commitments: UpcomingItem[];
    commitmentCount: number;
}

export default function Dashboard() {
    const {
        income,
        committed,
        surplus,
        primaryName,
        payPeriodStart,
        payPeriodEnd,
        commitments,
        commitmentCount,
    } = usePage<DashboardProps>().props;

    // Brand-new account: nothing to summarise yet.
    if (income === null && commitmentCount === 0) {
        return (
            <>
                <Head title="Dashboard" />
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
 