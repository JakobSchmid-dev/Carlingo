import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

type Variant = 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost';

const base =
  'inline-flex min-h-tap items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-bold transition-colors duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:opacity-90',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-muted',
  danger: 'bg-danger text-primary-fg hover:opacity-90',
  'danger-outline': 'border border-danger bg-surface text-danger hover:bg-danger-soft',
  ghost: 'text-fg hover:bg-surface-muted',
};

export function buttonClass(variant: Variant = 'primary', block = false) {
  return `${base} ${variants[variant]} ${block ? 'w-full' : ''}`;
}

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  block = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button type="button" className={`${buttonClass(variant, block)} ${className}`} {...props} />
  );
}

export function ButtonLink({
  variant = 'primary',
  block = false,
  className = '',
  ...props
}: LinkProps & { variant?: Variant; block?: boolean }) {
  return <Link className={`${buttonClass(variant, block)} ${className}`} {...props} />;
}
