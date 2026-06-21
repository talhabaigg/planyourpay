import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    ListChecks,
    Wallet,
} from 'lucide-react';
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
    if (!iso) {
        return '';
    }

    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) {
        return '';
    }

    return d.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

interface CoverSummary {
    id: number;
    source: 'saver' | 'paycheck';
    amount: number;
    saverPlan?: { id: number; name: string } | null;
}

interface UpcomingItem {
    id: number;
    name: string;
    amount: number;
    pay_amount?: number;
    category: string | null;
    due: string | null;
    covers?: CoverSummary[];
}

type DashboardProps = {
    income: number | null;
    committed: number;
    surplus: number | null;
    primaryName: string | null;
    payPeriodStart: string | null;
    payPeriodEnd: string | null;
    commitments: UpcomingItem[];
    commitmentCount: number;
};

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

    if (income === null && commitmentCount === 0) {
        return (
            <>
                <Head title="Dashboard" />
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Wallet className="h-6 w-6" />
                            </span>
                            <div>
                                <p className="text-lg font-semibold">
                                    Let’s set up your plan
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add a pay schedule and your recurring
                                    commitments to see every pay cycle at a
                                    glance.
                                </p>
                            </div>
                            <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <Button asChild className="w-full sm:w-auto">
                                    <Link href={paySchedulesIndex().url}>
                                        Add pay schedule
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
                                    <Link href={commitmentsIndex().url}>
                                        Add commitment
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    const committedPct =
        income && income > 0
            ? Math.min(100, Math.round((committed / income) * 100))
            : null;
    const periodLabel =
        payPeriodStart && payPeriodEnd
            ? `${formatDue(payPeriodStart)} – ${formatDue(payPeriodEnd)}`
            : null;

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
                <Card>
                    <CardContent className="space-y-5 p-5">
                        <div className="flex flex-wrap items-center justify-between text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {primaryName ?? 'Pay cycle'}
                            </span>
                            {periodLabel && <span>{periodLabel}</span>}
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Left to allocate
                            </p>
                            <p className="text-4xl font-semibold tracking-tight text-foreground">
                                {currency.format(surplus ?? 0)}
                            </p>
                        </div>

                        {committedPct !== null && (
                            <div className="space-y-2">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${committedPct}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>
                                        {currency.format(committed)} committed
                                    </span>
                                    <span>{currency.format(income!)} in</span>
                                </div>
                            </div>
                        )}

                        <Button asChild size="sm" variant="secondary">
                            <Link href={payCyclesIndex().url}>
                                View pay cycles
                                <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            Upcoming
                        </CardTitle>
                        <Link
                            href={commitmentsIndex().url}
                            className="text-sm font-medium text-primary"
                        >
                            See all
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {commitments.length > 0 ? (
                            <ul className="divide-y divide-border border-t">
                                {commitments.map((item) => {
                                    const payAmount =
                                        item.pay_amount ?? item.amount;
                                    const coverLabel = item.covers
                                        ?.map(
                                            (cover) =>
                                                `${currency.format(cover.amount)} ` +
                                                (cover.source === 'saver'
                                                    ? `from ${cover.saverPlan?.name ?? 'Saver'}`
                                                    : 'from pay cheque'),
                                        )
                                        .join(', ');

                                    return (
                                        <li
                                            key={item.id}
                                            className="flex items-center justify-between gap-3 px-4 py-2.5"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {[
                                                        formatDue(item.due),
                                                        item.category,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                                {coverLabel && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Covered: {coverLabel}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="shrink-0 font-medium">
                                                {currency.format(payAmount)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : commitmentCount > 0 ? (
                            <div className="flex items-center gap-2 border-t px-4 py-4 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                All commitments complete this pay
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 border-t px-4 py-8 text-center">
                                <ListChecks className="h-5 w-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    No active commitments yet.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
