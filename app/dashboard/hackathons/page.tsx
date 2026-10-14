import { Metadata } from "next";
import { getActiveHackathons } from "@/lib/data/hackathons";
import { getUserSavedSquads } from "@/lib/data/squads";
import { HackathonsManager } from "@/components/scraper/HackathonsManager";

export const metadata: Metadata = {
  title: "Hackathons Catalog & Magic Scraper — Hackline",
  description: "Scrape, track, and manage hackathons from Devfolio, Unstop, Devpost, and Luma.",
};

export default async function HackathonsPage() {
  const [hackathons, savedPresets] = await Promise.all([
    getActiveHackathons(),
    getUserSavedSquads(),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <HackathonsManager
        initialHackathons={hackathons}
        savedSquadPresets={savedPresets}
      />
    </div>
  );
}
