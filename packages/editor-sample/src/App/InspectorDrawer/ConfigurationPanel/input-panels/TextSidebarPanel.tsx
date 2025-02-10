import React, { useState } from 'react';
import { TextProps, TextPropsSchema } from '@usewaypoint/block-text';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import BooleanInput from './helpers/inputs/BooleanInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
import DropdownInput from './helpers/inputs/DropdownInput'; // Assuming there's a dropdown component

type TextSidebarPanelProps = {
  data: TextProps;
  setData: (v: TextProps) => void;
};

// Predefined variables (unused here but kept for reference)
const PREDEFINED_VARIABLES = [
  { label: 'First Name', value: '%firstname%' },
  { label: 'Last Name', value: '%lastname%' },
  { label: 'Email', value: '%email%' },
  { label: 'Company', value: '%company%' },
  { label: 'Unsubscribe', value: '%unsubcribe%' }
];

export default function TextSidebarPanel({ data, setData }: TextSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  // We'll use a "version" state to force re‑mounting the TextInput
  // only when a variable is inserted.
  const [version, setVersion] = useState(0);

  // Generic update function that validates and passes new data upward.
  const updateData = (d: unknown) => {
    const res = TextPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  return (
    <BaseSidebarPanel title="Text block">
      <TextInput
        key={`text-${version}`}
        label="Content"
        rows={5}
        defaultValue={data.props?.text ?? ''}
        onChange={(text: string) => {
          updateData({ ...data, props: { ...data.props, text } });
        }}
      />

      {/* Dropdown to insert variables */}
      <DropdownInput
        label="Insert Variable"
        onChange={(variable: string) => {
          // Use the stored text from the parent's data.
          // (Make sure that TextInput’s onChange is sending the full text.)
          const currentText = data.props?.text || '';
          const updatedText = `${currentText} ${variable}`.trim();
          updateData({ ...data, props: { ...data.props, text: updatedText } });
          // Increment the version to force the TextInput to re-mount
          // and pick up the new defaultValue.
          setVersion((prev) => prev + 1);
        }}
      />

      <BooleanInput
        label="Markdown"
        defaultValue={data.props?.markdown ?? false}
        onChange={(markdown: boolean) =>
          updateData({ ...data, props: { ...data.props, markdown } })
        }
      />

      <MultiStylePropertyPanel
        names={[
          'color',
          'backgroundColor',
          'fontFamily',
          'fontSize',
          'fontWeight',
          'textAlign',
          'padding'
        ]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
