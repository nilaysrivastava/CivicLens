import { ReactNode } from 'react';

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-16 h-16 bg-civic-soft-bg border border-civic-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <span className="text-2xl">🚧</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-civic-main mb-4">
        {title}
      </h1>
      <p className="text-lg text-civic-muted max-w-lg mx-auto">
        {description}
      </p>
    </div>
  );
}
