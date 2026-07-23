"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, ArrowRight, Building2, PenLine, DollarSign,
  Plus, Trash2, CheckCircle, Sparkles, Shield,
  Wallet, Upload,
} from "lucide-react";
import { saveOnboarding, type OnboardingForecastSummary } from "@/app/app/onboarding/actions";

const display: React.CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

// ── TYPES ────────────────────────────────────────────────────────────────────

type IncomePatternValue = "regular" | "variable" | "mixed";
interface IncomeItem { id: number; name: string; amount: string; frequency: string; nextDate: string | null; kind: "regular" | "variable"; earliestDate?: string | null; latestDate?: string | null; confidence?: "certain" | "likely" | "possible" }
interface BillItem   { id: number; name: string; amount: string; frequency: string; nextDate: string | null }

// ── HELPERS ──────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 8;

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / (TOTAL_STEPS - 1)) * 100);
  return (
    <div className="w-full h-0.5 bg-border rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StepShell({
  step, onBack, children,
}: {
  step: number;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const navigate = router.push;
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="px-5 py-4 flex items-center justify-between max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <TrendingUp size={11} className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm" style={display}>FlowSight</span>
        </div>
        <button
          onClick={() => navigate("/app/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </header>

      {/* Progress */}
      <div className="px-5 max-w-xl mx-auto w-full mb-1">
        <ProgressBar step={step} />
        <p className="text-[10px] text-muted-foreground mt-1.5 text-right" style={mono}>
          {step + 1} / {TOTAL_STEPS}
        </p>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Back */}
      {onBack && step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="px-5 pb-6 flex justify-center">
          <button
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

function PrimaryButton({
  onClick, disabled, loading, children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading
        ? <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
        : children}
    </button>
  );
}

// ── STEP SCREENS ─────────────────────────────────────────────────────────────

// 0 — Welcome
function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl" />
          <div className="relative w-20 h-20 rounded-3xl bg-card border border-border flex items-center justify-center shadow-2xl">
            <TrendingUp size={32} className="text-primary" />
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-[38px] font-medium tracking-tight leading-[1.1] mb-3" style={display}>
          Know what&apos;s coming<br />
          <span className="text-accent">before it arrives.</span>
        </h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed max-w-sm mx-auto">
          Answer a few quick questions and we&apos;ll build your first 30-day cash flow forecast in under 2 minutes.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "2 min", label: "to set up" },
          { value: "30 days", label: "forecast range" },
          { value: "Clear", label: "day-by-day view" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-card border border-border rounded-xl py-3 px-2 text-center">
            <p className="text-base font-bold text-foreground" style={mono}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onNext}>
        Build my forecast <ArrowRight size={15} />
      </PrimaryButton>

      <p className="text-xs text-muted-foreground">No credit card. Free during beta.</p>
    </div>
  );
}

// 1 — Choose data source
function ChooseSource({
  value, onChange, onNext,
}: {
  value: "csv" | "manual" | null;
  onChange: (v: "csv" | "manual") => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 1 of 7</p>
        <h2 className="text-[30px] font-medium tracking-tight mb-2" style={display}>
          How do you want to get started?
        </h2>
        <p className="text-sm text-muted-foreground">
          Import a CSV from your bank, or enter the essentials yourself. No bank connection required.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            id: "csv" as const,
            icon: Upload,
            title: "Import a CSV",
            desc: "The quickest way to get started. Upload a transaction file from your bank and we’ll help organize what’s inside.",
            badge: "Recommended",
            badgeColor: "bg-accent/15 text-accent",
          },
          {
            id: "manual" as const,
            icon: PenLine,
            title: "Enter manually",
            desc: "Prefer to keep it simple? Add your current balance, next paycheck, and upcoming bills yourself.",
            badge: null,
            badgeColor: "",
          },
        ].map(({ id, icon: Icon, title, desc, badge, badgeColor }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-150 ${
              value === id
                ? "border-primary/40 bg-primary/8"
                : "border-border hover:border-border/60"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${value === id ? "bg-primary/20" : "bg-muted"}`}>
                <Icon size={17} className={value === id ? "text-primary" : "text-muted-foreground"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  {badge && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${value === id ? "border-primary" : "border-border"}`}>
                {value === id && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button disabled className="w-full text-left px-5 py-4 rounded-2xl border border-border opacity-60 cursor-not-allowed">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted"><Building2 size={17} className="text-muted-foreground" /></div>
          <div><p className="text-sm font-semibold">Connect your bank — Premium, coming later</p><p className="text-xs text-muted-foreground mt-0.5">Automatically keep your balance and transactions up to date.</p></div>
        </div>
      </button>

      {value === "csv" && (
        <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl px-4 py-3">
          <Shield size={13} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Private and connection-free. You’ll map the columns, review every transaction, and confirm recurring activity before it enters your forecast.
          </p>
        </div>
      )}

      <PrimaryButton onClick={onNext} disabled={!value}>
        Continue <ArrowRight size={15} />
      </PrimaryButton>
    </div>
  );
}

// 2 — Income pattern
function IncomePattern({ value, onChange, onNext }: { value: IncomePatternValue | null; onChange: (value: IncomePatternValue) => void; onNext: () => void }) {
  const options: Array<{ value: IncomePatternValue; label: string }> = [
    { value: "regular", label: "Regular paycheck" },
    { value: "variable", label: "Variable or irregular income" },
    { value: "mixed", label: "A mix of both" },
  ];
  return <div className="space-y-6"><div><p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 2 of 7</p><h2 className="text-[30px] font-medium tracking-tight" style={display}>How does money usually come in?</h2></div><div className="space-y-2.5">{options.map((option) => <button type="button" key={option.value} onClick={() => onChange(option.value)} className={`w-full rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all ${value === option.value ? "border-primary bg-primary/[0.08]" : "border-border hover:border-primary/30"}`}>{option.label}</button>)}</div><PrimaryButton onClick={onNext} disabled={!value}>Continue <ArrowRight size={15} /></PrimaryButton></div>;
}

// 3 — Current balance
function CurrentBalance({
  value, onChange, onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const numeric = parseFloat(value.replace(/,/g, "")) || 0;

  const handleChange = (raw: string) => {
    const clean = raw.replace(/[^0-9.]/g, "");
    onChange(clean);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 3 of 7</p>
        <h2 className="text-[30px] font-medium tracking-tight mb-2" style={display}>
          What&apos;s your current balance?
        </h2>
        <p className="text-sm text-muted-foreground">
          Your main checking account balance right now.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4" style={mono}>Checking balance</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[40px] font-bold text-muted-foreground" style={mono}>$</span>
          <input
            ref={inputRef}
            type="number"
            min="0"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="0"
            className="text-[48px] font-extrabold text-foreground bg-transparent border-none outline-none w-full text-center placeholder:text-border [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={mono}
          />
        </div>
        {numeric > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {numeric.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["1000", "2500", "5000", "10000"].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              value === v ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
            style={mono}
          >
            ${parseInt(v).toLocaleString()}
          </button>
        ))}
      </div>

      <PrimaryButton onClick={onNext} disabled={!value || numeric <= 0}>
        Continue <ArrowRight size={15} />
      </PrimaryButton>
    </div>
  );
}

// 3 — Recurring income
function RecurringIncome({
  items, pattern, onAdd, onRemove, onNext,
}: {
  items: IncomeItem[];
  pattern: IncomePatternValue;
  onAdd: (item: IncomeItem) => void;
  onRemove: (id: number) => void;
  onNext: () => void;
}) {
  const [name, setName] = useState("Monthly salary");
  const [amount, setAmount] = useState("");
  const [freq, setFreq] = useState("Monthly");
  const [nextDate, setNextDate] = useState("");
  const [kind, setKind] = useState<"regular" | "variable">(pattern === "variable" ? "variable" : "regular");
  const [showRange, setShowRange] = useState(false);
  const [earliestDate, setEarliestDate] = useState("");
  const [latestDate, setLatestDate] = useState("");
  const [confidence, setConfidence] = useState<"certain" | "likely" | "possible">("likely");
  const [adding, setAdding] = useState(items.length === 0);

  const handleAdd = () => {
    if (!name || !amount) return;
    onAdd({ id: Date.now(), name, amount, frequency: freq, nextDate: nextDate || null, kind, earliestDate: kind === "variable" ? earliestDate || null : null, latestDate: kind === "variable" ? latestDate || null : null, confidence: kind === "variable" ? confidence : undefined });
    setName("");
    setAmount("");
    setNextDate("");
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 4 of 7</p>
        <h2 className="text-[30px] font-medium tracking-tight mb-2" style={display}>
          When does money come in?
        </h2>
        <p className="text-sm text-muted-foreground">
          Add your salary, freelance income, or any regular deposits.
        </p>
      </div>

      {pattern === "mixed" && <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1"><button type="button" onClick={() => setKind("regular")} className={`rounded-lg px-3 py-2 text-xs font-medium ${kind === "regular" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Regular paycheck</button><button type="button" onClick={() => setKind("variable")} className={`rounded-lg px-3 py-2 text-xs font-medium ${kind === "variable" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Variable income</button></div>}

      {/* Added items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-card border border-accent/20 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                <DollarSign size={14} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.frequency} · {item.nextDate ? `Next ${new Date(`${item.nextDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Date estimated"}</p>
              </div>
              <span className="text-sm font-semibold text-accent shrink-0" style={mono}>
                +${parseFloat(item.amount).toLocaleString()}
              </span>
              <button onClick={() => onRemove(item.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Income name (e.g. Monthly salary)"
            className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-muted border border-border rounded-xl pl-7 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {kind === "regular" && <select
              value={freq}
              onChange={(e) => setFreq(e.target.value)}
              className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
            >
              {["Weekly", "Bi-weekly", "Monthly", "Annual"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5" htmlFor="income-next-date">{kind === "variable" ? "Expected date" : "Next deposit date"} <span className="text-muted-foreground/60">(optional)</span></label>
            <input
              id="income-next-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">{kind === "variable" ? "FlowSight uses the expected date for the Phase 1 forecast." : "Not sure? Leave this blank and we’ll mark the timing as estimated."}</p>
          </div>
          {kind === "variable" && <><div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="income-confidence">How confident are you?</label><select id="income-confidence" value={confidence} onChange={(event) => setConfidence(event.target.value as typeof confidence)} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm"><option value="certain">Certain</option><option value="likely">Likely</option><option value="possible">Possible</option></select></div><button type="button" onClick={() => setShowRange((open) => !open)} className="text-xs text-primary hover:underline">{showRange ? "Hide date range" : "Add date range"}</button>{showRange && <div className="rounded-xl bg-muted/60 p-3 space-y-3"><p className="text-[11px] text-muted-foreground">FlowSight uses the expected date for now. The range helps improve your forecast over time.</p><div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-muted-foreground block mb-1">Earliest likely date</label><input type="date" value={earliestDate} onChange={(event) => setEarliestDate(event.target.value)} className="w-full bg-white border border-border rounded-lg px-2 py-2 text-xs" /></div><div><label className="text-[10px] text-muted-foreground block mb-1">Latest likely date</label><input type="date" value={latestDate} onChange={(event) => setLatestDate(event.target.value)} className="w-full bg-white border border-border rounded-lg px-2 py-2 text-xs" /></div></div></div>}</>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!name || !amount}
              className="flex-1 bg-primary/15 text-primary py-2.5 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
            >
              Add income
            </button>
            {items.length > 0 && (
              <button onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add another income source
        </button>
      )}

      <PrimaryButton onClick={onNext} disabled={items.length === 0 && !adding}>
        Continue <ArrowRight size={15} />
      </PrimaryButton>
      {items.length === 0 && (
        <button onClick={onNext} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          Skip for now
        </button>
      )}
    </div>
  );
}

// 4 — Recurring bills
function RecurringBills({
  items, onAdd, onRemove, onNext,
}: {
  items: BillItem[];
  onAdd: (item: BillItem) => void;
  onRemove: (id: number) => void;
  onNext: () => void;
}) {
  const [name, setName] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [freq, setFreq] = useState("Monthly");
  const [nextDate, setNextDate] = useState("");
  const [adding, setAdding] = useState(items.length === 0);

  const suggestions = ["Rent", "Netflix", "Spotify", "Internet", "Phone", "Gym"];

  const handleAdd = () => {
    if (!name || !amount) return;
    onAdd({ id: Date.now(), name, amount, frequency: freq, nextDate: nextDate || null });
    setName("");
    setAmount("");
    setNextDate("");
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 5 of 7</p>
        <h2 className="text-[30px] font-medium tracking-tight mb-2" style={display}>
          What goes out regularly?
        </h2>
        <p className="text-sm text-muted-foreground">
          Add rent, subscriptions, loan payments — anything predictable.
        </p>
      </div>

      {/* Suggestions */}
      {items.length === 0 && !adding && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setName(s); setAdding(true); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Added items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <DollarSign size={14} className="text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.frequency} · {item.nextDate ? `Next ${new Date(`${item.nextDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Date estimated"}</p>
              </div>
              <span className="text-sm font-semibold text-destructive shrink-0" style={mono}>
                –${parseFloat(item.amount).toLocaleString()}
              </span>
              <button onClick={() => onRemove(item.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bill name (e.g. Rent)"
            className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-muted border border-border rounded-xl pl-7 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <select
              value={freq}
              onChange={(e) => setFreq(e.target.value)}
              className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
            >
              {["Weekly", "Bi-weekly", "Monthly", "Annual"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5" htmlFor="bill-next-date">Next charge date <span className="text-muted-foreground/60">(optional)</span></label>
            <input
              id="bill-next-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">Don’t know your Netflix date? Leave this blank; the forecast will treat it as estimated.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!name || !amount}
              className="flex-1 bg-primary/15 text-primary py-2.5 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
            >
              Add bill
            </button>
            {items.length > 0 && (
              <button onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add another bill
        </button>
      )}

      <PrimaryButton onClick={onNext}>
        Continue <ArrowRight size={15} />
      </PrimaryButton>
      {items.length === 0 && (
        <button onClick={onNext} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          Skip for now
        </button>
      )}
    </div>
  );
}

// 5 — Safety buffer
function SafetyBuffer({
  value, onChange, onNext, saving, error,
}: {
  value: number;
  onChange: (v: number) => void;
  onNext: () => void | Promise<void>;
  saving: boolean;
  error: string | null;
}) {
  const presets = [
    { amount: 200, label: "Minimal", desc: "Just enough to avoid fees" },
    { amount: 500, label: "Standard", desc: "A small cushion for surprises" },
    { amount: 1000, label: "Comfortable", desc: "Recommended for most people" },
    { amount: 2000, label: "Conservative", desc: "Extra peace of mind" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 6 of 7</p>
        <h2 className="text-[30px] font-medium tracking-tight mb-2" style={display}>
          Set your safety buffer.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          FlowSight will alert you if your balance is forecast to drop below this amount. You can change this anytime.
        </p>
      </div>

      <div className="space-y-2.5">
        {presets.map(({ amount, label, desc }) => (
          <button
            key={amount}
            onClick={() => onChange(amount)}
            className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-150 flex items-center justify-between ${
              value === amount
                ? "border-primary/40 bg-primary/8"
                : "border-border hover:border-border/60"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-foreground" style={mono}>
                ${amount.toLocaleString()}
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${value === amount ? "border-primary" : "border-border"}`}>
                {value === amount && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <Wallet size={13} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your &ldquo;safe to spend&rdquo; amount will always reflect this buffer — so you&apos;re never caught off guard.
        </p>
      </div>

      {error && <p className="text-sm text-destructive text-center" role="alert">{error}</p>}
      <PrimaryButton onClick={onNext} disabled={!value} loading={saving}>
        Build my forecast <ArrowRight size={15} />
      </PrimaryButton>
    </div>
  );
}

// 7 — Forecast ready
function ForecastReady({
  forecast, onDashboard,
}: {
  forecast: OnboardingForecastSummary;
  onDashboard: () => void;
}) {
  const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
  const conditionLabel = forecast.condition === "update_needed" ? "Update Needed" : forecast.condition[0].toUpperCase() + forecast.condition.slice(1);

  return (
    <div className="space-y-7">
      <div className="text-center">
        <div className="relative inline-flex mb-5">
          <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-card border border-accent/30 flex items-center justify-center shadow-xl">
            <Sparkles size={26} className="text-accent" />
          </div>
        </div>
        <h2 className="text-[32px] font-medium tracking-tight mb-2" style={display}>
          Your forecast is ready.
        </h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s a preview of what FlowSight found.
        </p>
      </div>

      {/* Key stats */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {[
          { label: "Safe to spend", value: money(forecast.safeToSpendCents), color: "text-[hsl(var(--fs-green))]", note: "from your 30-day forecast" },
          { label: "Lowest projected balance", value: money(forecast.lowestBalanceCents), color: "text-foreground", note: new Date(`${forecast.lowestBalanceDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" }) },
          { label: "Condition", value: conditionLabel, color: forecast.condition === "clear" ? "text-[hsl(var(--fs-green))]" : forecast.condition === "watch" ? "text-[hsl(var(--fs-amber))]" : forecast.condition === "tight" ? "text-destructive" : "text-muted-foreground", note: "based on your buffer and upcoming activity" },
        ].map(({ label, value, color, note }) => (
          <div key={label} className="px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{note}</p>
            </div>
            <span className={`text-base font-bold ${color}`} style={mono}>{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 bg-accent/8 border border-accent/20 rounded-xl px-4 py-3">
        <CheckCircle size={14} className="text-accent shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Based on {forecast.confirmedEventCount} confirmed events and {forecast.estimatedEventCount} estimates.
        </p>
      </div>

      <p className="text-xs text-muted-foreground text-center">Your forecast updates as you add transactions or refresh your balance.</p>
      <div>
        <PrimaryButton onClick={onDashboard}>
          Go to my dashboard <ArrowRight size={15} />
        </PrimaryButton>
      </div>
    </div>
  );
}

// ── ORCHESTRATOR ─────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const navigate = router.push;
  const [step, setStep] = useState(0);

  const [source, setSource] = useState<"csv" | "manual" | null>(null);
  const [incomePattern, setIncomePattern] = useState<IncomePatternValue | null>(null);
  const [balance, setBalance] = useState("");
  const [income, setIncome] = useState<IncomeItem[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [buffer, setBuffer] = useState(1000);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [forecastSummary, setForecastSummary] = useState<OnboardingForecastSummary | null>(null);
  const timezoneRef = useRef("UTC");

  useEffect(() => { timezoneRef.current = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }, []);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const balanceNum = parseFloat(balance) || 0;

  const normalizeFrequency = (value: string) => {
    const normalized = value.toLowerCase().replace("-", "");
    if (normalized === "biweekly") return "biweekly" as const;
    if (normalized === "weekly") return "weekly" as const;
    if (normalized === "annual") return "annual" as const;
    return "monthly" as const;
  };

  const persistAndContinue = async () => {
    setSaving(true);
    setSaveError(null);
    const result = await saveOnboarding({
      balanceCents: Math.round(balanceNum * 100),
      safetyBufferCents: Math.round(buffer * 100),
      income: income.map((item) => ({
        name: item.name,
        amountCents: Math.round(parseFloat(item.amount) * 100),
        frequency: normalizeFrequency(item.frequency),
        nextDate: item.nextDate,
        kind: item.kind,
        earliestDate: item.earliestDate,
        latestDate: item.latestDate,
        confidence: item.confidence,
      })),
      bills: bills.map((item) => ({
        name: item.name,
        amountCents: Math.round(parseFloat(item.amount) * 100),
        frequency: normalizeFrequency(item.frequency),
        nextDate: item.nextDate,
      })),
      incomePattern: incomePattern ?? "regular",
      timezone: timezoneRef.current,
    });
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.message);
      return;
    }
    setForecastSummary(result.forecast);
    next();
  };

  const screen = (() => {
    switch (step) {
      case 0: return <Welcome onNext={next} />;
      case 1: return <ChooseSource value={source} onChange={setSource} onNext={source === "csv" ? () => navigate("/app/transactions?import=1") : next} />;
      case 2: return <IncomePattern value={incomePattern} onChange={setIncomePattern} onNext={next} />;
      case 3: return <CurrentBalance value={balance} onChange={setBalance} onNext={next} />;
      case 4: return (
        <RecurringIncome
          items={income}
          pattern={incomePattern ?? "regular"}
          onAdd={(item) => setIncome((p) => [...p, item])}
          onRemove={(id) => setIncome((p) => p.filter((i) => i.id !== id))}
          onNext={next}
        />
      );
      case 5: return (
        <RecurringBills
          items={bills}
          onAdd={(item) => setBills((p) => [...p, item])}
          onRemove={(id) => setBills((p) => p.filter((b) => b.id !== id))}
          onNext={next}
        />
      );
      case 6: return <SafetyBuffer value={buffer} onChange={setBuffer} onNext={persistAndContinue} saving={saving} error={saveError} />;
      case 7: return forecastSummary ? (
        <ForecastReady
          forecast={forecastSummary}
          onDashboard={() => navigate("/app/dashboard")}
        />
      ) : null;
      default: return null;
    }
  })();

  return (
    <StepShell step={step} onBack={back}>
      {screen}
    </StepShell>
  );
}
