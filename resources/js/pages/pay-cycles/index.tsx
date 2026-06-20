import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { Check, MoreVertical, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types/navigation';
import { index as payCyclesIndex } from '@/routes/pay-cycles';
import { index as paySchedulesIndex } from '@/routes/pay-schedules';

type AllocationType = 'inflow' | 'outflow';

interface Allocation {
    id: number | string;
    type: AllocationType;
    label: string;
    amount: number;
    date: string | null;
    status: 'planned' | 'paid' | 'skipped';
    is_recurring: boolean;
    is_saver_transfer?: boolean;
    materialized?: boolean;
    saverPlanId?: number | null;
}

interface Plan {
    id: number;
    scheduleName: string;
    periodStart: string;
    periodEnd: string;
    inflowTotal: number;
    outflowTotal: number;
    remaining: number;
    allocations: Allocation[];
}

interface Cycle {
    start: string;
    end: string;
    isCurrent: boolean;
}

interface PageProps {
    hasPrimarySchedule: boolean;
    plan: Plan | null;
    cycles: Cycle[];
}

const currency = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
});

function formatDate(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? iso
        : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function PayCyclesIndex({
    hasPrimarySchedule,
    plan,
    cycles = [],
}: PageProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [saverTarget, setSaverTarget] = useState<Allocation | null>(null);

    const form = useForm<{
        type: AllocationType;
        label: string;
        amount: string;
        date: string;
        notes: string;
    }>({ type: 'outflow', label: '', amount: '', date: '', notes: '' });

    const saverForm = useForm<{ amount: string; paid: boolean }>({
        amount: '',
        paid: true,
    });

    if (!hasPrimarySchedule || !plan) {
        return (
            <div className="mx-auto w-full max-w-3xl space-y-5 p-4">
                <Head title="Pay cycles" />
                <div>
                    <h1 className="text-2xl font-semibold">Pay cycles</h1>
                    <p className="text-sm text-muted-foreground">
                        Plan the actual pay — income, bills and any one-offs.
                    </p>
                </div>
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            Add a primary pay schedule first to generate pay cycles.
                        </p>
                        <Button asChild variant="outline" size="sm">
                            <Link href={paySchedulesIndex().url}>Add pay schedule</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const byDate = (a: Allocation, b: Allocation) =>
        (a.date ?? '').localeCompare(b.date ?? '');
    const inflows = plan.allocations.filter((a) => a.type === 'inflow').sort(byDate);
    const outflows = plan.allocations.filter((a) => a.type === 'outflow').sort(byDate);

    const openAdd = (type: AllocationType) => {
        setEditingId(null);
        // Default new entries to the start of the current pay period.
        form.setData({
            type,
            label: '',
            amount: '',
            date: plan.periodStart,
            notes: '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const openEdit = (a: Allocation) => {
        setEditingId(a.id);
        form.setData({
            type: a.type,
            label: a.label,
            amount: String(a.amount),
            date: a.date ?? plan.periodStart,
            notes: '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingId(null);
        form.reset();
        form.clearErrors();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingId) {
            form.put(`/pay-plan-allocations/${editingId}`, {
                preserveScroll: true,
                onSuccess: closeDialog,
            });
            return;
        }

        form.post(`/pay-plans/${plan.id}/allocations`, {
            preserveScroll: true,
            onSuccess: closeDialog,
        });
    };

    const togglePaid = (a: Allocation) => {
        router.put(
            `/pay-plan-allocations/${a.id}`,
            { status: a.status === 'paid' ? 'planned' : 'paid' },
            { preserveScroll: true },
        );
    };

    const remove = (a: Allocation) => {
        if (!window.confirm(`Remove ${a.label}?`)) return;
        router.delete(`/pay-plan-allocations/${a.id}`, { preserveScroll: true });
    };

    // Record the planned amount as actually paid (materialises the line).
    const markSaverPaid = (a: Allocation) => {
        if (!plan) return;
        router.post(
            `/pay-plans/${plan.id}/saver-transfers/${a.saverPlanId}`,
            { amount: a.amount, status: 'paid', label: a.label },
            { preserveScroll: true },
        );
    };

    const openSaverAmount = (a: Allocation) => {
        setSaverTarget(a);
        saverForm.setData({ amount: String(a.amount), paid: a.status === 'paid' });
        saverForm.clearErrors();
    };

    const closeSaverAmount = () => {
        setSaverTarget(null);
        saverForm.reset();
        saverForm.clearErrors();
    };

    const submitSaverAmount = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!plan || !saverTarget) return;
        const status = saverForm.data.paid ? 'paid' : 'planned';

        if (saverTarget.materialized) {
            router.put(
                `/pay-plan-allocations/${saverTarget.id}`,
                { amount: Number(saverForm.data.amount), status },
                { preserveScroll: true, onSuccess: closeSaverAmount },
            );
        } else {
            router.post(
                `/pay-plans/${plan.id}/saver-transfers/${saverTarget.saverPlanId}`,
                { amount: Number(saverForm.data.amount), status, label: saverTarget.label },
                { preserveScroll: true, onSuccess: closeSaverAmount },
            );
        }
    };

    // Revert a recorded transfer back to the recurring plan amount.
    const resetSaver = (a: Allocation) => {
        router.delete(`/pay-plan-allocations/${a.id}`, { preserveScroll: true });
    };

    const renderRow = (a: Allocation) => {
        const paid = a.status === 'paid';

        return (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                'truncate font-medium',
                                paid && 'text-muted-foreground line-through',
                            )}
                        >
                            {a.label}
                        </span>
                        {a.is_recurring && !a.is_saver_transfer && (
                            <Badge
                                variant="outline"
                                className="h-5 shrink-0 px-1.5 text-[10px]"
                            >
                                Recurring
                            </Badge>
                        )}
                        {a.is_saver_transfer && (
                            <Badge
                                variant="secondary"
                                className="h-5 shrink-0 px-1.5 text-[10px]"
                            >
                                Saver
                            </Badge>
                        )}
                        {paid && (
                            <Badge
                                variant="secondary"
                                className="h-5 shrink-0 px-1.5 text-[10px]"
                            >
                                Paid
                            </Badge>
                        )}
                    </div>
                    {a.date && (
                        <p className="text-xs text-muted-foreground">
                            {formatDate(a.date)}
                        </p>
                    )}
                </div>
                <span
                    className={cn(
                        'shrink-0 text-sm font-semibold tabular-nums',
                        a.type === 'inflow' && 'text-emerald-600 dark:text-emerald-500',
                    )}
                >
                    {a.type === 'outflow' ? '−' : '+'}
                    {currency.format(a.amount)}
                </span>
                {a.is_saver_transfer ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                aria-label={`Actions for ${a.label}`}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {a.materialized ? (
                                <>
                                    <DropdownMenuItem onSelect={() => togglePaid(a)}>
                                        {paid ? (
                                            <>
                                                <RotateCcw className="h-4 w-4" />
                                                Mark planned
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Mark paid
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => openSaverAmount(a)}>
                                        <Pencil className="h-4 w-4" />
                                        Edit amount
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={() => resetSaver(a)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Reset to plan
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <>
                                    <DropdownMenuItem onSelect={() => markSaverPaid(a)}>
                                        <Check className="h-4 w-4" />
                                        Mark paid
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => openSaverAmount(a)}>
                                        <Pencil className="h-4 w-4" />
                                        Set actual amount
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                aria-label={`Actions for ${a.label}`}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => togglePaid(a)}>
                                {paid ? (
                                    <>
                                        <RotateCcw className="h-4 w-4" />
                                        Mark planned
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Mark paid
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openEdit(a)}>
                                <Pencil className="h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => remove(a)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Remove
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </li>
        );
    };

    const section = (
        title: string,
        type: AllocationType,
        items: Allocation[],
        total: number,
        emptyText: string,
    ) => (
        <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                <CardTitle className="text-base">{title}</CardTitle>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                        {currency.format(total)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => openAdd(type)}>
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {items.length > 0 ? (
                    <ul className="divide-y divide-border border-t">
                        {items.map(renderRow)}
                    </ul>
                ) : (
                    <p className="border-t px-4 py-4 text-sm text-muted-foreground">
                        {emptyText}
                    </p>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
            <Head title="Pay cycles" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Pay cycles</h1>
                    <p className="text-sm text-muted-foreground">
                        Plan the actual pay — income, bills and any one-offs.
                    </p>
                </div>
                {cycles.length > 0 && (
                    <Select
                        value={plan.periodStart}
                        onValueChange={(value) =>
                            router.get(
                                payCyclesIndex().url,
                                { period: value },
                                { preserveScroll: true, preserveState: false },
                            )
                        }
                    >
                        <SelectTrigger className="w-full sm:w-56">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {cycles.map((c) => (
                                <SelectItem key={c.start} value={c.start}>
                                    {formatDate(c.start)} – {formatDate(c.end)}
                                    {c.isCurrent ? ' · Current' : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Standing */}
            <Card className="overflow-hidden">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                            {plan.scheduleName}
                        </span>
                        <span>
                            {formatDate(plan.periodStart)} – {formatDate(plan.periodEnd)}
                        </span>
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground">Left to allocate</p>
                    <p
                        className={cn(
                            'text-4xl font-semibold tracking-tight',
                            plan.remaining >= 0 ? 'text-emerald-500' : 'text-red-500',
                        )}
                    >
                        {currency.format(plan.remaining)}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-xs text-muted-foreground">Money in</p>
                            <p className="font-semibold tabular-nums">
                                {currency.format(plan.inflowTotal)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-xs text-muted-foreground">Money out</p>
                            <p className="font-semibold tabular-nums">
                                {currency.format(plan.outflowTotal)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {section(
                'Money in',
                'inflow',
                inflows,
                plan.inflowTotal,
                'No income added yet.',
            )}
            {section(
                'Money out',
                'outflow',
                outflows,
                plan.outflowTotal,
                'No commitments due this pay. Add a one-off below.',
            )}

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId
                                ? 'Edit entry'
                                : form.data.type === 'inflow'
                                  ? 'Add money in'
                                  : 'Add money out'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="alloc-label">Label</Label>
                            <Input
                                id="alloc-label"
                                value={form.data.label}
                                onChange={(e) => form.setData('label', e.target.value)}
                                placeholder={
                                    form.data.type === 'inflow'
                                        ? 'Tax refund'
                                        : 'Concert tickets'
                                }
                            />
                            <InputError message={form.errors.label} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="alloc-amount">Amount</Label>
                                <Input
                                    id="alloc-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.amount}
                                    onChange={(e) => form.setData('amount', e.target.value)}
                                    placeholder="0.00"
                                />
                                <InputError message={form.errors.amount} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="alloc-date">Date</Label>
                                <Input
                                    id="alloc-date"
                                    type="date"
                                    min={plan.periodStart}
                                    max={plan.periodEnd}
                                    value={form.data.date}
                                    onChange={(e) => form.setData('date', e.target.value)}
                                />
                                <InputError message={form.errors.date} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="alloc-notes">Notes (optional)</Label>
                            <Input
                                id="alloc-notes"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                            />
                            <InputError message={form.errors.notes} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={closeDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {editingId ? 'Save changes' : 'Add entry'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={saverTarget !== null}
                onOpenChange={(o) => (o ? null : closeSaverAmount())}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {saverTarget?.label.replace('→ ', '')}
                        </DialogTitle>
                        <DialogDescription>
                            Record the actual amount moved to this Saver this pay. It
                            won’t change your recurring plan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitSaverAmount} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="saver-amount">Amount this pay</Label>
                            <Input
                                id="saver-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={saverForm.data.amount}
                                onChange={(e) => saverForm.setData('amount', e.target.value)}
                            />
                            <InputError message={saverForm.errors.amount} />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={saverForm.data.paid}
                                onCheckedChange={(c) => saverForm.setData('paid', c === true)}
                            />
                            Mark as paid
                        </label>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={closeSaverAmount}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saverForm.processing}>
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
