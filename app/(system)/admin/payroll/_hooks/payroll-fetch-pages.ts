type PageError = { message: string };
type PageResult<T> = { data: T[] | null; error: PageError | null };

// Keep reading until empty, including when the server caps a page below 500.
// Never return a partial result after an error.
export async function fetchPayrollPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<PageResult<T>> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const result = await fetchPage(offset, offset + 499);
    if (result.error) return { data: null, error: result.error };
    const rows = result.data ?? [];
    if (rows.length === 0) return { data: all, error: null };
    all.push(...rows);
    offset += rows.length;
  }
}
