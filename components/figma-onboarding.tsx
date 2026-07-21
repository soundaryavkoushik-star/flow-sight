"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, ArrowRight, Building2, PenLine, DollarSign,
  Plus, Trash2, CheckCircle, Sparkles, Shield, ChevronRight,
  RefreshCw, Wallet, Upload,
} from "lucide-react";
import { saveOnboarding } from "@/app/app/onboarding/actions";

const display: React.CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

// ── TYPES ────────────────────────────────────────────────────────────────────

interface IncomeItem { id: number; name: string; amount: string; frequency: string; nextDate: string | null }
interface BillItem   { id: number; name: string; amount: string; frequency: string; nextDate: string | null }

// ── HELPERS ──────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9; // 0-indexed 0..8
const FORECAST_TASKS = [
  "Calculating monthly cash flow",
  "Checking upcoming income and bills",
  "Projecting 30-day balance",
  "Computing safe-to-spend",
  "Checking your safety buffer",
];

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
        <h1 className="text-[38px] font-extrabold tracking-tight leading-[1.1] mb-3" style={display}>
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
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 1 of 6</p>
        <h2 className="text-[30px] font-extrabold tracking-tight mb-2" style={display}>
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

// 2 — Current balance
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
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 2 of 6</p>
        <h2 className="text-[30px] font-extrabold tracking-tight mb-2" style={display}>
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
  items, onAdd, onRemove, onNext,
}: {
  items: IncomeItem[];
  onAdd: (item: IncomeItem) => void;
  onRemove: (id: number) => void;
  onNext: () => void;
}) {
  const [name, setName] = useState("Monthly salary");
  const [amount, setAmount] = useState("");
  const [freq, setFreq] = useState("Monthly");
  const [nextDate, setNextDate] = useState("");
  const [adding, setAdding] = useState(items.length === 0);

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
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 3 of 6</p>
        <h2 className="text-[30px] font-extrabold tracking-tight mb-2" style={display}>
          When does money come in?
        </h2>
        <p className="text-sm text-muted-foreground">
          Add your salary, freelance income, or any regular deposits.
        </p>
      </div>

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
            <label className="text-xs text-muted-foreground block mb-1.5" htmlFor="income-next-date">Next deposit date <span className="text-muted-foreground/60">(optional)</span></label>
            <input
              id="income-next-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">Not sure? Leave this blank and we’ll mark the timing as estimated.</p>
          </div>
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
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 4 of 6</p>
        <h2 className="text-[30px] font-extrabold tracking-tight mb-2" style={display}>
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
              <span className="text-sm font-semibold text-red-400 shrink-0" style={mono}>
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
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2" style={mono}>Step 5 of 6</p>
        <h2 className="text-[30px] font-extrabold tracking-tight mb-2" style={display}>
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

// 6 — Building forecast (animated)
function BuildingForecast({ onDone }: { onDone: () => void }) {
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  useEffect(() => {
    FORECAST_TASKS.forEach((_, i) => {
      setTimeout(() => {
        setCompletedTasks((prev) => [...prev, i]);
      }, 400 + i * 380);
    });
    const doneTimer = setTimeout(onDone, 400 + FORECAST_TASKS.length * 380 + 600);
    return () => clearTimeout(doneTimer);
  }, [onDone]);

  const progress = Math.round((completedTasks.length / FORECAST_TASKS.length) * 100);

  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-primary/15 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center">
            <RefreshCw size={28} className="text-primary animate-spin" style={{ animationDuration: "2s" }} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight mb-2" style={display}>
          Building your forecast…
        </h2>
        <p className="text-sm text-muted-foreground">This takes just a moment.</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right" style={mono}>{progress}%</p>
      </div>

      {/* Tasks */}
      <div className="space-y-2.5 text-left">
        {FORECAST_TASKS.map((task, i) => {
          const done = completedTasks.includes(i);
          const active = !done && completedTasks.length === i;
          return (
            <div key={task} className={`flex items-center gap-3 transition-opacity duration-300 ${i > completedTasks.length ? "opacity-30" : "opacity-100"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${done ? "bg-accent/20" : active ? "bg-primary/20" : "bg-muted"}`}>
                {done
                  ? <CheckCircle size={12} className="text-accent" />
                  : active
                  ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
              </div>
              <span className={`text-sm transition-colors ${done ? "text-muted-foreground" : active ? "text-foreground" : "text-muted-foreground/50"}`}>
                {task}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 7 — Forecast ready
function ForecastReady({
  balance, income, bills, buffer, onDashboard, onTour,
}: {
  balance: number;
  income: number;
  bills: number;
  buffer: number;
  onDashboard: () => void;
  onTour: () => void;
}) {
  const safeToSpend = Math.max(0, balance - bills - buffer);
  const projected30 = balance + income - bills;

  return (
    <div className="space-y-7">
      <div className="text-center">
        <div className="relative inline-flex mb-5">
          <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-card border border-accent/30 flex items-center justify-center shadow-xl">
            <Sparkles size={26} className="text-accent" />
          </div>
        </div>
        <h2 className="text-[32px] font-extrabold tracking-tight mb-2" style={display}>
          Your forecast is ready.
        </h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s a preview of what FlowSight found.
        </p>
      </div>

      {/* Key stats */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {[
          { label: "Current balance", value: `$${balance.toLocaleString()}`, color: "text-foreground", note: "as entered" },
          { label: "Safe to spend", value: `$${safeToSpend.toLocaleString()}`, color: "text-accent", note: "after committed outflows" },
          { label: "30-day projection", value: `$${projected30.toLocaleString()}`, color: projected30 > balance ? "text-accent" : "text-yellow-400", note: "estimated end-of-month" },
          { label: "Safety buffer", value: `$${buffer.toLocaleString()}`, color: "text-primary", note: "alert threshold" },
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
          This forecast uses the balance, income, bills, and safety buffer you confirmed.
        </p>
      </div>

      <div className="space-y-2.5">
        <PrimaryButton onClick={onDashboard}>
          Go to my dashboard <ArrowRight size={15} />
        </PrimaryButton>
        <button
          onClick={onTour}
          className="w-full border border-border rounded-xl py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all flex items-center justify-center gap-2"
        >
          <ChevronRight size={14} /> Take a quick product tour first
        </button>
      </div>
    </div>
  );
}

// 8 — Optional product tour (3-slide mini walkthrough)
const tourSlides = [
  {
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/15",
    title: "Cash Flow Forecast",
    body: "Your dashboard shows a rolling 30-day projection of your balance — updated continuously as your spending evolves.",
  },
  {
    icon: Wallet,
    color: "text-accent",
    bg: "bg-accent/15",
    title: "Safe to Spend",
    body: "Always know how much you can spend today without risking upcoming bills or dipping below your safety buffer.",
  },
  {
    icon: Sparkles,
    color: "text-yellow-400",
    bg: "bg-yellow-500/15",
    title: "Smart Alerts",
    body: "FlowSight warns you days in advance — before a balance dip, an unusual charge, or a large upcoming payment.",
  },
];

function ProductTour({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const { icon: Icon, color, bg, title, body } = tourSlides[slide];

  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center`}>
          <Icon size={28} className={color} />
        </div>
      </div>

      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight mb-3" style={display}>{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{body}</p>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2">
        {tourSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`rounded-full transition-all duration-200 ${i === slide ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-muted-foreground"}`}
          />
        ))}
      </div>

      <div className="space-y-2.5">
        {slide < tourSlides.length - 1 ? (
          <PrimaryButton onClick={() => setSlide((s) => s + 1)}>
            Next <ArrowRight size={15} />
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={onDone}>
            Open my dashboard <ArrowRight size={15} />
          </PrimaryButton>
        )}
        <button onClick={onDone} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          Skip tour
        </button>
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
  const [balance, setBalance] = useState("");
  const [income, setIncome] = useState<IncomeItem[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [buffer, setBuffer] = useState(1000);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const balanceNum = parseFloat(balance) || 0;
  const totalIncome = income.reduce((s, i) => s + parseFloat(i.amount || "0"), 0);
  const totalBills = bills.reduce((s, b) => s + parseFloat(b.amount || "0"), 0);

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
      })),
      bills: bills.map((item) => ({
        name: item.name,
        amountCents: Math.round(parseFloat(item.amount) * 100),
        frequency: normalizeFrequency(item.frequency),
        nextDate: item.nextDate,
      })),
    });
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.message);
      return;
    }
    next();
  };

  const screen = (() => {
    switch (step) {
      case 0: return <Welcome onNext={next} />;
      case 1: return <ChooseSource value={source} onChange={setSource} onNext={source === "csv" ? () => navigate("/app/transactions?import=1") : next} />;
      case 2: return <CurrentBalance value={balance} onChange={setBalance} onNext={next} />;
      case 3: return (
        <RecurringIncome
          items={income}
          onAdd={(item) => setIncome((p) => [...p, item])}
          onRemove={(id) => setIncome((p) => p.filter((i) => i.id !== id))}
          onNext={next}
        />
      );
      case 4: return (
        <RecurringBills
          items={bills}
          onAdd={(item) => setBills((p) => [...p, item])}
          onRemove={(id) => setBills((p) => p.filter((b) => b.id !== id))}
          onNext={next}
        />
      );
      case 5: return <SafetyBuffer value={buffer} onChange={setBuffer} onNext={persistAndContinue} saving={saving} error={saveError} />;
      case 6: return <BuildingForecast onDone={next} />;
      case 7: return (
        <ForecastReady
          balance={balanceNum}
          income={totalIncome}
          bills={totalBills}
          buffer={buffer}
          onDashboard={() => navigate("/app/dashboard")}
          onTour={next}
        />
      );
      case 8: return <ProductTour onDone={() => navigate("/app/dashboard")} />;
      default: return null;
    }
  })();

  return (
    <StepShell step={step} onBack={back}>
      {screen}
    </StepShell>
  );
}
