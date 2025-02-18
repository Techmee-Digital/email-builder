import React, { useEffect, useState, useCallback } from 'react';
import { Drawer, Stack, Typography, IconButton, Box } from '@mui/material';
import { DeleteOutlined } from '@mui/icons-material';
import { useSamplesDrawerOpen } from '../../documents/editor/EditorContext';
import SidebarButton from './SidebarButton';

export const SAMPLES_DRAWER_WIDTH = 240;

interface IBlock {
  id: number;
  name: string;
  // configuration is stored in the DB but not needed for listing
}

export default function BlocksDrawer() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const [blocks, setBlocks] = useState<IBlock[]>([]);

  const fetchBlocks = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/blocks', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch blocks');
      }
      const data = await response.json();
      setBlocks(data.blocks);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    const handleBlocksChanged = () => {
      fetchBlocks();
    };
    window.addEventListener('blocksChanged', handleBlocksChanged);
    return () => window.removeEventListener('blocksChanged', handleBlocksChanged);
  }, [fetchBlocks]);

  const handleDelete = async (blockId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/blocks/${blockId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete block');
      }
      fetchBlocks();
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={samplesDrawerOpen}
      sx={{
        width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
      }}
    >
      <Stack
        spacing={3}
        py={1}
        px={2}
        width={SAMPLES_DRAWER_WIDTH}
        justifyContent="space-between"
        height="100%"
      >
        <Stack spacing={2}>
          <Typography variant="h6" component="h1" sx={{ p: 0.75 }}>
            Blocks
          </Typography>
          <Stack spacing={1}>
            {blocks.length > 0 ? (
              blocks.map((block) => (
                <Box
                  key={block.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  width="100%"
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {/* Single-line styling for the block name */}
                  <SidebarButton
                    href={`#db/${block.id}`}
                    sx={{
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'left',
                      mr: 1, // spacing to the icon
                    }}
                  >
                    {block.name}
                  </SidebarButton>
                  <IconButton
                    onClick={() => handleDelete(block.id)}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No blocks available.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
}
