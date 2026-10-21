import { describe, expect, it, vi } from 'vitest';
import { commitAndRefresh } from './mutation-result';

describe('confirmed writes and refresh failures', () => {
  it('returns the acknowledged result when the subsequent read-back fails', async () => {
    const result = { id: 'saved-plan' };
    const commit = vi.fn().mockResolvedValue(result);
    const refresh = vi.fn().mockRejectedValue(new Error('Connection interrupted'));
    await expect(commitAndRefresh(commit, refresh)).resolves.toEqual({ result, refreshError: 'Connection interrupted' });
    expect(commit).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh or report success when the write itself fails', async () => {
    const refresh = vi.fn();
    await expect(commitAndRefresh(() => Promise.reject(new Error('Prerequisite missing')), refresh)).rejects.toThrow('Prerequisite missing');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('reports a completely refreshed result without resubmitting the change', async () => {
    const commit = vi.fn().mockResolvedValue({ approved: true });
    await expect(commitAndRefresh(commit, () => Promise.resolve({ current: true }))).resolves.toEqual({ result: { approved: true }, refreshError: null });
    expect(commit).toHaveBeenCalledTimes(1);
  });
});
