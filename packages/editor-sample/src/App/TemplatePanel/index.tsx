import React, { useEffect } from 'react';
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
} from '../../documents/editor/EditorContext';
import ToggleInspectorPanelButton from '../InspectorDrawer/ToggleInspectorPanelButton';
import ToggleSamplesPanelButton from '../SamplesDrawer/ToggleSamplesPanelButton';

import DownloadJson from './DownloadJson';
import HtmlPanel from './HtmlPanel';
import JsonPanel from './JsonPanel';
import MainTabsGroup from './MainTabsGroup';
import ShareButton from './ShareButton';

export default function TemplatePanel() {
  const document = useDocument();  // Hook should be called directly in the component
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();
  // Extract the campaign ID from the URL
  const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
  const campaignId = parseInt(pathSegments[pathSegments.length - 1], 10);

  useEffect(() => {
    const fetchInitialJson = async () => {
      try {
        // Validate campaign ID
        if (isNaN(campaignId)) {
          console.error('Invalid campaign ID');
          window.location.href = 'http://127.0.0.1:5000/campaigns';
          return;
        }
        // Fetch the campaign data
        const response = await fetch(`http://127.0.0.1:5000/get-campaign/${campaignId}`, {
          credentials: 'include', // Include session cookies
        });
        // Handle unauthorized access
        if (response.status === 401) {
          console.warn('Unauthorized access, redirecting to login page.');
          window.location.href = 'http://127.0.0.1:5000/'; // Redirect to login
          return;
        }
        // Handle forbidden access
        if (response.status === 403) {
          console.warn('Access forbidden, redirecting to campaigns page.');
          window.location.href = 'http://127.0.0.1:5000/campaigns'; // Redirect to campaigns page
          return;
        }
        // Handle invalid campaigns
        if (response.status === 404) {
          console.warn('Access forbidden, redirecting to campaigns page.');
          window.location.href = 'http://127.0.0.1:5000/campaigns'; // Redirect to campaigns page
          return;
        }
        // Handle other errors
        if (!response.ok) {
          throw new Error(`Failed to fetch campaign data: ${response.statusText}`);
        }
        // Parse and use the campaign data
        const data = await response.json();
        resetDocument(data.content);
      } catch (error) {
        console.error('Error fetching campaign:', error);
      }
    };
    fetchInitialJson();
  }, []);

  const handleDoneClick = async () => {
    const markup = renderToStaticMarkup(document, { rootBlockId: 'root' });
    try {
      const response = await fetch('http://127.0.0.1:5000/save_campaign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          html: markup,
          JSON: JSON.stringify(document), // Explicitly stringify nested JSON
        }),        
        credentials: 'include', // Include session cookies
      });
      // Check for HTTP errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save campaign: ${response.statusText}`);
      } 
      console.log('Campaign saved successfully!');
      // Redirect to the campaign page using the campaignId
      window.location.href = `http://127.0.0.1:5000/campaigns`;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error saving campaign:', error.message);
      } else {
        console.error('Error saving campaign:', error);
      }
    }    
  };
  

  let mainBoxSx: SxProps = {
    height: '100%',
  };
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
    }
  };

  const renderMainPanel = () => {
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
    }
  };

  return (
    <>
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
        <Stack px={2} direction="row" gap={2} width="100%" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <MainTabsGroup />
          </Stack>
          <Stack direction="row" spacing={2}>
            <DownloadJson />
            {/* <ImportJson /> */}
            <Button variant="contained" color="primary" onClick={handleDoneClick}> Save </Button>
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
            <ShareButton />
          </Stack>
        </Stack>
        <ToggleInspectorPanelButton />
      </Stack>
      <Box sx={{ height: 'calc(100vh - 49px)', overflow: 'auto', minWidth: 370 }}>{renderMainPanel()}</Box>
    </>
  );
}
