/** A failed read-back must not turn a confirmed write into a claimed failed write. */
export async function commitAndRefresh<T>(commit: () => Promise<T>, refresh: () => Promise<unknown>): Promise<{ result: T; refreshError: string | null }> {
  const result = await commit();
  try {
    await refresh();
    return { result, refreshError: null };
  } catch (error) {
    return { result, refreshError: error instanceof Error ? error.message : 'The workspace could not be refreshed.' };
  }
}
