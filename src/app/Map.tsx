import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { FileText, MapPin, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { listReports } from "../lib/firebaseReports";
import { Report } from "../types/report";
import { IssueTypeBadge, StatusBadge } from "../components/ui/Badges";

type MapReport = Report & {
  lat?: number;
  lng?: number;
  latitude?: number | string;
  longitude?: number | string;
  imageDataUrlPreview?: string;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function hasValidLocation(report: MapReport) {
  const lat = toNumber(report.lat);
  const lng = toNumber(report.lng);

  if (lat === undefined || lng === undefined) return false;
  if (lat === 0 && lng === 0) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;

  return true;
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function imageSrc(report: MapReport) {
  return report.imageUrl || report.imageDataUrlPreview || "";
}

function getMarkerIcon(report: MapReport, active: boolean) {
  const priority = report.priorityScore ?? 0;

  let color = "#2563EB";
  let glow = "rgba(37,99,235,0.22)";

  if (report.status === "resolved") {
    color = "#16A34A";
    glow = "rgba(22,163,74,0.22)";
  } else if (
    report.safetyRisk === "critical" ||
    report.safetyRisk === "high" ||
    priority >= 70
  ) {
    color = "#EF4444";
    glow = "rgba(239,68,68,0.24)";
  } else if (report.safetyRisk === "medium" || priority >= 45) {
    color = "#FACC15";
    glow = "rgba(250,204,21,0.32)";
  }

  return L.divIcon({
    className: "civiclens-marker",
    html: `
      <div style="
        width:${active ? "30px" : "24px"};
        height:${active ? "30px" : "24px"};
        border-radius:9999px;
        background:${color};
        border:3px solid white;
        box-shadow:0 0 0 ${active ? "8px" : "4px"} ${glow}, 0 14px 24px rgba(15,23,42,0.18);
        transition:all 180ms ease;
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function MapController({
  reports,
  activeReport,
}: {
  reports: MapReport[];
  activeReport: MapReport | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (activeReport && hasValidLocation(activeReport)) {
      map.flyTo([activeReport.lat!, activeReport.lng!], 15, {
        duration: 0.65,
      });
      return;
    }

    if (reports.length === 1) {
      map.setView([reports[0].lat!, reports[0].lng!], 14);
      return;
    }

    if (reports.length > 1) {
      const bounds = L.latLngBounds(
        reports.map((r) => [r.lat!, r.lng!] as [number, number])
      );

      map.fitBounds(bounds, {
        padding: [42, 42],
        maxZoom: 14,
      });
    }
  }, [reports, activeReport, map]);

  return null;
}

function PhotoPreview({
  report,
  className = "",
}: {
  report: MapReport;
  className?: string;
}) {
  const src = imageSrc(report);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
      >
        <FileText className="h-6 w-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={safeText(report.title, "Civic case photo")}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}

function EmptyMap() {
  return (
    <div className="flex h-full min-h-[360px] w-full items-center justify-center bg-slate-100 p-5 text-center">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <MapPin className="mx-auto mb-3 h-9 w-9 text-slate-300" />
        <p className="text-sm font-semibold leading-6 text-slate-700">
          Reports with precise locations will appear on the civic map.
        </p>
      </div>
    </div>
  );
}

function LoadingMap() {
  return (
    <div className="flex h-full min-h-[360px] w-full items-center justify-center bg-slate-100">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}

function CivicMap({
  reports,
  activeReport,
  onSelect,
}: {
  reports: MapReport[];
  activeReport: MapReport | null;
  onSelect: (report: MapReport) => void;
}) {
  if (reports.length === 0) return <EmptyMap />;

  const center: [number, number] =
    activeReport && hasValidLocation(activeReport)
      ? [activeReport.lat!, activeReport.lng!]
      : [reports[0].lat!, reports[0].lng!];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full min-h-[360px] w-full"
    >
      <MapController reports={reports} activeReport={activeReport} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {reports.map((report) => {
        const title = safeText(report.title, "Civic case");
        const address = safeText(report.address, "Location details unavailable");

        return (
          <Marker
            key={report.id}
            position={[report.lat!, report.lng!]}
            icon={getMarkerIcon(report, activeReport?.id === report.id)}
            eventHandlers={{ click: () => onSelect(report) }}
          >
            <Popup maxWidth={280} className="civiclens-popup">
              <div className="w-[260px] max-w-[calc(100vw-48px)] overflow-hidden rounded-2xl bg-white">
                <div className="relative h-28 w-full bg-slate-100">
                  <PhotoPreview report={report} className="h-full w-full" />
                  <div className="absolute left-2 top-2">
                    <StatusBadge status={report.status} />
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="mb-1 line-clamp-2 break-words text-sm font-bold leading-snug text-slate-950">
                    {title}
                  </h4>

                  <p className="mb-3 flex items-start gap-1.5 text-xs text-slate-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-2 break-words">{address}</span>
                  </p>

                  <Link
                    to={`/issues/${report.id}`}
                    className="block w-full rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-bold text-white transition-colors hover:bg-blue-700"
                  >
                    View Case
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

function CaseCard({
  report,
  active,
  onFocus,
  hasLocation,
}: {
  key?: React.Key;
  report: MapReport;
  active?: boolean;
  onFocus?: () => void;
  hasLocation?: boolean;
}) {
  const title = safeText(report.title, "Civic case");
  const address = safeText(report.address, "Location details unavailable");

  return (
    <article
      onClick={hasLocation ? onFocus : undefined}
      className={[
        "w-full min-w-0 max-w-full overflow-hidden rounded-3xl border bg-white p-4 shadow-sm transition-all sm:p-5",
        hasLocation ? "cursor-pointer hover:border-blue-300 hover:shadow-md" : "",
        active ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-20 sm:w-20">
          <PhotoPreview report={report} className="h-full w-full" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 break-words text-sm font-bold leading-snug text-slate-950 sm:text-[15px]">
              {title}
            </h3>

            <div className="shrink-0">
              <StatusBadge status={report.status} />
            </div>
          </div>

          <p className="mb-3 flex min-w-0 items-start gap-1.5 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="line-clamp-2 min-w-0 break-words">{address}</span>
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <IssueTypeBadge type={report.issueType} />

            <Link
              to={`/issues/${report.id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-600"
            >
              View Case
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MapPage() {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<MapReport | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        const data = await listReports();

        const normalized = data.map((report: any) => ({
          ...report,
          lat: toNumber(report.lat ?? report.latitude),
          lng: toNumber(report.lng ?? report.longitude),
        }));

        if (mounted) setReports(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReports();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return reports
      .filter((r) => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterType !== "all" && r.issueType !== filterType) return false;

        if (!q) return true;

        return (
          safeText(r.title, "").toLowerCase().includes(q) ||
          safeText(r.address, "").toLowerCase().includes(q) ||
          safeText(r.description, "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const p = (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
        if (p !== 0) return p;

        const at = new Date((a as any).createdAt ?? 0).getTime();
        const bt = new Date((b as any).createdAt ?? 0).getTime();

        return bt - at;
      });
  }, [reports, searchQuery, filterStatus, filterType]);

  const validMapReports = useMemo(
    () => filteredReports.filter(hasValidLocation),
    [filteredReports]
  );

  const noLocationReports = useMemo(
    () => filteredReports.filter((r) => !hasValidLocation(r)),
    [filteredReports]
  );

  useEffect(() => {
    if (
      activeReport &&
      !validMapReports.some((report) => report.id === activeReport.id)
    ) {
      setActiveReport(null);
    }
  }, [activeReport, validMapReports]);

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-[#FFFDF7]">
      <style>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          font-family: inherit;
          z-index: 0;
        }

        .civiclens-marker {
          background: transparent;
          border: none;
        }

        .civiclens-popup .leaflet-popup-content-wrapper {
          max-width: calc(100vw - 32px);
          overflow: hidden;
          border-radius: 18px;
          padding: 0;
        }

        .civiclens-popup .leaflet-popup-content {
          width: auto !important;
          margin: 0;
        }

        .civiclens-popup .leaflet-popup-tip {
          background: white;
        }

        .leaflet-control-attribution {
          font-size: 10px;
        }
      `}</style>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Civic Map
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Track civic cases across your community.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:w-auto">
            <p className="text-sm font-bold text-slate-950">
              {filteredReports.length} Cases
            </p>
            <p className="text-xs text-slate-500">
              {validMapReports.length} mapped • {noLocationReports.length} without
              precise location
            </p>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search addresses or titles..."
                className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All Types</option>
              <option value="pothole">Pothole</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Streetlight</option>
              <option value="water_leakage">Water Leakage</option>
              <option value="drainage">Drainage</option>
              <option value="traffic">Traffic</option>
              <option value="other">Other</option>
            </select>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <div className="h-[360px] w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:h-[430px] md:h-[520px] lg:h-[calc(100vh-290px)] lg:min-h-[520px] xl:min-h-[640px]">
              {loading ? (
                <LoadingMap />
              ) : (
                <CivicMap
                  reports={validMapReports}
                  activeReport={activeReport}
                  onSelect={setActiveReport}
                />
              )}
            </div>
          </div>

          <aside className="min-w-0">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">Case List</h2>
                <p className="text-xs text-slate-500">
                  Select a mapped case to focus its location.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {validMapReports.length} mapped
              </span>
            </div>

            <div className="space-y-4 lg:max-h-[calc(100vh-330px)] lg:min-h-[520px] lg:overflow-y-auto lg:pr-1 xl:min-h-[640px]">
              {!loading &&
                validMapReports.length === 0 &&
                noLocationReports.length === 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">
                      No civic cases match the selected filters.
                    </p>
                  </div>
                )}

              {validMapReports.map((report) => (
                <CaseCard
                  key={report.id}
                  report={report}
                  active={activeReport?.id === report.id}
                  hasLocation
                  onFocus={() => setActiveReport(report)}
                />
              ))}

              {noLocationReports.length > 0 && (
                <section className="pt-2">
                  <div className="mb-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                    <p className="text-xs font-semibold leading-5 text-yellow-900">
                      {validMapReports.length === 0
                        ? "Reports with precise locations will appear on the civic map."
                        : "Some cases do not include precise map coordinates."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {noLocationReports.map((report) => (
                      <CaseCard key={report.id} report={report} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}