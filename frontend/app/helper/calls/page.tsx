"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  PhoneCall,
  PhoneOff,
  Mic,
  Square,
  Send,
  Volume2,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  PhoneIncoming,
  FlaskConical,
  Clock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/contexts/language-context";
import { backendClient } from "@/lib/api/backendClient";
import { ivrApi, ivrAudioUrl, IvrConfig, IvrFields, IvrInput, IvrPrompt, IvrRegistration, IvrSession, IvrSubmission } from "@/lib/api/ivr";

const STATUS_STYLES: Record<IvrSession["status"], { label: string; cls: string }> = {
  in_progress: { label: "In progress", cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  completed: { label: "Registered", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  failed: { label: "Registration failed", cls: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30" },
  callback: { label: "Call back", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  ended: { label: "Ended by caller", cls: "bg-farmly-surface-elevated text-farmly-muted border-farmly-border" },
  transferred: { label: "Transferred", cls: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  abandoned: { label: "Hung up (resumable)", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
};

const REQUIRED: { key: keyof IvrFields; label: string }[] = [
  { key: "crop", label: "Crop" },
  { key: "quantity", label: "Quantity" },
  { key: "harvestDate", label: "Harvest date" },
  { key: "location", label: "Location" },
];

function StatusBadge({ status }: { status: IvrSession["status"] }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.ended;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

const KIND_LABEL: Record<IvrSubmission["kind"], string> = { farmer: "Farmer", lot: "Crop lot", availability: "Upcoming harvest" };

function Rows({ rows }: { rows: [string, string | undefined][] }) {
  return (
    <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-1 text-xs">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-farmly-muted">{k}</dt>
          <dd className={v ? "text-farmly-foreground font-medium" : "text-farmly-muted-dark italic"}>{v || "not collected"}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function FieldList({ fields, availability }: { fields: IvrFields; availability?: boolean }) {
  const rows: [string, string | undefined][] = [
    ["Crop", fields.crop],
    ["Variety", fields.variety === null ? "Not known" : fields.variety],
    ["Quantity", fields.quantity !== undefined ? `${fields.quantity} ${fields.unit || ""}` : undefined],
    ["Harvest", fields.harvestDate ? `${fields.harvestDate}${fields.harvested ? " (harvested)" : " (expected)"}` : undefined],
    ["Location", fields.location],
  ];
  if (availability) rows.push(["Notes", fields.notes === null ? "None" : fields.notes || undefined]);
  return <Rows rows={rows} />;
}

function RegistrationList({ reg }: { reg: IvrRegistration }) {
  return (
    <Rows
      rows={[
        ["Mobile", reg.mobile],
        ["Name", reg.name],
        ["Village", reg.village],
        ["Taluka", reg.taluka === null ? "Not given" : reg.taluka],
        ["District", reg.district],
        ["State", reg.state],
        ["Farming", reg.category],
        ["FPO", reg.fpo === null ? "None" : reg.fpo],
        ["Consent", reg.consent ? "Given on the call" : undefined],
      ]}
    />
  );
}

function SubmissionRow({ sub, busy, canRetry, onRetry }: { sub: IvrSubmission; busy: boolean; canRetry: boolean; onRetry: () => void }) {
  const ok = sub.status === "registered";
  return (
    <div className={`rounded-xl border p-2.5 text-xs ${ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />}
          <span className="font-semibold text-farmly-foreground">{KIND_LABEL[sub.kind]}</span>
          <span className="font-mono text-farmly-foreground truncate">{sub.recordId || sub.reservedId}</span>
          {!ok && <span className="text-red-700 dark:text-red-300">{sub.status === "failed" ? "failed" : "not sent"}</span>}
        </div>
        {!ok && canRetry && (
          <Button type="button" size="sm" onClick={onRetry} disabled={busy} className="h-7 px-2.5 shrink-0">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        )}
      </div>
      {sub.error && <p className="mt-1 text-[11px] text-red-700 dark:text-red-300">{sub.error}</p>}
      <details className="mt-1.5">
        <summary className="cursor-pointer text-[11px] text-farmly-muted">Generated JSON (sent to the website API)</summary>
        <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-farmly-background/60 p-2 text-[10px] leading-relaxed text-farmly-foreground">{JSON.stringify(sub.payload, null, 2)}</pre>
      </details>
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

type ChatLine = { role: "agent" | "caller"; text: string; english?: string; audioUrl?: string | null };

export default function HelperCallsPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<IvrConfig | null>(null);
  const [sessions, setSessions] = useState<IvrSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Simulator
  const [callerNumber, setCallerNumber] = useState("");
  const [sim, setSim] = useState<{ id: string; expect: string; end: boolean } | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [answer, setAnswer] = useState("");
  const [simError, setSimError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [cfg, list] = await Promise.all([ivrApi.config(), ivrApi.sessions()]);
      setConfig(cfg);
      setSessions(list);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(
        err instanceof TypeError
          ? `Cannot reach the Farmly backend at ${backendClient.apiBaseUrl()}. Start it and set NEXT_PUBLIC_API_URL (e.g. http://localhost:5000/api/v1).`
          : err.message || "Could not reach the Farmly backend"
      );
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat]);

  const playQueue = useCallback(async (prompts: IvrPrompt[]) => {
    for (const p of prompts) {
      if (!p.audioUrl) continue;
      await new Promise<void>((resolve) => {
        const a = new Audio(ivrAudioUrl(p.audioUrl!));
        a.onended = () => resolve();
        a.onerror = () => resolve();
        a.play().catch(() => resolve());
      });
    }
  }, []);

  const applyResult = useCallback(
    (r: { session: IvrSession; say: IvrPrompt[]; expect: string; end: boolean }) => {
      setSim({ id: r.session.id, expect: r.expect, end: r.end });
      setChat((c) => [...c, ...r.say.map((p) => ({ role: "agent" as const, text: p.text, english: p.english, audioUrl: p.audioUrl }))]);
      setSessions((list) => [r.session, ...list.filter((s) => s.id !== r.session.id)]);
      setSelectedId(r.session.id);
      if (autoPlay) playQueue(r.say);
    },
    [autoPlay, playQueue]
  );

  const startCall = async () => {
    setSimError(null);
    setBusy(true);
    setChat([]);
    try {
      applyResult(await ivrApi.startSimulation(callerNumber));
    } catch (err: any) {
      setSimError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const send = async (input: IvrInput, shown: string) => {
    if (!sim || sim.end) return;
    setSimError(null);
    setBusy(true);
    setChat((c) => [...c, { role: "caller", text: shown }]);
    try {
      applyResult(await ivrApi.sendTurn(sim.id, input));
    } catch (err: any) {
      setSimError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const v = answer.trim();
    if (!v || busy) return; // the farmer's previous answer is still being processed; keep the text
    setAnswer("");
    if (/^[0-9*#]{1,12}$/.test(v)) send({ digits: v }, `[keypad ${v}]`);
    else send({ text: v }, v);
  };

  const toggleMic = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (ev) => chunks.push(ev.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        send({ audioBase64: await blobToBase64(blob), mimeType: blob.type }, "[voice answer]");
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setTimeout(() => rec.state === "recording" && rec.stop(), 25000); // same limit as phone calls
    } catch (err: any) {
      setSimError(`Microphone unavailable: ${err.message}`);
    }
  };

  const retry = async (id: string, key: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const s = await ivrApi.retry(id, key);
      setSessions((list) => list.map((x) => (x.id === id ? s : x)));
      const sub = s.submissions.find((x) => x.key === key);
      setNotice(sub?.status === "registered" ? `${KIND_LABEL[sub.kind]} ${sub.recordId} registered.` : s.lastError || "Retry failed");
    } catch (err: any) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const selected = sessions.find((s) => s.id === selectedId) || null;
  const missing = selected ? REQUIRED.filter((r) => selected.fields[r.key] === undefined || selected.fields[r.key] === null) : [];

  return (
    <AppLayout title={t("nav.phoneCalls", "Phone Registrations")}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">{t("helper.phoneCallsTitle", "Phone Crop Registrations")}</h1>
            <p className="text-xs text-farmly-muted">
              {t("helper.phoneCallsDesc", "Farmers call in and, in their own language, register themselves, their crop lots and upcoming harvests. Nothing is saved until the farmer confirms the read-back.")}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={refresh} className="shrink-0">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>

        {/* Setup status */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className={`rounded-full border px-2.5 py-1 font-semibold ${config?.speechConfigured ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 text-amber-700 dark:text-amber-300"}`}>
            Speech (Sarvam): {config ? (config.speechConfigured ? "configured" : "not configured — text-only simulator, English prompts") : "…"}
          </span>
          <span className={`rounded-full border px-2.5 py-1 font-semibold ${config?.twilioConfigured ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "border-farmly-border text-farmly-muted"}`}>
            Phone line (Twilio): {config ? (config.twilioConfigured ? `live ${config.twilioNumber || ""}` : "not configured") : "…"}
          </span>
        </div>
        {loadError && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {loadError}
          </div>
        )}
        {notice && <div className="p-3 rounded-xl border border-farmly-border bg-farmly-surface text-xs text-farmly-foreground">{notice}</div>}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Simulator */}
          <Card className="bg-farmly-surface border-farmly-border p-4 flex flex-col min-h-[520px]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-farmly-accent" />
                <h2 className="text-sm font-bold text-farmly-foreground">Call simulator</h2>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-farmly-muted">
                <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} /> Play voice
              </label>
            </div>
            <p className="text-[11px] text-farmly-muted mb-3">
              Free local test of the same conversation a caller hears. Simulated calls are labelled and kept apart from real phone calls, but a confirmed simulation does register a real lot.
            </p>

            <div className="flex gap-2 mb-3">
              <Input value={callerNumber} onChange={(e) => setCallerNumber(e.target.value)} placeholder="Farmer's registered mobile (caller ID)" inputMode="tel" />
              <Button type="button" size="sm" onClick={startCall} disabled={busy || !callerNumber.trim()} className="shrink-0 h-10">
                <PhoneCall className="w-4 h-4 mr-1.5" /> {sim && !sim.end ? "Restart" : "Call"}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl border border-farmly-border bg-farmly-background/40 p-3 space-y-2 max-h-[380px]">
              {chat.length === 0 && <p className="text-xs text-farmly-muted text-center py-10">Enter a farmer's mobile number and start a call.</p>}
              {chat.map((line, i) => (
                <div key={i} className={`flex ${line.role === "caller" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${line.role === "caller" ? "bg-farmly-primary text-white" : "bg-farmly-surface-elevated text-farmly-foreground border border-farmly-border"}`}>
                    <div className="flex items-start gap-2">
                      <span className="whitespace-pre-wrap">{line.text}</span>
                      {line.audioUrl && (
                        <button type="button" aria-label="Play" onClick={() => new Audio(ivrAudioUrl(line.audioUrl!)).play()} className="shrink-0 text-farmly-accent">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {line.english && line.english !== line.text && <div className="mt-1 text-[10px] opacity-70 italic">{line.english}</div>}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {simError && <p className="mt-2 text-[11px] text-red-600 dark:text-red-400">{simError}</p>}

            {sim && !sim.end ? (
              <div className="mt-3 space-y-2">
                <form onSubmit={submitAnswer} className="flex gap-2">
                  <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={sim.expect === "mobile" ? "Type the 10-digit mobile number" : "Type what the farmer says (any language) or a key"}
                    disabled={recording}
                  />
                  <Button type="submit" size="icon" disabled={busy || !answer.trim()} aria-label="Send">
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant={recording ? "accent" : "outline"}
                    onClick={toggleMic}
                    disabled={busy || !config?.speechConfigured}
                    title={config?.speechConfigured ? "Speak the answer" : "Voice input needs SARVAM_API_KEY"}
                    aria-label="Record answer"
                  >
                    {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </form>
                <div className="flex flex-wrap gap-1.5">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
                    <button key={d} type="button" disabled={busy} onClick={() => send({ digits: d }, `[keypad ${d}]`)} className="w-8 h-8 rounded-lg border border-farmly-border text-xs font-semibold text-farmly-foreground hover:bg-farmly-surface-elevated">
                      {d}
                    </button>
                  ))}
                  <button type="button" disabled={busy} onClick={() => send({ noInput: true }, "[silence]")} className="px-2.5 h-8 rounded-lg border border-farmly-border text-[11px] text-farmly-muted hover:bg-farmly-surface-elevated">
                    Silence
                  </button>
                </div>
              </div>
            ) : (
              sim?.end && (
                <div className="mt-3 flex items-center gap-2 text-xs text-farmly-muted">
                  <PhoneOff className="w-4 h-4" /> Call ended. See the session on the right.
                </div>
              )
            )}
          </Card>

          {/* Sessions */}
          <div className="space-y-4">
            <Card className="bg-farmly-surface border-farmly-border p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-farmly-border text-sm font-bold text-farmly-foreground">Recent calls</div>
              <div className="max-h-[260px] overflow-y-auto divide-y divide-farmly-border">
                {sessions.length === 0 && <p className="text-xs text-farmly-muted p-4">No calls yet.</p>}
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-farmly-surface-elevated ${s.id === selectedId ? "bg-farmly-surface-elevated" : ""}`}
                  >
                    {s.source === "twilio" ? <PhoneIncoming className="w-4 h-4 text-farmly-accent shrink-0" /> : <FlaskConical className="w-4 h-4 text-farmly-muted shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-farmly-foreground truncate">
                        {s.farmer?.name || s.registration?.name || s.phone}{" "}
                        {s.submissions.length
                          ? `· ${s.submissions.filter((x) => x.status === "registered").map((x) => KIND_LABEL[x.kind]).join(", ") || "registration failed"}`
                          : s.task === "register"
                            ? "· registering farmer"
                            : s.fields.crop
                              ? `· ${s.fields.crop}`
                              : ""}
                      </div>
                      <div className="text-[11px] text-farmly-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(s.createdAt).toLocaleString()} · {s.source === "twilio" ? "Phone call" : "Simulated"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={s.status} />
                      {s.batchId && <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">{s.batchId}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {selected && (
              <Card className="bg-farmly-surface border-farmly-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-farmly-foreground">{selected.farmer?.name || "Unidentified caller"}</div>
                    <div className="text-[11px] text-farmly-muted">
                      {selected.phone} · {selected.farmer?.registryId || "not registered"} · {selected.language || "language not chosen"}
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {selected.submissions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-farmly-muted">Registrations on this call</div>
                    {selected.submissions.map((sub) => (
                      <SubmissionRow key={sub.key} sub={sub} busy={busy} onRetry={() => retry(selected.id, sub.key)} canRetry={selected.status !== "in_progress"} />
                    ))}
                  </div>
                )}

                {(selected.task === "register" || (!selected.farmer && Object.keys(selected.registration || {}).length > 0)) && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-farmly-muted mb-1">Farmer registration (collecting)</div>
                    <RegistrationList reg={selected.registration} />
                  </div>
                )}

                {(selected.task === "lot" || selected.task === "availability") && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-farmly-muted mb-1">
                      {selected.task === "lot" ? "Crop lot" : "Upcoming harvest"} (collecting)
                    </div>
                    <FieldList fields={selected.fields} availability={selected.task === "availability"} />
                    {missing.length > 0 && selected.status !== "in_progress" && (
                      <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">Missing: {missing.map((m) => m.label).join(", ")}</p>
                    )}
                  </div>
                )}
                {selected.callbackRequested && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 flex gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" /> Call back {selected.phone}: {selected.callbackReason}
                  </p>
                )}
                {selected.lastError && <p className="text-[11px] text-red-600 dark:text-red-400">Last error: {selected.lastError}</p>}


                <details className="text-xs">
                  <summary className="cursor-pointer text-farmly-muted">Transcript ({selected.turns.length} turns)</summary>
                  <ol className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                    {selected.turns.map((turn, i) => (
                      <li key={i} className={turn.role === "agent" ? "text-farmly-foreground" : "text-farmly-accent"}>
                        <span className="font-semibold">{turn.role === "agent" ? "Agent" : "Caller"}:</span> {turn.text}
                        {turn.english && turn.english !== turn.text && <span className="text-farmly-muted italic"> — {turn.english}</span>}
                      </li>
                    ))}
                  </ol>
                </details>
              </Card>
            )}

            {config && (
              <Card className="bg-farmly-surface border-farmly-border p-4">
                <div className="text-sm font-bold text-farmly-foreground mb-2">Languages</div>
                <div className="flex flex-wrap gap-1.5">
                  {config.languages.map((l) => (
                    <span
                      key={l.code}
                      title={l.note || undefined}
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${l.support === "full" ? "border-farmly-border text-farmly-foreground" : "border-amber-500/30 text-amber-700 dark:text-amber-300"}`}
                    >
                      {l.nativeName} {l.support === "partial" ? "(partial)" : ""}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
