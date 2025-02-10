import React, { useState } from 'react';

import { ToggleButton } from '@mui/material';
import { HeadingProps, HeadingPropsDefaults, HeadingPropsSchema } from '@usewaypoint/block-heading';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
import DropdownInput from './helpers/inputs/DropdownInput';

type HeadingSidebarPanelProps = {
  data: HeadingProps;
  setData: (v: HeadingProps) => void;
};

export default function HeadingSidebarPanel({ data, setData }: HeadingSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  // Version state to force a re-mount of the TextInput when a variable is inserted.
  const [version, setVersion] = useState(0);

  const updateData = (d: unknown) => {
    const res = HeadingPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  return (
    <BaseSidebarPanel title="Heading block">
      <TextInput
        key={`heading-text-${version}`}
        label="Content"
        rows={3}
        defaultValue={data.props?.text ?? HeadingPropsDefaults.text}
        onChange={(text: string) => {
          updateData({ ...data, props: { ...data.props, text } });
        }}
      />
      <DropdownInput
        label="Insert Variable"
        onChange={(variable: string) => {
          // Append the variable to the current heading text.
          const currentText = data.props?.text || '';
          const updatedText = `${currentText} ${variable}`.trim();
          updateData({ ...data, props: { ...data.props, text: updatedText } });
          // Increment version to force re-mount so that the new defaultValue is picked up.
          setVersion((prev) => prev + 1);
        }}
      />
      <RadioGroupInput
        label="Level"
        defaultValue={data.props?.level ?? HeadingPropsDefaults.level}
        onChange={(level: string) => {
          updateData({ ...data, props: { ...data.props, level } });
        }}
      >
        <ToggleButton value="h1">H1</ToggleButton>
        <ToggleButton value="h2">H2</ToggleButton>
        <ToggleButton value="h3">H3</ToggleButton>
      </RadioGroupInput>
      <MultiStylePropertyPanel
        names={['color', 'backgroundColor', 'fontFamily', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
