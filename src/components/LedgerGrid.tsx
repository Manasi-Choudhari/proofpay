"use client";

import { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
  type ValueFormatterParams,
} from "ag-grid-community";
import type { LedgerEntry } from "@/lib/types";

ModuleRegistry.registerModules([AllCommunityModule]);

const theme = themeQuartz.withPart(colorSchemeDarkBlue).withParams({
  backgroundColor: "#0b1220",
  headerBackgroundColor: "#0f172a",
  accentColor: "#38bdf8",
  borderColor: "rgba(255,255,255,0.08)",
  fontFamily: "inherit",
  rowHoverColor: "rgba(56,189,248,0.06)",
});

const typeStyle: Record<string, string> = {
  Authorization: "bg-sky-500/15 text-sky-300",
  Capture: "bg-emerald-500/15 text-emerald-300",
  Void: "bg-amber-500/15 text-amber-300",
  Payout: "bg-violet-500/15 text-violet-300",
  Refused: "bg-rose-500/15 text-rose-300",
};

function TypePill(p: ICellRendererParams<LedgerEntry>) {
  if (!p.value) return null;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeStyle[p.value] ?? ""}`}>{p.value}</span>;
}

function ConfidenceBar(p: ICellRendererParams<LedgerEntry>) {
  if (p.value == null) return <span className="text-slate-600">-</span>;
  const pct = Math.round(p.value * 100);
  const refused = p.data?.type === "Refused";
  return (
    <div className="flex items-center gap-2 h-full" title={refused ? "Verifier's confidence that the work FAILED" : "Verifier's confidence that the work passed"}>
      <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${refused ? "bg-rose-400" : pct >= 70 ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs">{pct}%</span>
    </div>
  );
}

const money = (p: ValueFormatterParams<LedgerEntry, number>) => (p.value == null ? "" : `$${p.value.toFixed(2)}`);

const FILTERS = ["All", "Capture", "Refused", "Authorization", "Void", "Payout"] as const;

export default function LedgerGrid({ rows }: { rows: LedgerEntry[] }) {
  const gridRef = useRef<AgGridReact<LedgerEntry>>(null);
  const [quick, setQuick] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof FILTERS)[number]>("All");
  const [visible, setVisible] = useState(rows);

  const data = useMemo(() => (typeFilter === "All" ? rows : rows.filter((r) => r.type === typeFilter)), [rows, typeFilter]);

  const columns = useMemo<ColDef<LedgerEntry>[]>(
    () => [
      {
        field: "at",
        headerName: "Time",
        width: 170,
        sort: "desc",
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : ""),
        filter: "agDateColumnFilter",
      },
      { field: "type", headerName: "Type", width: 140, cellRenderer: TypePill, filter: true },
      {
        field: "amount",
        headerName: "Amount",
        width: 120,
        type: "rightAligned",
        valueFormatter: money,
        filter: "agNumberColumnFilter",
        cellClass: (p) => (p.data?.type === "Refused" ? "line-through text-rose-300" : ""),
      },
      { field: "source", headerName: "Source", width: 140, filter: true },
      { field: "sourceTitle", headerName: "Job / mission", flex: 1, minWidth: 200, filter: true },
      { field: "counterparty", headerName: "Counterparty", width: 200, filter: true },
      { field: "aiConfidence", headerName: "Verifier confidence", width: 170, cellRenderer: ConfidenceBar, filter: "agNumberColumnFilter" },
      {
        field: "paypalRef",
        headerName: "PayPal ID",
        width: 190,
        cellClass: "font-mono text-xs",
        valueFormatter: (p) => (p.node?.rowPinned ? "" : (p.value ?? "(none, nothing charged)")),
      },
      { field: "note", headerName: "Note", flex: 1, minWidth: 220, tooltipField: "note" },
    ],
    [],
  );

  const totals = useMemo(() => {
    const sum = (t: string) => visible.filter((r) => r.type === t).reduce((s, r) => s + r.amount, 0);
    return {
      captured: sum("Capture"),
      refused: sum("Refused"),
      voided: sum("Void"),
      authorized: sum("Authorization"),
    };
  }, [visible]);

  const pinnedBottom = useMemo<Partial<LedgerEntry>[]>(
    () => [{ type: "Capture", amount: totals.captured, sourceTitle: "Total released after verification", note: `${visible.length} rows shown` }],
    [totals, visible.length],
  );

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          ["Authorized (held)", totals.authorized, "text-sky-300"],
          ["Released to workers & agents", totals.captured, "text-emerald-300"],
          ["Refused, $0 paid", totals.refused, "text-rose-300"],
          ["Voided back to payers", totals.voided, "text-amber-300"],
        ].map(([label, value, tone]) => (
          <div key={label as string} className="card !p-4">
            <div className="text-xs text-slate-400">{label}</div>
            <div className={`mt-1 text-xl font-semibold ${tone}`}>${(value as number).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input className="input !w-72" placeholder="Search everything…" value={quick} onChange={(e) => setQuick(e.target.value)} />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs ${typeFilter === f ? "bg-sky-500 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          className="btn-ghost ml-auto"
          onClick={() => gridRef.current?.api.exportDataAsCsv({ fileName: "proofpay-ledger.csv" })}
        >
          Export CSV
        </button>
      </div>

      <div style={{ height: 560 }}>
        <AgGridReact<LedgerEntry>
          ref={gridRef}
          theme={theme}
          rowData={data}
          columnDefs={columns}
          quickFilterText={quick}
          pinnedBottomRowData={pinnedBottom as LedgerEntry[]}
          defaultColDef={{ sortable: true, resizable: true, floatingFilter: false }}
          animateRows
          pagination
          paginationPageSize={20}
          paginationPageSizeSelector={[20, 50, 100]}
          tooltipShowDelay={300}
          overlayNoRowsTemplate="No PayPal activity yet. Fund a job or mission to see it here."
          onModelUpdated={(e) => {
            const shown: LedgerEntry[] = [];
            e.api.forEachNodeAfterFilter((n) => n.data && shown.push(n.data));
            setVisible((prev) =>
              prev.length === shown.length && prev.every((r, i) => r.id === shown[i]?.id) ? prev : shown,
            );
          }}
        />
      </div>
    </div>
  );
}
