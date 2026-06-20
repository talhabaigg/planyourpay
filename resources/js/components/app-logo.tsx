import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-3">
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] text-white">
                <AppLogoIcon className="h-5 w-5" />
            </div>
            <div className="leading-tight">
                <p className="text-sm font-semibold text-[var(--foreground)]">PlanYourPay</p>
                <p className="text-xs text-[color-mix(in srgb, var(--foreground) 60%, transparent)]">
                    Assign every pay in advance
                </p>
            </div>
        </div>
    );
}
