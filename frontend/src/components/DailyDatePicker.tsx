import { TextField } from '@mui/material';

interface DailyDatePickerProps {
  value: string;
  onChange: (newDate: string) => void;
}

export default function DailyDatePicker({ value, onChange }: DailyDatePickerProps) {
  return (
    <TextField
      type="date"
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
    />
  );
}

