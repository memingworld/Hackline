import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getActiveHackathons, getUserCurrentTeam } from "@/lib/data/hackathons";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasValidSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (!user && hasValidSupabase) {
    redirect("/login");
  }

  const [hackathons, currentTeam] = await Promise.all([
    getActiveHackathons(),
    getUserCurrentTeam(),
  ]);

  const activeHackathon = hackathons.length > 0 ? hackathons[0] : null;

  const userEmail = user?.email || "";
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : "Builder");

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-100 selection:bg-zinc-700 selection:text-white">
      <DashboardSidebar
        activeHackathon={activeHackathon}
        currentTeam={currentTeam}
        currentUserId={user?.id}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          userEmail={userEmail}
          userName={userName}
          hackathons={hackathons}
          activeHackathonId={activeHackathon?.id}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
