import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types/navigation';
import { index as payCyclesIndex } from '@/routes/pay-cycles';
import { index as commitmentsIndex } from '@/routes/commitments';

interface CycleTransaction {
    id: number;
    label: string;
    amount: number;
}

interface PayCycleResource {
    id: number;
    label: string;
    start_date: string;
    end_date: string;
    schedule_name: string;
    income: string;
    status: string;
    inflows: CycleTransaction[];
    outflows: CycleTransaction[];
    surplus: string;
}

interface PageProps {
    cycles: PayCycleResource[];
    hasPrimarySchedule: boolean;
}

export default function PayCyclesIndex({ cycles = [], hasPrimarySchedule }: PageProps) {
    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'AUD',
                minimumFractionDigits: 2,
            }),
        []
    );

    const [selectedId, setSelectedId] = useState<number | null>(cycles[0]?.id ?? null);
    const selectedCycle = cycles.find((cycle) => cycle.id === selectedId) ?? cycles[0];
    const inflowItems = selectedCycle?.inflows ?? [];
    const outflowItems = selectedCycle?.outflows ?? [];
    const inflowTotal = inflowItems.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const outflowTotal = outflowItems.reduce((sum, entry) => sum + Number(entry.amount), 0);

    useEffect(() => {
        if (cycles.length && !selectedId) {
            setSelectedId(cycles[0].id);
        }
    }, [cycles, selectedId]);

    return (
        <div className="space-y-6 p-4">
            <Head title="Pay cycles" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Pay cycles</h1>
                    <p className="text-sm text-muted-foreground">
                        Upcoming windows anchored to your primary pay schedule. Pick a cycle to inspect the plan.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={commitmentsIndex().url}>Manage commitments</Link>
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                        Planner coming soon
                    </Button>
                </div>
            </div>

            {!hasPrimarySchedule && (
                <Card>
                    <CardContent className="py-6 text-sm text-muted-foreground">
                        Add a primary pay schedule first to generate pay cycles.
                    </CardContent>
                </Card>
            )}

            {hasPrimarySchedule && cycles.length > 0 && (
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    <Card className="border-border">
                        <CardHeader className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Select cycle</p>
                            <select
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                value={selectedId ?? ''}
                                onChange={(event) => setSelectedId(Number(event.target.value))}
                            >
                                {cycles.map((cycle) => (
                                    <option key={cycle.id} value={cycle.id}>
                                        {cycle.label} ({cycle.start_date} → {cycle.end_date})
                                    </option>
                                ))}
                            </select>
                        </CardHeader>
                    </Card>

                    <div className="space-y-4">
                        <Card className="border border-border">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <p className="text-lg font-semibold text-foreground">{selectedCycle?.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedCycle?.start_date} → {selectedCycle?.end_date}
                                    </p>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                                    {selectedCycle?.status}
                                </span>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="rounded-2xl bg-muted/40 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Schedule</span>
                                        <span className="font-medium">{selectedCycle?.schedule_name}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-muted-foreground">Income</span>
                                        <span className="font-medium">
                                            {currencyFormatter.format(Number(selectedCycle?.income || 0))}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <Card className="border border-dashed">
                                        <CardHeader className="pb-2">
                                            <p className="text-sm font-medium text-muted-foreground">Inflow</p>
                                            <p className="text-2xl font-semibold">
                                                {currencyFormatter.format(inflowTotal)}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            {inflowItems.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between">
                                                    <span>{item.label}</span>
                                                    <span className="font-medium">
                                                        {currencyFormatter.format(Number(item.amount))}
                                                    </span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                    <Card className="border border-dashed">
                                        <CardHeader className="pb-2">
                                            <p className="text-sm font-medium text-muted-foreground">Outflow</p>
                                            <p className="text-2xl font-semibold">
                                                {currencyFormatter.format(outflowTotal)}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            {outflowItems.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between">
                                                    <span>{item.label}</span>
                                                    <span className="font-medium">
                                                        {currencyFormatter.format(Number(item.amount))}
                                                    </span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="border border-dashed bg-muted/30">
                                    <CardHeader className="pb-1">
                                        <p className="text-sm font-medium text-muted-foreground">Surplus</p>
                                        <p className="text-xl font-semibold text-foreground">
                                            {currencyFormatter.format(inflowTotal - outflowTotal)}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground">
                                        Surplus = inflow − outflow. We'll update this as allocations become editable.
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

PayCyclesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Pay cycles',
            href: payCyclesIndex().url,
        } as BreadcrumbItem,
    ],
};
