import Link from "next/link";

interface BreadcrumbProps {
  pageName: string;
}

export const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 mb-4">
      <h2 className="text-sm font-semibold text-dark dark:text-gray-100">
        {pageName}
      </h2>
      <nav>
        <ol className="flex items-center gap-1 text-xs">
          <li>
            <Link className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" href="/admin/dashboard">
              Dashboard
            </Link>
          </li>
          <li className="text-gray-400 dark:text-gray-500">/</li>
          <li className="text-primary dark:text-primary font-medium">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
