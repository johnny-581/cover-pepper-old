import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost"
    contentLeft?: boolean;
    icon?: ReactNode;
    children: ReactNode;
};

export default function Button({
    variant = "primary",
    contentLeft,
    disabled,
    icon,
    className,
    children,
    ...rest
}: Props) {
    const height = "h-10"
    const base = "inline-flex items-center rounded-lg whitespace-nowrap font-sans transition select-none"
    const disabledStyle = "opacity-50 cursor-not-allowed pointer-events-none";
    const contentLeftStyle = "min-w-20 justify-left px-3"

    const variants = {
        primary: "bg-theme-primary hover:bg-theme-primary-hover",
        secondary: "bg-theme-medium-gray hover:bg-theme-selection-gray",
        ghost: "bg-transparent hover:bg-theme-hover-gray",
    }

    return (
        <button
            className={clsx(
                base,
                height,
                variants[variant],
                disabled ? disabledStyle : "hover:cursor-pointer",
                contentLeft ? contentLeftStyle : "px-4",
                className
            )}
            disabled={disabled}
            {...rest}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
}