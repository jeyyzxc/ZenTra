import type { ReactNode } from 'react';

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-[#1F2933] dark:text-[#F4F4F0]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-[#667085] dark:text-[#A3B19B]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
