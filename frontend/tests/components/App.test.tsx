import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../src/pages/App';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api');

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders aides list after fetch', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [
      { id: 1, name: 'John Smith', colour_hex: '#FF5733' },
      { id: 2, name: 'Mary Johnson', colour_hex: '#33C1FF' },
    ]});

    render(<App />);
    expect(await screen.findByText('John Smith')).toBeInTheDocument();
    expect(screen.getAllByText('Mary Johnson').length).toBeGreaterThan(0);
  });
});




