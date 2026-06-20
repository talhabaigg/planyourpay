import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" {...props}>
            <rect x="3" y="5" width="12" height="22" rx="6" stroke="currentColor" strokeWidth="2.5" />
            <path
                d="M17 7H25C27.2091 7 29 8.79086 29 11V17C29 19.2091 27.2091 21 25 21H17"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <circle cx="23" cy="24" r="3" fill="currentColor" />
        </svg>
    );
}
