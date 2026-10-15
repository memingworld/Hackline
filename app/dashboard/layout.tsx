import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getActiveHackathons, getUserCurrentTeam } from "@/lib/data/hackathons";
import { getAllUserTimelineEvents } from "@/lib/data/timeline";

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

  const [hackathons, allTimelineEvents, profileRes] = await Promise.all([
    getActiveHackathons(),
    getAllUserTimelineEvents(),
    user
      ? supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const activeHackathon = hackathons[0] || null;
  const currentTeam = await getUserCurrentTeam(activeHackathon?.id);

  const userProfile = profileRes?.data;
  const avatarUrl =
    userProfile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    null;
  const userEmail = user?.email || "";
  const userName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : "Builder");

  return (
    <div className="flex min-h-screen bg-[#14110e] text-[#fef3c7] selection:bg-[#e5a93c]/30 selection:text-[#fef3c7]">
      <DashboardSidebar
        currentUserId={user?.id}
        userEmail={userEmail}
        userName={userName}
        avatarUrl={avatarUrl}
        hackathons={hackathons}
        timelineEvents={allTimelineEvents}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <DashboardHeader
          userEmail={userEmail}
          userName={userName}
          avatarUrl={avatarUrl}
          hackathons={hackathons}
          activeHackathonId={activeHackathon?.id}
          currentTeam={currentTeam}
        />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
