import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileWarning,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { getShowById } from "@/lib/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Field,
} from "@/components/ui/card";
import { StatusBadge, DealTypeBadge, PlainBadge } from "@/components/ui/badge";
import { calculateSettlement } from "@/lib/dealMath";
import {
  formatMoney,
  formatShowDateFull,
} from "@/lib/format";

export default async function SettlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getShowById(id);
  if (!data) notFound();

  const { show, artist, deal, ticketSales, expenses, settlement } = data;

  if (!deal) {
    return (
      <div className="px-10 py-8 max-w-3xl">
        <BackLink showId={show.id} />
        <div className="text-[13px] text-ink-500">
          No deal entered for this show. Settlement can&apos;t run yet.
        </div>
      </div>
    );
  }

  const calc = calculateSettlement({ deal, ticketSales, expenses });
  const grossSoFar = ticketSales.reduce((sum, t) => sum + t.gross, 0);
  const totalFees = ticketSales.reduce((sum, t) => sum + t.fees, 0);
  const totalExpenses = expenses
    .filter((e) => !e.absorbedByVenue)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="px-10 py-8 max-w-4xl">
      <BackLink showId={show.id} />

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-1.5 mb-3">
          <StatusBadge status={show.status} />
          <DealTypeBadge type={deal.dealType} />
          {settlement?.status === "disputed" && (
            <PlainBadge variant="rose">Disputed</PlainBadge>
          )}
        </div>
        <h1 className="text-[32px] font-semibold text-ink-900 tracking-tight leading-none">
          Settlement · {artist?.name}
        </h1>
        <div className="text-[13.5px] text-ink-500 mt-2">
          {formatShowDateFull(show.date)}
        </div>
      </div>

      {!calc.supported ? (
        <UnsupportedDeal
          dealType={calc.dealType}
          deal={deal}
          existingSettlement={settlement}
          grossSoFar={grossSoFar}
          totalFees={totalFees}
          totalExpenses={totalExpenses}
          ticketCount={ticketSales.reduce((s, t) => s + (t.qty ?? 0), 0)}
          expenseRowCount={expenses.length}
        />
      ) : (
        <SupportedSettlement calc={calc} existingSettlement={settlement} />
      )}

      {/* Educational footer — explains the gap, links to the brief */}
      <div className="mt-8 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-canvas-soft p-5">
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-brand-200 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="h-4 w-4 text-brand-700" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-ink-900 mb-1">
              You&apos;re looking at the seam this case study is about.
            </div>
            <p className="text-[12.5px] text-ink-700 leading-relaxed">
              Greenroom&apos;s in-app settlement tool was built early in the
              company&apos;s history, when most deals were flat guarantees.
              About 18% of customers actively use it; the other 82% — including
              most of the larger venues — default to spreadsheets. The CEO has
              flagged this as the company&apos;s biggest craft gap.{" "}
              <Link
                href="/context"
                className="text-brand-700 font-medium hover:text-brand-800 hover:underline inline-flex items-center gap-0.5"
              >
                Where to start <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackLink({ showId }: { showId: string }) {
  return (
    <Link
      href={`/shows/${showId}`}
      className="inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink-900 mb-5 transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to show
    </Link>
  );
}

function UnsupportedDeal({
  dealType,
  deal,
  existingSettlement,
  grossSoFar,
  totalFees,
  totalExpenses,
  ticketCount,
  expenseRowCount,
}: {
  dealType: string;
  deal: NonNullable<Awaited<ReturnType<typeof getShowById>>>["deal"];
  existingSettlement: NonNullable<
    Awaited<ReturnType<typeof getShowById>>
  >["settlement"];
  grossSoFar: number;
  totalFees: number;
  totalExpenses: number;
  ticketCount: number;
  expenseRowCount: number;
}) {
  const friendly: Record<string, string> = {
    flat: "flat guarantee",
    percentage_of_gross: "percentage of gross",
    percentage_of_net: "percentage of net",
    vs: "vs deal",
    door: "door deal",
  };

  return (
    <div className="space-y-5">
      {/* Empty state — colored, intentional */}
      <Card accent="amber">
        <CardContent className="py-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200 mb-4 shadow-sm">
            <FileWarning className="h-5 w-5 text-amber-700" />
          </div>
          <h2 className="text-[16px] font-semibold text-ink-900 mb-1.5">
            The in-app tool can&apos;t settle a {friendly[dealType] ?? dealType} yet.
          </h2>
          <p className="text-[13px] text-ink-600 max-w-md mx-auto leading-relaxed">
            Mariana would do this on a Google Sheet at 2am tonight. The inputs
            are below — but the math doesn&apos;t happen here.
          </p>
        </CardContent>
      </Card>

      {/* What we have */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>What the system has</CardTitle>
            <CardDescription>
              The inputs Mariana would pull together to settle this show.
              They&apos;re here — but disconnected from the deal terms.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field
              label="Gross box office"
              mono
              value={formatMoney(grossSoFar)}
            />
            <Field label="Fees" mono value={formatMoney(totalFees)} />
            <Field
              label="Net box office"
              mono
              value={formatMoney(grossSoFar - totalFees)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="Tickets sold" mono value={String(ticketCount)} />
            <Field
              label="Expenses (line items)"
              mono
              value={String(expenseRowCount)}
            />
            <Field
              label="Expenses (passed through)"
              mono
              value={formatMoney(totalExpenses)}
            />
          </div>

          {deal?.dealNotesFreetext && (
            <div className="mt-5">
              <div className="text-[10.5px] font-medium text-ink-500 uppercase tracking-wider mb-1.5">
                Deal notes (free text — what Mariana actually trusts)
              </div>
              <div className="text-[12.5px] text-ink-800 bg-canvas-soft rounded-lg p-3.5 ring-1 ring-ink-200 leading-relaxed">
                {deal.dealNotesFreetext}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* If already settled (off-platform) — show what the spreadsheet flow produced */}
      {existingSettlement?.totalToArtist != null && (
        <Card
          accent={existingSettlement.status === "disputed" ? "rose" : "brand"}
        >
          <CardHeader>
            <div>
              <CardTitle>Actually settled (off-platform)</CardTitle>
              <CardDescription>
                Mariana ran this in a spreadsheet. Here&apos;s the result that
                was logged back into Greenroom afterward.
              </CardDescription>
            </div>
            {existingSettlement.status === "disputed" ? (
              <PlainBadge variant="rose">Disputed</PlainBadge>
            ) : (
              <PlainBadge variant="brand">Signed</PlainBadge>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between py-2">
              <span className="text-[13px] text-ink-700">Total to artist</span>
              <span className="text-[28px] font-semibold font-mono tabular text-ink-900 tracking-tight">
                {formatMoney(existingSettlement.totalToArtist)}
              </span>
            </div>
            {existingSettlement.notes && (
              <div className="mt-3 text-[12.5px] text-ink-700 bg-canvas-soft rounded-lg p-3.5 ring-1 ring-ink-200 leading-relaxed">
                <div className="text-[10.5px] font-medium text-ink-500 uppercase tracking-wider mb-1.5">
                  Settlement notes
                </div>
                {existingSettlement.notes}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SupportedSettlement({
  calc,
  existingSettlement,
}: {
  calc: Extract<
    ReturnType<typeof calculateSettlement>,
    { supported: true }
  >;
  existingSettlement: NonNullable<
    Awaited<ReturnType<typeof getShowById>>
  >["settlement"];
}) {
  return (
    <Card accent="brand">
      <CardHeader>
        <div>
          <CardTitle>Settlement worksheet</CardTitle>
          <CardDescription className="font-mono">
            {calc.finalFormula}
          </CardDescription>
        </div>
        {existingSettlement && <PlainBadge variant="brand">Signed</PlainBadge>}
      </CardHeader>
      <CardContent className="divide-y divide-ink-100">
        <Row
          label="Gross box office"
          value={formatMoney(calc.grossBoxOffice)}
        />
        <Row label="Net box office" value={formatMoney(calc.netBoxOffice)} />
        <Row
          label="Total expenses (passed through)"
          value={formatMoney(calc.totalExpenses)}
        />
        <div className="pt-3" />
        {calc.steps.map((step, i) => (
          <Row
            key={i}
            label={step.label}
            value={formatMoney(step.value)}
            note={step.note}
          />
        ))}
        <div className="pt-3" />
        <div className="flex items-baseline justify-between py-3">
          <span className="text-[13px] font-semibold text-ink-900">
            Total to artist
          </span>
          <span className="text-[32px] font-semibold font-mono tabular text-ink-900 tracking-tight">
            {formatMoney(calc.totalToArtist)}
          </span>
        </div>
        {existingSettlement?.totalToArtist != null && (
          <div className="text-[12px] text-ink-500 pt-2.5">
            Originally settled at{" "}
            <span className="font-mono tabular text-ink-700">
              {formatMoney(existingSettlement.totalToArtist)}
            </span>
            .
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-2.5">
      <div>
        <div className="text-[13px] text-ink-700">{label}</div>
        {note && (
          <div className="text-[11.5px] text-ink-500 mt-0.5 max-w-md leading-snug">
            {note}
          </div>
        )}
      </div>
      <div className="text-[13.5px] text-ink-900 font-mono tabular">
        {value}
      </div>
    </div>
  );
}
