"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Edit3,
  CheckCircle2,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );
}
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  SubmissionKitFormData,
  SubmissionKitMember,
  CustomField,
  generateDevpostMarkdown,
  generateDevfolioMarkdown,
  generateUnstopPlainText,
  generateReadmeMarkdown,
  generateTeamJson,
  getQuickCopyFields,
} from "@/lib/exporter/templates";
import { auditSubmissionLinks, LinkAuditResult } from "@/lib/actions/audit-links";
import { fetchSubmissionKitData } from "@/lib/actions/submission-kit";

interface SubmissionKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  hackathonId?: string;
  initialData?: SubmissionKitFormData | null;
}

type TabType = "edit" | "export" | "quickcopy" | "audit";
type PlatformType = "devpost" | "devfolio" | "unstop" | "readme" | "json";

const COMMON_TECH_STACK_SUGGESTIONS = [
  "Next.js",
  "React",
  "TypeScript",
  "Supabase",
  "Tailwind CSS",
  "Node.js",
  "Python",
  "FastAPI",
  "PostgreSQL",
  "OpenAI API",
  "Prisma",
  "Vercel",
];

export function SubmissionKitModal({
  isOpen,
  onClose,
  teamId,
  hackathonId,
  initialData,
}: SubmissionKitModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>("edit");
  const [activePlatform, setActivePlatform] = React.useState<PlatformType>("devpost");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [auditResults, setAuditResults] = React.useState<LinkAuditResult[]>([]);
  const [tagInput, setTagInput] = React.useState("");

  // Form State
  const [formData, setFormData] = React.useState<SubmissionKitFormData>({
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
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch or initialize form data when modal opens
  React.useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData(initialData);
    } else if (teamId) {
      setIsLoading(true);
      fetchSubmissionKitData(teamId, hackathonId)
        .then((res) => {
          if (res.success && res.data) {
            setFormData(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load submission kit data:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, teamId, hackathonId, initialData]);

  if (!mounted || !isOpen) return null;

  // Add a tech tag
  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || tagInput).trim();
    if (!tag) return;
    if (!formData.techStack.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        techStack: [...prev.techStack, tag],
      }));
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((t) => t !== tagToRemove),
    }));
  };

  // Add custom field
  const handleAddCustomField = () => {
    setFormData((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { id: `cf-${Date.now()}`, label: "Field Name", value: "" },
      ],
    }));
  };

  const handleRemoveCustomField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((cf) => cf.id !== id),
    }));
  };

  // Add ad-hoc squad member
  const handleAddMember = () => {
    setFormData((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          id: `member-${Date.now()}`,
          name: "",
          duty: "Contributor",
          githubUrl: "",
          linkedinUrl: "",
          include: true,
        },
      ],
    }));
  };

  // Clipboard Copy helper
  const handleCopyText = (text: string, key = "global") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Download File helper
  const handleDownloadFile = (filename: string, content: string, mime = "text/markdown") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  // Run Link Audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const results = await auditSubmissionLinks({
        repoUrl: formData.repoUrl,
        demoVideoUrl: formData.demoVideoUrl,
        deckUrl: formData.deckUrl,
        liveAppUrl: formData.liveAppUrl,
      });
      setAuditResults(results);
      if (results.some((r) => r.status === "warning" || r.status === "error")) {
        toast.warning("Link audit completed with recommendations.");
      } else {
        toast.success("All deliverable links checked and verified!");
      }
    } catch {
      toast.error("Failed to run link audit.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Get active export text
  const getCompiledExportText = (): { content: string; filename: string; mime: string } => {
    switch (activePlatform) {
      case "devpost":
        return {
          content: generateDevpostMarkdown(formData),
          filename: `${formData.title || "hackline-project"}-devpost.md`,
          mime: "text/markdown",
        };
      case "devfolio":
        return {
          content: generateDevfolioMarkdown(formData),
          filename: `${formData.title || "hackline-project"}-devfolio.md`,
          mime: "text/markdown",
        };
      case "unstop":
        return {
          content: generateUnstopPlainText(formData),
          filename: `${formData.title || "hackline-project"}-unstop.txt`,
          mime: "text/plain",
        };
      case "readme":
        return {
          content: generateReadmeMarkdown(formData),
          filename: "README.md",
          mime: "text/markdown",
        };
      case "json":
        return {
          content: generateTeamJson(formData),
          filename: "submission-metadata.json",
          mime: "application/json",
        };
    }
  };

  const compiledExport = getCompiledExportText();
  const quickCopyFields = getQuickCopyFields(formData);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] md:h-[88vh] bg-[#16120E] border border-[#2E2822] rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A231C] bg-[#1C1712]/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#E5A93C]/15 border border-[#E5A93C]/30 text-[#E5A93C]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#FEF3C7] tracking-tight">
                  1-Click Submission Kit
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/40">
                  Universal Exporter
                </span>
              </div>
              <p className="text-xs text-[#A89A8C]">
                Pre-filled from your squad data. Fully customizable and ready to paste in 5 seconds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#A89A8C] hover:text-[#FEF3C7] hover:bg-[#251E17] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP TAB NAVIGATION (MOBILE FRIENDLY) */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#120F0C] border-b border-[#2A231C] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("edit")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === "edit"
                ? "bg-[#E5A93C] text-[#14110E] shadow-sm font-bold"
                : "text-[#A89A8C] hover:text-[#FEF3C7] hover:bg-[#1E1914]"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>1. Edit Details</span>
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === "export"
                ? "bg-[#E5A93C] text-[#14110E] shadow-sm font-bold"
                : "text-[#A89A8C] hover:text-[#FEF3C7] hover:bg-[#1E1914]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. Platform Export</span>
          </button>

          <button
            onClick={() => setActiveTab("quickcopy")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === "quickcopy"
                ? "bg-[#E5A93C] text-[#14110E] shadow-sm font-bold"
                : "text-[#A89A8C] hover:text-[#FEF3C7] hover:bg-[#1E1914]"
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>3. Quick Copy Drawer</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
              {quickCopyFields.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("audit");
              if (auditResults.length === 0) handleRunAudit();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === "audit"
                ? "bg-[#E5A93C] text-[#14110E] shadow-sm font-bold"
                : "text-[#A89A8C] hover:text-[#FEF3C7] hover:bg-[#1E1914]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Link Audit</span>
            {auditResults.some((r) => r.status === "warning") && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm text-[#FEF3C7]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#A89A8C]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#E5A93C]" />
              <p>Aggregating squad deliverables and Idea Vault...</p>
            </div>
          ) : activeTab === "edit" ? (
            /* TAB 1: EDIT FORM */
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* SECTION: PROJECT IDENTITY */}
              <div className="p-4 rounded-xl bg-[#1D1813] border border-[#2A231C] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  <span>Project Identity</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                      Project Name *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. HackLine"
                      className="bg-[#14110E] border-[#382F26] text-[#FEF3C7] focus:border-[#E5A93C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                      Hackathon Track / Category (Optional)
                    </label>
                    <Input
                      value={formData.track || ""}
                      onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                      placeholder="e.g. AI & Automation, Open Innovation"
                      className="bg-[#14110E] border-[#382F26] text-[#FEF3C7] focus:border-[#E5A93C]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                    Tagline / One-Line Elevator Pitch
                  </label>
                  <Input
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Collaborative sprint workspace for hackathon squads."
                    className="bg-[#14110E] border-[#382F26] text-[#FEF3C7] focus:border-[#E5A93C]"
                  />
                </div>
              </div>

              {/* SECTION: PROBLEM & SOLUTION */}
              <div className="p-4 rounded-xl bg-[#1D1813] border border-[#2A231C] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Problem & Solution</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                    The Problem & Inspiration (Pre-filled from Idea Vault)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.problemDescription}
                    onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                    placeholder="Describe what pain point sparked this build..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#14110E] border border-[#382F26] text-[#FEF3C7] focus:outline-none focus:border-[#E5A93C] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                    The Solution & Key Features (What It Does)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.solutionDescription}
                    onChange={(e) => setFormData({ ...formData, solutionDescription: e.target.value })}
                    placeholder="Describe how your project solves this problem and its primary features..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#14110E] border border-[#382F26] text-[#FEF3C7] focus:outline-none focus:border-[#E5A93C] resize-none"
                  />
                </div>
              </div>

              {/* SECTION: DELIVERABLES & LINKS */}
              <div className="p-4 rounded-xl bg-[#1D1813] border border-[#2A231C] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                    <ExternalLink className="w-4 h-4" />
                    <span>Submission Deliverable URLs</span>
                  </div>
                  <span className="text-[11px] text-[#A89A8C]">Pre-filled from Asset Hub & Gates</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                      GitHub Repository URL
                    </label>
                    <Input
                      value={formData.repoUrl}
                      onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                      placeholder="https://github.com/org/repo"
                      className="bg-[#14110E] border-[#382F26] text-[#FEF3C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                      Live App / Deployed URL
                    </label>
                    <Input
                      value={formData.liveAppUrl}
                      onChange={(e) => setFormData({ ...formData, liveAppUrl: e.target.value })}
                      placeholder="https://your-hackathon-demo.vercel.app"
                      className="bg-[#14110E] border-[#382F26] text-[#FEF3C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                      Demo Video Link (Loom / YouTube)
                    </label>
                    <Input
                      value={formData.demoVideoUrl}
                      onChange={(e) => setFormData({ ...formData, demoVideoUrl: e.target.value })}
                      placeholder="https://www.loom.com/share/..."
                      className="bg-[#14110E] border-[#382F26] text-[#FEF3C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                      Slide Deck / Presentation URL
                    </label>
                    <Input
                      value={formData.deckUrl}
                      onChange={(e) => setFormData({ ...formData, deckUrl: e.target.value })}
                      placeholder="https://pitch.com/... or Google Slides"
                      className="bg-[#14110E] border-[#382F26] text-[#FEF3C7]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: TECH STACK */}
              <div className="p-4 rounded-xl bg-[#1D1813] border border-[#2A231C] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                    <Code2 className="w-4 h-4" />
                    <span>Tech Stack & Frameworks</span>
                  </div>
                  <span className="text-[11px] text-[#A89A8C]">Interactive Tags</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type a technology and press Enter (e.g. Next.js, Supabase)..."
                    className="bg-[#14110E] border-[#382F26] text-[#FEF3C7]"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="bg-[#2A231C] hover:bg-[#382F26] text-[#FEF3C7]"
                  >
                    Add
                  </Button>
                </div>

                {/* ACTIVE TAGS */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[#E5A93C]/15 text-[#E5A93C] border border-[#E5A93C]/30"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tech)}
                        className="hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.techStack.length === 0 && (
                    <p className="text-xs text-[#A89A8C] italic">No technologies added yet.</p>
                  )}
                </div>

                {/* SUGGESTIONS */}
                <div className="pt-2 border-t border-[#2A231C]">
                  <p className="text-[11px] text-[#A89A8C] mb-2 font-medium">Quick Suggestions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_TECH_STACK_SUGGESTIONS.filter((s) => !formData.techStack.includes(s)).map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddTag(suggestion)}
                          className="px-2 py-0.5 text-[11px] rounded bg-[#16120E] border border-[#2A231C] text-[#A89A8C] hover:text-[#FEF3C7] hover:border-[#E5A93C]/40 transition-colors"
                        >
                          + {suggestion}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION: SQUAD ROSTER WITH GITHUB & LINKEDIN */}
              <div className="p-4 rounded-xl bg-[#1D1813] border border-[#2A231C] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Squad Roster & Social Credits</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddMember}
                    className="h-7 text-xs border-[#382F26] text-[#A89A8C] hover:text-[#FEF3C7]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Member
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.members.map((member, index) => (
                    <div
                      key={member.id}
                      className="p-3 rounded-lg bg-[#14110E] border border-[#2A231C] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={member.include}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].include = e.target.checked;
                              setFormData({ ...formData, members: updated });
                            }}
                            className="rounded border-[#382F26] bg-[#1E1914] text-[#E5A93C] focus:ring-[#E5A93C]"
                          />
                          <span className="text-xs font-bold text-[#FEF3C7]">
                            Teammate #{index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              members: prev.members.filter((m) => m.id !== member.id),
                            }));
                          }}
                          className="text-[#A89A8C] hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={member.name}
                          onChange={(e) => {
                            const updated = [...formData.members];
                            updated[index].name = e.target.value;
                            setFormData({ ...formData, members: updated });
                          }}
                          placeholder="Full Name"
                          className="bg-[#1C1712] border-[#2A231C] text-xs h-8 text-[#FEF3C7]"
                        />
                        <Input
                          value={member.duty}
                          onChange={(e) => {
                            const updated = [...formData.members];
                            updated[index].duty = e.target.value;
                            setFormData({ ...formData, members: updated });
                          }}
                          placeholder="Role (e.g. AI Engineer, UI Designer)"
                          className="bg-[#1C1712] border-[#2A231C] text-xs h-8 text-[#FEF3C7]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="relative">
                          <GithubIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#A89A8C]" />
                          <Input
                            value={member.githubUrl || ""}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].githubUrl = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            placeholder="GitHub Profile / Handle"
                            className="bg-[#1C1712] border-[#2A231C] text-xs h-8 pl-8 text-[#FEF3C7]"
                          />
                        </div>
                        <div className="relative">
                          <LinkedinIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#A89A8C]" />
                          <Input
                            value={member.linkedinUrl || ""}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].linkedinUrl = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            placeholder="LinkedIn Profile URL"
                            className="bg-[#1C1712] border-[#2A231C] text-xs h-8 pl-8 text-[#FEF3C7]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.members.length === 0 && (
                    <p className="text-xs text-[#A89A8C] italic">No members listed.</p>
                  )}
                </div>
              </div>

              {/* SECTION: CHALLENGES & ROADMAP */}
              <div className="p-4 rounded-xl bg-[#1D1813] border border-[#2A231C] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  <span>Challenges & Learnings (Optional)</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                    Challenges We Ran Into (Devpost Prompt)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    placeholder="Technical obstacles overcome during the sprint..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#14110E] border border-[#382F26] text-[#FEF3C7] focus:outline-none focus:border-[#E5A93C] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A89A8C] mb-1">
                    What We Learned & Next Steps
                  </label>
                  <textarea
                    rows={2}
                    value={formData.nextSteps}
                    onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                    placeholder="Future roadmap milestones and key learnings..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#14110E] border border-[#382F26] text-[#FEF3C7] focus:outline-none focus:border-[#E5A93C] resize-none"
                  />
                </div>
              </div>

              {/* SECTION: CUSTOM FIELDS */}
              <div className="p-4 rounded-xl bg-[#1D1813] border border-[#2A231C] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                    <Plus className="w-4 h-4" />
                    <span>Custom Specifications / Extra Links</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddCustomField}
                    className="h-7 text-xs border-[#382F26] text-[#A89A8C] hover:text-[#FEF3C7]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                  </Button>
                </div>
                {formData.customFields.map((cf, idx) => (
                  <div key={cf.id} className="flex gap-2 items-center">
                    <Input
                      value={cf.label}
                      onChange={(e) => {
                        const updated = [...formData.customFields];
                        updated[idx].label = e.target.value;
                        setFormData({ ...formData, customFields: updated });
                      }}
                      placeholder="Field Label (e.g. Contract Address)"
                      className="bg-[#14110E] border-[#2A231C] text-xs h-8 w-1/3 text-[#FEF3C7]"
                    />
                    <Input
                      value={cf.value}
                      onChange={(e) => {
                        const updated = [...formData.customFields];
                        updated[idx].value = e.target.value;
                        setFormData({ ...formData, customFields: updated });
                      }}
                      placeholder="Value or URL"
                      className="bg-[#14110E] border-[#2A231C] text-xs h-8 flex-1 text-[#FEF3C7]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(cf.id)}
                      className="text-[#A89A8C] hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.customFields.length === 0 && (
                  <p className="text-xs text-[#A89A8C] italic">No custom fields added.</p>
                )}
              </div>
            </div>
          ) : activeTab === "export" ? (
            /* TAB 2: PLATFORM EXPORT PREVIEW */
            <div className="flex flex-col h-full space-y-4 max-w-4xl mx-auto">
              {/* PLATFORM SELECTOR TABS */}
              <div className="flex items-center gap-2 p-1.5 bg-[#1A1510] border border-[#2E2822] rounded-xl overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: "devpost", label: "Devpost (.md)" },
                    { id: "devfolio", label: "Devfolio (.md)" },
                    { id: "unstop", label: "Unstop (Text)" },
                    { id: "readme", label: "GitHub README" },
                    { id: "json", label: "Metadata JSON" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePlatform(p.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                      activePlatform === p.id
                        ? "bg-[#E5A93C] text-[#14110E] shadow"
                        : "text-[#A89A8C] hover:text-[#FEF3C7] hover:bg-[#251E17]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* LIVE CODE / MARKDOWN CONTAINER */}
              <div className="flex-1 min-h-[380px] p-4 rounded-xl bg-[#0F0C0A] border border-[#2A231C] font-mono text-xs text-[#E6E1DC] overflow-y-auto whitespace-pre-wrap selection:bg-[#E5A93C]/30">
                {compiledExport.content}
              </div>

              {/* ACTION BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-[#A89A8C]">
                  Length: {compiledExport.content.length} characters •{" "}
                  {compiledExport.content.split("\n").length} lines
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleCopyText(compiledExport.content, "export-full")}
                    className="bg-[#E5A93C] hover:bg-[#F3B74A] text-[#14110E] font-bold text-xs h-9 px-4"
                  >
                    {copiedKey === "export-full" ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5 text-emerald-950" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5" /> Copy Formatted Text
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() =>
                      handleDownloadFile(
                        compiledExport.filename,
                        compiledExport.content,
                        compiledExport.mime
                      )
                    }
                    variant="outline"
                    className="border-[#382F26] text-[#FEF3C7] hover:bg-[#241E18] text-xs h-9 px-4"
                  >
                    <Download className="w-4 h-4 mr-1.5" /> Download File
                  </Button>
                </div>
              </div>
            </div>
          ) : activeTab === "quickcopy" ? (
            /* TAB 3: FIELD BY FIELD QUICK COPY DRAWER */
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-3.5 rounded-xl bg-[#1A1510] border border-[#2E2822]">
                <h3 className="text-xs font-bold text-[#E5A93C] uppercase tracking-wider mb-1">
                  1-Click Field-by-Field Copy Drawer
                </h3>
                <p className="text-xs text-[#A89A8C]">
                  Submitting via Google Forms, Typeform, or custom portal? Click any button to copy that exact item to your clipboard.
                </p>
              </div>

              <div className="space-y-2">
                {quickCopyFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1D1813] border border-[#2A231C] gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#A89A8C] uppercase tracking-wider">
                        {field.label}
                      </p>
                      <p className="text-xs text-[#FEF3C7] truncate font-mono mt-0.5">
                        {field.value}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCopyText(field.value, `field-${idx}`)}
                      className={`h-8 px-3 text-xs shrink-0 ${
                        copiedKey === `field-${idx}`
                          ? "bg-emerald-600 text-white"
                          : "bg-[#2A231C] hover:bg-[#382F26] text-[#FEF3C7]"
                      }`}
                    >
                      {copiedKey === `field-${idx}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* TAB 4: LINK SANITY AUDIT */
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#1A1510] border border-[#2E2822]">
                <div>
                  <h3 className="text-xs font-bold text-[#E5A93C] uppercase tracking-wider mb-1">
                    Pre-Flight Link Sanity Auditor
                  </h3>
                  <p className="text-xs text-[#A89A8C]">
                    Prevents zero-point penalties caused by private GitHub repos, expired Loom links, or restricted Google Drive decks.
                  </p>
                </div>
                <Button
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="bg-[#E5A93C] hover:bg-[#F3B74A] text-[#14110E] font-bold text-xs h-9 px-4 shrink-0"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Auditing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Run Audit
                    </>
                  )}
                </Button>
              </div>

              {auditResults.length > 0 ? (
                <div className="space-y-2.5">
                  {auditResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                        result.status === "valid"
                          ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-200"
                          : result.status === "warning"
                          ? "bg-amber-950/20 border-amber-900/40 text-amber-200"
                          : "bg-red-950/20 border-red-900/40 text-red-200"
                      }`}
                    >
                      {result.status === "valid" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40">
                            {result.type}
                          </span>
                          <span className="text-xs truncate font-mono text-[#FEF3C7]">
                            {result.url}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-[#E6E1DC]">{result.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#A89A8C] border border-dashed border-[#2A231C] rounded-xl">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Click "Run Audit" to verify your deliverable URLs before submission.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM GLOBAL ACTION BAR */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#2A231C] bg-[#14100C]">
          <div className="text-xs text-[#A89A8C] hidden sm:block">
            {formData.title ? `Project: "${formData.title}"` : "Draft Project"}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#382F26] text-[#A89A8C] hover:text-[#FEF3C7] text-xs h-9 px-4"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setActiveTab("export");
                handleCopyText(compiledExport.content, "bottom-copy");
              }}
              className="bg-[#E5A93C] hover:bg-[#F3B74A] text-[#14110E] font-bold text-xs h-9 px-4 flex-1 sm:flex-initial"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Final Submission
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
