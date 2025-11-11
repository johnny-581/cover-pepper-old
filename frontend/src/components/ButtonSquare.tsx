import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost"
};

export default function ButtonSquare({
    variant = "primary",
    className,
    children,
    ...rest
}: Props) {
    const size = "h-9 w-9"
    const base = "inline-flex items-center justify-center rounded-lg whitespace-nowrap transition hover:cursor-pointer"

    const variants = {
        primary: "bg-theme-primary hover:bg-theme-primary-hover",
        ghost: "bg-transparent hover:bg-theme-hover-gray",
    }


    return (
        <button
            className={clsx(base, size, variants[variant], className)}
            {...rest}
        >
            {children}
        </button >
    );
}