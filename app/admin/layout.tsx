"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "melxluki34@gmail.com";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      const email = user.email?.toLowerCase().trim();

      if (email !== ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkAccess();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 shadow-sm">
          Verificando acesso...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
