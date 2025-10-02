type WeekNavigationProps = {
  weekStartISO: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export default function WeekNavigation({ weekStartISO, onPrev, onNext, onToday }: WeekNavigationProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onPrev} data-testid="nav-prev">{'← Prev'}</button>
      <button onClick={onToday} data-testid="nav-today">Today</button>
      <button onClick={onNext} data-testid="nav-next">{'Next →'}</button>
      <span style={{ marginLeft: 8, opacity: 0.7 }}>Week starting {weekStartISO}</span>
    </div>
  );
}


