import React, { useMemo } from 'react';
import { FileDownloadOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { renderToStaticMarkup } from '@usewaypoint/email-builder'; // Ensure this import is correct
import { useDocument } from '../../../documents/editor/EditorContext';

export default function DownloadJson() {
  const document = useDocument(); // Correctly get the document

  const href = useMemo(() => {
    // Generate the HTML markup from the document
    const markup = renderToStaticMarkup(document, { rootBlockId: 'root' });

    // Create a blob from the HTML markup
    const blob = new Blob([markup], { type: 'text/html' });

    // Generate a URL for the blob
    return URL.createObjectURL(blob);
  }, [document]);

  return (
    <Tooltip title="Download HTML file">
      <IconButton href={href} download="emailTemplate.html">
        <FileDownloadOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

