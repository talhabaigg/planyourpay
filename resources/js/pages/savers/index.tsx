import { Head, router, useForm } from '@inertiajs/react';
import {
    ExternalLink,
    MoreVertical,
    PiggyBank,
    RotateCcw,
    Target,
    Unplug,
    Wallet,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types/navigation';

interface Saver {
    id: string;
    name: string;
    balance: number;
    target?: number | null;
    targetDate?: string | null;
    contribution?: number | null;
}

interface PageProps {
    connected: boolean;
    error: string | null;
    savers: Saver[];
    total: number;
    spending: number | null;
    syncedAt: string | null;
    payDays: number | null;
    nextPayday: string | null;
}

const currency = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
});

const currency0 = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
});

function relativeTime(iso: string | null): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diff)) return '';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function fmtDate(d: Date | string | null): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

const DAY_MS = 86_400_000;

/** Number of paydays on or before a date, counting from the next payday. */
function paydaysUntil(targetDate: string, payDays: number, nextPayday: string): number {
    const np = new Date(nextPayday).getTime();
    const td = new Date(targetDate).getTime();
    if (np > td) return 0;
    return Math.floor((td - np) / (payDays * DAY_MS)) + 1;
}

/** Amount per pay needed to reach the goal by the target date (payday-aligned). */
function recommendedPerPay(
    target: number,
    targetDate: string | null,
    balance: number,
    payDays: number | null,
    nextPayday: string | null,
): number | null {
    if (!target || !targetDate || !payDays || !nextPayday) return null;
    const remaining = target - balance;
    if (remaining <= 0) return 0;
    const count = paydaysUntil(targetDate, payDays, nextPayday);
    if (count <= 0) return null;
    return Math.ceil(remaining / count);
}

/** Date the goal completes given a per-pay contribution (lands on a payday). */
function forecastDate(
    target: number,
    balance: number,
    contribution: number,
    payDays: number | null,
    nextPayday: string | null,
): Date | null {
    if (!target || !contribution || contribution <= 0 || !payDays || !nextPayday)
        return null;
    const remaining = target - balance;
    const np = new Date(nextPayday);
    if (remaining <= 0) return np;
    const k = Math.ceil(remaining / contribution);
    const d = new Date(np);
    d.setDate(d.getDate() + (k - 1) * payDays);
    return d;
}

function projection(s: Saver, payDays: number | null, nextPayday: string | null) {
    const target = s.target ?? 0;
    const hasTarget = target > 0;
    const pct = hasTarget ? Math.min(100, (s.balance / target) * 100) : null;

    if (hasTarget && s.balance >= target) {
        return { pct, label: 'Goal reached 🎉', status: null as 'ahead' | 'behind' | null };
    }

    const fc = forecastDate(target, s.balance, s.contribution ?? 0, payDays, nextPayday);
    if (!fc) {
        return { pct, label: null, status: null as 'ahead' | 'behind' | null };
    }

    let status: 'ahead' | 'behind' | null = null;
    if (s.targetDate) {
        status = fc.getTime() <= new Date(s.targetDate).getTime() ? 'ahead' : 'behind';
    }
    return { pct, label: `forecast ${fmtDate(fc)}`, status };
}

function ConnectForm() {
    const form = useForm<{ token: string }>({ token: '' });

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.post('/savers/connect', { onSuccess: () => form.reset() });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    Connect your Up account
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                    Paste a personal access token from Up to pull your Savers and
                    balances. It’s stored encrypted and used for read-only access —
                    PlanYourPay can’t move your money.
                </p>
                <form onSubmit={submit} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="up-token">Personal access token</Label>
                        <Input
                            id="up-token"
                            type="password"
                            autoComplete="off"
                            value={form.data.token}
                            onChange={(e) => form.setData('token', e.target.value)}
                            placeholder="up:yeah:..."
                        />
                        <InputError message={form.errors.token} />
                    </div>
                    <Button type="submit" disabled={form.processing} className="w-full sm:w-auto">
                        Connect
                    </Button>
                </form>
                <a
                    href="https://api.up.com.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                    Get your token from Up
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            </CardContent>
        </Card>
    );
}

export default function SaversIndex({
    connected,
    error,
    savers = [],
    total,
    spending,
    syncedAt,
    payDays,
    nextPayday,
}: PageProps) {
    const [planSaver, setPlanSaver] = useState<Saver | null>(null);
    const planForm = useForm<{
        name: string;
        target_amount: string;
        target_date: string;
        contribution_amount: string;
    }>({
        name: '',
        target_amount: '',
        target_date: '',
        contribution_amount: '',
    });

    const refresh = () =>
        router.get('/savers', { refresh: 1 }, { preserveScroll: true, preserveState: false });

    const disconnect = () => {
        if (window.confirm('Disconnect your Up account?')) {
            router.delete('/savers/disconnect', { preserveScroll: true });
        }
    };

    const openPlan = (s: Saver) => {
        setPlanSaver(s);
        planForm.setData({
            name: s.name,
            target_amount: s.target ? String(s.target) : '',
            target_date: s.targetDate ?? '',
            contribution_amount: s.contribution ? String(s.contribution) : '',
        });
        planForm.clearErrors();
    };

    const closePlan = () => {
        setPlanSaver(null);
        planForm.reset();
        planForm.clearErrors();
    };

    const submitPlan = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!planSaver) return;
        planForm.post(`/savers/${planSaver.id}/plan`, {
            preserveScroll: true,
            onSuccess: closePlan,
        });
    };

    // Live recommendation + forecast for the open plan dialog.
    const planTarget = Number(planForm.data.target_amount) || 0;
    const planContribution = Number(planForm.data.contribution_amount) || 0;
    const planBalance = planSaver?.balance ?? 0;
    const planTargetDate = planForm.data.target_date || null;
    const recommended = recommendedPerPay(
        planTarget,
        planTargetDate,
        planBalance,
        payDays,
        nextPayday,
    );
    const planForecast = forecastDate(
        planTarget,
        planBalance,
        planContribution,
        payDays,
        nextPayday,
    );
    const forecastBehind =
        !!planForecast &&
        !!planTargetDate &&
        planForecast.getTime() > new Date(planTargetDate).getTime();

    return (
        <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
            <Head title="Savers" />

            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Savers</h1>
                    <p className="text-sm text-muted-foreground">
                        Your Up Savers — set a goal and a per-pay transfer to project ahead.
                    </p>
                </div>
                {connected && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                aria-label="Saver options"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={refresh}>
                                <RotateCcw className="h-4 w-4" />
                                Refresh
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={disconnect}
                                className="text-destructive focus:text-destructive"
                            >
                                <Unplug className="h-4 w-4" />
                                Disconnect
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {!connected && <ConnectForm />}

            {connected && error && (
                <>
                    <Card className="border-destructive/40">
                        <CardContent className="px-5 py-4 text-sm text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                    <ConnectForm />
                </>
            )}

            {connected && !error && (
                <>
                    <Card className="overflow-hidden">
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground">Total in Savers</p>
                            <p className="text-4xl font-semibold tracking-tight text-emerald-500">
                                {currency.format(total)}
                            </p>
                            {spending !== null && (
                                <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        Spending account
                                    </span>
                                    <span className="ml-auto font-semibold tabular-nums">
                                        {currency.format(spending)}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="gap-0 overflow-hidden py-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                            <CardTitle className="text-base">
                                {savers.length} Saver{savers.length === 1 ? '' : 's'}
                            </CardTitle>
                            <button
                                type="button"
                                onClick={refresh}
                                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <RotateCcw className="h-3 w-3" />
                                {syncedAt ? `Updated ${relativeTime(syncedAt)}` : 'Refresh'}
                            </button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {savers.length > 0 ? (
                                <ul className="divide-y divide-border border-t">
                                    {savers.map((s) => {
                                        const zero = s.balance === 0;
                                        const hasPlan = !!s.target || !!s.contribution;
                                        const { pct, label, status } = projection(
                                            s,
                                            payDays,
                                            nextPayday,
                                        );

                                        return (
                                            <li key={s.id} className="px-4 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={cn(
                                                            'min-w-0 flex-1 truncate font-medium',
                                                            zero && !hasPlan && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {s.name}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'shrink-0 font-semibold tabular-nums',
                                                            zero && !hasPlan && 'font-normal text-muted-foreground',
                                                        )}
                                                    >
                                                        {currency.format(s.balance)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            'h-8 w-8 shrink-0',
                                                            hasPlan && 'text-primary',
                                                        )}
                                                        aria-label={`Plan ${s.name}`}
                                                        onClick={() => openPlan(s)}
                                                    >
                                                        <Target className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {hasPlan && (
                                                    <div className="mt-2 space-y-1">
                                                        {pct !== null && (
                                                            <>
                                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                                    <div
                                                                        className="h-full rounded-full bg-primary"
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                                    <span>
                                                                        {currency0.format(s.balance)} of{' '}
                                                                        {currency0.format(s.target as number)}
                                                                    </span>
                                                                    <span>{Math.round(pct)}%</span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {(s.contribution || label) && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {s.contribution
                                                                    ? `+${currency0.format(s.contribution)}/pay`
                                                                    : ''}
                                                                {s.contribution && label ? ' · ' : ''}
                                                                {label && (
                                                                    <span
                                                                        className={cn(
                                                                            status === 'behind' &&
                                                                                'text-amber-600 dark:text-amber-500',
                                                                            status === 'ahead' &&
                                                                                'text-emerald-600 dark:text-emerald-500',
                                                                        )}
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                )}
                                                                {s.targetDate && (
                                                                    <span> · goal {fmtDate(s.targetDate)}</span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
                                    No Savers found on this account.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            <Dialog open={planSaver !== null} onOpenChange={(o) => (o ? null : closePlan())}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{planSaver?.name}</DialogTitle>
                        <DialogDescription>
                            Set a goal and a per-pay transfer to project this Saver forward.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitPlan} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="plan-target">Goal amount</Label>
                                <Input
                                    id="plan-target"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={planForm.data.target_amount}
                                    onChange={(e) =>
                                        planForm.setData('target_amount', e.target.value)
                                    }
                                    placeholder="5000"
                                />
                                <InputError message={planForm.errors.target_amount} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="plan-date">Target date</Label>
                                <Input
                                    id="plan-date"
                                    type="date"
                                    value={planForm.data.target_date}
                                    onChange={(e) =>
                                        planForm.setData('target_date', e.target.value)
                                    }
                                />
                                <InputError message={planForm.errors.target_date} />
                            </div>
                        </div>

                        {recommended !== null && recommended > 0 && (
                            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                                <span className="text-muted-foreground">
                                    Put away{' '}
                                    <span className="font-semibold text-foreground">
                                        {currency0.format(recommended)}/pay
                                    </span>{' '}
                                    to reach goal by {fmtDate(planTargetDate)}
                                </span>
                                <button
                                    type="button"
                                    className="shrink-0 font-medium text-primary"
                                    onClick={() =>
                                        planForm.setData(
                                            'contribution_amount',
                                            String(recommended),
                                        )
                                    }
                                >
                                    Use this
                                </button>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="plan-contribution">Transfer each pay</Label>
                            <Input
                                id="plan-contribution"
                                type="number"
                                min="0"
                                step="0.01"
                                value={planForm.data.contribution_amount}
                                onChange={(e) =>
                                    planForm.setData('contribution_amount', e.target.value)
                                }
                                placeholder={recommended ? String(recommended) : '200'}
                            />
                            <InputError message={planForm.errors.contribution_amount} />
                            {planForecast && (
                                <p
                                    className={cn(
                                        'text-xs',
                                        forecastBehind
                                            ? 'text-amber-600 dark:text-amber-500'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    Forecast: complete by {fmtDate(planForecast)}
                                    {forecastBehind && planTargetDate
                                        ? ' — later than target'
                                        : ''}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={closePlan}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={planForm.processing}>
                                Save plan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

SaversIndex.layout = {
    breadcrumbs: [
        {
            title: 'Savers',
            href: '/savers',
        } as BreadcrumbItem,
    ],
};
