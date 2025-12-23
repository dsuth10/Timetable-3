import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DailyDisplayPage from '../../src/pages/DailyDisplayPage';
import { api } from '../../src/services/api';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../src/services/api');

const mockData = {
  aides: [
    { id: 1, name: 'Jane Doe', is_absent: false, assignments: [] }
  ],
  relief_pool: [],
  task_bank: [
    { id: 101, title: 'Reading Support', category: 'CLASS_SUPPORT' }
  ],
  timeline_config: { 
    slots: [{ start_time: '08:50:00', duration_minutes: 20 }] 
  }
};

describe('DailyViewLayout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (api.get as any).mockResolvedValue({ data: mockData });
  });

  it('renders Daily Display page with aides and panels', async () => {
    render(
      <BrowserRouter>
        <DailyDisplayPage />
      </BrowserRouter>
    );
    
    expect(await screen.findByText('Daily Display')).toBeInTheDocument();
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(await screen.findByText('Task Bank')).toBeInTheDocument();
    expect(await screen.findByText('Reading Support')).toBeInTheDocument();
  });

  it('switches between Task Bank and Relief Pool tabs', async () => {
    render(
      <BrowserRouter>
        <DailyDisplayPage />
      </BrowserRouter>
    );
    
    const reliefTab = await screen.findByText('Relief Pool');
    fireEvent.click(reliefTab);
    
    expect(await screen.findByText('No Relief Tasks')).toBeInTheDocument();
  });
});

