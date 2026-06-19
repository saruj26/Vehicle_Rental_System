import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
        <Compass className="h-10 w-10" />
      </div>
      <p className="text-5xl font-extrabold tracking-tight">404</p>
      <h1 className="mt-3 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="primary">Back to home</Button>
      </Link>
    </div>
  );
}
