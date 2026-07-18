import { parseQueryParams } from '../../src/utils/queryHelper';

describe('queryHelper unit tests', () => {
  it('should parse default limit and page options when query is empty', () => {
    const options = parseQueryParams({});
    expect(options.limit).toBe(10);
    expect(options.offset).toBe(0);
    expect(options.sortBy).toBeUndefined();
    expect(options.order).toBe('asc');
    expect(options.filters).toEqual({});
  });

  it('should calculate offset correctly for page values', () => {
    const options = parseQueryParams({ page: '3', limit: '20' });
    expect(options.limit).toBe(20);
    expect(options.offset).toBe(40); // (3 - 1) * 20
  });

  it('should parse sorting parameters', () => {
    const options = parseQueryParams({ sortBy: 'reportedAt', order: 'desc' });
    expect(options.sortBy).toBe('reportedAt');
    expect(options.order).toBe('desc');
  });

  it('should filter out pagination keys and map remaining queries as filters', () => {
    const options = parseQueryParams({
      page: '1',
      limit: '10',
      status: 'active',
      sector: 'Sector 104',
    });
    expect(options.filters).toEqual({
      status: 'active',
      sector: 'Sector 104',
    });
  });
});
