/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect } from 'react';
import { indexAdvisor, IndexDefinition, RECOMMENDED_INDEXES } from './indexAdvisor';

export { indexAdvisor, RECOMMENDED_INDEXES };
export type { IndexDefinition };

/**
 * Performance Thresholds (in milliseconds)
 */
export const PERF_THRESHOLDS = {
  /** Database query considered slow if taking longer than this */
  SLOW_QUERY_MS: 70,
  /** Component render considered slow if taking longer than this (1 frame @ 60fps ~ 16.6ms) */
  SLOW_RENDER_MS: 20,
  /** Real-time snapshot processing considered slow if exceeding this */
  SLOW_SNAPSHOT_MS: 30,
  /** Inverted index search considered slow if exceeding this */
  SLOW_SEARCH_MS: 15,
};

export interface QueryMetric {
  id: string;
  name: string;
  type: 'query' | 'mutation' | 'snapshot';
  durationMs: number;
  itemCount?: number;
  timestamp: number;
  isSlow: boolean;
  error?: string;
}

export interface RenderMetric {
  componentName: string;
  durationMs: number;
  timestamp: number;
  renderCount: number;
  isSlow: boolean;
}

export interface PerfSummary {
  totalQueries: number;
  slowQueries: number;
  avgQueryDurationMs: number;
  maxQueryDurationMs: number;
  p95QueryDurationMs: number;
  totalRendersTracked: number;
  slowRenders: number;
  avgRenderDurationMs: number;
  maxRenderDurationMs: number;
  slowQueryHistory: QueryMetric[];
  slowRenderHistory: RenderMetric[];
}

/**
 * High-performance In-Memory Circular Buffer
 */
class CircularBuffer<T> {
  private buffer: T[];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.buffer = [];
    this.maxSize = maxSize;
  }

  push(item: T) {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(item);
  }

  getAll(): T[] {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }
}

/**
 * Performance Monitor Service
 */
class PerformanceMonitorService {
  private queries = new CircularBuffer<QueryMetric>(200);
  private renders = new CircularBuffer<RenderMetric>(200);
  private componentRenderCounters: Map<string, number> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    // Expose global developer/diagnostic object without adding visual UI clutter
    if (typeof window !== 'undefined') {
      (window as any).__PERF_MONITOR__ = this;
    }
  }

  /**
   * Measures asynchronous database operations (Firestore getDocs, setDoc, updateDoc, etc.)
   */
  async measureQuery<T>(
    name: string,
    queryFn: () => Promise<T>,
    options?: {
      slowThresholdMs?: number;
      type?: 'query' | 'mutation' | 'snapshot';
      itemCountExtractor?: (result: T) => number;
    }
  ): Promise<T> {
    if (!this.isEnabled || typeof performance === 'undefined') {
      return queryFn();
    }

    const start = performance.now();
    const threshold = options?.slowThresholdMs ?? PERF_THRESHOLDS.SLOW_QUERY_MS;
    const type = options?.type ?? 'query';
    let errorStr: string | undefined;

    try {
      const result = await queryFn();
      const duration = performance.now() - start;
      const isSlow = duration >= threshold;

      let itemCount: number | undefined;
      if (options?.itemCountExtractor) {
        try {
          itemCount = options.itemCountExtractor(result);
        } catch {}
      } else if (result && typeof result === 'object') {
        if ('size' in result && typeof (result as any).size === 'number') {
          itemCount = (result as any).size;
        } else if (Array.isArray(result)) {
          itemCount = result.length;
        }
      }

      const metric: QueryMetric = {
        id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name,
        type,
        durationMs: Math.round(duration * 100) / 100,
        itemCount,
        timestamp: Date.now(),
        isSlow,
      };

      this.queries.push(metric);

      if (isSlow) {
        console.warn(
          `⚡ [PERF SLOW QUERY] "${name}" took ${metric.durationMs}ms (threshold: ${threshold}ms)${
            itemCount !== undefined ? ` [${itemCount} items]` : ''
          }.`,
          {
            operation: name,
            durationMs: metric.durationMs,
            thresholdMs: threshold,
            itemCount,
            hint: 'Use caching, sub-collections, or index queries to prevent UI latency as dataset grows.',
          }
        );
      }

      return result;
    } catch (err: any) {
      const duration = performance.now() - start;
      errorStr = err instanceof Error ? err.message : String(err);

      const metric: QueryMetric = {
        id: `${name}_${Date.now()}_err`,
        name,
        type,
        durationMs: Math.round(duration * 100) / 100,
        timestamp: Date.now(),
        isSlow: duration >= threshold,
        error: errorStr,
      };
      this.queries.push(metric);

      throw err;
    }
  }

  /**
   * Measures execution time of real-time snapshot processing
   */
  measureSnapshotProcessing(
    name: string,
    processFn: () => void,
    itemCount?: number
  ): void {
    if (!this.isEnabled || typeof performance === 'undefined') {
      processFn();
      return;
    }

    const start = performance.now();
    processFn();
    const duration = performance.now() - start;
    const isSlow = duration >= PERF_THRESHOLDS.SLOW_SNAPSHOT_MS;

    const metric: QueryMetric = {
      id: `${name}_snap_${Date.now()}`,
      name,
      type: 'snapshot',
      durationMs: Math.round(duration * 100) / 100,
      itemCount,
      timestamp: Date.now(),
      isSlow,
    };

    this.queries.push(metric);

    if (isSlow) {
      console.warn(
        `⚡ [PERF SLOW SNAPSHOT] Listener "${name}" took ${metric.durationMs}ms to process ${itemCount ?? 0} docs.`,
        metric
      );
    }
  }

  /**
   * Records a component render timing
   */
  recordRender(
    componentName: string,
    durationMs: number,
    slowThresholdMs: number = PERF_THRESHOLDS.SLOW_RENDER_MS
  ): void {
    if (!this.isEnabled) return;

    const currentCount = (this.componentRenderCounters.get(componentName) || 0) + 1;
    this.componentRenderCounters.set(componentName, currentCount);

    const isSlow = durationMs >= slowThresholdMs;
    const metric: RenderMetric = {
      componentName,
      durationMs: Math.round(durationMs * 100) / 100,
      timestamp: Date.now(),
      renderCount: currentCount,
      isSlow,
    };

    this.renders.push(metric);

    if (isSlow) {
      console.warn(
        `⚡ [PERF SLOW RENDER] <${componentName} /> took ${metric.durationMs}ms (frame budget: ${slowThresholdMs}ms) [render #${currentCount}].`,
        {
          component: componentName,
          durationMs: metric.durationMs,
          renderCount: currentCount,
          hint: 'Memoize heavy subtrees (React.memo, useMemo) or paginate large collections to maintain 60 FPS.',
        }
      );
    }
  }

  /**
   * React Profiler onRender callback integration
   */
  onProfilerRender = (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    _baseDuration: number,
    _startTime: number,
    _commitTime: number
  ): void => {
    this.recordRender(`${id} (${phase})`, actualDuration);
  };

  /**
   * Aggregates and returns real-time diagnostic performance metrics
   */
  getSummary(): PerfSummary {
    const allQueries = this.queries.getAll();
    const allRenders = this.renders.getAll();

    const slowQueriesList = allQueries.filter((q) => q.isSlow);
    const slowRendersList = allRenders.filter((r) => r.isSlow);

    const queryDurations = allQueries.map((q) => q.durationMs).sort((a, b) => a - b);
    const renderDurations = allRenders.map((r) => r.durationMs).sort((a, b) => a - b);

    const avgQuery =
      queryDurations.length > 0
        ? Math.round((queryDurations.reduce((a, b) => a + b, 0) / queryDurations.length) * 100) / 100
        : 0;

    const avgRender =
      renderDurations.length > 0
        ? Math.round((renderDurations.reduce((a, b) => a + b, 0) / renderDurations.length) * 100) / 100
        : 0;

    const p95Query =
      queryDurations.length > 0
        ? queryDurations[Math.min(Math.floor(queryDurations.length * 0.95), queryDurations.length - 1)]
        : 0;

    return {
      totalQueries: allQueries.length,
      slowQueries: slowQueriesList.length,
      avgQueryDurationMs: avgQuery,
      maxQueryDurationMs: queryDurations.length > 0 ? queryDurations[queryDurations.length - 1] : 0,
      p95QueryDurationMs: p95Query,
      totalRendersTracked: allRenders.length,
      slowRenders: slowRendersList.length,
      avgRenderDurationMs: avgRender,
      maxRenderDurationMs: renderDurations.length > 0 ? renderDurations[renderDurations.length - 1] : 0,
      slowQueryHistory: slowQueriesList.slice(-20),
      slowRenderHistory: slowRendersList.slice(-20),
    };
  }

  /**
   * Prints a formatted summary table to console for developers
   */
  report(): void {
    const summary = this.getSummary();
    console.group('📊 [PERF MONITOR] Performance Audit Summary');
    console.table({
      'Total Queries': summary.totalQueries,
      'Slow Queries (> threshold)': summary.slowQueries,
      'Avg Query Latency': `${summary.avgQueryDurationMs}ms`,
      'P95 Query Latency': `${summary.p95QueryDurationMs}ms`,
      'Max Query Latency': `${summary.maxQueryDurationMs}ms`,
      'Total Renders Tracked': summary.totalRendersTracked,
      'Slow Renders (> frame budget)': summary.slowRenders,
      'Avg Render Time': `${summary.avgRenderDurationMs}ms`,
      'Max Render Time': `${summary.maxRenderDurationMs}ms`,
    });
    if (summary.slowQueryHistory.length > 0) {
      console.group('Slow Queries Log:');
      console.table(summary.slowQueryHistory);
      console.groupEnd();
    }
    if (summary.slowRenderHistory.length > 0) {
      console.group('Slow Renders Log:');
      console.table(summary.slowRenderHistory);
      console.groupEnd();
    }
    console.groupEnd();
    this.reportIndexes();
  }

  /**
   * Retrieves recommended composite indexes for Firestore collections
   */
  getIndexSuggestions(collection?: 'suppliers' | 'catalog'): IndexDefinition[] {
    return indexAdvisor.getSuggestions(collection);
  }

  /**
   * Logs index suggestions report to console
   */
  reportIndexes(): void {
    indexAdvisor.printReport();
  }

  /**
   * Evaluates query filters and order parameters to suggest indexes dynamically
   */
  suggestIndexForQuery(params: {
    collection: 'suppliers' | 'catalog';
    whereFields: string[];
    orderByFields: { field: string; direction: 'asc' | 'desc' }[];
  }): IndexDefinition | null {
    return indexAdvisor.analyzeQuery(params);
  }

  clear(): void {
    this.queries.clear();
    this.renders.clear();
    this.componentRenderCounters.clear();
  }
}

export const perfMonitor = new PerformanceMonitorService();

/**
 * React Hook: Measures render duration and logs slow renders
 */
export function useRenderProfiler(
  componentName: string,
  slowThresholdMs: number = PERF_THRESHOLDS.SLOW_RENDER_MS
) {
  const startTimeRef = useRef<number>(0);
  startTimeRef.current = typeof performance !== 'undefined' ? performance.now() : 0;

  useEffect(() => {
    if (typeof performance !== 'undefined' && startTimeRef.current > 0) {
      const duration = performance.now() - startTimeRef.current;
      perfMonitor.recordRender(componentName, duration, slowThresholdMs);
    }
  });
}

/**
 * High-performance In-Memory Search Index for Catalog & Suppliers
 * Enables sub-millisecond filtering as dataset grows into thousands of items.
 */
export class FastSearchIndex<T> {
  private items: T[] = [];
  private tokenMap: Map<string, Set<number>> = new Map();
  private fieldsExtractor: (item: T) => string[];

  constructor(fieldsExtractor: (item: T) => string[]) {
    this.fieldsExtractor = fieldsExtractor;
  }

  /**
   * Rebuilds token index in O(N * words) time.
   */
  setItems(items: T[]) {
    this.items = items;
    this.tokenMap.clear();

    const start = performance.now();

    for (let i = 0; i < items.length; i++) {
      const texts = this.fieldsExtractor(items[i]);
      for (const text of texts) {
        if (!text) continue;
        const tokens = text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .split(/[\s,.\-_/\\()]+/);

        for (const token of tokens) {
          if (token.length < 2) continue;
          let set = this.tokenMap.get(token);
          if (!set) {
            set = new Set<number>();
            this.tokenMap.set(token, set);
          }
          set.add(i);
        }
      }
    }

    const duration = performance.now() - start;
    if (duration > PERF_THRESHOLDS.SLOW_SEARCH_MS) {
      console.warn(
        `⚡ [PERF] FastSearchIndex built for ${items.length} items in ${duration.toFixed(2)}ms.`
      );
    }
  }

  /**
   * Sub-millisecond lookup returning matching items
   */
  search(query: string): T[] {
    if (!query || !query.trim()) {
      return this.items;
    }

    const start = performance.now();
    const queryTokens = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[\s,.\-_/\\()]+/)
      .filter((t) => t.length >= 2);

    if (queryTokens.length === 0) {
      return this.items;
    }

    // Find candidate matching sets
    const matchSets: Set<number>[] = [];

    for (const qToken of queryTokens) {
      const tokenMatches = new Set<number>();
      for (const [key, indices] of this.tokenMap.entries()) {
        if (key.includes(qToken)) {
          for (const idx of indices) {
            tokenMatches.add(idx);
          }
        }
      }
      matchSets.push(tokenMatches);
    }

    if (matchSets.length === 0) return [];

    // Intersect matches (AND search)
    let resultIndices = matchSets[0];
    for (let i = 1; i < matchSets.length; i++) {
      const nextSet = matchSets[i];
      const intersection = new Set<number>();
      for (const id of resultIndices) {
        if (nextSet.has(id)) {
          intersection.add(id);
        }
      }
      resultIndices = intersection;
    }

    const matchedItems: T[] = [];
    for (const idx of resultIndices) {
      if (this.items[idx]) {
        matchedItems.push(this.items[idx]);
      }
    }

    const duration = performance.now() - start;
    if (duration > PERF_THRESHOLDS.SLOW_SEARCH_MS) {
      console.warn(
        `⚡ [PERF SLOW SEARCH] Search "${query}" across ${this.items.length} items took ${duration.toFixed(2)}ms.`
      );
    }

    return matchedItems;
  }
}
