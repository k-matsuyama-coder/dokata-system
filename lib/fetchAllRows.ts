/** Read ordered pages to completion; a failed page must not become a partial total. */
export async function fetchAllRows<T, E>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: E | null }>
): Promise<{ data: T[] | null; error: E | null }> {
  const result: T[] = [];
  let offset = 0;
  while (true) {
    const page = await fetchPage(offset, offset + 499);
    if (page.error) return { data: null, error: page.error };
    const rows = page.data ?? [];
    if (rows.length === 0) return { data: result, error: null };
    result.push(...rows);
    offset += rows.length;
  }
}
