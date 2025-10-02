import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAidesStore } from '../../src/store/stores/aides';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api');

describe('useAidesStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAidesStore.setState({ aides: [], loading: false, error: undefined });
  });

  it('fetches aides', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [
      { id: 1, name: 'A', colour_hex: '#000000' },
    ]});
    await useAidesStore.getState().fetchAides();
    const { aides, loading, error } = useAidesStore.getState();
    expect(loading).toBe(false);
    expect(error).toBeUndefined();
    expect(aides).toHaveLength(1);
  });
});




