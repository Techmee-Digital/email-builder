import React, { useState } from 'react';
import { MenuItem, TextField } from '@mui/material';

// Predefined variable options
const VARIABLE_OPTIONS = [
  { label: 'First Name', value: '%firstname%' },
  { label: 'Last Name', value: '%lastname%' },
  { label: 'Email', value: '%email%' },
  { label: 'Company', value: '%company%' },
  { label: 'Unsubscribe', value: '%unsubscribe%' }
];

type DropdownInputProps = {
  label: string;
  onChange: (value: string) => void;
  defaultValue?: string;
};

export function DropdownInput({ label, onChange, defaultValue }: DropdownInputProps) {
  const [value, setValue] = useState(defaultValue ?? '');

  return (
    <TextField
      select
      variant="standard"
      label={label}
      value={value}
      onChange={(ev) => {
        const selectedValue = ev.target.value;
        setValue(selectedValue);
        onChange(selectedValue);
      }}
    >
      {/* Default option (blank) */}
      <MenuItem value="">None</MenuItem>

      {/* Dynamically render variable options */}
      {VARIABLE_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default DropdownInput;
