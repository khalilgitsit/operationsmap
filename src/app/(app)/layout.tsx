import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TopBar } from '@/components/top-bar';
import { Sidebar } from '@/components/sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen flex-col">
        <TopBar userEmail={user.email ?? ''} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
