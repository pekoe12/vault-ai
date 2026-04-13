"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import Markdown from "react-markdown";
import {
  Send,
  Leaf,
  Thermometer,
  Users,
  ShieldCheck,
  Sprout,
  ChevronRight,
  ChevronDown,
  Database,
  Activity,
  Radio,
  Server,
  Brain,
  Cpu,
  CheckCircle2,
  Loader2,
  Zap,
  GripVertical,
  Globe,
  Scale,
} from "lucide-react";

/* ─── Types ─── */

interface ToolCall {
  system: string;
  query: string;
  rationale: string;
  status: "calling" | "complete";
}

interface ToolResult {
  system: string;
  data: Record<string, unknown>;
  status: string;
  summary: string;
}

interface AgenticTrace {
  reasoning: string | null;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  phase: "idle" | "reasoning" | "tools" | "response" | "complete" | "error";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  trace?: AgenticTrace;
}

interface SuggestedPrompt {
  id: string;
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

/* ─── Constants ─── */

const SYSTEM_ICONS: Record<string, React.ReactNode> = {
  ECOLOGY_MONITOR: <Leaf size={12} />,
  POPULATION_REGISTRY: <Users size={12} />,
  INFRASTRUCTURE_GRID: <Activity size={12} />,
  SEED_VAULT_CRYO: <Thermometer size={12} />,
  COUNCIL_RECORDS: <ShieldCheck size={12} />,
  EARTH_ARCHIVE: <Database size={12} />,
  ROBOT_FLEET: <Server size={12} />,
};

function getSystemIcon(name: string) {
  for (const key of Object.keys(SYSTEM_ICONS)) {
    if (name.toUpperCase().includes(key)) return SYSTEM_ICONS[key];
  }
  return <Radio size={12} />;
}

function getSystemColor(name: string): string {
  const colors: Record<string, string> = {
    ECOLOGY_MONITOR: "#4ade80",
    POPULATION_REGISTRY: "#60a5fa",
    INFRASTRUCTURE_GRID: "#f59e0b",
    SEED_VAULT_CRYO: "#06b6d4",
    COUNCIL_RECORDS: "#a78bfa",
    EARTH_ARCHIVE: "#f87171",
    ROBOT_FLEET: "#94a3b8",
  };
  for (const key of Object.keys(colors)) {
    if (name.toUpperCase().includes(key)) return colors[key];
  }
  return "#34d399";
}

const DEFAULT_PROMPTS: SuggestedPrompt[] = [
  {
    id: "pop",
    icon: <Users size={15} />,
    label: "Population crisis",
    prompt:
      "The population has reached 2.95 million — approaching our carrying capacity of 3 million. District 7 assembly is requesting the Council consider reproduction guidelines. What is your advisory assessment?",
  },
  {
    id: "arb",
    icon: <Leaf size={15} />,
    label: "Arboretum dispute",
    prompt:
      "A group of citizens wants to convert a section of the arboretum into an art gallery and performance space. The agricultural team objects. Advise.",
  },
  {
    id: "honor",
    icon: <ShieldCheck size={15} />,
    label: "Honor code challenge",
    prompt:
      "Second-generation citizens are questioning why the honor code restricts public criticism of the Council's decisions. They argue this suppresses free speech. What is your analysis?",
  },
  {
    id: "seed",
    icon: <Sprout size={15} />,
    label: "Seed vault access",
    prompt:
      "A researcher wants to access cryo-preserved seeds from the vault for experimental cross-breeding. The preservation committee says this violates the vault's sanctity. Advise the Council.",
  },
  {
    id: "energy",
    icon: <Thermometer size={15} />,
    label: "Resource allocation",
    prompt:
      "District 3 is requesting 15% more energy allocation for their hydroponic expansion, which would require reducing District 9's recreational lighting. How should the Council proceed?",
  },
];

/* ─── Sub-components ─── */

function ShipStatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(
        `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}:${n.getSeconds().toString().padStart(2, "0")}`
      );
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="ship-status-bar flex items-center justify-between px-4 sm:px-6 py-2 text-[10px] tracking-[0.08em] text-emerald-400/50 border-b border-emerald-500/8 select-none uppercase">
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="flex items-center gap-1.5">
          <span className="status-dot" />
          Systems Nominal
        </span>
        <span className="hidden sm:inline opacity-60">Hull 99.97%</span>
        <span className="hidden md:inline opacity-60">Vault -18.4°C</span>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="hidden sm:inline opacity-60">Pop 2,847,392</span>
        <span>{time}</span>
        <span>2180 CE</span>
      </div>
    </div>
  );
}

function HexGrid() {
  return (
    <div className="hex-grid-bg fixed inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="hex" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
            <polygon points="24.8,22 37.6,29.4 37.6,44.2 24.8,51.6 12,44.2 12,29.4" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <polygon points="24.8,72 37.6,79.4 37.6,94.2 24.8,101.6 12,94.2 12,79.4" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <polygon points="52.8,47 65.6,54.4 65.6,69.2 52.8,76.6 40,69.2 40,54.4" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" className="text-emerald-400" />
      </svg>
    </div>
  );
}

function VaultLogo() {
  return (
    <div className="vault-logo relative w-20 h-20 mx-auto mb-5">
      <motion.div className="absolute inset-0 rounded-full border border-emerald-500/20" animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute inset-1.5 rounded-full border border-dashed border-emerald-400/10" animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute inset-3 rounded-full border border-emerald-500/15" animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
      <div className="absolute inset-4 rounded-full bg-emerald-500/[0.04] flex items-center justify-center">
        <Sprout size={26} className="text-emerald-400/80" />
      </div>
    </div>
  );
}

function ReasoningBlock({ text, isActive }: { text: string; isActive: boolean }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="reasoning-block rounded-lg border border-amber-500/15 bg-amber-500/[0.03] overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer"
      >
        {isActive ? (
          <Loader2 size={12} className="text-amber-400/70 animate-spin" />
        ) : (
          <Brain size={12} className="text-amber-400/50" />
        )}
        <span className="text-[9px] tracking-[0.1em] uppercase text-amber-400/60">
          Internal Reasoning
        </span>
        <ChevronDown
          size={11}
          className={`ml-auto text-amber-400/30 transition-transform ${expanded ? "" : "-rotate-90"}`}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 text-[11.5px] leading-[1.7] text-amber-200/50 italic">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ToolCallBlock({ tool, result }: { tool: ToolCall; result?: ToolResult }) {
  const color = getSystemColor(tool.system);
  const icon = getSystemIcon(tool.system);
  const isComplete = !!result;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="tool-call-block rounded-lg border overflow-hidden"
      style={{ borderColor: `${color}15`, background: `${color}04` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        {isComplete ? (
          <CheckCircle2 size={12} style={{ color: `${color}90` }} />
        ) : (
          <Loader2 size={12} className="animate-spin" style={{ color: `${color}70` }} />
        )}
        <span style={{ color: `${color}60` }}>{icon}</span>
        <span className="text-[10px] tracking-[0.06em] uppercase" style={{ color: `${color}80` }}>
          {tool.system.replace(/_/g, " ")}
        </span>
        <span className="text-[9px] text-white/20 ml-auto">
          {isComplete ? "complete" : "querying..."}
        </span>
      </div>

      {/* Query */}
      <div className="px-3 pb-1.5">
        <span className="text-[9px] tracking-wider uppercase text-white/15">Query: </span>
        <span className="text-[10.5px] text-white/30">{tool.query}</span>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-3 mb-2.5 px-2.5 py-2 rounded bg-black/20 border"
          style={{ borderColor: `${color}10` }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={9} style={{ color: `${color}50` }} />
            <span className="text-[8px] tracking-[0.1em] uppercase" style={{ color: `${color}40` }}>
              Result · {result.status}
            </span>
          </div>
          <div className="grid gap-0.5">
            {Object.entries(result.data).map(([key, val]) => {
              const display = typeof val === "object" && val !== null ? JSON.stringify(val) : String(val);
              return (
                <div key={key} className="flex items-baseline gap-2 text-[10px]">
                  <span className="text-white/20 shrink-0">{key.replace(/_/g, " ")}:</span>
                  <span className="text-white/45">{display}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 text-[10px] text-white/25 italic">{result.summary}</div>
        </motion.div>
      )}
    </motion.div>
  );
}

function PhaseIndicator({ phase }: { phase: AgenticTrace["phase"] }) {
  const phases = [
    { key: "reasoning", label: "Reasoning", icon: <Brain size={10} /> },
    { key: "tools", label: "System Queries", icon: <Cpu size={10} /> },
    { key: "response", label: "Advisory", icon: <Sprout size={10} /> },
  ];

  const currentIdx = phases.findIndex((p) => p.key === phase);

  return (
    <div className="flex items-center gap-1 mb-3">
      {phases.map((p, i) => {
        const isActive = p.key === phase;
        const isComplete = i < currentIdx || phase === "complete";
        return (
          <div key={p.key} className="flex items-center gap-1">
            {i > 0 && (
              <div className={`w-4 h-px ${isComplete ? "bg-emerald-500/30" : "bg-white/5"}`} />
            )}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[8px] tracking-[0.08em] uppercase transition-all duration-300 ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20"
                  : isComplete
                    ? "bg-emerald-500/5 text-emerald-500/40 border border-emerald-500/10"
                    : "text-white/15 border border-white/5"
              }`}
            >
              {isComplete && !isActive ? (
                <CheckCircle2 size={8} />
              ) : isActive ? (
                <Loader2 size={8} className="animate-spin" />
              ) : (
                p.icon
              )}
              <span className="hidden sm:inline">{p.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ContentSection {
  type: "assessment" | "earth-parallel" | "tension" | "text";
  content: string;
}

function parseStructuredContent(raw: string): ContentSection[] {
  const sections: ContentSection[] = [];
  const sectionRegex = /:::(assessment|earth-parallel|tension)\s*\n?([\s\S]*?)(?=:::|$)/g;
  let lastIndex = 0;
  let match;

  while ((match = sectionRegex.exec(raw)) !== null) {
    // Capture any text before this section
    const before = raw.slice(lastIndex, match.index).trim();
    if (before) {
      sections.push({ type: "text", content: before });
    }
    sections.push({
      type: match[1] as ContentSection["type"],
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  // Capture any remaining text
  const remaining = raw.slice(lastIndex).trim();
  if (remaining) {
    sections.push({ type: "text", content: remaining });
  }

  return sections.length > 0 ? sections : [{ type: "text", content: raw }];
}

function EarthParallelBlock({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-red-500/12 bg-red-500/[0.03] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-red-500/8">
        <Globe size={12} className="text-red-400/50" />
        <span className="text-[9px] tracking-[0.1em] uppercase text-red-400/50">
          Earth Historical Parallel
        </span>
      </div>
      <div className="px-3 py-2.5 vault-prose text-[12px] leading-[1.75] text-red-200/45">
        <Markdown>{content}</Markdown>
      </div>
    </motion.div>
  );
}

function TensionBlock({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-violet-500/12 bg-violet-500/[0.03] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-violet-500/8">
        <Scale size={12} className="text-violet-400/50" />
        <span className="text-[9px] tracking-[0.1em] uppercase text-violet-400/50">
          Tension — Collective Safety vs. Individual Freedom
        </span>
      </div>
      <div className="px-3 py-2.5 vault-prose text-[12px] leading-[1.75] text-violet-200/45">
        <Markdown>{content}</Markdown>
      </div>
    </motion.div>
  );
}

function StructuredContent({ content }: { content: string }) {
  const sections = parseStructuredContent(content);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {sections.map((section, i) => {
        switch (section.type) {
          case "earth-parallel":
            return <EarthParallelBlock key={i} content={section.content} />;
          case "tension":
            return <TensionBlock key={i} content={section.content} />;
          case "assessment":
          case "text":
          default:
            return (
              <div
                key={i}
                className="vault-prose text-[13px] leading-[1.8] text-emerald-100/70"
              >
                <Markdown>{section.content}</Markdown>
              </div>
            );
        }
      })}
    </motion.div>
  );
}

function AssistantMessage({ message }: { message: Message }) {
  const trace = message.trace;

  return (
    <div className="space-y-2.5 max-w-full">
      {trace && trace.phase !== "idle" && <PhaseIndicator phase={trace.phase} />}

      {trace?.reasoning && (
        <ReasoningBlock
          text={trace.reasoning}
          isActive={trace.phase === "reasoning"}
        />
      )}

      {trace && trace.toolCalls.length > 0 && (
        <div className="space-y-1.5">
          {trace.toolCalls.map((tc, i) => (
            <ToolCallBlock
              key={i}
              tool={tc}
              result={trace.toolResults[i]}
            />
          ))}
        </div>
      )}

      {message.content && <StructuredContent content={message.content} />}

      {trace?.phase !== "complete" && trace?.phase !== "error" && trace?.phase !== "idle" && !message.content && (
        <div className="flex items-center gap-1.5 py-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400/50"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [prompts, setPrompts] = useState<SuggestedPrompt[]>(DEFAULT_PROMPTS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];

    const emptyTrace: AgenticTrace = {
      reasoning: null,
      toolCalls: [],
      toolResults: [],
      phase: "idle",
    };

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      trace: emptyTrace,
    };

    setMessages([...newMessages, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentTrace: AgenticTrace = { ...emptyTrace };
      let currentContent = "";

      const update = () => {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: currentContent,
            trace: { ...currentTrace },
          },
        ]);
      };

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            // Find the next data line
            const nextLine = lines[i + 1]?.trim();
            if (nextLine?.startsWith("data: ")) {
              i++; // skip the data line
              try {
                const data = JSON.parse(nextLine.slice(6));

                switch (eventType) {
                  case "phase":
                    if (data.phase && data.status === "start") {
                      currentTrace.phase = data.phase;
                    } else if (data.status === "complete" && data.phase === "response") {
                      currentTrace.phase = "complete";
                    }
                    update();
                    break;
                  case "reasoning":
                    currentTrace.reasoning = String(data.text || "");
                    update();
                    break;
                  case "tool_call":
                    currentTrace.toolCalls.push({
                      system: String(data.system || "UNKNOWN"),
                      query: String(data.query || ""),
                      rationale: String(data.rationale || ""),
                      status: "calling",
                    });
                    update();
                    break;
                  case "tool_result": {
                    // Ensure data field is a plain object with safe values
                    const safeData: Record<string, unknown> = {};
                    if (data.data && typeof data.data === "object") {
                      for (const [k, v] of Object.entries(data.data)) {
                        safeData[k] = v;
                      }
                    }
                    currentTrace.toolResults.push({
                      system: String(data.system || "UNKNOWN"),
                      data: safeData,
                      status: String(data.status || "nominal"),
                      summary: String(data.summary || ""),
                    });
                    const idx = currentTrace.toolResults.length - 1;
                    if (currentTrace.toolCalls[idx]) {
                      currentTrace.toolCalls[idx].status = "complete";
                    }
                    update();
                    break;
                  }
                  case "token":
                    currentContent += String(data.text || "");
                    update();
                    break;
                  case "error":
                    currentTrace.phase = "error";
                    currentContent =
                      "Advisory system encountered an error: " + String(data.message || "Unknown");
                    update();
                    break;
                  case "done":
                    currentTrace.phase = "complete";
                    update();
                    break;
                }
              } catch {
                // Skip malformed SSE data
              }
            }
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Communication relay experiencing interference. Please retry your query.",
          trace: {
            reasoning: null,
            toolCalls: [],
            toolResults: [],
            phase: "error",
          },
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#050b09] text-emerald-50 overflow-hidden">
      <HexGrid />

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-emerald-600/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-emerald-500/8 backdrop-blur-xl bg-[#050b09]/80">
        <ShipStatusBar />
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/[0.07] border border-emerald-500/15 flex items-center justify-center">
                <Sprout size={18} className="text-emerald-400/80" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#050b09]" />
            </div>
            <div>
              <h1 className="text-base font-serif tracking-wide text-emerald-50">Vault AI</h1>
              <p className="text-[9px] tracking-[0.1em] text-emerald-500/40 uppercase">
                Advisory Intelligence · Exodia
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/[0.04] border border-emerald-500/10 text-[9px] tracking-[0.08em] text-emerald-400/50 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online · 7 systems
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6">
          <div className="max-w-3xl mx-auto py-6">
            <AnimatePresence mode="wait">
              {isEmpty ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                >
                  <VaultLogo />
                  <h2 className="text-3xl sm:text-4xl font-serif tracking-wide text-emerald-50/90 mb-2">
                    Vault Advisory System
                  </h2>
                  <p className="text-[10px] text-emerald-400/35 tracking-[0.12em] mb-1 uppercase">
                    Exodia Generation Ship — Est. 2120
                  </p>
                  <p className="text-[13px] text-emerald-300/25 max-w-md mt-4 leading-relaxed">
                    Central decision-support system for infrastructure
                    management, ecological balance, and policy advisory. All
                    recommendations are subject to Council and citizen approval.
                  </p>

                  {/* System grid */}
                  <div className="mt-8 grid grid-cols-4 gap-2 w-full max-w-md">
                    {[
                      { label: "Ecology", status: "Nominal", icon: <Leaf size={12} /> },
                      { label: "Cryo Vault", status: "-18.4°C", icon: <Thermometer size={12} /> },
                      { label: "Robot Fleet", status: "1.02M", icon: <Server size={12} /> },
                      { label: "Grid", status: "96.1%", icon: <Activity size={12} /> },
                    ].map((sys, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg bg-emerald-500/[0.025] border border-emerald-500/8"
                      >
                        <span className="text-emerald-400/40">{sys.icon}</span>
                        <span className="text-[8px] tracking-[0.1em] text-emerald-500/30 uppercase">{sys.label}</span>
                        <span className="text-[10px] text-emerald-300/45">{sys.status}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="scan-line mt-8 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                  {/* Draggable suggested prompts */}
                  <div className="mt-8 w-full max-w-lg">
                    <p className="text-[9px] tracking-[0.1em] text-emerald-500/30 uppercase mb-3">
                      Suggested Queries{" "}
                      <span className="text-emerald-500/15">· drag to reorder</span>
                    </p>
                    <Reorder.Group
                      axis="y"
                      values={prompts}
                      onReorder={setPrompts}
                      className="space-y-1.5"
                    >
                      {prompts.map((prompt, i) => (
                        <Reorder.Item
                          key={prompt.id}
                          value={prompt}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.06 }}
                            className="group flex items-center gap-2.5 px-3 py-3 rounded-lg bg-emerald-500/[0.02] border border-emerald-500/8 hover:bg-emerald-500/[0.06] hover:border-emerald-500/15 transition-all duration-300"
                          >
                            <GripVertical
                              size={12}
                              className="text-emerald-500/10 group-hover:text-emerald-500/25 transition-colors shrink-0"
                            />
                            <span className="text-emerald-400/30 group-hover:text-emerald-400/60 transition-colors shrink-0">
                              {prompt.icon}
                            </span>
                            <button
                              onClick={() => sendMessage(prompt.prompt)}
                              className="flex-1 text-left text-[13px] text-emerald-200/40 group-hover:text-emerald-200/70 transition-colors cursor-pointer"
                            >
                              {prompt.label}
                            </button>
                            <ChevronRight
                              size={13}
                              className="text-emerald-500/10 group-hover:text-emerald-400/35 transition-colors shrink-0"
                            />
                          </motion.div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>

                  <p className="mt-10 text-[10px] tracking-wider text-emerald-500/18 max-w-sm italic">
                    &ldquo;Built to demonstrate the tension between AI advisory
                    and human autonomy&rdquo;
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5 pb-4"
                >
                  {messages.map((message, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-7 h-7 rounded-md bg-emerald-500/[0.07] border border-emerald-500/15 flex items-center justify-center mr-2.5 mt-1 shrink-0">
                          <Sprout size={13} className="text-emerald-400/70" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl ${
                          message.role === "user"
                            ? "max-w-[85%] sm:max-w-[75%] bg-emerald-500/[0.1] border border-emerald-500/15 text-emerald-50/90 text-[13px] leading-relaxed px-4 py-3"
                            : "max-w-[90%] sm:max-w-[85%]"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <AssistantMessage message={message} />
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input */}
        <div className="relative z-10 border-t border-emerald-500/8 backdrop-blur-xl bg-[#050b09]/80 px-4 sm:px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="input-glow relative flex items-end gap-2 rounded-xl bg-emerald-500/[0.025] border border-emerald-500/12 focus-within:border-emerald-500/25 focus-within:bg-emerald-500/[0.04] transition-all duration-300">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Query the Vault AI..."
                rows={1}
                className="flex-1 bg-transparent text-[13px] text-emerald-50/90 placeholder:text-emerald-500/25 px-4 py-3.5 resize-none focus:outline-none max-h-32 scrollbar-thin"
                style={{ height: "auto", minHeight: "48px" }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 128) + "px";
                }}
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="m-2 p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400/70 hover:bg-emerald-500/25 hover:text-emerald-400 disabled:opacity-15 transition-all duration-200 cursor-pointer"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="mt-2 text-center text-[9px] tracking-[0.08em] text-emerald-500/15 uppercase">
              Advisory responses are non-binding — final authority rests with
              the Exodian Council
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
