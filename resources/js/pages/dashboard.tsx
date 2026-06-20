import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, CalendarClock, PiggyBank, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as payCyclesIndex } from '@/routes/pay-cycles';
import { index as paySchedulesIndex } from '@/routes/pay-schedules';

const currency = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
});

// Placeholder glance content until pay-schedule data is wired to this page.
const cycle = {
    label: 'Pay #14',
    range: '28 Jun – 11 Jul',
    income: 3200,
    committed: 1880,
    elapsedPct: 45,
};
const surplus = cycle.income - cycle.committed;

const upcoming = [
    { name: 'Mortgage', due: 'Fri 28 Jun', amount: 1400, category: 'Housing' },
    { name: 'Car loan', due: 'Mon 1 Jul', amount: 320, category: 'Transport' },
    { name: 'Internet', due: 'Wed 3 Jul', amount: 90, category: 'Utilities' },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
                {/* Current pay cycle — the mobile glance */}
                <Card className="overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {cycle.label}
                            </span>
                            <span>{cycle.range}</span>
                        </div>

                        <p className="mt-3 text-sm text-muted-foreground">
              