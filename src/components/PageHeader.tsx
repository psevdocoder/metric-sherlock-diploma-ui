import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title?: string;
  description?: string;
  leading?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, leading, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        {title ? (
          <div className="page-title-row">
            {leading ? <div className="page-leading">{leading}</div> : null}
            <h1>{title}</h1>
          </div>
        ) : null}
        {description ? <p className="page-description">{description}</p> : null}
      </div>

      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}
