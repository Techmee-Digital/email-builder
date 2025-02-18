import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { useDocument, setDocument, setSelectedBlockId } from '../../documents/editor/EditorContext';

function generateUniqueId() {
  return 'block_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

interface SidebarButtonProps extends ButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function SidebarButton({ href, children, ...rest }: SidebarButtonProps) {
  const document = useDocument();

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const prefix = '#db/';
    if (href.startsWith(prefix)) {
      const blockId = href.substring(prefix.length);
      try {
        const response = await fetch(`http://127.0.0.1:5000/blocks/${blockId}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          console.error('Failed to fetch block configuration');
          return;
        }
        const data = await response.json();
        const newBlockId = generateUniqueId();
        const newDocument = { ...document, [newBlockId]: data.configuration };

        if (newDocument.root && newDocument.root.data && Array.isArray(newDocument.root.data.childrenIds)) {
          newDocument.root = {
            ...newDocument.root,
            data: {
              ...newDocument.root.data,
              childrenIds: [...newDocument.root.data.childrenIds, newBlockId],
            },
          };
        }

        setDocument(newDocument);
        setSelectedBlockId(newBlockId);
      } catch (error) {
        console.error('Error fetching block:', error);
      }
    }
  };

  return (
    <Button size="small" onClick={handleClick} {...rest}>
      {children}
    </Button>
  );
}
