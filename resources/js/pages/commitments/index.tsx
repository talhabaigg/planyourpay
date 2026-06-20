import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';
import { MoreVertical, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import type { BreadcrumbItem } from '@/types/navigation';
import {
    destroy as commitmentsDestroy,
    index as commitmentsIndex,
    store as commitmentsStore,
    update as commitmentsUpdate,
} from '@/routes/commitments';
import { index as payCyclesIndex } from '@/routes/pay-cycles';

interface CommitmentSummary {
    id: number;
    name: string;
    amount: string;
    recurrence_type: string;
    recurrence_interval: number;
    first_due_date: string | null;
    category?: string | null;
    notes?: string | null;
    active: boolean;
}

type CommitmentFormData = {
    name: string;
    amount: string;
    recurrence_type: string;
    recurrence_interval: number;
    first_due_date: string;
    category: string;
    notes: string;
    active: boolean;
};

const recurrenceOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'fortnightly', label: 'Fortnightly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
    { value: 'one_time', label: 'One-off' },
];

const emptyForm: CommitmentFormData = {
    name: '',
    amount: '',
    recurrence_type: 'fortnightly',
    recurrence_interval: 1,
    first_due_date: '',
    category: '',
    notes: '',
    active: true,
};

const serializeCommitment = (
    commitment: CommitmentSummary,
    overrides: Partial<CommitmentFormData> = {},
): CommitmentFormData => ({
    name: commitment.name ?? '',
    amount: commitment.amount ?? '',
    recurrence_type: commitment.recurrence_type ?? 'fortnightly',
    recurrence_interval: commitment.recurrence_interval ?? 1,
    first_due_date: commitment.first_due_date ?? '',
    category: commitment.category ?? '',
    notes: commitment.notes ?? '',
    active: commitment.active,
    ...overrides,
});

export default function CommitmentsIndex() {
    const { commitments = [] } = usePage<{ commitments: CommitmentSummary[] }>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm<CommitmentFormData>({ ...emptyForm });

    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'AUD',
                minimumFractionDigits: 2,
            }),
        []
    );

    const describeCadence = (commitment: CommitmentSummary) => {
        if (commitment.recurrence_type === 'one_time') {
            return 'Single payment';
        }

        const baseLabel =
            recurrenceOptions.find((option) => option.value === commitment.recurrence_type)?.label ??
            commitment.recurrence_type;

        if (commitment.recurrence_interval <= 1) {
            return baseLabel;
        }

        return `${baseLabel} · every ${commitment.recurrence_interval}`;
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingId(null);
        form.reset();
        form.clearErrors();
    };

    const openCreate = () => {
        setEditingId(null);
        form.setData({ ...emptyForm });
        form.clearErrors();
        setDialogOpen(true);
    };

    const openEdit = (commitment: CommitmentSummary) => {
        setEditingId(commitment.id);
        form.setData(serializeCommitment(commitment));
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingId) {
            form.put(commitmentsUpdate({ commitment: editingId }).url, {
                preserveScroll: true,
                onSuccess: closeDialog,
            });
            return;
        }

        form.post(commitmentsStore().url, {
            preserveScroll: true,
            onSuccess: closeDialog,
        });
    };

    const handleToggle = (commitment: CommitmentSummary) => {
        router.put(
            commitmentsUpdate({ commitment: commitment.id }).url,
            serializeCommitment(commitment, { active: !commitment.active }),
            { preserveScroll: true },
        );
    };

    const handleDelete = (commitment: CommitmentSummary) => {
        if (!window.confirm(`Remove ${commitment.name}?`)) {
            return;
        }

        router.delete(commitmentsDestroy({ commitment: commitment.id }).url, {
            preserveScroll: true,
        });
    };

    return (
        <div className="mx-auto w-full max-w-3xl space-y-5 p-4">
            <Head title="Commitments" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Commitments</h1>
                    <p className="text-sm text-muted-foreground">
                        Recurring outflows that pre-fill every pay cycle.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                        <Link href={payCyclesIndex().url}>Back to pay cycles</Link>
                    </Button>
                    <Button onClick={openCreate} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        New commitment
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden py-0">
                <CardContent className="p-0">
                    {commitments.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                No commitments yet. Add your mortgage, rent, utilities, or
                                subscriptions so future pay cycles can pre-fill them.
                            </p>
                            <Button onClick={openCreate} variant="outline" size="sm">
                                <Plus className="h-4 w-4" />
                                Add commitment
                            </Button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {commitments.map((commitment) => (
                                <li
                                    key={commitment.id}
                                    className="flex items-center gap-3 px-4 py-2.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={
                                                    'truncate font-medium ' +
                                                    (commitment.active ? '' : 'text-muted-foreground')
                                                }
                                            >
                                                {commitment.name}
                                            </span>
                                            {!commitment.active && (
                                                <Badge
                                                    variant="outline"
                                                    className="h-5 shrink-0 px-1.5 text-[10px]"
                                                >
                                                    Paused
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {describeCadence(commitment)}
                                            {commitment.category ? ` · ${commitment.category}` : ''}
                                            {commitment.first_due_date
                                                ? ` · next ${commitment.first_due_date}`
                                                : ''}
                                        </p>
                                    </div>

                                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                                        {currencyFormatter.format(Number(commitment.amount))}
                                    </span>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0"
                                                aria-label={`Actions for ${commitment.name}`}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => openEdit(commitment)}>
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleToggle(commitment)}>
                                                {commitment.active ? (
                                                    <>
                                                        <Pause className="h-4 w-4" />
                                                        Pause
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-4 w-4" />
                                                        Resume
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onSelect={() => handleDelete(commitment)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? 'Edit commitment' : 'New commitment'}
                        </DialogTitle>
                        <DialogDescription>
                            Define the recurring outflow you want every cycle to honor.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="form-name">Name</Label>
                                <Input
                                    id="form-name"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    placeholder="Mortgage"
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="form-amount">Amount</Label>
                                <Input
                                    id="form-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.amount}
                                    onChange={(event) => form.setData('amount', event.target.value)}
                                    placeholder="1400"
                                />
                                <InputError message={form.errors.amount} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Cadence</Label>
                                <Select
                                    value={form.data.recurrence_type}
                                    onValueChange={(value) => form.setData('recurrence_type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {recurrenceOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.recurrence_type} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="form-interval">Interval</Label>
                                <Input
                                    id="form-interval"
                                    type="number"
                                    min={1}
                                    max={52}
                                    value={form.data.recurrence_interval}
                                    onChange={(event) =>
                                        form.setData(
                                            'recurrence_interval',
                                            Number(event.target.value) || 1,
                                        )
                                    }
                                />
                                <InputError message={form.errors.recurrence_interval} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="form-date">First due date</Label>
                                <Input
                                    id="form-date"
                                    type="date"
                                    value={form.data.first_due_date}
                                    onChange={(event) =>
                                        form.setData('first_due_date', event.target.value)
                                    }
                                />
                                <InputError message={form.errors.first_due_date} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="form-category">Category</Label>
                                <Input
                                    id="form-category"
                                    value={form.data.category}
                                    onChange={(event) => form.setData('category', event.target.value)}
                                    placeholder="Housing"
                                />
                                <InputError message={form.errors.category} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="form-notes">Notes</Label>
                            <textarea
                                id="form-notes"
                                className="min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                value={form.data.notes}
                                onChange={(event) => form.setData('notes', event.target.value)}
                                placeholder="Anything special about this payment"
                            />
                            <InputError message={form.errors.notes} />
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-dashed p-3">
                            <Checkbox
                                id="form-active"
                                checked={form.data.active}
                                onCheckedChange={(checked) =>
                                    form.setData('active', checked === true)
                                }
                            />
                            <div>
                                <Label htmlFor="form-active">Active</Label>
                                <p className="text-xs text-muted-foreground">
                                    Pause to keep this out of future cycles.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={closeDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {editingId ? 'Save changes' : 'Save commitment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

CommitmentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Commitments',
            href: commitmentsIndex().url,
        } as BreadcrumbItem,
    ],
};
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   