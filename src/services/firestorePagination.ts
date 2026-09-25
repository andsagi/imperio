/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { Supplier, CatalogItem } from '../types';
import { loadSuppliers, loadCatalogItems } from '../mockData';
import { perfMonitor } from './perfMonitor';
import { indexAdvisor } from './indexAdvisor';

export interface SupplierPaginationOptions {
  category?: string; // 'todos' | 'pecas' | 'mecanica' | 'postos' | 'pneus' | 'guincho' | 'eletrica'
  niche?: 'pesados' | 'passeio' | 'motos';
  searchQuery?: string;
  searchRadius?: number; // in km
  orderByField?: 'rating' | 'distance' | 'name';
  orderDirection?: 'asc' | 'desc';
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  pageNumber?: number;
}

export interface CatalogPaginationOptions {
  supplierId?: string;
  category?: string;
  niche?: 'pesados' | 'passeio' | 'motos';
  searchQuery?: string;
  compatibility?: string;
  orderByField?: 'price' | 'title' | 'code';
  orderDirection?: 'asc' | 'desc';
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  pageNumber?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  totalCount: number;
  pageNumber: number;
  latencyMs: number;
}

/**
 * Executes a high-performance paginated Firestore query for Suppliers
 */
export async function fetchPaginatedSuppliers(
  options: SupplierPaginationOptions = {}
): Promise<PaginatedResult<Supplier>> {
  const pageSize = options.pageSize || 8;
  const pageNumber = options.pageNumber || 1;
  const start = performance.now();

  const whereFields: string[] = [];
  const orderByFields: { field: string; direction: 'asc' | 'desc' }[] = [];

  const constraints: QueryConstraint[] = [];

  // Filter: Niche
  if (options.niche) {
    constraints.push(where('niche', '==', options.niche));
    whereFields.push('niche');
  }

  // Filter: Category
  if (options.category && options.category !== 'todos') {
    // Normalization for custom UI categories
    const catTarget =
      options.category === 'guincho' || options.category === 'eletrica'
        ? 'mecanica'
        : options.category;
    constraints.push(where('category', '==', catTarget));
    whereFields.push('category');
  }

  // Ordering
  const sortField = options.orderByField || 'rating';
  const sortDir = options.orderDirection || (sortField === 'rating' ? 'desc' : 'asc');
  constraints.push(orderBy(sortField, sortDir));
  orderByFields.push({ field: sortField, direction: sortDir });

  // Index requirement evaluation
  indexAdvisor.analyzeQuery({
    collection: 'suppliers',
    whereFields,
    orderByFields,
  });

  // Cursor for Pagination
  if (options.cursor) {
    constraints.push(startAfter(options.cursor));
  }

  // Limit (+1 to check hasMore)
  constraints.push(limit(pageSize + 1));

  try {
    const q = query(collection(db, 'suppliers'), ...constraints);

    const snapshot = await perfMonitor.measureQuery(
      `paginate:suppliers:page_${pageNumber}`,
      () => getDocs(q),
      {
        slowThresholdMs: 60,
        type: 'query',
        itemCountExtractor: (snap) => snap.size,
      }
    );

    let docs = snapshot.docs;
    let hasMore = docs.length > pageSize;
    if (hasMore) {
      docs = docs.slice(0, pageSize);
    }

    let items = docs.map((docSnap) => docSnap.data() as Supplier);
    const nextCursor = docs.length > 0 ? docs[docs.length - 1] : null;

    // In-memory post-filters if specific non-indexable criteria applied (searchQuery / searchRadius)
    if (options.searchQuery && options.searchQuery.trim()) {
      const qLower = options.searchQuery.toLowerCase().trim();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(qLower) ||
          s.specialty.toLowerCase().includes(qLower) ||
          s.address.toLowerCase().includes(qLower)
      );
    }

    if (options.searchRadius && options.searchRadius > 0) {
      items = items.filter((s) => s.distance <= options.searchRadius!);
    }

    // If Firestore returned items
    if (items.length > 0) {
      const latencyMs = Math.round((performance.now() - start) * 100) / 100;
      return {
        items,
        nextCursor,
        hasMore,
        totalCount: items.length,
        pageNumber,
        latencyMs,
      };
    }

    // If Firestore query returned 0 items (e.g. offline or empty state), fallback gracefully to local cache
    return fallbackLocalSuppliersPagination(options, pageSize, pageNumber, start);
  } catch (err) {
    console.warn('Firestore paginated query fallback to local cache:', err);
    return fallbackLocalSuppliersPagination(options, pageSize, pageNumber, start);
  }
}

/**
 * Local cache fallback for Suppliers pagination
 */
function fallbackLocalSuppliersPagination(
  options: SupplierPaginationOptions,
  pageSize: number,
  pageNumber: number,
  startTime: number
): PaginatedResult<Supplier> {
  let all = loadSuppliers();

  if (options.niche) {
    all = all.filter((s) => !s.niche || s.niche === options.niche);
  }

  if (options.category && options.category !== 'todos') {
    if (options.category === 'guincho') {
      all = all.filter(
        (s) =>
          s.category === 'socorro' ||
          s.specialty.toLowerCase().includes('guincho') ||
          s.name.toLowerCase().includes('guincho')
      );
    } else if (options.category === 'eletrica') {
      all = all.filter(
        (s) =>
          s.category === 'mecanica' ||
          s.specialty.toLowerCase().includes('elétr') ||
          s.name.toLowerCase().includes('elétr')
      );
    } else {
      all = all.filter((s) => s.category === options.category);
    }
  }

  if (options.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    all = all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.specialty.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }

  if (options.searchRadius && options.searchRadius > 0) {
    all = all.filter((s) => s.distance <= options.searchRadius!);
  }

  // Sort
  const sortField = options.orderByField || 'rating';
  const sortDir = options.orderDirection || (sortField === 'rating' ? 'desc' : 'asc');
  all.sort((a, b) => {
    let diff = 0;
    if (sortField === 'rating') diff = a.rating - b.rating;
    else if (sortField === 'distance') diff = a.distance - b.distance;
    else diff = a.name.localeCompare(b.name);
    return sortDir === 'desc' ? -diff : diff;
  });

  const startIndex = (pageNumber - 1) * pageSize;
  const pagedItems = all.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < all.length;
  const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    items: pagedItems,
    nextCursor: null,
    hasMore,
    totalCount: all.length,
    pageNumber,
    latencyMs,
  };
}

/**
 * Executes a high-performance paginated Firestore query for Catalog Items
 */
export async function fetchPaginatedCatalog(
  options: CatalogPaginationOptions = {}
): Promise<PaginatedResult<CatalogItem>> {
  const pageSize = options.pageSize || 10;
  const pageNumber = options.pageNumber || 1;
  const start = performance.now();

  const whereFields: string[] = [];
  const orderByFields: { field: string; direction: 'asc' | 'desc' }[] = [];
  const constraints: QueryConstraint[] = [];

  // Filter: Supplier
  if (options.supplierId) {
    constraints.push(where('supplierId', '==', options.supplierId));
    whereFields.push('supplierId');
  }

  // Filter: Niche
  if (options.niche) {
    constraints.push(where('niche', '==', options.niche));
    whereFields.push('niche');
  }

  // Filter: Category
  if (options.category && options.category !== 'todos') {
    constraints.push(where('category', '==', options.category));
    whereFields.push('category');
  }

  // Sort
  const sortField = options.orderByField || 'price';
  const sortDir = options.orderDirection || 'asc';
  constraints.push(orderBy(sortField, sortDir));
  orderByFields.push({ field: sortField, direction: sortDir });

  // Index requirement evaluation
  indexAdvisor.analyzeQuery({
    collection: 'catalog',
    whereFields,
    orderByFields,
  });

  // Cursor for Pagination
  if (options.cursor) {
    constraints.push(startAfter(options.cursor));
  }

  // Limit (+1 to check hasMore)
  constraints.push(limit(pageSize + 1));

  try {
    const q = query(collection(db, 'catalog'), ...constraints);

    const snapshot = await perfMonitor.measureQuery(
      `paginate:catalog:page_${pageNumber}`,
      () => getDocs(q),
      {
        slowThresholdMs: 60,
        type: 'query',
        itemCountExtractor: (snap) => snap.size,
      }
    );

    let docs = snapshot.docs;
    let hasMore = docs.length > pageSize;
    if (hasMore) {
      docs = docs.slice(0, pageSize);
    }

    let items = docs.map((docSnap) => docSnap.data() as CatalogItem);
    const nextCursor = docs.length > 0 ? docs[docs.length - 1] : null;

    // Search query or compatibility filter in-memory if requested
    if (options.searchQuery && options.searchQuery.trim()) {
      const qLower = options.searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(qLower) ||
          item.code.toLowerCase().includes(qLower) ||
          item.description.toLowerCase().includes(qLower) ||
          item.compatibleWith.toLowerCase().includes(qLower)
      );
    }

    if (options.compatibility && options.compatibility !== 'todos') {
      const compLower = options.compatibility.toLowerCase();
      items = items.filter((item) =>
        item.compatibleWith.toLowerCase().includes(compLower)
      );
    }

    if (items.length > 0) {
      const latencyMs = Math.round((performance.now() - start) * 100) / 100;
      return {
        items,
        nextCursor,
        hasMore,
        totalCount: items.length,
        pageNumber,
        latencyMs,
      };
    }

    return fallbackLocalCatalogPagination(options, pageSize, pageNumber, start);
  } catch (err) {
    console.warn('Firestore catalog paginated query fallback to local cache:', err);
    return fallbackLocalCatalogPagination(options, pageSize, pageNumber, start);
  }
}

/**
 * Local cache fallback for Catalog pagination
 */
function fallbackLocalCatalogPagination(
  options: CatalogPaginationOptions,
  pageSize: number,
  pageNumber: number,
  startTime: number
): PaginatedResult<CatalogItem> {
  let all = loadCatalogItems();

  if (options.supplierId) {
    all = all.filter((i) => i.supplierId === options.supplierId);
  }

  if (options.niche) {
    all = all.filter((i) => !i.niche || i.niche === options.niche);
  }

  if (options.category && options.category !== 'todos') {
    all = all.filter((i) => i.category === options.category);
  }

  if (options.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    all = all.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.compatibleWith.toLowerCase().includes(q)
    );
  }

  if (options.compatibility && options.compatibility !== 'todos') {
    const compLower = options.compatibility.toLowerCase();
    all = all.filter((item) =>
      item.compatibleWith.toLowerCase().includes(compLower)
    );
  }

  const sortField = options.orderByField || 'price';
  const sortDir = options.orderDirection || 'asc';
  all.sort((a, b) => {
    let diff = 0;
    if (sortField === 'price') diff = a.price - b.price;
    else if (sortField === 'title') diff = a.title.localeCompare(b.title);
    else diff = a.code.localeCompare(b.code);
    return sortDir === 'desc' ? -diff : diff;
  });

  const startIndex = (pageNumber - 1) * pageSize;
  const pagedItems = all.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < all.length;
  const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    items: pagedItems,
    nextCursor: null,
    hasMore,
    totalCount: all.length,
    pageNumber,
    latencyMs,
  };
}

/**
 * Custom React Hook for Suppliers Pagination
 */
export function usePaginatedSuppliers(initialOptions: SupplierPaginationOptions = {}) {
  const [items, setItems] = useState<Supplier[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  const optionsRef = useRef(initialOptions);
  optionsRef.current = initialOptions;

  const loadPage = useCallback(
    async (isNextPage: boolean = false) => {
      if (isNextPage) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }

      try {
        const result = await fetchPaginatedSuppliers({
          ...optionsRef.current,
          cursor: isNextPage ? cursor : null,
          pageNumber: isNextPage ? page + 1 : 1,
        });

        if (isNextPage) {
          setItems((prev) => [...prev, ...result.items]);
          setPage((p) => p + 1);
        } else {
          setItems(result.items);
          setPage(1);
        }

        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
        setLatencyMs(result.latencyMs);
      } catch (err) {
        console.error('Error loading paginated suppliers:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor, page]
  );

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      loadPage(true);
    }
  }, [loading, loadingMore, hasMore, loadPage]);

  const refresh = useCallback(() => {
    setCursor(null);
    loadPage(false);
  }, [loadPage]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    page,
    totalCount,
    latencyMs,
    loadMore,
    refresh,
  };
}

/**
 * Custom React Hook for Catalog Items Pagination
 */
export function usePaginatedCatalog(initialOptions: CatalogPaginationOptions = {}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  const optionsRef = useRef(initialOptions);
  optionsRef.current = initialOptions;

  const loadPage = useCallback(
    async (isNextPage: boolean = false) => {
      if (isNextPage) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }

      try {
        const result = await fetchPaginatedCatalog({
          ...optionsRef.current,
          cursor: isNextPage ? cursor : null,
          pageNumber: isNextPage ? page + 1 : 1,
        });

        if (isNextPage) {
          setItems((prev) => [...prev, ...result.items]);
          setPage((p) => p + 1);
        } else {
          setItems(result.items);
          setPage(1);
        }

        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
        setLatencyMs(result.latencyMs);
      } catch (err) {
        console.error('Error loading paginated catalog:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor, page]
  );

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      loadPage(true);
    }
  }, [loading, loadingMore, hasMore, loadPage]);

  const refresh = useCallback(() => {
    setCursor(null);
    loadPage(false);
  }, [loadPage]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    page,
    totalCount,
    latencyMs,
    loadMore,
    refresh,
  };
}
