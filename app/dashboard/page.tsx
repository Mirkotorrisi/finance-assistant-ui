"use client";

import { useState } from "react";
import { SummaryCards } from "@/components/finance/SummaryCards";
import { TransactionsTable } from "@/components/finance/TransactionsTable";
import { SpendingBubble } from "@/components/finance/SpendingBubble";
import { SpendingPie } from "@/components/finance/SpendingPie";
import { MonthlyBarChart } from "@/components/finance/MonthlyBarChart";
import { ChatOverlay } from "@/components/chat/ChatOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, X } from "lucide-react";
import type { TransactionFilters } from "@/lib/types/transaction";
import { useTranslation } from "@/lib/i18n";

const EMPTY_FILTERS: TransactionFilters = {
  category: undefined,
  start_date: undefined,
  end_date: undefined,
};

export default function DashboardPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("transactions");
  const [draft, setDraft] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [chatOpen, setChatOpen] = useState(false);

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

  function handleBubbleClick(
    category: string,
    startDate: string,
    endDate: string,
  ) {
    const filters: TransactionFilters = {
      category,
      start_date: startDate,
      end_date: endDate,
    };
    setDraft(filters);
    setApplied(filters);
    setActiveTab("transactions");
  }

  const hasActiveFilters =
    applied.category || applied.start_date || applied.end_date;

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      {/* Page header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary cards always visible */}
        <SummaryCards />

        {/* Tabbed content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="transactions">{t('dashboard.tabs.transactions')}</TabsTrigger>
            <TabsTrigger value="charts">{t('dashboard.tabs.charts')}</TabsTrigger>
          </TabsList>

          {/* Transactions tab */}
          <TabsContent value="transactions" className="space-y-4 mt-4">
            <form
              onSubmit={handleApply}
              className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm"
            >
              <div className="space-y-1">
                <Label
                  htmlFor="category"
                  className="text-xs text-muted-foreground"
                >
                  {t('common.category')}
                </Label>
                <Input
                  id="category"
                  placeholder={t('dashboard.filters.categoryPlaceholder')}
                  value={draft.category ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-44 h-9 rounded-lg text-sm bg-background/80"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="start_date"
                  className="text-xs text-muted-foreground"
                >
                  {t('common.from')}
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={draft.start_date ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  className="w-40 h-9 rounded-lg text-sm bg-background/80"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="end_date"
                  className="text-xs text-muted-foreground"
                >
                  {t('common.to')}
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={draft.end_date ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, end_date: e.target.value }))
                  }
                  className="w-40 h-9 rounded-lg text-sm bg-background/80"
                />
              </div>

              <div className="flex gap-2 pb-0.5">
                <Button type="submit" size="sm" className="rounded-lg">
                  {t('common.apply')}
                </Button>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg gap-1.5"
                    onClick={handleReset}
                  >
                    <X className="h-3.5 w-3.5" />
                    {t('common.reset')}
                  </Button>
                )}
              </div>
            </form>

            <TransactionsTable params={applied} />
          </TabsContent>

          {/* Charts tab */}
          <TabsContent value="charts" className="space-y-6 mt-4">
            <SpendingBubble onCategoryClick={handleBubbleClick} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SpendingPie />
              <MonthlyBarChart />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating chat trigger */}
      <button
        onClick={() => setChatOpen((o) => !o)}
        aria-label={chatOpen ? t('dashboard.chat.closeLabel') : t('dashboard.chat.openLabel')}
        aria-expanded={chatOpen}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-200 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {chatOpen
          ? <X className="h-4 w-4 shrink-0" />
          : <MessageSquare className="h-4 w-4 shrink-0" />
        }
        <span>{chatOpen ? t('dashboard.chat.close') : t('dashboard.chat.open')}</span>
      </button>

      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
