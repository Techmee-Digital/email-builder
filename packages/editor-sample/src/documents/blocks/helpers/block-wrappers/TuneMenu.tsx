import React, { useState } from 'react';
import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  DeleteOutlined,
  StarBorderOutlined,
} from '@mui/icons-material';
import {
  IconButton,
  Paper,
  Stack,
  SxProps,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';

import { TEditorBlock } from '../../../editor/core';
import {
  resetDocument,
  setSelectedBlockId,
  useDocument,
} from '../../../editor/EditorContext';
import { ColumnsContainerProps } from '../../ColumnsContainer/ColumnsContainerPropsSchema';

const sx: SxProps = {
  position: 'absolute',
  top: 0,
  left: -56,
  borderRadius: 64,
  paddingX: 0.5,
  paddingY: 1,
  zIndex: 'fab',
};

type Props = {
  blockId: string;
};

export default function TuneMenu({ blockId }: Props) {
  const document = useDocument();

  // State for the Save Block modal
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [saveBlockName, setSaveBlockName] = useState('');

  const handleDeleteClick = () => {
    const filterChildrenIds = (childrenIds: string[] | null | undefined) => {
      if (!childrenIds) return childrenIds;
      return childrenIds.filter((f) => f !== blockId);
    };
    const nDocument: typeof document = { ...document };
    for (const [id, b] of Object.entries(nDocument)) {
      const block = b as TEditorBlock;
      if (id === blockId) continue;
      switch (block.type) {
        case 'EmailLayout':
          nDocument[id] = {
            ...block,
            data: {
              ...block.data,
              childrenIds: filterChildrenIds(block.data.childrenIds),
            },
          };
          break;
        case 'Container':
          nDocument[id] = {
            ...block,
            data: {
              ...block.data,
              props: {
                ...block.data.props,
                childrenIds: filterChildrenIds(block.data.props?.childrenIds),
              },
            },
          };
          break;
        case 'ColumnsContainer':
          nDocument[id] = {
            type: 'ColumnsContainer',
            data: {
              style: block.data.style,
              props: {
                ...block.data.props,
                columns: block.data.props?.columns?.map((c) => ({
                  childrenIds: filterChildrenIds(c.childrenIds),
                })),
              },
            } as ColumnsContainerProps,
          };
          break;
        default:
          nDocument[id] = block;
      }
    }
    delete nDocument[blockId];
    resetDocument(nDocument);
    setSelectedBlockId(null);
    // Dispatch event to refresh blocks panel
    window.dispatchEvent(new Event('blocksChanged'));
  };

  const handleMoveClick = (direction: 'up' | 'down') => {
    const moveChildrenIds = (ids: string[] | null | undefined) => {
      if (!ids) return ids;
      const index = ids.indexOf(blockId);
      if (index < 0) return ids;
      const childrenIds = [...ids];
      if (direction === 'up' && index > 0) {
        [childrenIds[index], childrenIds[index - 1]] = [childrenIds[index - 1], childrenIds[index]];
      } else if (direction === 'down' && index < childrenIds.length - 1) {
        [childrenIds[index], childrenIds[index + 1]] = [childrenIds[index + 1], childrenIds[index]];
      }
      return childrenIds;
    };
    const nDocument: typeof document = { ...document };
    for (const [id, b] of Object.entries(nDocument)) {
      const block = b as TEditorBlock;
      if (id === blockId) continue;
      switch (block.type) {
        case 'EmailLayout':
          nDocument[id] = {
            ...block,
            data: {
              ...block.data,
              childrenIds: moveChildrenIds(block.data.childrenIds),
            },
          };
          break;
        case 'Container':
          nDocument[id] = {
            ...block,
            data: {
              ...block.data,
              props: {
                ...block.data.props,
                childrenIds: moveChildrenIds(block.data.props?.childrenIds),
              },
            },
          };
          break;
        case 'ColumnsContainer':
          nDocument[id] = {
            type: 'ColumnsContainer',
            data: {
              style: block.data.style,
              props: {
                ...block.data.props,
                columns: block.data.props?.columns?.map((c) => ({
                  childrenIds: moveChildrenIds(c.childrenIds),
                })),
              },
            } as ColumnsContainerProps,
          };
          break;
        default:
          nDocument[id] = block;
      }
    }
    resetDocument(nDocument);
    setSelectedBlockId(blockId);
  };

  // Open the modal when the save button is clicked
  const handleOpenSaveModal = () => {
    setOpenSaveModal(true);
  };

  // Handle modal cancel
  const handleCancelSave = () => {
    setOpenSaveModal(false);
    setSaveBlockName('');
  };

  // Handle saving the block via the modal
  const handleModalSave = async () => {
    if (!saveBlockName.trim()) {
      alert('Please enter a block name.');
      return;
    }

    const blockConfig = document[blockId];
    if (!blockConfig) {
      alert('Block configuration not found.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/blocks', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: saveBlockName,
          configuration: blockConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save block.');
      }

      await response.json();
      setSaveBlockName('');
      setOpenSaveModal(false);
      // Dispatch event to refresh blocks panel after save
      window.dispatchEvent(new Event('blocksChanged'));
    } catch (error: any) {
      alert('Error saving block: ' + error.message);
    }
  };

  return (
    <>
      <Paper sx={sx} onClick={(ev) => ev.stopPropagation()}>
        <Stack>
          <Tooltip title="Move up" placement="left-start">
            <IconButton onClick={() => handleMoveClick('up')} sx={{ color: 'text.primary' }}>
              <ArrowUpwardOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move down" placement="left-start">
            <IconButton onClick={() => handleMoveClick('down')} sx={{ color: 'text.primary' }}>
              <ArrowDownwardOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save block" placement="left-start">
            <IconButton onClick={handleOpenSaveModal} sx={{ color: 'text.primary' }}>
              <StarBorderOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" placement="left-start">
            <IconButton onClick={handleDeleteClick} sx={{ color: 'text.primary' }}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <Dialog open={openSaveModal} onClose={handleCancelSave}>
        <DialogTitle>Save Block</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a name for this block.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Block Name"
            fullWidth
            value={saveBlockName}
            onChange={(e) => setSaveBlockName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave}>Cancel</Button>
          <Button onClick={handleModalSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
