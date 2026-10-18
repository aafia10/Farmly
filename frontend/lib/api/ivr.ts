import { backendClient } from "@/lib/api/backendClient";

// Mirrors backend/src/controllers/ivrController.ts (phone crop registration).

export interface IvrFields {
  crop?: string;
  variety?: string | null;
  quantity?: number;
  unit?: "kg" | "quintals" | "tonnes";
  harvestDate?: string;
  harvested?: boolean;
  location?: string;
}

export interface IvrTurn {
  at: string;
  role: "agent" | "caller";
  text: string;
  english?: string;
  language?: string;
  digits?: string;
}

export interface IvrSession {
  id: string;
  source: "twilio" | "simulator";
  phone: string;
  status: "in_progress" | "completed" | "failed" | "callback" | "ended" | "transferred" | "abandoned";
  step: string;
  language: string | null;
  farmer: { registryId: string; name: string } | null;
  fields: IvrFields;
  outcome: string | null;
  batchId: string | null;
  callbackRequested: boolean;
  callbackReason: string | null;
  lastError: string | null;
  helperName: string | null;
  canRetry: boolean;
  turns: IvrTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface IvrPrompt {
  text: string;
  english: string;
  language: string;
  audioUrl: string | null;
}

export interface IvrTurnResult {
  session: IvrSession;
  say: IvrPrompt[];
  expect: "speech" | "mobile" | "none";
  end: boolean;
}

export interface IvrConfig {
  speechConfigured: boolean;
  twilioConfigured: boolean;
  twilioNumber: string | null;
  languages: { code: string; name: string; nativeName: string; support: "full" | "partial"; note: string | null }[];
}

export type IvrInput = { text: string } | { digits: string } | { noInput: true } | { audioBase64: string; mimeType: string };

/** Absolute URL for prompt audio served by the backend. */
export function ivrAudioUrl(path: string): string {
  return backendClient.apiBaseUrl().replace(/\/api\/v1\/?$/, "") + path;
}

export const ivrApi = {
  config: () => backendClient.fetchApi<IvrConfig>("/ivr/config"),
  sessions: () => backendClient.fetchApi<IvrSession[]>("/ivr/sessions"),
  session: (id: string) => backendClient.fetchApi<IvrSession>(`/ivr/sessions/${id}`),
  retry: (id: string) => backendClient.fetchApi<IvrSession>(`/ivr/sessions/${id}/retry`, { method: "POST" }),
  startSimulation: (callerNumber: string) =>
    backendClient.fetchApi<IvrTurnResult>("/ivr/sim/sessions", { method: "POST", body: JSON.stringify({ callerNumber }) }),
  sendTurn: (id: string, input: IvrInput) =>
    backendClient.fetchApi<IvrTurnResult>(`/ivr/sim/sessions/${id}/turn`, { method: "POST", body: JSON.stringify(input) }),
};
