import type { ReactNode } from "react";

type Props = {
    autoHeightAndWidth?: boolean,
    className?: string,
    children: ReactNode
}

export default function ThemeContainer({ autoHeightAndWidth = false, className, children, ...rest }: Props) {
    const height = autoHeightAndWidth ? "" : "h-full w-full"
    return (
        <div className={`${height} min-h-0 rounded-lg theme-border overflow-hidden ${className}`} {...rest}>
            {children}
        </div>
    )
}