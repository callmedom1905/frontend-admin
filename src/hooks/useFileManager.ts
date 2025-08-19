import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { FileItem, FileViewMode, FileManagerState } from '@/types/file-manager';
import { toast } from 'react-toastify';
import NotificationModal from '@/components/tables/NotificationModal';
import React from 'react';

export const useFileManager = () => {
  const [state, setState] = useState<FileManagerState>({
    files: [],
    currentPath: '',
    selectedFiles: [],
    viewMode: 'grid',
    isLoading: false,
    error: null,
  });

  const [notification, setNotification] = useState<{
    open: boolean;
    title: string;
    description: string;
    emoji?: React.ReactNode;
    acceptText?: string;
    onAccept?: () => void;
  }>(
    {
      open: false,
      title: '',
      description: '',
      emoji: undefined,
      acceptText: 'OK',
      onAccept: () => setNotification((prev) => ({ ...prev, open: false })),
    }
  );

  const setFiles = useCallback((files: FileItem[]) => {
    setState(prev => ({ ...prev, files }));
  }, []);

  const setCurrentPath = useCallback((path: string) => {
    console.log('setCurrentPath called with:', path);
    // Chỉ normalize trailing slash, giữ nguyên leading slash nếu có
    let normalizedPath = path;
    if (normalizedPath.endsWith('/') && normalizedPath.length > 1) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    console.log('setCurrentPath normalized:', normalizedPath);
    setState(prev => ({ ...prev, currentPath: normalizedPath, selectedFiles: [] }));
  }, []);

  const setSelectedFiles = useCallback((files: FileItem[]) => {
    setState(prev => ({ ...prev, selectedFiles: files }));
  }, []);

  const setViewMode = useCallback((mode: FileViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('loadFiles called with currentPath:', state.currentPath);
      
      // Thử các format path khác nhau cho Laravel File Manager
      let workingDir = state.currentPath || '';
      
      // LFM có thể cần path với leading slash
      if (workingDir && !workingDir.startsWith('/')) {
        workingDir = '/' + workingDir;
      }
      
      console.log('loadFiles working_dir param (with leading slash):', workingDir);
      
      // Thử cả encoded và non-encoded
      const urls = [
        `/file-manager/jsonitems?working_dir=${encodeURIComponent(workingDir)}`,
        `/file-manager/jsonitems?working_dir=${workingDir}`,
      ];
      
      let response = null;
      let usedUrl = '';
      
      // Thử từng URL format
      for (const url of urls) {
        try {
          console.log('Trying URL:', url);
          response = await apiClient.get(url);
          usedUrl = url;
          console.log('Success with URL:', url);
          break;
        } catch (error) {
          console.log('Failed with URL:', url, error);
          continue;
        }
      }
      
      if (!response) {
        throw new Error('All URL formats failed');
      }
      
      console.log('loadFiles successful URL:', usedUrl);
      console.log('loadFiles full response:', response);
      console.log('loadFiles response working_dir:', (response as any).working_dir);
      
      // Laravel File Manager returns items in the response
      let items = [];
      if (response && typeof response === 'object') {
        if (Array.isArray((response as any).items)) {
          items = (response as any).items;
        } else if (Array.isArray(response)) {
          items = response;
        } else {
          console.log('Unexpected response format:', response);
        }
      }
      
      console.log('loadFiles parsed items:', items);
      setFiles(items);
    } catch (error) {
      console.error('loadFiles error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [state.currentPath]);

  const uploadFile = useCallback(async (file: File, path: string = '') => {
    const formData = new FormData();
    formData.append('upload', file);
    formData.append('working_dir', path || state.currentPath);
    formData.append('type', 'Files');

    try {
      const response = await apiClient.post('/file-manager/upload', formData);
      // LFM upload returns JSON with success status
      if (response && typeof response === 'object' && (response as any).status === 'success') {
        await loadFiles();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      throw error;
    }
  }, [loadFiles, state.currentPath]);

  const deleteFiles = useCallback(async (fileNames: string[]) => {
    try {
      // LFM expects items as array, not comma-separated string
      const items = fileNames.map(name => encodeURIComponent(name));
      const response = await apiClient.get(`/file-manager/delete?items[]=${items.join('&items[]=')}&working_dir=${state.currentPath}`);
      // LFM returns "OK" as text response, not JSON
      if (typeof response === 'string') {
        if (response === 'OK') {
          await loadFiles();
          setSelectedFiles([]);
        } else {
          throw new Error(response);
        }
      } else {
        throw new Error('Failed to delete files');
      }
    } catch (error: any) {
      // Nếu là lỗi 400 khi xóa folder, luôn báo thư mục không trống
      if (error?.response?.status === 400 || error?.status === 400 || (error?.message && error.message.includes('400'))) {
        setError('Không thể xóa thư mục này vì nó không trống!');
        setNotification({
          open: true,
          title: 'Không thể xóa thư mục',
          description: 'Không thể xóa thư mục này vì nó không trống!',
          emoji: React.createElement('span', { style: { fontSize: 28 } }, '⚠️'),
          acceptText: 'OK',
          onAccept: () => setNotification((prev) => ({ ...prev, open: false })),
        });
        await loadFiles();
      } else {
        setError(error instanceof Error ? error.message : 'Failed to delete files');
      }
    }
  }, [state.currentPath, loadFiles]);

  const createFolder = useCallback(async (folderName: string) => {
    try {
      const response = await apiClient.get(`/file-manager/newfolder?name=${encodeURIComponent(folderName)}&working_dir=${state.currentPath}`);
      // LFM returns "OK" as text response, not JSON
      if (typeof response === 'string') {
        if (response === 'OK') {
          await loadFiles();
        } else {
          throw new Error(response);
        }
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create folder');
    }
  }, [state.currentPath, loadFiles]);

  const renameFile = useCallback(async (oldName: string, newName: string) => {
    try {
      const response = await apiClient.get(`/file-manager/rename?file=${encodeURIComponent(oldName)}&new_name=${encodeURIComponent(newName)}&working_dir=${state.currentPath}`);
      // LFM returns "OK" as text response, not JSON
      if (typeof response === 'string') {
        if (response === 'OK') {
          await loadFiles();
        } else {
          throw new Error(response);
        }
      } else {
        throw new Error('Failed to rename file');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to rename file');
    }
  }, [state.currentPath, loadFiles]);

  const moveFiles = useCallback(async (fileNames: string[], destination: string) => {
    try {
      const items = fileNames.map(name => encodeURIComponent(name)).join('&items[]=');
      const response = await apiClient.get(`/file-manager/domove?items[]=${items}&destination=${encodeURIComponent(destination)}&working_dir=${state.currentPath}`);
      // LFM returns "OK" as text response, not JSON
      if (typeof response === 'string') {
        if (response === 'OK') {
          await loadFiles();
          setSelectedFiles([]);
        } else {
          throw new Error(response);
        }
      } else {
        throw new Error('Failed to move files');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to move files');
    }
  }, [state.currentPath, loadFiles]);

  const copyFiles = useCallback(async (fileNames: string[], destination: string) => {
    try {
      const items = fileNames.map(name => encodeURIComponent(name)).join('&items[]=');
      const response = await apiClient.get(`/file-manager/docopy?items[]=${items}&destination=${encodeURIComponent(destination)}&working_dir=${state.currentPath}`);
      // LFM returns "OK" as text response, not JSON
      if (typeof response === 'string') {
        if (response === 'OK') {
          await loadFiles();
        } else {
          throw new Error(response);
        }
      } else {
        throw new Error('Failed to copy files');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to copy files');
    }
  }, [state.currentPath, loadFiles]);

  const downloadFile = useCallback(async (file: FileItem) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${apiClient.getBaseUrl()}/api/file-manager/download?file=${encodeURIComponent(file.name)}&working_dir=${state.currentPath}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to download file');
    }
  }, [state.currentPath]);

  return {
    ...state,
    loadFiles,
    uploadFile,
    deleteFiles,
    createFolder,
    renameFile,
    moveFiles,
    copyFiles,
    downloadFile,
    setCurrentPath,
    setSelectedFiles,
    setViewMode,
    notification,
    setNotification,
  };
}; 