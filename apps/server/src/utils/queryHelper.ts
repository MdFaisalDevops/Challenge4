import { CollectionReference, Query, DocumentData } from 'firebase-admin/firestore';

interface ParsedQueryOptions {
  page: number;
  limit: number;
  sortBy?: string;
  order: 'asc' | 'desc';
  filters: Record<string, any>;
}

export interface PagedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Parse Express Request query params into structured types
export const parseQueryParams = (reqQuery: any): ParsedQueryOptions => {
  const page = parseInt(reqQuery.page as string, 10) || 1;
  const limit = parseInt(reqQuery.limit as string, 10) || 10;
  const sortBy = reqQuery.sortBy as string;
  const order = (reqQuery.order as string) === 'desc' ? 'desc' : 'asc';

  // Extract other keys as equality filters, ignoring pagination keywords
  const reservedKeywords = ['page', 'limit', 'sortBy', 'order'];
  const filters: Record<string, any> = {};

  for (const [key, value] of Object.entries(reqQuery)) {
    if (!reservedKeywords.includes(key) && value !== undefined && value !== '') {
      // Cast string representations of boolean/numbers if needed
      if (value === 'true') filters[key] = true;
      else if (value === 'false') filters[key] = false;
      else if (!isNaN(Number(value)) && String(Number(value)) === value) {
        filters[key] = Number(value);
      } else {
        filters[key] = value;
      }
    }
  }

  return { page, limit, sortBy, order, filters };
};

// Build and execute Firestore query with filters, sorting, and offset pagination
export const executePagedQuery = async <T = DocumentData>(
  collectionRef: CollectionReference,
  options: ParsedQueryOptions
): Promise<PagedResult<T>> => {
  const { page, limit, sortBy, order, filters } = options;

  let query: Query = collectionRef;

  // 1. Apply equality filters
  for (const [field, value] of Object.entries(filters)) {
    query = query.where(field, '==', value);
  }

  // 2. Fetch total count of filtered documents before applying pagination offset (uses lightweight aggregation)
  const countSnapshot = await query.count().get();
  const total = countSnapshot.data().count;

  // 3. Apply sorting
  if (sortBy) {
    query = query.orderBy(sortBy, order);
  }

  // 4. Apply pagination offset
  const skip = (page - 1) * limit;
  query = query.offset(skip).limit(limit);

  // 5. Fetch documents
  const snapshot = await query.get();
  const data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
