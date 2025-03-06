import React, { useState, useEffect } from 'react';
import {
  VerticalAlignBottomOutlined,
  VerticalAlignCenterOutlined,
  VerticalAlignTopOutlined,
  CloudUploadOutlined,
} from '@mui/icons-material';
import {
  Stack,
  ToggleButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import TextInput from './helpers/inputs/TextInput';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import TextDimensionInput from './helpers/inputs/TextDimensionInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import { ImageProps, ImagePropsSchema } from '@usewaypoint/block-image';
import * as Zod from 'zod';
import './gallery.css'; // External CSS for gallery thumbnails

type ImageSidebarPanelProps = {
  data: ImageProps;
  setData: (v: ImageProps) => void;
};

export default function ImageSidebarPanel({ data, setData }: ImageSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryItems, setGalleryItems] = useState<
    { id: number; url: string; filename: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');

  const updateData = (d: unknown) => {
    const res = ImagePropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  // Handle file selection.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload image via fetch to backend.
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await fetch('https://emailbuilder.acumendashboards.com/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (response.ok) {
        const result = await response.json();
        updateData({ ...data, props: { ...data.props, url: result.url } });
        setUploadModalOpen(false);
        setSelectedFile(null);
        // Refresh gallery items after upload.
        fetchGalleryItems();
      } else {
        console.error('Upload failed:', await response.text());
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Fetch gallery items from the /media?format=json endpoint with an optional search query.
  const fetchGalleryItems = async () => {
    try {
      const res = await fetch(`https://emailbuilder.acumendashboards.com/media?format=json&search_query=${encodeURIComponent(searchQuery)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.images) {
          setGalleryItems(data.images);
        }
      } else {
        console.error("Failed to fetch gallery items");
      }
    } catch (error) {
      console.error("Gallery fetch error:", error);
    }
  };

  // Refresh gallery items when the modal opens.
  useEffect(() => {
    if (uploadModalOpen) {
      fetchGalleryItems();
    }
  }, [uploadModalOpen, searchQuery]);

  return (
    <BaseSidebarPanel title="Image block">
      <Stack spacing={2}>
        {/* Source URL input with Gallery button */}
        <Stack direction="row" spacing={1} alignItems="center">
          <TextInput
            label="Source URL"
            defaultValue={data.props?.url ?? ''}
            onChange={(v) => {
              const url = v.trim().length === 0 ? null : v.trim();
              updateData({ ...data, props: { ...data.props, url } });
            }}
          />
          <Button
            variant="outlined"
            startIcon={<CloudUploadOutlined />}
            onClick={() => setUploadModalOpen(true)}
          >
            Gallery
          </Button>
        </Stack>

        <TextInput
          label="Alt text"
          defaultValue={data.props?.alt ?? ''}
          onChange={(alt) => updateData({ ...data, props: { ...data.props, alt } })}
        />
        <TextInput
          label="Click through URL"
          defaultValue={data.props?.linkHref ?? ''}
          onChange={(v) => {
            const linkHref = v.trim().length === 0 ? null : v.trim();
            updateData({ ...data, props: { ...data.props, linkHref } });
          }}
        />
        <Stack direction="row" spacing={2}>
          <TextDimensionInput
            label="Width"
            defaultValue={data.props?.width}
            onChange={(width) => updateData({ ...data, props: { ...data.props, width } })}
          />
          <TextDimensionInput
            label="Height"
            defaultValue={data.props?.height}
            onChange={(height) => updateData({ ...data, props: { ...data.props, height } })}
          />
        </Stack>
        <RadioGroupInput
          label="Alignment"
          defaultValue={data.props?.contentAlignment ?? 'middle'}
          onChange={(contentAlignment) => updateData({ ...data, props: { ...data.props, contentAlignment } })}
        >
          <ToggleButton value="top">
            <VerticalAlignTopOutlined fontSize="small" />
          </ToggleButton>
          <ToggleButton value="middle">
            <VerticalAlignCenterOutlined fontSize="small" />
          </ToggleButton>
          <ToggleButton value="bottom">
            <VerticalAlignBottomOutlined fontSize="small" />
          </ToggleButton>
        </RadioGroupInput>
        <MultiStylePropertyPanel
          names={['backgroundColor', 'textAlign', 'padding']}
          value={data.style}
          onChange={(style) => updateData({ ...data, style })}
        />
      </Stack>

      {/* Upload / Gallery Modal */}
      <Dialog
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Choose or Upload Image</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Upload New Image Section */}
            <Stack spacing={1}>
              <label htmlFor="upload-file" className="visually-hidden">Upload Image File</label>
              <input
                id="upload-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                aria-label="Upload image file"
              />
              <Button variant="contained" onClick={handleUpload} disabled={uploading || !selectedFile}>
                {uploading ? 'Uploading...' : 'Upload New Image'}
              </Button>
            </Stack>
            <Divider />
            {/* Gallery Search and Selection */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextInput
                  label="Search"
                  defaultValue={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  />
                <Button variant="outlined" onClick={fetchGalleryItems}>
                  Search
                </Button>
              </Stack>
              {galleryItems.length > 0 ? (
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {galleryItems.map((item) => (
                    <div
                      key={item.id}
                      className="gallery-item"
                      onClick={() => {
                        updateData({ ...data, props: { ...data.props, url: item.url } });
                        setUploadModalOpen(false);
                      }}
                    >
                      <img className="gallery-thumbnail" src={item.url} alt={item.filename} />
                      <p className="gallery-filename">{item.filename}</p>
                    </div>
                  ))}
                </Stack>
              ) : (
                <p>No images in gallery.</p>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </BaseSidebarPanel>
  );
}
