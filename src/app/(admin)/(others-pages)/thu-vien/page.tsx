'use client';

import React from 'react';
import { FileManager } from '@/components/file-manager/FileManager';
import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';

const ThuVienPage = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Thư viện" />


      <ComponentCard title="Thư viện File">
        <FileManager />
      </ComponentCard>
    </>
  );
};

export default ThuVienPage; 