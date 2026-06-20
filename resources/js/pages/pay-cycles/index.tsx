import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { Check, MoreVertical, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
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
    id: number;
    type: AllocationType;
    label: string;
    amount: number;
    date: string | null;
    status: 'planned' | 'paid' | 'skipped';
    is_recurring: boolean;
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
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm<{
        type: AllocationType;
        label: string;
        amount: string;
        date: string;
        notes: string;
    }>({ type: 'outflow', label: '', amount: '', date: '', notes: '' });

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
                        {a.is_recurring && (
                            <Badge
                                variant="outline"
                                className="h-5 shrink-0 px-1.5 text-[10px]"
                            >
                                Recurring
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
                    <span className="text-sm font-semibold tabular-nums text-mu