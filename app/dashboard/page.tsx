"use client";

import { useEffect, useState } from "react";
import { InvestmentsSummary } from "@/components/investments/InvestmentsSummary";
import { SummaryCards } from "@/components/finance/SummaryCards";
import { TransactionsTable } from "@/components/finance/TransactionsTable";
import { SpendingBubble } from "@/components/finance/SpendingBubble";
import { SpendingPie } from "@/components/finance/SpendingPie";
import { MonthlyBarChart } from "@/components/finance/MonthlyBarChart";
import { ChatOverlay } from "@/components/chat/ChatOverlay";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountsService } from "@/lib/services/accounts.service";
import { MessageSquare, SlidersHorizontal, X } from "lucide-react";
import type { TransactionFilters } from "@/lib/types/transaction";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const EMPTY_FILTERS: TransactionFilters = {
  category: undefined,
  start_date: undefined,
  end_date: undefined,
};

export default function DashboardPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview");
  const [draft, setDraft] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [chatOpen, setChatOpen] = useState(false);
  const [accountCount, setAccountCount] = useState<number | null>(null);

  useEffect(() => {
    const load = () => accountsService.list(true).then((a) => setAccountCount(a.length)).catch(() => setAccountCount(null))
    void load()
    window.addEventListener('workspace-changed', load)
    return () => window.removeEventListener('workspace-changed', load)
  }, [])

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setApplied({
      category: draft.category || undefined,
      start_date: draft.start_date || undefined,
      end_date: draft.end_date || undefined,
    });
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  function handleBubbleClick(category: string, startDate: string, endDate: string) {
    const filters: TransactionFilters = { category, start_date: startDate, end_date: endDate };
    setDraft(filters);
    setApplied(filters);
    setActiveTab("transactions");
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasActiveFilters = Boolean(applied.category || applied.start_date || applied.end_date);
  const today = new Date().toLocaleDateString(t('summary.localeCode'), { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        meta={
          <>
            <span className="num">{today}</span>
            {accountCount !== null && (
              <>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-border" />
                <span className="num">{accountCount === 1 ? t('dashboard.account') : t('dashboard.accounts', { n: accountCount })}</span>
              </>
            )}
          </>
        }
      />

      <PageBody className="space-y-5">
        <SummaryCards />
        <InvestmentsSummary />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="enter" style={{ '--i': 5 } as React.CSSProperties}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="overview">{t('dashboard.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="transactions">
                {t('dashboard.tabs.transactions')}
                {hasActiveFilters && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2 [&>div]:h-full">
                <MonthlyBarChart />
              </div>
              <SpendingPie />
            </div>
            <SpendingBubble onCategoryClick={handleBubbleClick} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <form
              onSubmit={handleApply}
              className={cn(
                "flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3 shadow-card transition-colors",
                hasActiveFilters ? "border-primary/30" : "border-border/80",
              )}
              aria-label={t('dashboard.filters.title')}
            >
              <span className="hidden h-9 items-center gap-1.5 pl-1 pr-2 text-xs font-medium text-muted-foreground sm:flex">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t('dashboard.filters.title')}
              </span>
              <div className="space-y-1">
                <Label htmlFor="category" className="eyebrow">
                  {t('common.category')}
                </Label>
                <Input
                  id="category"
                  placeholder={t('dashboard.filters.categoryPlaceholder')}
                  value={draft.category ?? ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                  className="h-9 w-44 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="start_date" className="eyebrow">
                  {t('common.from')}
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={draft.start_date ?? ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, start_date: e.target.value }))}
                  className="num h-9 w-40 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="end_date" className="eyebrow">
                  {t('common.to')}
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={draft.end_date ?? ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="num h-9 w-40 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" className="h-9">
                  {t('common.apply')}
                </Button>
                {hasActiveFilters && (
                  <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleReset}>
                    <X className="h-3.5 w-3.5" />
                    {t('common.reset')}
                  </Button>
                )}
              </div>
            </form>

            <TransactionsTable params={applied} />
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Floating chat trigger */}
      <button
        onClick={() => setChatOpen((o) => !o)}
        aria-label={chatOpen ? t('dashboard.chat.closeLabel') : t('dashboard.chat.openLabel')}
        aria-expanded={chatOpen}
        className="press fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-pop transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-11 sm:w-auto sm:pl-4 sm:pr-5"
      >
        {chatOpen ? <X className="h-4 w-4 shrink-0" /> : <MessageSquare className="h-4 w-4 shrink-0" />}
        <span className="hidden sm:inline">{chatOpen ? t('dashboard.chat.close') : t('dashboard.chat.open')}</span>
      </button>

      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
