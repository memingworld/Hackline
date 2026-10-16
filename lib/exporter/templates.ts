export interface SubmissionKitMember {
  id: string;
  name: string;
  duty: string;
  githubUrl?: string;
  linkedinUrl?: string;
  include: boolean;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface SubmissionKitFormData {
  title: string;
  tagline: string;
  track?: string;
  problemDescription: string;
  solutionDescription: string;
  repoUrl: string;
  demoVideoUrl: string;
  deckUrl: string;
  liveAppUrl: string;
  techStack: string[];
  challenges: string;
  nextSteps: string;
  members: SubmissionKitMember[];
  customFields: CustomField[];
}

/**
 * Cleanly format squad members for Markdown output based on user-entered GitHub/LinkedIn links.
 */
function formatTeamMarkdown(members: SubmissionKitMember[]): string {
  const activeMembers = members.filter((m) => m.include && m.name.trim());
  if (activeMembers.length === 0) return "*Squad members not specified.*";

  return activeMembers
    .map((m) => {
      const links: string[] = [];
      if (m.githubUrl?.trim()) {
        const gh = m.githubUrl.trim();
        const display = gh.replace(/^https?:\/\/(www\.)?github\.com\//i, "@");
        links.push(`[GitHub (${display})](${gh.startsWith("http") ? gh : `https://${gh}`})`);
      }
      if (m.linkedinUrl?.trim()) {
        const li = m.linkedinUrl.trim();
        links.push(`[LinkedIn](${li.startsWith("http") ? li : `https://${li}`})`);
      }
      const linkStr = links.length > 0 ? ` (${links.join(" • ")})` : "";
      return `- **${m.name.trim()}** — *${m.duty.trim() || "Contributor"}*${linkStr}`;
    })
    .join("\n");
}

/**
 * Generate Devpost-standard formatted submission markdown.
 */
export function generateDevpostMarkdown(data: SubmissionKitFormData): string {
  const techStackStr = data.techStack.length > 0 ? data.techStack.join(", ") : "None specified";
  const trackStr = data.track ? `\n> **Hackathon Track:** ${data.track}\n` : "";

  let content = `# ${data.title || "Project Title"}\n\n`;
  if (data.tagline?.trim()) {
    content += `> ${data.tagline.trim()}\n\n`;
  }
  content += `${trackStr}\n`;

  // Links Bar
  const links: string[] = [];
  if (data.liveAppUrl?.trim()) links.push(`[🌐 Live Demo](${data.liveAppUrl.trim()})`);
  if (data.repoUrl?.trim()) links.push(`[💻 GitHub Repo](${data.repoUrl.trim()})`);
  if (data.demoVideoUrl?.trim()) links.push(`[🎬 Video Demo](${data.demoVideoUrl.trim()})`);
  if (data.deckUrl?.trim()) links.push(`[📊 Pitch Deck](${data.deckUrl.trim()})`);
  if (links.length > 0) {
    content += `### Quick Links\n${links.join(" • ")}\n\n---\n\n`;
  }

  // Devpost Question 1: Inspiration
  content += `## Inspiration\n${data.problemDescription?.trim() || "Describe the real-world problem or inspiration that sparked this project."}\n\n`;

  // Devpost Question 2: What it does
  content += `## What It Does\n${data.solutionDescription?.trim() || "Describe the core solution, key features, and user journey."}\n\n`;

  // Devpost Question 3: How we built it
  content += `## How We Built It\n`;
  content += `**Tech Stack:** ${techStackStr}\n\n`;
  if (data.customFields.length > 0) {
    content += `**Key Specifications:**\n`;
    data.customFields.forEach((cf) => {
      if (cf.label.trim() && cf.value.trim()) {
        content += `- **${cf.label.trim()}:** ${cf.value.trim()}\n`;
      }
    });
    content += "\n";
  }

  // Devpost Question 4: Challenges we ran into
  content += `## Challenges We Ran Into\n${data.challenges?.trim() || "Describe the primary technical hurdles, architectural pivots, or sprint blockers overcome."}\n\n`;

  // Devpost Question 5: Accomplishments & What we learned
  content += `## What We Learned & What's Next\n${data.nextSteps?.trim() || "Key takeaways from this sprint and future roadmap milestones."}\n\n`;

  // Team
  content += `## Built By Squad\n${formatTeamMarkdown(data.members)}\n`;

  return content.trim();
}

/**
 * Generate Devfolio-standard project story markdown.
 */
export function generateDevfolioMarkdown(data: SubmissionKitFormData): string {
  let content = `# ${data.title || "Project Title"}\n\n`;
  if (data.tagline?.trim()) {
    content += `**${data.tagline.trim()}**\n\n`;
  }

  content += `## Project Overview\n${data.solutionDescription?.trim() || data.problemDescription?.trim() || "Project overview and features."}\n\n`;

  if (data.problemDescription?.trim() && data.solutionDescription?.trim()) {
    content += `### The Problem\n${data.problemDescription.trim()}\n\n`;
    content += `### The Solution\n${data.solutionDescription.trim()}\n\n`;
  }

  content += `## Tech Stack\n`;
  if (data.techStack.length > 0) {
    content += data.techStack.map((t) => `- \`${t}\``).join("\n") + "\n\n";
  } else {
    content += `*No technologies listed.*\n\n`;
  }

  content += `## Deliverables & Links\n`;
  if (data.repoUrl?.trim()) content += `- **Code Repository:** ${data.repoUrl.trim()}\n`;
  if (data.liveAppUrl?.trim()) content += `- **Live App / Deployment:** ${data.liveAppUrl.trim()}\n`;
  if (data.demoVideoUrl?.trim()) content += `- **Demo Walkthrough Video:** ${data.demoVideoUrl.trim()}\n`;
  if (data.deckUrl?.trim()) content += `- **Slide Deck:** ${data.deckUrl.trim()}\n`;

  data.customFields.forEach((cf) => {
    if (cf.label.trim() && cf.value.trim()) {
      content += `- **${cf.label.trim()}:** ${cf.value.trim()}\n`;
    }
  });

  content += `\n## Squad Contributors\n${formatTeamMarkdown(data.members)}\n`;

  return content.trim();
}

/**
 * Generate Unstop plain-text formatted summary (optimized for strict character count limits).
 */
export function generateUnstopPlainText(data: SubmissionKitFormData): string {
  let text = `PROJECT NAME: ${data.title || "Untitled Project"}\n`;
  if (data.tagline?.trim()) text += `TAGLINE: ${data.tagline.trim()}\n`;
  if (data.track?.trim()) text += `TRACK: ${data.track.trim()}\n`;
  text += `\nPROBLEM STATEMENT:\n${data.problemDescription?.trim() || "N/A"}\n`;
  text += `\nPROPOSED SOLUTION:\n${data.solutionDescription?.trim() || "N/A"}\n`;

  if (data.techStack.length > 0) {
    text += `\nTECHNOLOGIES USED:\n${data.techStack.join(", ")}\n`;
  }

  text += `\nSUBMISSION LINKS:\n`;
  if (data.repoUrl?.trim()) text += `- Repository: ${data.repoUrl.trim()}\n`;
  if (data.liveAppUrl?.trim()) text += `- Live Demo: ${data.liveAppUrl.trim()}\n`;
  if (data.demoVideoUrl?.trim()) text += `- Video Demo: ${data.demoVideoUrl.trim()}\n`;
  if (data.deckUrl?.trim()) text += `- Presentation: ${data.deckUrl.trim()}\n`;

  const activeMembers = data.members.filter((m) => m.include && m.name.trim());
  if (activeMembers.length > 0) {
    text += `\nTEAM MEMBERS:\n`;
    activeMembers.forEach((m) => {
      text += `- ${m.name.trim()} (${m.duty.trim() || "Contributor"})\n`;
    });
  }

  return text.trim();
}

/**
 * Generate standard GitHub README.md ready to commit to the repository.
 */
export function generateReadmeMarkdown(data: SubmissionKitFormData): string {
  let md = `# ${data.title || "Project Name"}\n\n`;
  if (data.tagline?.trim()) {
    md += `> ${data.tagline.trim()}\n\n`;
  }

  // Badges / Quick links
  const links: string[] = [];
  if (data.liveAppUrl?.trim()) links.push(`[🌐 Live Web App](${data.liveAppUrl.trim()})`);
  if (data.demoVideoUrl?.trim()) links.push(`[🎬 Demo Video](${data.demoVideoUrl.trim()})`);
  if (data.deckUrl?.trim()) links.push(`[📊 Pitch Deck](${data.deckUrl.trim()})`);
  if (links.length > 0) {
    md += `${links.join(" • ")}\n\n`;
  }

  md += `## 💡 About The Project\n\n`;
  if (data.problemDescription?.trim()) {
    md += `### Problem\n${data.problemDescription.trim()}\n\n`;
  }
  if (data.solutionDescription?.trim()) {
    md += `### Solution\n${data.solutionDescription.trim()}\n\n`;
  }

  if (data.techStack.length > 0) {
    md += `## 🛠️ Built With\n\n`;
    md += data.techStack.map((tech) => `- **${tech}**`).join("\n") + "\n\n";
  }

  md += `## 👥 Team Squad\n\n${formatTeamMarkdown(data.members)}\n\n`;
  md += `---\n*Generated with [HackLine](https://hackline.dev) — Competitive Hackathon OS*`;

  return md.trim();
}

/**
 * Machine-readable JSON export of squad submission.
 */
export function generateTeamJson(data: SubmissionKitFormData): string {
  return JSON.stringify(
    {
      project_title: data.title,
      tagline: data.tagline,
      track: data.track || null,
      problem_statement: data.problemDescription,
      solution_overview: data.solutionDescription,
      tech_stack: data.techStack,
      deliverables: {
        github_repository: data.repoUrl || null,
        live_app: data.liveAppUrl || null,
        demo_video: data.demoVideoUrl || null,
        slide_deck: data.deckUrl || null,
      },
      custom_fields: data.customFields.reduce((acc, f) => {
        if (f.label.trim()) acc[f.label.trim()] = f.value.trim();
        return acc;
      }, {} as Record<string, string>),
      team_roster: data.members
        .filter((m) => m.include && m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          duty: m.duty.trim(),
          github: m.githubUrl?.trim() || null,
          linkedin: m.linkedinUrl?.trim() || null,
        })),
      exported_at: new Date().toISOString(),
      platform: "HackLine",
    },
    null,
    2
  );
}

/**
 * Extract clean single fields for 1-click clipboard copy (useful for Google Forms & custom portals).
 */
export function getQuickCopyFields(data: SubmissionKitFormData): Array<{ label: string; value: string }> {
  const fields: Array<{ label: string; value: string }> = [];

  if (data.title?.trim()) fields.push({ label: "Project Title", value: data.title.trim() });
  if (data.tagline?.trim()) fields.push({ label: "Tagline / Short Pitch", value: data.tagline.trim() });
  if (data.problemDescription?.trim()) fields.push({ label: "Problem / Inspiration", value: data.problemDescription.trim() });
  if (data.solutionDescription?.trim()) fields.push({ label: "Solution / What It Does", value: data.solutionDescription.trim() });
  if (data.repoUrl?.trim()) fields.push({ label: "GitHub Repository URL", value: data.repoUrl.trim() });
  if (data.liveAppUrl?.trim()) fields.push({ label: "Live App / Deployment URL", value: data.liveAppUrl.trim() });
  if (data.demoVideoUrl?.trim()) fields.push({ label: "Demo Video URL", value: data.demoVideoUrl.trim() });
  if (data.deckUrl?.trim()) fields.push({ label: "Pitch Deck URL", value: data.deckUrl.trim() });
  if (data.techStack.length > 0) fields.push({ label: "Tech Stack (Comma-Separated)", value: data.techStack.join(", ") });

  const activeMembers = data.members.filter((m) => m.include && m.name.trim());
  if (activeMembers.length > 0) {
    fields.push({
      label: "Team Members List",
      value: activeMembers.map((m) => `${m.name} (${m.duty || "Member"})`).join(", "),
    });
  }

  data.customFields.forEach((cf) => {
    if (cf.label.trim() && cf.value.trim()) {
      fields.push({ label: cf.label.trim(), value: cf.value.trim() });
    }
  });

  return fields;
}
