import { Link } from '@inertiajs/react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { mainNavItems } from '@/lib/nav-items';
import { cn } from '@/lib/utils';

/**
 * Mobile-first bottom tab bar. Visible only below `md`; the desktop
 * sidebar takes over from `md` up. Sits fixed at the bottom so the
 * primary destinations stay within thumb reach, with iOS safe-area
 * padding so it clears the home indicator.
 */
export function BottomNav() {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <nav
            aria-label="Primary"
            className="fixed inset-x-0 bottom-0 z-50 border-t border-sidebar-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden dark:border-sidebar-border"
        >
            <ul className="mx-auto flex max-w-md items-stretch justify-around">
                {mainNavItems.map((item) => {
                    const active = isCurrentOrParentUrl(item.href);

                    return (
                        <li key={item.title} className="flex-1">
                            <Link
                                href={item.href}
                                prefetch
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors',
                                    active
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {item.icon && (
                                    <item.icon
                                        className={cn(
                                            'h-5 w-5 shrink-0',
                                            active && 'stroke-[2.25]',
                                        )}
                                    />
                                )}
                                <span className="max-w-full truncate">
                                    {item.title}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
