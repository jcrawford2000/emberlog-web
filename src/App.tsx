import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, Filter, Info, MapPin, Search, Shield } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { addIncidentDedupeCap } from "./lib/incidentList";
import { openIncidentStream, type LiveState } from "./lib/sse";
import type { Incident } from "./types/emberlogTypes";


// --- Types -----------------------------------------------------------------

//type Incident = {
//  id: number;
//  dispatched_at: string; // ISO in UTC
//  incident_type: string;
//  address: string; // freeform street + city
//  units: string[];
//  channel: string; // e.g., "PRWC G" or numeric
//  source_audio?: string; // URL/path
//  transcript?: string;
//};

// --- Mock Data (replace with API later) ------------------------------------

const MOCK: Incident[] = [
  {
    id: 101,
    dispatched_at: "2025-09-29T02:18:45Z",
    incident_type: "STRUCTURE FIRE",
    address: "1234 W Camelback Rd, Phoenix, AZ",
    units: ["E12", "L9", "R12", "BC1"],
    channel: "PRWC G",
    source_audio: "/audio/2025-09-29/101.wav",
    transcript:
      "E12, L9, R12, Battalion 1, respond to a reported structure fire, 1234 West Camelback Road.",
  },
  {
    id: 102,
    dispatched_at: "2025-09-29T03:05:09Z",
    incident_type: "MEDICAL",
    address: "2401 E Van Buren St, Phoenix, AZ",
    units: ["R1", "E1"],
    channel: "PRWC J",
    source_audio: "/audio/2025-09-29/102.wav",
    transcript:
      "Rescue 1, Engine 1, respond to medical, 2401 East Van Buren Street, patient breathing difficulty.",
  },
  {
    id: 103,
    dispatched_at: "2025-09-29T04:22:12Z",
    incident_type: "MVA",
    address: "I-10 & 7th Ave, Phoenix, AZ",
    units: ["E3", "R3"],
    channel: "MCSO White Tanks",
    source_audio: "/audio/2025-09-29/103.wav",
    transcript:
      "Engine 3, Rescue 3, motor vehicle accident, I-10 at 7th Avenue, two vehicles, unknown injuries.",
  },
];

// --- Utilities -------------------------------------------------------------

function toLocalDisplay(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

function mapsLink(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// --- API client stub -------------------------------------------------------

async function fetchIncidents(query: string): Promise<Incident[]> {
  await new Promise((r) => setTimeout(r, 200));
  const q = query.trim().toLowerCase();
  if (!q) return MOCK;
  return MOCK.filter((i) => {
    const hay = [
      i.incident_type,
      i.address,
      i.channel,
      i.units.join(" "),
      i.transcript ?? "",
      toLocalDisplay(i.dispatched_at),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

// --- Components ------------------------------------------------------------

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="pill">{children}</span>;
}

function RowExpand({ incident }: { incident: Incident }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-alt/40 border-t border-border"
    >
      <div className="p-4 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-2">
          <div className="text-sm font-semibold">Transcript</div>
          <div className="text-sm whitespace-pre-wrap leading-relaxed text-body">
            {incident.transcript || "No transcript available."}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">Audio</div>
          {incident.source_audio ? (
            <audio controls preload="none" className="w-full">
              <source src={incident.source_audio} />
            </audio>
          ) : (
            <div className="text-sm text-muted">No audio file.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function EmberlogApp() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  //const [results, setResults] = useState<Incident[]>(MOCK);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [ live, setLive ] = useState<LiveState>("connecting");
  const [ incidents, setIncidents ] = useState<Incident[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchIncidents(query).then((data) => {
      if (!active) return;
      if (data) {
        console.log("dummy")
      }
      //setResults(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [query]);

  const incidentTypes = useMemo(() => {
    const s = new Set(incidents.map((r) => r.incident_type));
    return ["ALL", ...Array.from(s).sort()];
  }, [incidents]);

  useEffect(() => {
    const stop = openIncidentStream({
      onStatus: setLive,
      onIncident: (json) => {
        try {
          const incoming = JSON.parse(json) as Incident;
          setIncidents((prev) => addIncidentDedupeCap(incoming, prev, 200));
        }
        catch (e) {
          console.warn("Bad incident JSON from SSE:", e, json);
        }
      },
    });
    return stop;
  }, []);



  const filtered = useMemo(() => {
    return typeFilter === "ALL"
      ? incidents
      : incidents.filter((r) => r.incident_type === typeFilter);
  }, [incidents, typeFilter]);

  return (
    <div className="min-h-screen bg-surface text-primary-text">
      {/* Top Banner */}
      <header className="sticky top-0 z-20 backdrop-blur bg-engine ">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-15 rounded-2xl text-white grid place-items-center shadow">
                <AudioLines className="h-10 w-15 bg-safety rounded-2xl" />
              </div>
              <div className="font-bold tracking-wide text-2xl text-white">Emberlog</div>
            </div>
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-2 text-xs text-white/80">
              <Shield className="h-4 w-4" />
              <span>Status: {live}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Search + Filters Row */}
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incident type, address, unit, channel, time…"
              className="input-ember w-full px-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3 py-2">
              <Filter className="h-4 w-4" />
              <select
                className="bg-transparent focus:outline-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {incidentTypes.map((t) => (
                  <option key={t} value={t} className="text-body">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="card-surface overflow-hidden">
          <div className="border-b border-border bg-alt/40 px-4 py-3 flex items-center justify-between">
            <div className="font-semibold text-body">Latest Dispatches</div>
            <div className="text-sm text-muted">
              {loading ? "Loading…" : `${filtered.length} results`}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="text-left px-4 py-2">Date/Time</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Address</th>
                  <th className="text-left px-4 py-2">Channel</th>
                  <th className="text-left px-4 py-2">Units</th>
                  <th className="text-right px-4 py-2">Info</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc) => {
                  const isOpen = !!expanded[inc.id];
                  return (
                    <React.Fragment key={inc.id}>
                      <tr className="hover:bg-black/5">
                        <td className="px-4 py-2 align-top whitespace-nowrap">
                          {toLocalDisplay(inc.dispatched_at)}
                        </td>
                        <td className="px-4 py-2 align-top font-medium text-[--color-engine]">
                          {inc.incident_type}
                        </td>
                        <td className="px-4 py-2 align-top">
                          <a
                            href={mapsLink(inc.address)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:decoration-solid"
                          >
                            <MapPin className="h-4 w-4" /> {inc.address}
                          </a>
                        </td>
                        <td className="px-4 py-2 align-top">{inc.channel}</td>
                        <td className="px-4 py-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            {inc.units.map((u) => (
                              <Pill key={u}>{u}</Pill>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 align-top text-right">
                          <button
                            onClick={() =>
                              setExpanded((s) => ({ ...s, [inc.id]: !s[inc.id] }))
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-black/20 px-2 py-1 hover:bg-[--color-brass]/20"
                            aria-expanded={isOpen}
                            aria-controls={`expand-${inc.id}`}
                          >
                            <Info className="h-4 w-4" />
                            <span className="hidden sm:inline">Details</span>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={6} className="p-0">
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <RowExpand incident={inc} key={`exp-${inc.id}`} />
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-white/60">
                      No incidents match your search. Try a broader query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-xs text-white/70 text-center py-6">
          Phoenix area data. Emberlog theme colors applied.
        </footer>
      </main>
    </div>
  );
}
