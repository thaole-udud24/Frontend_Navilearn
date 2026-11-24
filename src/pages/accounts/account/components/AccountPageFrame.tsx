import type { ReactNode } from 'react';

interface AccountPageFrameProps {
  title: string;
  description: string;
  children: ReactNode;
}

/** Heading + card used by the single-purpose account pages (profile, change password). */
export function AccountPageFrame({ title, description, children }: AccountPageFrameProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <section className="rounded-card border border-border bg-card p-5 shadow-card">{children}</section>
    </div>
  );
}
