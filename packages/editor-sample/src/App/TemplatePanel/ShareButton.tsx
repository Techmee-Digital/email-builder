import React, { useState, useRef } from 'react';
import { IconButton, Menu, MenuItem, Snackbar, Tooltip, Box, Typography, Button } from '@mui/material';
import { IosShareOutlined } from '@mui/icons-material';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';

interface ShareButtonProps {
  campaignId: number;
}

export default function ShareButton({ campaignId }: ShareButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Store the generated share link
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Open the share menu.
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Close the share menu.
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Request a share link from the backend.
  const handleGenerateLink = async (accessType: 'view' | 'edit') => {
    try {
      setLoading(true);
      const response = await fetch('https://emailbuilder.acumendashboards.com/create-share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, access_type: accessType }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to generate share link.');
      }
      const data = await response.json();
      const token = data.token;
      const link = `${window.location.origin}/share/${token}`;
      setShareLink(link);
    } catch (error: any) {
      setShareLink(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      handleCloseMenu();
    }
  };

  // Close the snackbar notification.
  const handleCloseSnackbar = () => {
    setShareLink(null);
  };

  // Copy the share link to clipboard.
  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
    }
  };

  return (
    <Box sx={{ position: 'relative' }} ref={containerRef}>
      <IconButton onClick={handleClick}>
        <Tooltip title="Share current template">
          <IosShareOutlined fontSize="small" />
        </Tooltip>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => handleGenerateLink('view')} disabled={loading}>
          Share View-Only Link
        </MenuItem>
        <MenuItem onClick={() => handleGenerateLink('edit')} disabled={loading}>
          Share Edit Link
        </MenuItem>
      </Menu>
      
      <Snackbar
        open={shareLink !== null}
        onClose={handleCloseSnackbar}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // This will be overridden by sx
        sx={{
          position: 'absolute', 
          top: '100%',
          left: 0,
          right: 'auto',
          bottom: 'auto',
          transform: 'none',
          width: 'auto',
          maxWidth: '90%',
          mt: 2, // margin top
        }}
        message={
          <Box
            sx={{
              backgroundColor: 'white',
              border: '1px solid rgb(29, 106, 189)',
              padding: '8px 12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              color: 'black',
            }}
          >
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mr: 2
            }}>
              <Typography variant="body2">
                {shareLink}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleCopy}
              sx={{
                minWidth: 'auto',
                padding: '4px 8px',
                backgroundColor: 'rgb(29, 106, 189)',
                '&:hover': {
                  backgroundColor: 'rgb(21, 85, 156)',
                },
              }}
            >
              <ContentCopyOutlined fontSize="small" />
            </Button>
          </Box>
        }
        ContentProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      />
    </Box>
  );
}