"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  User,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Activity,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string | null;
  context_type: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("No hay sesión activa");
  return session.access_token;
}

// ─── Sugerencias rápidas ──────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  { icon: Activity,      label: "Diagnóstico completo",   prompt: "Analiza todas mis campañas activas y dime cuáles necesitan atención urgente" },
  { icon: TrendingUp,    label: "Cómo mejorar el ROAS",   prompt: "¿Cómo puedo mejorar el ROAS de mis campañas? Dame pasos concretos" },
  { icon: AlertTriangle, label: "CPC alto - qué hacer",   prompt: "Mi CPC está subiendo, ¿cuál es la causa más probable y cómo lo corrijo?" },
  { icon: BarChart3,     label: "Escalar lo que funciona", prompt: "¿Qué campañas debería escalar y cuánto presupuesto agregarles?" },
  { icon: Lightbulb,     label: "Ideas de creativos",     prompt: "Dame ideas concretas de creativos para mejorar el CTR de mis anuncios" },
  { icon: Sparkles,      label: "Estrategia de audiencias", prompt: "¿Cómo debería estructurar mis audiencias para maximizar el rendimiento?" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Tabla markdown
    if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1].startsWith("|---")) {
      const headers = line.split("|").filter(Boolean).map(h => h.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").filter(Boolean).map(c => c.trim()));
        i++;
      }
      elements.push(
        <div key={i} className="overflow-x-auto my-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/60">
                {headers.map((h, j) => (
                  <th key={j} className="text-left py-1.5 px-2 font-semibold text-xs text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/30 last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-1.5 px-2 text-xs">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Lista
    if (line.match(/^[-*\d+\.]\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*\d+\.]\s/)) {
        listItems.push(lines[i].replace(/^[-*\d+\.]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-1 my-2 ml-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (!line.trim()) {
      elements.push(<div key={i} className="h-1" />);
      i++;
      continue;
    }

    elements.push(
      <p key={i} className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
        }}
      />
    );
    i++;
  }
  return elements;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn("flex gap-3 group", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
        isUser ? "bg-primary text-primary-foreground" : "bg-indigo-500/10 border border-indigo-500/20",
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
      </div>

      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end flex flex-col")}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted/60 border border-border/60 rounded-tl-sm",
        )}>
          {isUser
            ? <p className="text-sm">{message.content}</p>
            : <div className="space-y-1">{renderMarkdown(message.content)}</div>}
        </div>

        <div className={cn(
          "flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser && "flex-row-reverse",
        )}>
          <span className="text-[10px] text-muted-foreground">{formatTime(message.timestamp)}</span>
          {!isUser && (
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="max-w-[80%] bg-muted/60 border border-border/60 rounded-2xl rounded-tl-sm px-4 py-3">
        {content ? (
          <div className="space-y-1">{renderMarkdown(content)}</div>
        ) : (
          <div className="flex items-center gap-1.5">
            {[0, 0.2, 0.4].map((delay, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: `${delay}s` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `Hola, soy tu **trafficker IA** especializado en Meta Ads.

Tengo acceso en tiempo real a los datos de tus campañas y puedo ayudarte a:
- **Diagnosticar problemas** antes de que afecten tu presupuesto
- **Optimizar métricas** con recomendaciones específicas y accionables
- **Escalar lo que funciona** identificando las mejores oportunidades
- **Interpretar cualquier anomalía** en tus resultados

¿Cómo quieres que empecemos?`,
  timestamp: new Date(),
};

export default function AIAgentPage() {
  const [messages, setMessages]         = useState<Message[]>([WELCOME_MESSAGE]);
  const [streamingContent, setStreaming] = useState<string | null>(null);
  const [input, setInput]               = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [apiError, setApiError]         = useState<string | null>(null);
  const bottomRef                        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Crear conversación en el backend
  const ensureConversation = useCallback(async (): Promise<Conversation> => {
    if (conversation) return conversation;
    const token = await getAuthToken();
    const res = await fetch(`${API_URL}/v1/ai/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ context_type: "general" }),
    });
    if (!res.ok) throw new Error("No se pudo crear la conversación");
    const conv = await res.json();
    setConversation(conv);
    return conv;
  }, [conversation]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setApiError(null);

    const userMsg: Message = {
      id: `u${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setStreaming("");

    try {
      const token = await getAuthToken();
      const conv = await ensureConversation();

      const res = await fetch(
        `${API_URL}/v1/ai/conversations/${conv.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: text.trim() }),
        }
      );

      if (!res.ok || !res.body) {
        throw new Error("Error al conectar con el agente");
      }

      // Leer SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          accumulated += data;
          setStreaming(accumulated);
        }
      }

      const assistantMsg: Message = {
        id: `a${Date.now()}`,
        role: "assistant",
        content: accumulated,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error conectando con el agente");
    } finally {
      setIsLoading(false);
      setStreaming(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setConversation(null);
    setInput("");
    setApiError(null);
    setStreaming(null);
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Trafficker IA</h1>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-500">En línea</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Experto en Meta Ads · acceso a tus campañas en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
            <Settings2 className="w-3.5 h-3.5" />
            Configurar
          </Link>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Error de API */}
      {apiError && (
        <div className="mb-3 flex-shrink-0 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <p className="text-xs text-amber-600">
            ⚠️ {apiError} — el agente usa datos de demostración cuando el backend no está disponible.
          </p>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && streamingContent !== null && (
          <StreamingBubble content={streamingContent} />
        )}

        {/* Sugerencias rápidas */}
        {showSuggestions && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              ¿Qué quieres analizar hoy?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_SUGGESTIONS.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.prompt)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 text-left transition-all duration-200 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3 border-t">
        <div className="flex items-end gap-2 bg-muted/40 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:bg-muted/60 transition-all duration-200">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre tus campañas… (Enter para enviar)"
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground max-h-32 leading-relaxed"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Accede a datos reales de tus campañas · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
