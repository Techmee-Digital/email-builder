import React, { useEffect, useState } from 'react';
import { MonitorOutlined, PhoneIphoneOutlined } from '@mui/icons-material';
import { Box, Stack, SxProps, ToggleButton, ToggleButtonGroup, Tooltip, Button } from '@mui/material';
import { Reader, renderToStaticMarkup } from '@usewaypoint/email-builder';

import EditorBlock from '../../documents/editor/EditorBlock';
import {
  setSelectedScreenSize,
  useDocument,
  useSelectedMainTab,
  useSelectedScreenSize,
  resetDocument,
  setSelectedMainTab,
} from '../../documents/editor/EditorContext';
import ToggleInspectorPanelButton from '../InspectorDrawer/ToggleInspectorPanelButton';
import ToggleSamplesPanelButton from '../SamplesDrawer/ToggleSamplesPanelButton';

import DownloadJson from './DownloadJson';
import HtmlPanel from './HtmlPanel';
import JsonPanel from './JsonPanel';
import MainTabsGroup from './MainTabsGroup';
import ShareButton from './ShareButton';

// Extract path segments from the URL.
const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
// Determine if the URL is a share link (i.e. starts with "share")
const isShareFlow = pathSegments[0] === 'share' && !!pathSegments[1];
// In normal mode, parse the campaignId from the last segment
const campaignId = !isShareFlow ? parseInt(pathSegments[pathSegments.length - 1], 10) : undefined;
// If in share mode, the second segment is the share token
const shareToken = isShareFlow ? pathSegments[1] : null;

export default function TemplatePanel() {
  const document = useDocument();
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();

  // Track if the share link is view-only (hide controls if so)
  const [viewOnly, setViewOnly] = useState(false);
  // Track the actual campaign ID returned by the share-info endpoint
  const [sharedCampaignId, setSharedCampaignId] = useState<number | undefined>(undefined);

  // Fetch share details (for share links)
  const fetchShareDetails = async (token: string) => {
    try {
      const response = await fetch(`https://emailbuilder.acumendashboards.com/share-info/${token}`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        window.location.href = 'https://emailbuilder.acumendashboards.com/';
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch share details: ${response.statusText}`);
      }
      const data = await response.json();

      // If the server includes campaign_id in the response, store it
      if (data.campaign_id) {
        setSharedCampaignId(data.campaign_id);
      }

      // If access_type is "view", force preview mode & mark as view-only
      if (data.access_type === 'view') {
        setSelectedMainTab('preview');
        setViewOnly(true);
      }

      // Load the content into the editor
      resetDocument(data.campaign.content);
    } catch (error) {
      console.error('Error fetching share details:', error);
    }
  };

  // Fetch campaign data for normal (non-share) access
  const fetchCampaignData = async (campaignId: number) => {
    try {
      if (isNaN(campaignId)) {
        console.error('Invalid campaign ID');
        window.location.href = 'https://emailbuilder.acumendashboards.com/campaigns';
        return;
      }
      const response = await fetch(`https://emailbuilder.acumendashboards.com/get-campaign/${campaignId}`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        window.location.href = 'https://emailbuilder.acumendashboards.com/';
        return;
      }
      if (response.status === 403 || response.status === 404) {
        window.location.href = 'https://emailbuilder.acumendashboards.com/campaigns';
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch campaign data: ${response.statusText}`);
      }
      const data = await response.json();
      resetDocument(data.content);
    } catch (error) {
      console.error('Error fetching campaign:', error);
    }
  };

  // On mount, check if share or normal mode
  useEffect(() => {
    if (isShareFlow && shareToken) {
      // In share mode, fetch share details
      fetchShareDetails(shareToken);
    } else if (campaignId !== undefined) {
      // Otherwise, fetch normal campaign data
      fetchCampaignData(campaignId);
    }
  }, [isShareFlow, shareToken, campaignId]);

  const handleDoneClick = async () => {
    // Convert the document to HTML
    const markup = renderToStaticMarkup(document, { rootBlockId: 'root' });
    try {
      // If share mode, use the real ID from share; else use the normal ID
      const actualCampaignId = isShareFlow
        ? sharedCampaignId // might be undefined if share-info hasn't loaded
        : (campaignId || parseInt(window.location.pathname.split('/').pop() || '0', 10));
  
      if (!actualCampaignId) {
        console.error('No valid campaign ID available for saving.');
        return;
      }
  
      // Build the payload
      const payload: any = {
        campaign_id: actualCampaignId,
        html: markup,
        JSON: JSON.stringify(document),
      };
      // Include share token if available (to allow saving via share edit access)
      if (isShareFlow && shareToken) {
        payload.token = shareToken;
      }
  
      const response = await fetch('https://emailbuilder.acumendashboards.com/save_campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save campaign: ${response.statusText}`);
      }
      console.log('Campaign saved successfully!');
      
      // If not in share mode, redirect to the campaigns page.
      // In share mode (edit), we do not redirect.
      if (!isShareFlow) {
        window.location.href = 'https://emailbuilder.acumendashboards.com/campaigns';
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error saving campaign:', error.message);
      } else {
        console.error('Error saving campaign:', error);
      }
    }
  };
  

  let mainBoxSx: SxProps = { height: '100%' };
  if (selectedScreenSize === 'mobile') {
    mainBoxSx = {
      ...mainBoxSx,
      margin: '32px auto',
      width: 370,
      height: 800,
      boxShadow:
        'rgba(33, 36, 67, 0.04) 0px 10px 20px, rgba(33, 36, 67, 0.04) 0px 2px 6px, rgba(33, 36, 67, 0.04) 0px 0px 1px',
    };
  }

  const handleScreenSizeChange = (_: unknown, value: unknown) => {
    switch (value) {
      case 'mobile':
      case 'desktop':
        setSelectedScreenSize(value);
        return;
      default:
        setSelectedScreenSize('desktop');
        return;
    }
  };

  const renderMainPanel = () => {
    if (viewOnly) {
      // If view-only share, always show preview
      return (
        <Box sx={mainBoxSx}>
          <Reader document={document} rootBlockId="root" />
        </Box>
      );
    }
    // Normal rendering based on selectedMainTab
    switch (selectedMainTab) {
      case 'editor':
        return (
          <Box sx={mainBoxSx}>
            <EditorBlock id="root" />
          </Box>
        );
      case 'preview':
        return (
          <Box sx={mainBoxSx}>
            <Reader document={document} rootBlockId="root" />
          </Box>
        );
      case 'html':
        return <HtmlPanel />;
      case 'json':
        return <JsonPanel />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Hide header controls if share is viewOnly */}
      {!viewOnly && (
        <Stack
          sx={{
            height: 49,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 'appBar',
            px: 1,
          }}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <ToggleSamplesPanelButton />
          <Stack
            px={2}
            direction="row"
            gap={2}
            width="100%"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={2}>
              <MainTabsGroup />
            </Stack>
            <Stack direction="row" spacing={2}>
              <DownloadJson />
              <Button variant="contained" color="primary" onClick={handleDoneClick}>
                Save
              </Button>
              <ToggleButtonGroup value={selectedScreenSize} exclusive size="small" onChange={handleScreenSizeChange}>
                <ToggleButton value="desktop">
                  <Tooltip title="Desktop view">
                    <MonitorOutlined fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="mobile">
                  <Tooltip title="Mobile view">
                    <PhoneIphoneOutlined fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              <ShareButton campaignId={campaignId!} />
            </Stack>
          </Stack>
          <ToggleInspectorPanelButton />
        </Stack>
      )}
      <Box sx={{ height: 'calc(100vh - 49px)', overflow: 'auto', minWidth: 370 }}>
        {renderMainPanel()}
      </Box>
    </>
  );
}
