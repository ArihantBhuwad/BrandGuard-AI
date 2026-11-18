
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  BookOpen,
  ScanLine,
  ClipboardCheck,
  ChartLine,
  Users,
  Settings,
  Search,
  Bell,
  UserRound,
  Menu,
  X,
  FileText,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Sparkles,
  Check,
  XCircle,
  Info,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";

import "./App.css";
import brandBackground from "./assets/brandguard-background.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const AUTH_TOKEN_KEY = "brandguard_access_token";

type AuthUser = { id: number; name: string; email: string; is_active: boolean; created_at: string };
type AuthResponse = { access_token: string; token_type: string; user: AuthUser };

type Page =
  | "Overview"
  | "Brand Guidelines"
  | "Content Auditor"
  | "Review & Approval"
  | "Reports & Insights"
  | "Team & Access"
  | "Settings";

type Guideline = {
  id: number;
  title: string;
  category: string;
  description: string;
  status: string;
};

type ApiGuideline = {
  id: number;
  user_id: number;
  title: string;
  category: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

type Review = {
  id: number;
  title: string;
  content: string;
  issue: string;
  status: "Pending" | "Approved" | "Rejected";
};

type AuditIssue = {
  id: string;
  guideline: string;
  evidence: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  explanation: string;
  suggestion: string;
  original?: string;
  replacement?: string;
};

type AuditReport = {
  content: string;
  correctedContent: string;
  score: number;
  issues: AuditIssue[];
  checkedGuidelines: string[];
  auditedAt: string;
};

type ApiAudit = {
  id: number;
  user_id: number;
  content: string;
  correctedContent: string;
  score: number;
  issues: AuditIssue[];
  checkedGuidelines: string[];
  auditedAt: string;
  created_at: string;
};

type ApiReview = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  issue: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
};

const navigation: {
  name: Page;
  icon: typeof LayoutDashboard;
}[] = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Brand Guidelines", icon: BookOpen },
    { name: "Content Auditor", icon: ScanLine },
    { name: "Review & Approval", icon: ClipboardCheck },
    { name: "Reports & Insights", icon: ChartLine },
    { name: "Team & Access", icon: Users },
    { name: "Settings", icon: Settings },
  ];

const initialReviews: Review[] = [
  {
    id: 1,
    title: "Spring campaign copy",
    content:
      "Our organization is excited to launch this amazing new campaign. Customize your experience today!",
    issue:
      "American English spelling detected. Use organisation and customise.",
    status: "Pending",
  },
  {
    id: 2,
    title: "Product announcement",
    content:
      "We are pleased to announce the launch of our latest product.",
    issue: "Awaiting final brand approval.",
    status: "Pending",
  },
  {
    id: 3,
    title: "Website landing page",
    content:
      "Discover a simpler way to manage your brand identity.",
    issue: "No major issues detected.",
    status: "Approved",
  },
];

function App() {
  const [activePage, setActivePage] = useState<Page>("Overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [registerName, setRegisterName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [clockNow, setClockNow] = useState(() => new Date());

  useEffect(() => {
    const clock = window.setInterval(() => setClockNow(new Date()), 60_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        if (active) setAuthLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Session expired");
        const user: AuthUser = await response.json();
        if (!active) return;
        setUserName(user.name);
        setUserEmail(user.email);
        setIsAuthenticated(true);
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      } finally {
        if (active) setAuthLoading(false);
      }
    }
    void restoreSession();
    return () => { active = false; };
  }, []);

  const greeting = (() => {
    // Use the computer's local time so the greeting follows the user's timezone.
    const hour = clockNow.getHours();
    if (hour >= 5 && hour < 12) return "Good morning.";
    if (hour >= 12 && hour < 17) return "Good afternoon.";
    return "Good evening.";
  })();

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter your email address and password.");
      return;
    }
    setAuthSubmitting(true);
    setLoginError("");
    setAuthNotice("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Sign in failed. Check your email and password.");
      const auth = data as AuthResponse;
      window.localStorage.setItem(AUTH_TOKEN_KEY, auth.access_token);
      setUserName(auth.user.name);
      setUserEmail(auth.user.email);
      setLoginPassword("");
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to connect to BrandGuard AI. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registerName.trim()) {
      setLoginError("Please enter your full name.");
      return;
    }
    if (loginPassword.length < 8) {
      setLoginError("Please choose a password with at least 8 characters.");
      return;
    }
    if (loginPassword !== confirmPassword) {
      setLoginError("Your passwords do not match. Please try again.");
      return;
    }
    setAuthSubmitting(true);
    setLoginError("");
    setAuthNotice("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: registerName.trim(), email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Account creation failed. Please try again.");
      const auth = data as AuthResponse;
      window.localStorage.setItem(AUTH_TOKEN_KEY, auth.access_token);
      setUserName(auth.user.name);
      setUserEmail(auth.user.email);
      setLoginPassword("");
      setConfirmPassword("");
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to connect to BrandGuard AI. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginEmail.trim()) {
      setLoginError("Enter your email address to continue.");
      return;
    }
    setLoginError("");
    setAuthNotice("Password reset is not connected yet. The backend currently supports registration, sign-in and account verification; email reset will be added next.");
  }

  function handleLogout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsAuthenticated(false);
    setLoginPassword("");
    setConfirmPassword("");
    setAuthMode("signin");
    setLoginError("");
    setAuthNotice("");
    setActivePage("Overview");
  }

  function changeAuthMode(mode: "signin" | "signup" | "forgot") {
    setAuthMode(mode);
    setLoginError("");
    setAuthNotice("");
    setShowPassword(false);
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [guidelinesLoading, setGuidelinesLoading] = useState(false);
  const [guidelineSaving, setGuidelineSaving] = useState(false);

  const [reviews, setReviews] =
    useState<Review[]>(initialReviews);

  const [content, setContent] = useState("");
  const [auditResult, setAuditResult] = useState<AuditReport | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditReport[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Content");
  const [newDescription, setNewDescription] = useState("");

  const [workspaceName, setWorkspaceName] =
    useState("Brand workspace");

  const [userName, setUserName] = useState("Arihant");
  const [savedMessage, setSavedMessage] = useState("");

  const pendingCount = reviews.filter(
    (review) => review.status === "Pending"
  ).length;

  const averageScore = auditHistory.length
    ? Math.round(
      auditHistory.reduce((total, report) => total + report.score, 0) /
      auditHistory.length
    )
    : 0;

  const filteredGuidelines = useMemo(() => {
    return guidelines.filter((item) =>
      `${item.title} ${item.category} ${item.description}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [guidelines, searchTerm]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((item) =>
      `${item.title} ${item.content} ${item.issue}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [reviews, searchTerm]);

  function navigateTo(page: Page) {
    setActivePage(page);
    setMobileMenuOpen(false);
    setSearchTerm("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setGuidelines([]);
      setAuditHistory([]);
      setReviews([]);
      return;
    }

    let active = true;
    async function loadGuidelines() {
      setGuidelinesLoading(true);
      setSavedMessage("");
      try {
        const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const response = await fetch(`${API_BASE_URL}/guidelines/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to load brand guidelines.");
        if (!active) return;
        setGuidelines((data as ApiGuideline[]).map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          description: item.description,
          status: item.is_active ? "Active" : "Inactive",
        })));
      } catch (error) {
        if (active) setSavedMessage(error instanceof Error ? error.message : "Unable to load brand guidelines.");
      } finally {
        if (active) setGuidelinesLoading(false);
      }
    }
    void loadGuidelines();
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    async function loadAuditHistory() {
      try {
        const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const response = await fetch(`${API_BASE_URL}/audits/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to load audit history.");
        if (!active) return;
        const reports = (data as ApiAudit[]).map((item) => ({
          content: item.content,
          correctedContent: item.correctedContent,
          score: item.score,
          issues: item.issues,
          checkedGuidelines: item.checkedGuidelines,
          auditedAt: item.auditedAt,
        }));
        setAuditHistory(reports);
      } catch (error) {
        if (active) setSavedMessage(error instanceof Error ? error.message : "Unable to load audit history.");
      }
    }

    void loadAuditHistory();
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    async function loadReviews() {
      try {
        const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const response = await fetch(`${API_BASE_URL}/reviews/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to load reviews.");
        if (active) setReviews((data as ApiReview[]).map((item) => ({
          id: item.id, title: item.title, content: item.content,
          issue: item.issue, status: item.status,
        })));
      } catch (error) {
        if (active) setSavedMessage(error instanceof Error ? error.message : "Unable to load reviews.");
      }
    }
    void loadReviews();
    return () => { active = false; };
  }, [isAuthenticated]);

  async function addGuideline() {
    if (!newTitle.trim() || !newDescription.trim()) {
      setSavedMessage("Please complete the guideline details.");
      return;
    }
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setSavedMessage("Your session has expired. Please sign in again.");
      return;
    }
    setGuidelineSaving(true);
    setSavedMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/guidelines/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          description: newDescription.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to save guideline.");
      const item = data as ApiGuideline;
      setGuidelines((previous) => [...previous, {
        id: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        status: item.is_active ? "Active" : "Inactive",
      }]);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("Content");
      setSavedMessage("Guideline saved to your BrandGuard workspace.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Unable to save guideline.");
    } finally {
      setGuidelineSaving(false);
    }
  }

  async function editGuideline(item: Guideline) {
    const title = window.prompt("Guideline title:", item.title);
    if (title === null) return;
    const description = window.prompt("Guideline description:", item.description);
    if (description === null) return;
    if (!title.trim() || !description.trim()) {
      setSavedMessage("Title and description cannot be empty.");
      return;
    }
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setSavedMessage("Your session has expired. Please sign in again.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/guidelines/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to update guideline.");
      setGuidelines((previous) => previous.map((guideline) => guideline.id === item.id
        ? { ...guideline, title: data.title, category: data.category, description: data.description, status: data.is_active ? "Active" : "Inactive" }
        : guideline));
      setSavedMessage("Guideline updated successfully.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Unable to update guideline.");
    }
  }

  async function deleteGuideline(id: number) {
    const confirmed = window.confirm("Are you sure you want to delete this guideline?");
    if (!confirmed) return;
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setSavedMessage("Your session has expired. Please sign in again.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/guidelines/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Unable to delete guideline.");
      }
      setGuidelines((previous) => previous.filter((item) => item.id !== id));
      setSavedMessage("Guideline deleted from your workspace.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Unable to delete guideline.");
    }
  }

  async function updateReview(
    id: number,
    status: "Approved" | "Rejected"
  ) {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setSavedMessage("Your session has expired. Please sign in again.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to save review decision.");
      setReviews((previous) => previous.map((review) =>
        review.id === id ? { ...review, status: data.status } : review
      ));
      setSavedMessage(`Review ${status.toLowerCase()} successfully.`);
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Unable to save review decision.");
    }
  }

  async function runAudit() {
    if (!content.trim()) {
      setAuditResult(null);
      setSavedMessage("Please enter some content to audit.");
      return;
    }

    const activeGuidelines = guidelines.filter(
      (guideline) => guideline.status === "Active"
    );
    const issues: AuditIssue[] = [];
    let correctedContent = content;

    const addIssue = (
      guideline: Guideline,
      evidence: string,
      severity: AuditIssue["severity"],
      explanation: string,
      suggestion: string,
      original?: string,
      replacement?: string
    ) => {
      const duplicate = issues.some(
        (issue) =>
          issue.guideline === guideline.title &&
          issue.evidence.toLowerCase() === evidence.toLowerCase() &&
          issue.explanation === explanation
      );
      if (duplicate) return;

      issues.push({
        id: `${guideline.id}-${issues.length}`,
        guideline: guideline.title,
        evidence,
        severity,
        explanation,
        suggestion,
        original,
        replacement,
      });
    };

    // British English checks are only run when an active language guideline exists.
    const britishGuideline = activeGuidelines.find((guideline) =>
      /british|english|spelling|language/i.test(
        `${guideline.title} ${guideline.category} ${guideline.description}`
      )
    );

    if (britishGuideline) {
      const spellingRules = [
        ["organizations", "organisations"],
        ["organization", "organisation"],
        ["customizing", "customising"],
        ["customized", "customised"],
        ["customize", "customise"],
        ["analyzing", "analysing"],
        ["analyzed", "analysed"],
        ["analyze", "analyse"],
        ["colors", "colours"],
        ["color", "colour"],
        ["centers", "centres"],
        ["center", "centre"],
        ["favorites", "favourites"],
        ["favorite", "favourite"],
        ["behavior", "behaviour"],
        ["license", "licence"],
        ["catalog", "catalogue"],
      ];

      spellingRules.forEach(([american, british]) => {
        const expression = new RegExp(`\\b${american}\\b`, "gi");
        const matches = [...content.matchAll(expression)];
        if (matches.length === 0) return;

        const evidence = [...new Set(matches.map((match) => match[0]))].join(", ");
        addIssue(
          britishGuideline,
          evidence,
          "Medium",
          `The submitted content uses American English spelling. This guideline requires British English spelling.`,
          `Replace “${american}” with “${british}”.`,
          american,
          british
        );

        correctedContent = correctedContent.replace(expression, (match) => {
          if (match === match.toUpperCase()) return british.toUpperCase();
          if (match[0] === match[0].toUpperCase()) {
            return british.charAt(0).toUpperCase() + british.slice(1);
          }
          return british;
        });
      });
    }

    // Plain-language checks are tied to an active writing/content guideline.
    const writingGuideline = activeGuidelines.find((guideline) =>
      /writing|content|style|readability/i.test(
        `${guideline.title} ${guideline.category}`
      )
    );

    if (writingGuideline) {
      const jargonTerms = [
        "synergy",
        "paradigm",
        "leverage",
        "disruptive",
        "best-in-class",
      ];

      jargonTerms.forEach((term) => {
        const expression = new RegExp(
          term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi"
        );
        const matches = [...content.matchAll(expression)];
        if (matches.length === 0) return;

        addIssue(
          writingGuideline,
          [...new Set(matches.map((match) => match[0]))].join(", "),
          "Low",
          `The term “${term}” may be unnecessary jargon. The writing guideline asks for clear, concise and readable language.`,
          "Consider replacing it with a simpler, more direct expression."
        );
      });

      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 60) {
        addIssue(
          writingGuideline,
          `${wordCount} words in the submitted text`,
          "Low",
          "The content is relatively long. The writing guideline encourages concise communication.",
          "Consider shortening long sentences and removing repeated ideas."
        );
      }

      // Respect explicitly quoted terms that a guideline says to avoid.
      const quotedAvoidPattern = /(?:avoid|do not use|don't use|never use|prohibited)\s+[“"]([^”"]+)[”"]/gi;
      for (const match of writingGuideline.description.matchAll(quotedAvoidPattern)) {
        const forbiddenTerm = match[1].trim();
        if (!forbiddenTerm) continue;
        const occurrence = content.match(new RegExp(
          forbiddenTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        ));
        if (occurrence) {
          addIssue(
            writingGuideline,
            occurrence[0],
            "High",
            `This term is explicitly marked for avoidance in the “${writingGuideline.title}” guideline.`,
            "Remove the term or replace it with approved brand language."
          );
        }
      }
    }

    // Flag absolute marketing claims where a brand voice guideline is active.
    const voiceGuideline = activeGuidelines.find((guideline) =>
      /voice|tone|communication|marketing/i.test(
        `${guideline.title} ${guideline.category}`
      )
    );

    if (voiceGuideline) {
      const absoluteClaims = [
        "guaranteed results",
        "100% guaranteed",
        "the best in the world",
        "number one in the world",
      ];

      absoluteClaims.forEach((phrase) => {
        const expression = new RegExp(
          phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi"
        );
        const matches = [...content.matchAll(expression)];
        if (matches.length === 0) return;

        addIssue(
          voiceGuideline,
          [...new Set(matches.map((match) => match[0]))].join(", "),
          "High",
          "This absolute promotional claim may conflict with a professional, trustworthy brand voice and should be substantiated.",
          "Replace it with a specific, verifiable statement."
        );
      });
    }

    const checkedGuidelines = [...new Map(
      [britishGuideline, writingGuideline, voiceGuideline]
        .filter((guideline): guideline is Guideline => Boolean(guideline))
        .map((guideline) => [guideline.id, guideline])
    ).values()].map((guideline) => guideline.title);

    const severityPenalty: Record<AuditIssue["severity"], number> = {
      Critical: 20,
      High: 12,
      Medium: 6,
      Low: 2,
    };
    const score = checkedGuidelines.length
      ? Math.max(
        0,
        100 - issues.reduce((total, issue) => total + severityPenalty[issue.severity], 0)
      )
      : 0;

    const report: AuditReport = {
      content,
      correctedContent,
      score,
      issues,
      checkedGuidelines,
      auditedAt: new Date().toLocaleString("en-GB"),
    };

    setAuditResult(report);
    setAuditHistory((previous) => [report, ...previous].slice(0, 50));
    setSavedMessage("Audit complete. Saving report to your workspace…");

    try {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch(`${API_BASE_URL}/audits/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: report.content,
          corrected_content: report.correctedContent,
          score: report.score,
          issues: report.issues,
          checked_guidelines: report.checkedGuidelines,
          audited_at: report.auditedAt,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Audit completed, but the report could not be saved.");
      setSavedMessage("Audit completed and saved to your workspace.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Audit completed, but saving failed.");
    }
  }

  async function submitForApproval() {
    if (!auditResult) return;
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setSavedMessage("Your session has expired. Please sign in again.");
      return;
    }
    const issueSummary = auditResult.issues.length
      ? `${auditResult.issues.length} issue(s) identified`
      : "No issues detected by the available checks";
    const payload = {
      title: `Content audit — ${new Date().toLocaleDateString("en-GB")}`,
      content: auditResult.content,
      issue: `${auditResult.score}% compliance. ${issueSummary}. Submitted for human approval.`,
    };
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to submit content for approval.");
      const newReview: Review = {
        id: data.id, title: data.title, content: data.content,
        issue: data.issue, status: data.status,
      };
      setReviews((previous) => [newReview, ...previous]);
      setSavedMessage("Content submitted and saved for human approval.");
      navigateTo("Review & Approval");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Unable to submit content for approval.");
    }
  }


  function saveSettings() {
    setSavedMessage("Workspace settings saved successfully.");
  }

  function renderOverview() {
    const stats = [
      {
        title: "Average compliance",
        value: auditHistory.length ? `${averageScore}%` : "—",
        note: auditHistory.length ? "Based on completed audits" : "No audits completed",
        icon: ShieldCheck,
      },
      {
        title: "Content audited",
        value: String(auditHistory.length),
        note: "Completed in this session",
        icon: FileText,
      },
      {
        title: "Pending reviews",
        value: String(pendingCount).padStart(2, "0"),
        note: "Awaiting approval",
        icon: Clock3,
      },
      {
        title: "Active guidelines",
        value: String(guidelines.length).padStart(2, "0"),
        note: "Workspace rules",
        icon: BookOpen,
      },
    ];

    return (
      <>
        <div className="welcome-row">
          <div className="page-heading">
            <p className="eyebrow">WORKSPACE OVERVIEW</p>
            <h1>{greeting}</h1>
            <p className="page-description">
              Here's what's happening across your brand workspace.
            </p>
          </div>

          <button
            className="button button-primary"
            onClick={() => navigateTo("Content Auditor")}
          >
            <ScanLine size={16} />
            Start an audit
          </button>
        </div>

        <div className="stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div className="panel stat-card" key={stat.title}>
                <div className="stat-top">
                  <span>{stat.title}</span>
                  <div className="stat-icon">
                    <Icon size={19} />
                  </div>
                </div>

                <strong className="stat-value">{stat.value}</strong>
                <span className="stat-note">{stat.note}</span>
              </div>
            );
          })}
        </div>

        <div className="overview-grid">
          <section className="panel health-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">BRAND HEALTH</p>
                <h2>Compliance snapshot</h2>
              </div>

              <ShieldCheck color="#315c45" size={22} />
            </div>

            <div className="health-content">
              <div
                className="score-ring"
                style={{
                  background: `conic-gradient(#4f8061 0deg ${averageScore * 3.6}deg, #e3eadf ${averageScore * 3.6}deg 360deg)`,
                }}
              >
                <div>
                  <strong>{auditHistory.length ? `${averageScore}%` : "—"}</strong>
                  <span>Average score</span>
                </div>
              </div>

              <p className="muted">
                {auditHistory.length
                  ? `Calculated from ${auditHistory.length} completed audit(s) in this session.`
                  : "Run your first content audit to establish your workspace compliance score."}
              </p>
            </div>

            <div className="health-bars">
              {(["Critical", "High", "Medium", "Low"] as const).map((severity) => {
                const count = auditHistory.reduce(
                  (total, report) => total + report.issues.filter((issue) => issue.severity === severity).length,
                  0
                );
                const totalIssues = auditHistory.reduce((total, report) => total + report.issues.length, 0);
                const percentage = totalIssues ? Math.round((count / totalIssues) * 100) : 0;
                return (
                  <div key={severity}>
                    <div className="compliance-row">
                      <span>{severity} findings</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="progress-track">
                      <div style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="text-button"
              onClick={() => navigateTo("Reports & Insights")}
            >
              View detailed reports <ArrowUpRight size={15} />
            </button>
          </section>

          <section className="panel attention-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">NEEDS ATTENTION</p>
                <h2>Pending actions</h2>
              </div>

              <span className="count-badge">{pendingCount}</span>
            </div>

            {reviews
              .filter((review) => review.status === "Pending")
              .map((review) => (
                <div className="attention-item" key={review.id}>
                  <div className="attention-icon warning-icon">
                    <AlertTriangle size={18} />
                  </div>

                  <div>
                    <strong>{review.title}</strong>
                    <p>{review.issue}</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => navigateTo("Review & Approval")}
                  >
                    Review
                  </button>
                </div>
              ))}

            {pendingCount === 0 && (
              <div className="empty-state">
                <CheckCircle2 size={30} />
                <h3>All caught up</h3>
                <p>There are no pending reviews.</p>
              </div>
            )}

            <button
              className="text-button"
              onClick={() => navigateTo("Review & Approval")}
            >
              View all reviews <ArrowUpRight size={15} />
            </button>
          </section>
        </div>

        <section className="panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">WORKSPACE ACTIVITY</p>
              <h2>Recent activity</h2>
            </div>
          </div>

          <div className="activity-table">
            {[
              {
                title: "Website landing page",
                detail: "Content audit completed",
                status: "Passed",
                icon: CheckCircle2,
              },
              {
                title: "Spring campaign copy",
                detail: "Brand guidelines flagged",
                status: "Review",
                icon: AlertTriangle,
              },
              {
                title: "Product announcement",
                detail: "Submitted for approval",
                status: "Pending",
                icon: FileText,
              },
              {
                title: "Tone of voice guideline",
                detail: "Guideline updated",
                status: "Updated",
                icon: BookOpen,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div className="activity-item" key={item.title}>
                  <div className="activity-icon">
                    <Icon size={18} />
                  </div>

                  <div className="activity-copy">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>

                  <div className="activity-meta">
                    <span
                      className={`activity-status ${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                    <time>Recent</time>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="quick-action">
          <div>
            <p className="eyebrow">YOUR BRAND, PROTECTED</p>
            <h2>Ready to check your next piece of content?</h2>
            <p>
              Run a brand compliance audit and identify areas
              that need improvement.
            </p>
          </div>

          <button
            className="button button-light"
            onClick={() => navigateTo("Content Auditor")}
          >
            <ScanLine size={16} />
            Audit content
          </button>
        </section>
      </>
    );
  }

  function renderGuidelines() {
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">BRAND KNOWLEDGE HUB</p>
          <h1>Brand Guidelines</h1>
          <p className="page-description">
            Manage the rules that define your brand identity.
          </p>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search guidelines..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <span className="soft-tag">
            {guidelines.length} active guidelines
          </span>
        </div>

        <section className="panel add-rule-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPAND YOUR BRAND KNOWLEDGE</p>
              <h2>Add a guideline</h2>
            </div>
            <Plus color="#315c45" />
          </div>

          <input
            className="form-input"
            placeholder="Guideline title"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />

          <select
            className="form-input"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          >
            <option>Content</option>
            <option>Communication</option>
            <option>Language</option>
            <option>Design</option>
            <option>Marketing</option>
          </select>

          <textarea
            className="form-input form-textarea"
            placeholder="Describe the guideline and its requirements..."
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
          />

          <button className="button button-primary" onClick={addGuideline} disabled={guidelineSaving}>
            <Plus size={16} />
            {guidelineSaving ? "Saving..." : "Add guideline"}
          </button>

          {savedMessage && (
            <p className="muted">{savedMessage}</p>
          )}
        </section>

        <div className="guideline-list">
          {guidelinesLoading && <div className="panel empty-state">Loading your saved guidelines...</div>}
          {!guidelinesLoading && filteredGuidelines.map((item) => (
            <article className="panel guideline-card" key={item.id}>
              <div className="guideline-icon">
                <BookOpen size={20} />
              </div>

              <div className="guideline-copy">
                <div className="guideline-title">
                  <h3>{item.title}</h3>
                  <span className="soft-tag">{item.status}</span>
                </div>

                <span className="category-label">{item.category}</span>
                <p>{item.description}</p>
              </div>

              <div className="guideline-actions">
                <button
                  className="icon-button"
                  title="Edit guideline"
                  aria-label={`Edit ${item.title}`}
                  onClick={() => editGuideline(item)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  title="Delete guideline"
                  aria-label={`Delete ${item.title}`}
                  onClick={() => deleteGuideline(item.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}

          {!guidelinesLoading && filteredGuidelines.length === 0 && (
            <div className="panel empty-state">
              <Search size={28} />
              <h3>{searchTerm ? "No guidelines found" : "No saved guidelines yet"}</h3>
              <p>{searchTerm ? "Try another search term." : "Add your first brand rule above. It will be saved securely to your workspace."}</p>
            </div>
          )}
        </div>
      </>
    );
  }

  function renderAuditor() {
    const report = auditResult;
    const activeGuidelines = guidelines.filter(
      (guideline) => guideline.status === "Active"
    );

    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">CONTENT GOVERNANCE</p>
          <h1>Content Auditor</h1>
          <p className="page-description">
            Check submitted content against your active brand guidelines and review evidence-backed findings.
          </p>
        </div>

        <div className="auditor-layout">
          <section className="panel editor-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">CONTENT INPUT</p>
                <h2>Submit your content</h2>
              </div>
              <FileText size={21} color="#315c45" />
            </div>

            <textarea
              className="content-input"
              placeholder="Paste your website copy, marketing content, social media post or other brand material here..."
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setAuditResult(null);
                setSavedMessage("");
              }}
            />

            <div className="editor-footer">
              <span className="muted">
                {content.length} characters · {content.trim() ? content.trim().split(/\s+/).length : 0} words
              </span>
              <button
                className="button button-primary"
                onClick={runAudit}
                disabled={!content.trim()}
              >
                <Sparkles size={16} />
                Analyse content
              </button>
            </div>

            <div className="helper-note">
              <Info size={17} />
              <span>
                Local checks currently cover British English spelling, selected writing-style rules and selected promotional claims. Visual identity and deeper semantic checks require the backend AI and asset-analysis services.
              </span>
            </div>

            <div className="correction-box active-guidelines-box">
              <p className="eyebrow">ACTIVE WORKSPACE GUIDELINES</p>
              {activeGuidelines.length === 0 ? (
                <p>No active guidelines. Activate or add guidelines before auditing.</p>
              ) : (
                <ul className="audit-guideline-list">
                  {activeGuidelines.map((guideline) => (
                    <li key={guideline.id}>
                      <CheckCircle2 size={15} />
                      <span>{guideline.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {savedMessage && <p className="audit-feedback" role="status">{savedMessage}</p>}
          </section>

          <section className="panel results-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AUDIT RESULTS</p>
                <h2>Compliance report</h2>
              </div>
              <ShieldCheck size={21} color="#315c45" />
            </div>

            {!report ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <ScanLine size={25} />
                </div>
                <h3>Ready to analyse</h3>
                <p>
                  Enter your content and run an audit. Your score, evidence and recommendations will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="audit-score-panel">
                  <div
                    className="score-ring audit-score-ring"
                    style={{
                      background: `conic-gradient(#4f8061 0deg ${report.score * 3.6}deg, #e3eadf ${report.score * 3.6}deg 360deg)`,
                    }}
                  >
                    <div>
                      <strong>{report.score}%</strong>
                      <span>Compliance</span>
                    </div>
                  </div>
                  <div className="audit-score-copy">
                    <h3>{report.checkedGuidelines.length === 0 ? "No supported rules active" : report.score >= 90 ? "Strong brand alignment" : report.score >= 70 ? "Some improvements needed" : "Review recommended"}</h3>
                    <p>
                      {report.issues.length} finding(s) from {report.checkedGuidelines.length} guideline(s) with supported checks.
                    </p>
                    <span className="audit-timestamp">Audited {report.auditedAt}</span>
                  </div>
                </div>

                <div className="audit-stat-row">
                  <div>
                    <span>Findings</span>
                    <strong>{report.issues.length}</strong>
                  </div>
                  <div>
                    <span>Guidelines checked</span>
                    <strong>{report.checkedGuidelines.length}</strong>
                  </div>
                  <div>
                    <span>Score deduction</span>
                    <strong>{100 - report.score}</strong>
                  </div>
                </div>

                <div className="audit-findings-heading">
                  <div>
                    <p className="eyebrow">EVIDENCE & RECOMMENDATIONS</p>
                    <h3>Detailed findings</h3>
                  </div>
                </div>

                {report.issues.length === 0 ? (
                  <div className="audit-pass-state">
                    <CheckCircle2 size={27} />
                    <div>
                      <strong>No issues detected</strong>
                      <p>The content passed all checks currently implemented for your active guidelines.</p>
                    </div>
                  </div>
                ) : (
                  <div className="audit-issue-list">
                    {report.issues.map((issue) => (
                      <article className="issue-card" key={issue.id}>
                        <div className="issue-top">
                          <strong>{issue.guideline}</strong>
                          <span className={`severity ${issue.severity.toLowerCase()}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <div className="evidence-line">
                          <span>Evidence</span>
                          <strong>“{issue.evidence}”</strong>
                        </div>
                        <p>{issue.explanation}</p>
                        <div className="suggestion">
                          <Sparkles size={15} />
                          <span><strong>Recommendation:</strong> {issue.suggestion}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {report.correctedContent !== report.content && (
                  <div className="correction-box">
                    <p className="eyebrow">SMART CORRECTION</p>
                    <p>British English spelling corrections are available for this submission.</p>
                    <button
                      className="button button-secondary correction-action"
                      onClick={() => {
                        setContent(report.correctedContent);
                        setAuditResult(null);
                        setSavedMessage("Spelling corrections applied. Run the audit again to verify the updated content.");
                      }}
                    >
                      <Check size={16} />
                      Apply spelling corrections
                    </button>
                  </div>
                )}

                <div className="review-actions audit-submit-actions">
                  <button className="button button-primary" onClick={submitForApproval}>
                    <ClipboardCheck size={16} />
                    Submit for approval
                  </button>
                  <button
                    className="button button-quiet"
                    onClick={() => {
                      setAuditResult(null);
                      setSavedMessage("Audit results cleared. Your content is unchanged.");
                    }}
                  >
                    Clear results
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </>
    );
  }

  function renderReviews() {
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">HUMAN APPROVAL WORKFLOW</p>
          <h1>Review & Approval</h1>
          <p className="page-description">
            Review submitted content and manage approval decisions.
          </p>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search submitted content..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <span className="soft-tag">
            {pendingCount} pending reviews
          </span>
        </div>

        <div className="guideline-list">
          {filteredReviews.map((review) => (
            <article className="panel review-card" key={review.id}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">CONTENT SUBMISSION</p>
                  <h2>{review.title}</h2>
                </div>

                <span
                  className={`status-tag ${review.status === "Approved"
                    ? "status-approved"
                    : review.status === "Rejected"
                      ? "status-rejected"
                      : "status-pending"
                    }`}
                >
                  {review.status}
                </span>
              </div>

              <p className="muted">{review.content}</p>

              <div className="review-findings">
                <AlertTriangle size={17} />
                <span>{review.issue}</span>
              </div>

              {review.status === "Pending" && (
                <div className="review-actions">
                  <button
                    className="button button-secondary"
                    onClick={() => updateReview(review.id, "Approved")}
                  >
                    <Check size={16} />
                    Approve
                  </button>

                  <button
                    className="button button-quiet"
                    onClick={() => updateReview(review.id, "Rejected")}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}

          {filteredReviews.length === 0 && (
            <div className="panel empty-state">
              <ClipboardCheck size={30} />
              <h3>No matching submissions</h3>
              <p>Try changing your search.</p>
            </div>
          )}
        </div>
      </>
    );
  }

  function renderReports() {
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">WORKSPACE PERFORMANCE</p>
          <h1>Reports & Insights</h1>
          <p className="page-description">
            Monitor brand compliance and identify improvement areas.
          </p>
        </div>

        <div className="stats-grid">
          <div className="panel stat-card">
            <div className="stat-top">Overall compliance</div>
            <strong className="stat-value">{auditHistory.length ? `${averageScore}%` : "—"}</strong>
            <span className="stat-note">Average completed audit score</span>
          </div>

          <div className="panel stat-card">
            <div className="stat-top">Total audits</div>
            <strong className="stat-value">{auditHistory.length}</strong>
            <span className="stat-note">Saved workspace audits</span>
          </div>

          <div className="panel stat-card">
            <div className="stat-top">Approved reviews</div>
            <strong className="stat-value">
              {reviews.filter((r) => r.status === "Approved").length}
            </strong>
            <span className="stat-note">Review decisions</span>
          </div>

          <div className="panel stat-card">
            <div className="stat-top">Active guidelines</div>
            <strong className="stat-value">{guidelines.length}</strong>
            <span className="stat-note">Workspace rules</span>
          </div>
        </div>

        <section className="panel report-panel">
          <p className="eyebrow">AUDIT HISTORY</p>
          <h2>Recent content audits</h2>

          {auditHistory.length === 0 ? (
            <div className="empty-state report-empty-state">
              <ChartLine size={28} />
              <h3>No audit data yet</h3>
              <p>Complete an audit to start building your compliance report.</p>
              <button className="button button-secondary" onClick={() => navigateTo("Content Auditor")}>
                <ScanLine size={15} /> Start an audit
              </button>
            </div>
          ) : (
            <div className="audit-history-list">
              {auditHistory.map((report, index) => (
                <div className="audit-history-item" key={`${report.auditedAt}-${index}`}>
                  <div>
                    <strong>{report.content.trim().slice(0, 72)}{report.content.trim().length > 72 ? "…" : ""}</strong>
                    <span>{report.auditedAt} · {report.issues.length} finding(s)</span>
                  </div>
                  <span className="audit-history-score">{report.score}%</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderTeam() {
    const members = [
      { name: "Arihant Bhuwad", role: "Team Lead", initials: "AB" },
      { name: "Piyush Mandhare", role: "Research & Analysis", initials: "PM" },
      { name: "Chetan Rokade", role: "Product & Requirements", initials: "CR" },
      { name: "Niharika Pawar", role: "UI/UX Design", initials: "NP" },
      { name: "Samrudhi Varma", role: "AI & Responsible AI", initials: "SV" },
      { name: "Arpita Bhongade", role: "Documentation", initials: "AB" },
    ];

    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">WORKSPACE MANAGEMENT</p>
          <h1>Team & Access</h1>
          <p className="page-description">
            View your team members and their responsibilities.
          </p>
        </div>

        <section className="panel team-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR TEAM</p>
              <h2>Workspace members</h2>
            </div>

            <span className="soft-tag">{members.length} members</span>
          </div>

          <div className="team-grid">
            {members.map((member) => (
              <div className="team-member" key={member.name}>
                <div className="avatar">{member.initials}</div>

                <div>
                  <strong>{member.name}</strong>
                  <p>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  function renderSettings() {
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">PERSONALISE YOUR WORKSPACE</p>
          <h1>Settings</h1>
          <p className="page-description">
            Manage your workspace preferences and account details.
          </p>
        </div>

        <section className="panel settings-panel">
          <p className="eyebrow">GENERAL PREFERENCES</p>
          <h2>Workspace settings</h2>

          <label htmlFor="workspace-name">Workspace name</label>
          <input
            id="workspace-name"
            className="form-input"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
          />

          <label htmlFor="workspace-language">Language</label>
          <input
            id="workspace-language"
            className="form-input"
            value="English (United Kingdom)"
            readOnly
          />

          <label htmlFor="workspace-theme">Interface theme</label>
          <input
            id="workspace-theme"
            className="form-input"
            value="Editorial & Refined"
            readOnly
          />

          <div className="divider" />

          <p className="eyebrow">ACCOUNT DETAILS</p>

          <label htmlFor="account-email">Account email</label>
          <input
            id="account-email"
            className="form-input"
            value={userEmail}
            readOnly
          />

          <label htmlFor="user-name">Display name</label>
          <input
            id="user-name"
            className="form-input"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
          />

          <div className="form-actions">
            <button
              className="button button-primary"
              onClick={saveSettings}
            >
              <Check size={16} />
              Save changes
            </button>
          </div>

          {savedMessage && (
            <p className="muted">{savedMessage}</p>
          )}
        </section>
      </>
    );
  }

  function renderPage() {
    switch (activePage) {
      case "Overview":
        return renderOverview();

      case "Brand Guidelines":
        return renderGuidelines();

      case "Content Auditor":
        return renderAuditor();

      case "Review & Approval":
        return renderReviews();

      case "Reports & Insights":
        return renderReports();

      case "Team & Access":
        return renderTeam();

      case "Settings":
        return renderSettings();

      default:
        return renderOverview();
    }
  }

  if (authLoading) {
    return (
      <div className="login-screen" style={{ backgroundImage: `url("${brandBackground}")` }}>
        <section className="login-card" aria-live="polite">
          <div className="login-brand-lockup">
            <span className="brand-mark"><ShieldCheck size={29} /></span>
            <span className="brand-name"><strong>BrandGuard AI</strong><small>BRAND GOVERNANCE</small></span>
          </div>
          <p className="muted">Verifying your session…</p>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-screen" style={{ backgroundImage: `url("${brandBackground}")` }}>
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-brand-lockup">
            <span className="brand-mark"><ShieldCheck size={29} /></span>
            <span className="brand-name">
              <strong>BrandGuard AI</strong>
              <small>BRAND GOVERNANCE</small>
            </span>
          </div>

          <div className="login-heading">
            <p className="eyebrow">YOUR BRAND. UNDER CONTROL.</p>
            <h1 id="login-title">
              {authMode === "signin" ? "Welcome back." : authMode === "signup" ? "Create your account." : "Reset your password."}
            </h1>
            <p>
              {authMode === "signin"
                ? "Sign in to continue to your brand workspace."
                : authMode === "signup"
                  ? "Set up your account and start governing your brand."
                  : "Enter your registered email address and we'll help you regain access."}
            </p>
          </div>

          {authMode === "signin" && (
            <form className="login-form" onSubmit={handleLogin}>
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="name@organisation.com"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />

              <div className="login-label-row">
                <label htmlFor="login-password">Password</label>
                <button className="login-text-link" type="button" onClick={() => changeAuthMode("forgot")}>Forgot password?</button>
              </div>
              <div className="login-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginError && <p className="login-error" role="alert">{loginError}</p>}
              <button className="button button-primary login-submit" type="submit" disabled={authSubmitting}>
                {authSubmitting ? "Signing in…" : "Sign in to workspace"} <ArrowUpRight size={17} />
              </button>
            </form>
          )}

          {authMode === "signup" && (
            <form className="login-form" onSubmit={handleRegister}>
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                required
              />
              <label htmlFor="register-email">Work email address</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="name@organisation.com"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
              <label htmlFor="register-password">Create password</label>
              <div className="login-password-wrap">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <button type="button" className="login-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
              {loginError && <p className="login-error" role="alert">{loginError}</p>}
              <button className="button button-primary login-submit" type="submit" disabled={authSubmitting}>
                {authSubmitting ? "Creating account…" : "Create account"} <ArrowUpRight size={17} />
              </button>
            </form>
          )}

          {authMode === "forgot" && (
            <form className="login-form" onSubmit={handleForgotPassword}>
              <label htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="name@organisation.com"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
              {loginError && <p className="login-error" role="alert">{loginError}</p>}
              {authNotice && <p className="login-notice" role="status">{authNotice}</p>}
              <button className="button button-primary login-submit" type="submit" disabled={authSubmitting}>
                Continue <ArrowUpRight size={17} />
              </button>
              <button className="login-back-link" type="button" onClick={() => changeAuthMode("signin")}>Back to sign in</button>
            </form>
          )}

          {authMode !== "forgot" && (
            <p className="login-switch">
              {authMode === "signin" ? "New to BrandGuard AI?" : "Already have an account?"}{" "}
              <button className="login-text-link" type="button" onClick={() => changeAuthMode(authMode === "signin" ? "signup" : "signin")}>
                {authMode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          )}

          <p className="login-demo-note">Your account is secured by BrandGuard AI authentication. Password reset by email will be available in a later update.</p>
          <div className="login-footer">© 2026 BrandGuard AI <span>•</span> Intelligent Brand Governance</div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* =================================
          MAIN HEADER
      ================================== */}

      <header className="site-header">
        <div className="header-main">

          <button
            className="brand-lockup"
            onClick={() => navigateTo("Overview")}
            aria-label="BrandGuard AI home"
          >
            <span className="brand-mark">
              <ShieldCheck size={27} />
            </span>

            <span className="brand-name">
              <strong>BrandGuard AI</strong>
              <small>BRAND GOVERNANCE</small>
            </span>
          </button>

          <div className="header-actions">

            <button
              className="icon-button notification-button"
              title="Open pending reviews"
              aria-label={`Open pending reviews. ${pendingCount} pending.`}
              onClick={() => navigateTo("Review & Approval")}
            >
              <Bell size={21} />
              {pendingCount > 0 && <span className="notification-dot" />}
            </button>

            <button
              className="profile-button"
              title="Your profile"
              onClick={() => navigateTo("Settings")}
            >
              <UserRound size={14} />
              {userName.split(/\\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U"}
            </button>

            <button
              className="icon-button"
              title={`Sign out${userEmail ? ` (${userEmail})` : ""}`}
              aria-label="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={17} />
            </button>

            <button
              className="icon-button mobile-menu-button"
              aria-label={
                mobileMenuOpen ? "Close menu" : "Open menu"
              }
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>

          </div>
        </div>

        {/* =================================
            TOP NAVIGATION
        ================================== */}

        <nav
          className={`top-navigation ${mobileMenuOpen ? "navigation-open" : ""
            }`}
          aria-label="Main navigation"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.name;

            return (
              <button
                key={item.name}
                className={`nav-link ${active ? "nav-link-active" : ""
                  }`}
                onClick={() => navigateTo(item.name)}
              >
                <Icon size={17} />

                <span>{item.name}</span>

                {item.name === "Review & Approval" &&
                  pendingCount > 0 && (
                    <span className="count-badge">
                      {pendingCount}
                    </span>
                  )}
              </button>
            );
          })}

          {/* SEARCH BAR AFTER SETTINGS */}

          <div className="nav-search">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search workspace..."
              aria-label="Search workspace"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchTerm("");
                }
              }}
            />
          </div>
        </nav>
      </header>

      {/* =================================
          MAIN CONTENT
      ================================== */}

      <main
        className="main-area"
        style={{
          backgroundImage: `url("${brandBackground}")`,
        }}
      >
        <div className="page-container">

          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          {renderPage()}

        </div>
      </main>

      {/* =================================
          FOOTER
      ================================== */}

      <footer className="app-footer">
        <span>© 2026 BrandGuard AI</span>
        <span>Intelligent Brand Governance</span>
      </footer>
    </div>
  );
}

export default App;
