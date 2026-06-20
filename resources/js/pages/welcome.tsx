import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { dashboard, login } from '@/routes';
/* @chisel-registration */
import { register } from '@/routes';
/* @end-chisel-registration */

const features = [
    'Paycheck briefs for weekly, fortnightly, or monthly cycles',
    'Monthly + annual bill pairing',
    'Credit-card float awareness',
    'Simple buffer + warning signals'
];

const steps = ['Add pays & bills', 'Set float rules', 'Follow the brief'];

const previewPays = [
    { label: 'Pay #14', date: '12 Jul', bills: ['Car loan', 'Internet'], surplus: '$1,320' },
    { label: 'Pay #15', date: '26 Jul', bills: ['Mortgage', 'Mobile'], surplus: '$900' },
    { label: 'Card cycle', date: '4 Aug', bills: ['Credit card statement'], surplus: '$1,980' }
];

export default function Welcome() {
    const { auth } = usePage().props;
    const [activePreview, setActivePreview] = useState(previewPays[0]);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        setTheme(prefersLight ? 'light' : 'dark');
    }, []);

    const isDark = theme === 'dark';

    const primaryCta = auth.user ? (
        <Link
            href={dashboard()}
            className={`inline-flex flex-1 items-center justify-center rounded-md px-6 py-2 text-sm font-semibold ${
                isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}
        >
            Open dashboard
        </Link>
    ) : (
        <Link
            href={login()}
            className={`inline-flex flex-1 items-center justify-center rounded-md px-6 py-2 text-sm font-semibold ${
                isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}
        >
            Log in
        </Link>
    );

    const secondaryCta = auth.user ? null : (
        <Link
            href={register()}
            className={`inline-flex flex-1 items-center justify-center rounded-md border px-6 py-2 text-sm font-semibold ${
                isDark ? 'border-white/30 text-white' : 'border-slate-900/30 text-slate-900'
            }`}
        >
            Try PlanYourPay
        </Link>
    );

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#05060b] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
            <Head title="PlanYourPay" />
            <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10">
                <header className={`flex flex-col gap-4 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'} sm:flex-row sm:items-center sm:justify-between`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold ${isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                                PY
                            </span>
                            <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>PlanYourPay</p>
                        </div>
                        <button
                            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-base ${isDark ? 'border-white/20 text-white/80 hover:border-white/40' : 'border-slate-900/20 text-slate-600 hover:border-slate-900/40'}`}
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                    </div>
                    <nav className="flex flex-wrap gap-3">
                        {auth.user ? (
                            <Link href={dashboard()} className={`rounded-full border px-4 py-1.5 ${isDark ? 'border-white/20' : 'border-slate-900/20 text-slate-700'}`}>
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={login()} className={`rounded-full border px-4 py-1.5 ${isDark ? 'border-white/20' : 'border-slate-900/20 text-slate-700'}`}>
                                    Log in
                                </Link>
                                <Link href={register()} className={`rounded-full border px-4 py-1.5 ${isDark ? 'border-white/20' : 'border-slate-900/20 text-slate-700'}`}>
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <section className="grid gap-10 md:grid-cols-2">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Your pay, already assigned.</h1>
                        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                            PlanYourPay keeps weekly, fortnightly, or monthly pays in sync with every bill.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            {primaryCta}
                            {secondaryCta}
                        </div>
                    </div>
                    <div className={`rounded-3xl p-5 text-sm ${isDark ? 'bg-white/5' : 'bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]'}`}>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {previewPays.map((pay) => (
                                <button
                                    key={pay.label}
                                    onClick={() => setActivePreview(pay)}
                                    className={`rounded-full px-3 py-1 transition ${
                                        pay.label === activePreview.label
                                            ? isDark
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-900 text-white'
                                            : isDark
                                            ? 'text-white/60 hover:text-white'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {pay.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-5 space-y-3">
                            <div className="space-y-2 border-t border-white/10 pt-3">
                                <p className="text-lg font-semibold">{activePreview.date}</p>
                                <ul className={`space-y-1 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                                    {activePreview.bills.map((bill) => (
                                        <li key={bill}>• {bill}</li>
                                    ))}
                                </ul>
                                <div className="flex items-center justify-between text-sm">
                                    <span className={isDark ? 'text-white/60' : 'text-slate-500'}>Surplus</span>
                                    <span className={`text-xl font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                        {activePreview.surplus}
                                    </span>
                                </div>
                            </div>
                            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                                Tap a tab to experience a real pay brief—no login required.
                            </p>
                        </div>
                    </div>
                </section>

                <section className={`space-y-3 rounded-3xl p-6 ${isDark ? 'bg-white/5' : 'bg-white shadow-[0_30px_60px_rgba(15,23,42,0.05)]'}`}>
                    {features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm last:border-b-0">
                            <span className={`text-xs font-semibold ${isDark ? 'text-white/40' : 'text-slate-500'}`}>•</span>
                            <span className={isDark ? 'text-white/80' : 'text-slate-700'}>{feature}</span>
                        </div>
                    ))}
                </section>

                <section className="space-y-4">
                    <p className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Flow</p>
                    <ul className="grid gap-3 md:grid-cols-3">
                        {steps.map((step, idx) => (
                            <li
                                key={step}
                                className={`rounded-full px-4 py-3 text-sm font-semibold ${isDark ? 'bg-white/5 text-white' : 'bg-slate-900/5 text-slate-900'}`}
                            >
                                <span className="mr-2 text-xs opacity-60">{String(idx + 1).padStart(2, '0')}</span>
                                {step}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="text-center">
                    <h2 className="text-3xl font-semibold">Ready for the next pay cycle?</h2>
                    <p className={`mt-3 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                        Give every pay a plan in minutes. Calm follows.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        {primaryCta}
                        {secondaryCta}
                    </div>
                </section>

                <footer className={`pb-6 text-center text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    PlanYourPay · {new Date().getFullYear()}
                </footer>
            </div>
        </div>
    );
}
