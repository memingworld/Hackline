import { Metadata } from "next";
import { cookies } from "next/headers";
import { getActiveHackathons } from "@/lib/data/hackathons";
import { getUserSavedSquads } from "@/lib/data/squads";
import { HackathonsManager } from "@/components/scraper/HackathonsManager";

export const metadata: Metadata = {
  title: "Hackathons Catalog & Magic Scraper — Hackline",
  description: "Scrape, track, and manage hackathons from Devfolio, Unstop, Devpost, and Luma.",
};

export default async function HackathonsPage(props: {
  searchParams: Promise<{ hackathon?: string; action?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const activeHackathonId =
    searchParams.hackathon || cookieStore.get("active_hackathon_id")?.value;

  const [hackathons, savedPresets] = await Promise.all([
    getActiveHackathons(),
    getUserSavedSquads(),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <HackathonsManager
        initialHackathons={hackathons}
        savedSquadPresets={savedPresets}
        activeHackathonId={activeHackathonId}
      />
    </div>
  );
}
