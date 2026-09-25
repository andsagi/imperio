/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IndexField {
  fieldPath: string;
  order: 'ASCENDING' | 'DESCENDING';
}

export interface IndexDefinition {
  id: string;
  collection: 'suppliers' | 'catalog' | 'chats' | 'reviews';
  queryScope: 'COLLECTION';
  fields: IndexField[];
  reason: string;
  queryPattern: string;
  priority: 'CRITICAL' | 'RECOMMENDED' | 'OPTIMAL';
  suggestedConsoleUrl?: string;
}

/**
 * Pre-computed Index Suggestions Catalog for Scaling
 * Designed to ensure sub-100ms pagination and multi-field queries as dataset expands to 10k+ records.
 */
export const RECOMMENDED_INDEXES: IndexDefinition[] = [
  // 1. Suppliers Collection Indexes
  {
    id: 'idx_suppliers_cat_rating',
    collection: 'suppliers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'rating', order: 'DESCENDING' },
    ],
    reason: 'Enables filtered pagination by category (Peças, Mecânica, Postos) sorted by top-rated suppliers first.',
    queryPattern: 'where("category", "==", val).orderBy("rating", "desc").limit(pageSize)',
    priority: 'CRITICAL',
  },
  {
    id: 'idx_suppliers_niche_rating',
    collection: 'suppliers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'niche', order: 'ASCENDING' },
      { fieldPath: 'rating', order: 'DESCENDING' },
    ],
    reason: 'Optimizes niche-specific lookups (Pesados, Passeio, Motos) sorted by rating.',
    queryPattern: 'where("niche", "==", val).orderBy("rating", "desc").limit(pageSize)',
    priority: 'CRITICAL',
  },
  {
    id: 'idx_suppliers_cat_dist',
    collection: 'suppliers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'distance', order: 'ASCENDING' },
    ],
    reason: 'Supports nearest-first supplier pagination filtered by emergency/service category within radius.',
    queryPattern: 'where("category", "==", val).orderBy("distance", "asc").limit(pageSize)',
    priority: 'RECOMMENDED',
  },
  {
    id: 'idx_suppliers_niche_cat_rating',
    collection: 'suppliers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'niche', order: 'ASCENDING' },
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'rating', order: 'DESCENDING' },
    ],
    reason: 'Compound filter for segment + category (e.g. Pesados + Mecânica) sorted by ranking score.',
    queryPattern: 'where("niche", "==", val).where("category", "==", val).orderBy("rating", "desc").limit(pageSize)',
    priority: 'RECOMMENDED',
  },
  {
    id: 'idx_suppliers_online_dist',
    collection: 'suppliers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'isOnline', order: 'DESCENDING' },
      { fieldPath: 'distance', order: 'ASCENDING' },
    ],
    reason: 'Prioritizes online suppliers first, sub-sorted by closest distance to driver.',
    queryPattern: 'orderBy("isOnline", "desc").orderBy("distance", "asc").limit(pageSize)',
    priority: 'OPTIMAL',
  },
  {
    id: 'idx_suppliers_verified_rating',
    collection: 'suppliers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'isVerified', order: 'ASCENDING' },
      { fieldPath: 'rating', order: 'DESCENDING' },
    ],
    reason: 'Supports VIP verified partner badge filter with highest customer review rating.',
    queryPattern: 'where("isVerified", "==", true).orderBy("rating", "desc").limit(pageSize)',
    priority: 'OPTIMAL',
  },

  // 2. Catalog Collection Indexes
  {
    id: 'idx_catalog_supplier_cat_price',
    collection: 'catalog',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'supplierId', order: 'ASCENDING' },
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'price', order: 'ASCENDING' },
    ],
    reason: 'Powers the Supplier Dashboard Inventory view, allowing quick category drilldowns sorted by price.',
    queryPattern: 'where("supplierId", "==", id).where("category", "==", cat).orderBy("price", "asc").limit(pageSize)',
    priority: 'CRITICAL',
  },
  {
    id: 'idx_catalog_supplier_price',
    collection: 'catalog',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'supplierId', order: 'ASCENDING' },
      { fieldPath: 'price', order: 'ASCENDING' },
    ],
    reason: 'Allows shop owners to manage and paginate inventory items sorted from lowest to highest price.',
    queryPattern: 'where("supplierId", "==", id).orderBy("price", "asc").limit(pageSize)',
    priority: 'CRITICAL',
  },
  {
    id: 'idx_catalog_cat_price_asc',
    collection: 'catalog',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'price', order: 'ASCENDING' },
    ],
    reason: 'Powers buyer catalog browsing (e.g. Turbinas / Motores) sorted by best deal (price asc).',
    queryPattern: 'where("category", "==", cat).orderBy("price", "asc").limit(pageSize)',
    priority: 'RECOMMENDED',
  },
  {
    id: 'idx_catalog_cat_price_desc',
    collection: 'catalog',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'price', order: 'DESCENDING' },
    ],
    reason: 'Supports sorting by premium catalog parts in buyer search view.',
    queryPattern: 'where("category", "==", cat).orderBy("price", "desc").limit(pageSize)',
    priority: 'RECOMMENDED',
  },
  {
    id: 'idx_catalog_niche_cat_price',
    collection: 'catalog',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'niche', order: 'ASCENDING' },
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'price', order: 'ASCENDING' },
    ],
    reason: 'Compound filter for niche + part category + ascending price pagination.',
    queryPattern: 'where("niche", "==", val).where("category", "==", val).orderBy("price", "asc").limit(pageSize)',
    priority: 'RECOMMENDED',
  },
  {
    id: 'idx_catalog_supplier_title',
    collection: 'catalog',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'supplierId', order: 'ASCENDING' },
      { fieldPath: 'title', order: 'ASCENDING' },
    ],
    reason: 'Alphabetical inventory pagination for supplier shop catalog managers.',
    queryPattern: 'where("supplierId", "==", id).orderBy("title", "asc").limit(pageSize)',
    priority: 'OPTIMAL',
  },
];

/**
 * Index Advisor Engine
 * Analyzes query execution patterns and suggests optimal Firestore composite indexes.
 */
class IndexAdvisorService {
  private registeredSuggestions: Map<string, IndexDefinition> = new Map();

  constructor() {
    RECOMMENDED_INDEXES.forEach((idx) => {
      this.registeredSuggestions.set(idx.id, idx);
    });
  }

  /**
   * Retrieves all index recommendations for a given collection or all collections.
   */
  getSuggestions(collection?: 'suppliers' | 'catalog'): IndexDefinition[] {
    const all = Array.from(this.registeredSuggestions.values());
    if (collection) {
      return all.filter((s) => s.collection === collection);
    }
    return all;
  }

  /**
   * Generates a direct Firebase Console URL for index creation
   */
  generateConsoleUrl(projectId: string, index: IndexDefinition): string {
    const fieldsParam = index.fields
      .map((f) => `${f.fieldPath}:${f.order === 'ASCENDING' ? 'ASCENDING' : 'DESCENDING'}`)
      .join(',');
    return `https://console.firebase.google.com/v1/r/project/${projectId}/firestore/indexes?create_composite=${index.collection}:${fieldsParam}`;
  }

  /**
   * Analyzes an ad-hoc query to check if a composite index is needed.
   * Logs an actionable warning if compound conditions are detected.
   */
  analyzeQuery(params: {
    collection: 'suppliers' | 'catalog';
    whereFields: string[];
    orderByFields: { field: string; direction: 'asc' | 'desc' }[];
    projectId?: string;
  }): IndexDefinition | null {
    const { collection, whereFields, orderByFields, projectId } = params;

    // A composite index is required if:
    // 1. Multiple inequality/orderBy fields are used with equality filters, OR
    // 2. An equality filter is combined with a different orderBy field
    const needsComposite =
      (whereFields.length > 0 && orderByFields.some((ob) => !whereFields.includes(ob.field))) ||
      whereFields.length >= 2 ||
      orderByFields.length >= 2;

    if (!needsComposite) {
      return null;
    }

    const fields: IndexField[] = [
      ...whereFields.map((f) => ({ fieldPath: f, order: 'ASCENDING' as const })),
      ...orderByFields.map((ob) => ({
        fieldPath: ob.field,
        order: ob.direction === 'desc' ? ('DESCENDING' as const) : ('ASCENDING' as const),
      })),
    ];

    const id = `dynamic_${collection}_${fields.map((f) => `${f.fieldPath}_${f.order.toLowerCase().slice(0, 3)}`).join('_')}`;

    const suggestion: IndexDefinition = {
      id,
      collection,
      queryScope: 'COLLECTION',
      fields,
      reason: `Auto-detected compound query on "${collection}" (${whereFields.join(', ')} + sort by ${orderByFields.map((o) => `${o.field} ${o.direction}`).join(', ')}).`,
      queryPattern: `where(${whereFields.map((w) => `"${w}", "=="`).join(') & where(')}).orderBy(${orderByFields.map((o) => `"${o.field}", "${o.direction}"`).join(').orderBy(')})`,
      priority: 'RECOMMENDED',
      suggestedConsoleUrl: projectId ? this.generateConsoleUrl(projectId, { id, collection, queryScope: 'COLLECTION', fields, reason: '', queryPattern: '', priority: 'RECOMMENDED' }) : undefined,
    };

    if (!this.registeredSuggestions.has(id)) {
      this.registeredSuggestions.set(id, suggestion);
      console.info(
        `💡 [FIRESTORE INDEX SUGGESTION] Composite index suggested for collection "${collection}":\n` +
          `   Query Pattern: ${suggestion.queryPattern}\n` +
          `   Add to firestore.indexes.json to ensure optimum execution speed as dataset scales.`
      );
    }

    return suggestion;
  }

  /**
   * Returns complete firestore.indexes.json object payload
   */
  exportIndexesJson() {
    const indexes = Array.from(this.registeredSuggestions.values()).map((idx) => ({
      collectionGroup: idx.collection,
      queryScope: idx.queryScope,
      fields: idx.fields.map((f) => ({
        fieldPath: f.fieldPath,
        order: f.order,
      })),
    }));

    return {
      indexes,
      fieldOverrides: [],
    };
  }

  /**
   * Prints a structured diagnostic index suggestions report to the console
   */
  printReport() {
    console.group('⚡ [FIRESTORE INDEX ADVISOR] Recommended Composite Indexes');
    const tableData = Array.from(this.registeredSuggestions.values()).map((idx) => ({
      Collection: idx.collection,
      Fields: idx.fields.map((f) => `${f.fieldPath} (${f.order})`).join(', '),
      Priority: idx.priority,
      Reason: idx.reason,
    }));
    console.table(tableData);
    console.info('📄 Complete index configuration is synced with /firestore.indexes.json');
    console.groupEnd();
  }
}

export const indexAdvisor = new IndexAdvisorService();
