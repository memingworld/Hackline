import { createClient } from "@/utils/supabase/server";
import { SubmissionKitFormData, SubmissionKitMember } from "@/lib/exporter/templates";
import { extractReservedMembers } from "@/lib/data/reserved-members";

/**
 * Fetch and assemble initial submission kit data for the given team and hackathon.
 * Safely handles missing records, 0 assets, and unselected problem statements without crashing.
 */
export async function getSubmissionKitInitialData(
  teamId: string,
  hackathonId?: string
): Promise<SubmissionKitFormData> {
  const fallback: SubmissionKitFormData = {
    title: "",
    tagline: "",
    track: "",
    problemDescription: "",
    solutionDescription: "",
    repoUrl: "",
    demoVideoUrl: "",
    deckUrl: "",
    liveAppUrl: "",
    techStack: [],
    challenges: "",
    nextSteps: "",
    members: [],
    customFields: [],
  };

  if (!teamId) return fallback;

  try {
    const supabase = await createClient();

    // 1. Fetch team with roster & profiles
    const { data: teamData } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        description,
        hackathon_id,
        members:team_members(
          id,
          duty,
          is_captain,
          user_id,
          user:profiles(
            id,
            full_name,
            github_handle,
            email
          )
        )
      `)
      .eq("id", teamId)
      .maybeSingle();

    const team = teamData;
    const resolvedHackathonId = hackathonId || team?.hackathon_id;

    // 2. Fetch winning or top problem statement from Idea Vault
    let winningIdea: { title: string; description?: string | null; track?: string | null } | null = null;
    const { data: statements } = await supabase
      .from("problem_statements")
      .select("id, title, description, track, is_selected, created_at")
      .eq("team_id", teamId)
      .order("is_selected", { ascending: false })
      .order("created_at", { ascending: false });

    if (statements && statements.length > 0) {
      // Prioritize selected idea, fallback to most recent
      const selected = statements.find((s) => s.is_selected) || statements[0];
      winningIdea = {
        title: selected.title,
        description: selected.description,
        track: selected.track,
      };
    }

    // 3. Fetch team assets (repo, demo, deck, live app)
    const { data: assets } = await supabase
      .from("assets")
      .select("category, title, url")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    let repoUrl = "";
    let demoVideoUrl = "";
    let deckUrl = "";
    let liveAppUrl = "";

    if (assets) {
      for (const asset of assets) {
        if (!repoUrl && (asset.category === "repo" || asset.url.includes("github.com"))) {
          repoUrl = asset.url;
        } else if (!demoVideoUrl && (asset.category === "demo" || asset.url.includes("loom.com") || asset.url.includes("youtube.com"))) {
          demoVideoUrl = asset.url;
        } else if (!deckUrl && (asset.category === "deck" || asset.url.includes("pitch.com") || asset.url.includes("slides.google.com"))) {
          deckUrl = asset.url;
        } else if (!liveAppUrl && (asset.category === "other" || asset.title.toLowerCase().includes("live") || asset.title.toLowerCase().includes("demo"))) {
          liveAppUrl = asset.url;
        }
      }
    }

    // 4. Map squad roster to SubmissionKitMember format
    const members: SubmissionKitMember[] = [];
    if (team?.members && Array.isArray(team.members)) {
      team.members.forEach((m: any, idx: number) => {
        const profile = m.user;
        const name = profile?.full_name?.trim() || `Teammate ${idx + 1}`;
        const duty = m.duty?.trim() || (m.is_captain ? "Squad Captain" : "Full-Stack Developer");
        
        let ghUrl = "";
        if (profile?.github_handle) {
          const handle = profile.github_handle.trim();
          ghUrl = handle.startsWith("http") ? handle : `https://github.com/${handle.replace(/^@/, "")}`;
        }

        members.push({
          id: m.id || `member-${idx}`,
          name,
          duty,
          githubUrl: ghUrl,
          linkedinUrl: "",
          include: true,
        });
      });
    }

    // 5. Build and return initial pre-filled form data
    return {
      title: winningIdea?.title || team?.name || "",
      tagline: "",
      track: winningIdea?.track || "",
      problemDescription: winningIdea?.description || "",
      solutionDescription: "",
      repoUrl,
      demoVideoUrl,
      deckUrl,
      liveAppUrl,
      techStack: [],
      challenges: "",
      nextSteps: "",
      members,
      customFields: [],
    };
  } catch (err) {
    console.error("Error aggregating submission kit data:", err);
    return fallback;
  }
}
