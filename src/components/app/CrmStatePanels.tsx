import { ShieldAlert } from 'lucide-react';

export function AccessDenied() {
  return (
    <div className="mx-auto my-12 max-w-xl rounded-3xl border border-[#eee7e2] bg-white p-8 text-center shadow-xl sm:p-12">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-[#464B43]">
        <ShieldAlert className="size-8" />
      </div>
      <h3 className="mt-5 text-2xl font-black text-slate-900">You don&apos;t have permission to access this section.</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">Ask an Admin to update your role in Roles &amp; Permissions.</p>
    </div>
  );
}
