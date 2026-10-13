'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Bot,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  FileText,
  Zap,
  Globe,
  Share2,
} from 'lucide-react';
import { PageContent } from '@/types/cms';
import { auditPageContent, AuditResult, AuditCheck } from '@/lib/seoAuditor';
import { SITE_ORIGIN } from '@/lib/config';
import GoogleSearchPerformance from './GoogleSearchPerformance';

interface SeoGeoAeoAuditorProps {
  pages: PageContent[];
  initialSlug?: string;
  onApplyFix?: (pageSlug: string, updates: { title?: string; metaDescription?: string }) => void;
  onRefresh?: () => Promise<void> | void;
}

export default function SeoGeoAeoAuditor({ pages, initialSlug, onApplyFix, onRefresh }: SeoGeoAeoAuditorProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug || pages[0]?.slug || 'home');
  const [filterCategory, setFilterCategory] = useState<'all' | 'seo' | 'geo' | 'aeo'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issues' | 'passed'>('all');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'checklist' | 'ai-simulation' | 'schema' | 'site-overview'>('checklist');
  const [isAuditing, setIsAuditing] = useState(false);

  // Sync with initialSlug prop if provided
  React.useEffect(() => {
    if (initialSlug) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug]);

  // Selected Page
  const currentPage = useMemo(() => {
    return pages.find((p) => p.slug === selectedSlug) || pages[0];
  }, [pages, selectedSlug]);

  // Run audit for selected page
  const auditResult: AuditResult | null = useMemo(() => {
    if (!currentPage) return null;
    return auditPageContent(currentPage);
  }, [currentPage]);

  // Batch site health across all pages
  const batchResults = useMemo(() => {
    return pages.map((page) => ({
      page,
      audit: auditPageContent(page),
    }));
  }, [pages]);

  const siteAvgScores = useMemo(() => {
    if (!batchResults.length) return { overall: 0, seo: 0, geo: 0, aeo: 0 };
    const sum = batchResults.reduce(
      (acc, cur) => ({
        overall: acc.overall + cur.audit.overallScore,
        seo: acc.seo + cur.audit.scores.seo,
        geo: acc.geo + cur.audit.scores.geo,
        aeo: acc.aeo + cur.audit.scores.aeo,
      }),
      { overall: 0, seo: 0, geo: 0, aeo: 0 }
    );
    return {
      overall: Math.round(sum.overall / batchResults.length),
      seo: Math.round(sum.seo / batchResults.length),
      geo: Math.round(sum.geo / batchResults.length),
      aeo: Math.round(sum.aeo / batchResults.length),
    };
  }, [batchResults]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setIsAuditing(false);
    }
  };

  if (!currentPage || !auditResult) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No pages available for auditing.</p>
      </div>
    );
  }

  // Filter checks
  const filteredChecks = auditResult.checks.filter((check) => {
    if (filterCategory !== 'all' && check.category !== filterCategory) return false;
    if (statusFilter === 'issues' && check.status === 'pass') return false;
    if (statusFilter === 'passed' && check.status !== 'pass') return false;
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Selector & Global Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-editorial-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Auditing Page:</span>
              <span className="text-terracotta underline decoration-terracotta/30">{currentPage.name}</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 font-mono">
                Public URL: <strong className="text-slate-800 font-bold">{SITE_ORIGIN}{currentPage.url}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500">Path: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">{currentPage.url}</code></span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500">Status: <strong className="capitalize text-emerald-700">{currentPage.status}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <a
            href={currentPage.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold transition-all border border-slate-200 shadow-xs shrink-0"
            title="Open public page in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Page</span>
          </a>

          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="flex-1 md:w-64 px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-terracotta"
          >
            {pages.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.url})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Refreshing & Auditing...' : 'Re-Audit'}</span>
          </button>
        </div>
      </div>

      {/* 3-Pillar Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Composite */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Overall Health</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(auditResult.overallScore)}`}>
              Grade {auditResult.grade}
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-editorial-serif text-4xl font-bold text-slate-900">{auditResult.overallScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getScoreBarColor(auditResult.overallScore)}`}
              style={{ width: `${auditResult.overallScore}%` }}
            />
          </div>
        </div>

        {/* 1. Traditional SEO */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              SEO (Google/Bing)
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(auditResult.scores.seo)}`}>
              {auditResult.scores.seo}%
            </span>
          </div>
          <p className="text-xs text-slate-500 my-2">SERP titles, meta tags, OpenGraph preview & indexability.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getScoreBarColor(auditResult.scores.seo)}`}
              style={{ width: `${auditResult.scores.seo}%` }}
            />
          </div>
        </div>

        {/* 2. GEO (AI Search Engine) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-600" />
              GEO (AI Search)
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(auditResult.scores.geo)}`}>
              {auditResult.scores.geo}%
            </span>
          </div>
          <p className="text-xs text-slate-500 my-2">E-E-A-T signals, entity clarity & Perplexity/ChatGPT citations.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getScoreBarColor(auditResult.scores.geo)}`}
              style={{ width: `${auditResult.scores.geo}%` }}
            />
          </div>
        </div>

        {/* 3. AEO (Answer Engine & Voice) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
              AEO (Snippets & Voice)
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(auditResult.scores.aeo)}`}>
              {auditResult.scores.aeo}%
            </span>
          </div>
          <p className="text-xs text-slate-500 my-2">Question-based structure, 40-50 word direct answers & FAQ schema.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getScoreBarColor(auditResult.scores.aeo)}`}
              style={{ width: `${auditResult.scores.aeo}%` }}
            />
          </div>
        </div>
      </div>

      {/* SEPARATE LAYER: Google Search Performance (Actual Google Search Console Data) */}
      <GoogleSearchPerformance page={currentPage} onRefreshPages={onRefresh} />

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'checklist', label: 'Audit Checklist', icon: CheckCircle2, count: auditResult.checks.length },
          { id: 'ai-simulation', label: 'Heuristic AI Search Extraction Simulation', icon: Bot },
          { id: 'schema', label: 'Schema & Auto-Fixes', icon: FileText },
          { id: 'site-overview', label: 'Site-wide Health Overview', icon: Globe, count: pages.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeViewTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveViewTab(tab.id as any)}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-terracotta/10 text-terracotta font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: AUDIT CHECKLIST */}
      {activeViewTab === 'checklist' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Dimensions' },
                { id: 'seo', label: 'SEO (Search)' },
                { id: 'geo', label: 'GEO (AI Search)' },
                { id: 'aeo', label: 'AEO (Snippets & Voice)' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCategory(c.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterCategory === c.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'issues', label: '⚠️ Needs Attention', count: auditResult.summary.warnCount + auditResult.summary.failCount },
                { id: 'passed', label: '✅ Passed', count: auditResult.summary.passedCount },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === s.id
                      ? 'bg-terracotta text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Check Items */}
          <div className="space-y-3">
            {filteredChecks.map((check) => {
              const isPass = check.status === 'pass';
              const isWarn = check.status === 'warn';
              const isFail = check.status === 'fail';

              return (
                <div
                  key={check.id}
                  className={`bg-white border rounded-2xl p-5 transition-all shadow-sm ${
                    isFail
                      ? 'border-rose-200 bg-rose-50/20'
                      : isWarn
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isPass && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        {isWarn && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                        {isFail && <XCircle className="w-5 h-5 text-rose-600" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{check.title}</h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {check.category.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{check.detail}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getScoreColor(check.score)}`}>
                        {check.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Recommendation / Fix Block */}
                  {(check.recommendation || check.suggestedFix) && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 bg-white rounded-xl p-3.5 border space-y-2">
                      {check.recommendation && (
                        <p className="text-xs text-amber-800 font-medium flex items-start gap-1.5">
                          <span className="font-bold">Recommendation:</span>
                          <span>{check.recommendation}</span>
                        </p>
                      )}

                      {check.suggestedFix && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs font-mono text-slate-800">
                          <span className="truncate">{check.suggestedFix}</span>
                          <button
                            onClick={() => handleCopy(check.suggestedFix!, check.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-terracotta hover:underline shrink-0 font-sans font-bold"
                          >
                            {copiedItem === check.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedItem === check.id ? 'Copied!' : 'Copy Fix'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredChecks.length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-semibold">No issues matching this filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI SEARCH SIMULATOR */}
      {activeViewTab === 'ai-simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Perplexity / ChatGPT citation box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <h4 className="font-editorial-serif text-base font-bold text-slate-900">
                  Heuristic AI Search Extraction Simulation
                </h4>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getScoreColor(auditResult.scores.geo)}`}>
                {auditResult.aiSimulation.citationConfidence} Citation Confidence
              </span>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-3 font-sans shadow-inner">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Simulated generative answer for query: &quot;Authentic travel &amp; cultural guides in Nepal&quot; (Heuristic Extraction)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                &quot;{auditResult.aiSimulation.summary}&quot;
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Source: {SITE_ORIGIN}{auditResult.url || ''}</span>
                <span className="text-emerald-400">Heuristic Extraction via E-E-A-T & Entities</span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">How AI Engines Rank This Page:</h5>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>ChatGPT Search and Perplexity prioritize firsthand verified hosts over generic directory aggregators.</li>
                <li>Clear entity mentions (e.g. Kathmandu Valley, Patan, Newar artisans) allow models to ground knowledge graphs.</li>
                <li>Presence of specific duration, group sizes, and seasons provides exact answers for conversational prompts.</li>
              </ul>
            </div>
          </div>

          {/* Knowledge Graph Entities Detected */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-editorial-serif text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
              <Sparkles className="w-5 h-5 text-terracotta" />
              Himalayan & Nepal Knowledge Graph Entities
            </h4>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">
                Detected Cultural & Geographic Entities ({auditResult.aiSimulation.keyEntitiesDetected.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {auditResult.aiSimulation.keyEntitiesDetected.map((ent) => (
                  <span
                    key={ent}
                    className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-semibold"
                  >
                    ✓ {ent}
                  </span>
                ))}
                {auditResult.aiSimulation.keyEntitiesDetected.length === 0 && (
                  <span className="text-xs text-rose-600">No specific Nepalese entities found in content.</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-700 mb-2">Recommended Entities to Add for Greater AI Authority:</p>
              <div className="flex flex-wrap gap-1.5">
                {auditResult.aiSimulation.missingCitations.map((ent) => (
                  <span
                    key={ent}
                    className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                  >
                    + {ent}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Pro Tip for GEO:</span> When writing blogs or descriptions, mention concrete UNESCO landmarks, high-altitude pass names, and traditional cultural ceremonies by name to cement entity authority.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA & AUTO-FIXES */}
      {activeViewTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Metadata Auto-Fix Proposals */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-editorial-serif text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
              Recommended Metadata Fixes
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recommended Title (50–60 Chars):</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono flex items-center justify-between gap-3">
                  <span>{auditResult.suggestedMetadata.title}</span>
                  <button
                    onClick={() => handleCopy(auditResult.suggestedMetadata.title, 'sugg-title')}
                    className="text-terracotta text-xs font-bold hover:underline shrink-0"
                  >
                    {copiedItem === 'sugg-title' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recommended Direct Answer Meta Description:</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono leading-relaxed space-y-2">
                  <p>{auditResult.suggestedMetadata.metaDescription}</p>
                  <div className="text-right">
                    <button
                      onClick={() => handleCopy(auditResult.suggestedMetadata.metaDescription, 'sugg-desc')}
                      className="text-terracotta text-xs font-bold hover:underline"
                    >
                      {copiedItem === 'sugg-desc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target AI & Search Keywords:</label>
                <div className="flex flex-wrap gap-1.5">
                  {auditResult.suggestedMetadata.targetKeywords.map((kw) => (
                    <span key={kw} className="px-2.5 py-1 bg-terracotta/10 border border-terracotta/20 text-terracotta text-xs font-semibold rounded-lg">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* JSON-LD Schema Generator */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="font-editorial-serif text-base font-bold text-slate-900">
                JSON-LD Structured Data (Schema.org)
              </h4>
              <button
                onClick={() => handleCopy(JSON.stringify(auditResult.suggestedSchema, null, 2), 'schema-json')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                {copiedItem === 'schema-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedItem === 'schema-json' ? 'Copied' : 'Copy Schema'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-80 shadow-inner">
              {JSON.stringify(auditResult.suggestedSchema, null, 2)}
            </pre>
            <p className="text-xs text-slate-500">
              Search engines and AI answer engines ingest this schema to understand page type, geographic service area, and human guide identity.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: SITE-WIDE HEALTH OVERVIEW */}
      {activeViewTab === 'site-overview' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h4 className="font-editorial-serif text-lg font-bold text-slate-900">
                Site-Wide SEO / GEO / AEO Health Audit
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary across all {pages.length} CMS managed pages in your application.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Site Average</span>
                <span className="font-editorial-serif text-2xl font-bold text-slate-900">{siteAvgScores.overall}/100</span>
              </div>
              <div className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${getScoreColor(siteAvgScores.overall)}`}>
                Avg Grade {siteAvgScores.overall >= 85 ? 'A' : siteAvgScores.overall >= 70 ? 'B' : 'C'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Page Name</th>
                  <th className="py-3 px-4">URL</th>
                  <th className="py-3 px-4 text-center">SEO</th>
                  <th className="py-3 px-4 text-center">GEO (AI)</th>
                  <th className="py-3 px-4 text-center">AEO (Voice)</th>
                  <th className="py-3 px-4 text-center">Overall</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchResults.map(({ page, audit }) => (
                  <tr key={page.slug} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span>{page.name}</span>
                      {page.status === 'draft' && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{page.url}</td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] ${getScoreColor(audit.scores.seo)}`}>
                        {audit.scores.seo}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] ${getScoreColor(audit.scores.geo)}`}>
                        {audit.scores.geo}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] ${getScoreColor(audit.scores.aeo)}`}>
                        {audit.scores.aeo}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-editorial-serif text-sm font-bold text-slate-900">{audit.overallScore}</span>
                      <span className="text-[10px] text-slate-400 font-semibold"> ({audit.grade})</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSlug(page.slug);
                          setActiveViewTab('checklist');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
