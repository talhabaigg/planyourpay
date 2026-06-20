import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types/navigation';
import { create as paySchedulesCreate, edit as paySchedulesEdit, destroy as paySchedulesDestroy, index as paySchedulesIndex } from '@/routes/pay-schedules';

interface PayScheduleSummary {
    id: number;
    name: string;
    amount: string;
    cadence: string;
    recurrence_interval: number;
    next_pay_date: string;
    is_primary: boolean;
    notes?: string | null;
}

export default function PaySchedulesIndex() {
    const { schedules = [] } = usePage<{ schedules: PayScheduleSummary[] }>().props;

    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'AUD',
                minimumFractionDigits: 2,
            }),
        []
    );

    const cadenceLabels: Record<string, string> = {
        weekly: 'Weekly',
        fortnightly: 'Fortnightly',
        monthly: 'Monthly',
    };

    return (
        <div className="space-y-6 p-4">
            <Head title="Pay schedules" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Pay schedules</h1>
                    <p className="text-sm text-muted-foreground">
                        Every plan starts here. Keep each income stream up to date.
                    </p>
                </div>
                <Button asChild>
                    <Link href={paySchedulesCreate().url}>Add schedule</Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {schedules.length === 0 && (
                    <Card className="md:col-span-2 xl:col-span-3">
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            You don’t have any pay schedules yet. Create one to start planning periods.
                        </CardContent>
                    </Card>
                )}

                {schedules.map((schedule) => (
                    <Card key={schedule.id} className="border border-border">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                            <div>
                                <p className="text-lg font-semibold text-foreground">{schedule.name}</p>
                                {schedule.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">{schedule.notes}</p>
                                )}
                            </div>
                            {schedule.is_primary && <Badge variant="secondary">Primary</Badge>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl bg-muted/40 p-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-medium">
                                        {currencyFormatter.format(Number(schedule.amount))}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-muted-foreground">Frequency</span>
                                    <span className="font-medium text-foreground">
                                        {cadenceLabels[schedule.cadence] ?? schedule.cadence}
                                        {schedule.recurrence_interval > 1 && ` · every ${schedule.recurrence_interval}`}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-muted-foreground">Next pay</span>
                                    <span className="font-medium text-foreground">{schedule.next_pay_date}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={paySchedulesEdit({ pay_schedule: schedule.id }).url}>Edit</Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        router.delete(paySchedulesDestroy({ pay_schedule: schedule.id }).url, {
                                            preserveScroll: true,
                                        })
                                    }
                                >
                                    Remove
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

PaySchedulesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Pay schedules',
            href: paySchedulesIndex().url,
        } as BreadcrumbItem,
    ],
};
