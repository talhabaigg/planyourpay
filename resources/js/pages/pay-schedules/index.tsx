import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BreadcrumbItem } from '@/types/navigation';
import {
    create as paySchedulesCreate,
    edit as paySchedulesEdit,
    destroy as paySchedulesDestroy,
    index as paySchedulesIndex,
} from '@/routes/pay-schedules';

interface PayScheduleSummary {
    id: number;
    name: string;
    amount: string;
    cadence: string;
    recurrence_interval: number;
    next_pay_date: string;
    upcoming_pay_date: string | null;
    is_primary: boolean;
    notes?: string | null;
}

const cadenceLabels: Record<string, string> = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
};

export default function PaySchedulesIndex() {
    const { schedules = [] } = usePage<{ schedules: PayScheduleSummary[] }>().props;

    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'AUD',
                minimumFractionDigits: 2,
            }),
        [],
    );

    const describeCadence = (schedule: PayScheduleSummary) => {
        const base = cadenceLabels[schedule.cadence] ?? schedule.cadence;

        return schedule.recurrence_interval > 1
            ? `${base} · every ${schedule.recurrence_interval}`
            : base;
    };

    const handleDelete = (schedule: PayScheduleSummary) => {
        if (!window.confirm(`Remove ${schedule.name}?`)) {
            return;
        }

        router.delete(paySchedulesDestroy({ pay_schedule: schedule.id }).url, {
            preserveScroll: true,
        });
    };

    return (
        <div className="mx-auto w-full max-w-3xl space-y-5 p-4">
            <Head title="Pay schedules" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Pay schedules</h1>
                    <p className="text-sm text-muted-foreground">
                        Every plan starts here. Keep each income stream up to date.
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href={paySchedulesCreate().url}>
                        <Plus className="h-4 w-4" />
                        Add schedule
                    </Link>
                </Button>
            </div>

            <Card className="overflow-hidden py-0">
                <CardContent className="p-0">
                    {schedules.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                You don’t have any pay schedules yet. Create one to start
                                planning periods.
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link href={paySchedulesCreate().url}>
                                    <Plus className="h-4 w-4" />
                                    Add schedule
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {schedules.map((schedule) => (
                                <li
                                    key={schedule.id}
                                    className="flex items-center gap-3 px-4 py-2.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate font-medium">
                                                {schedule.name}
                                            </span>
                                            {schedule.is_primary && (
                                                <Badge
                                                    variant="secondary"
                                                    className="h-5 shrink-0 px-1.5 text-[10px]"
                                                >
                                                    Primary
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {describeCadence(schedule)} · next{' '}
                                            {schedule.upcoming_pay_date ?? schedule.next_pay_date}
                                        </p>
                                    </div>

                                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                                        {currencyFormatter.format(Number(schedule.amount))}
                                    </span>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                               