'use client';

interface Breadcrumb {
  label: string;
  href: string;
}

interface PageTemplateProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageTemplate({ title, description, breadcrumbs, actions, children }: PageTemplateProps) {
  return (
    <div className="space-y-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex text-sm text-gray-500">
          {breadcrumbs.map((item, i) => (
            <span key={item.href} className="flex items-center">
              {i > 0 && <span className="mx-2">/</span>}
              <a href={item.href} className="hover:text-primary-600">
                {item.label}
              </a>
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-600 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {children}
    </div>
  );
}


