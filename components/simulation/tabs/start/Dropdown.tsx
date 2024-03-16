import React, { useState } from 'react';

export interface Option {
  value: string;
  label: string;
}

export interface DropdownProps {
  options: Option[];
  onSelect: (value: string) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({ options, onSelect }) => {
  const [selectedOption, setSelectedOption] = useState<string>('');

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedOption(value);
    onSelect(value);
  };

  return (
    <div>
      <select value={selectedOption} onChange={handleOptionChange} className="min-w-0 bg-grey-mid p-1">
        <option value="">--Choose an option--</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};
