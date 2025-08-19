import './globals.css';
import 'react-toastify/dist/ReactToastify.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Metadata } from "next";
import { ToastContainer } from 'react-toastify';

export const metadata: Metadata = {
  title: " Moo Beef Steak Prime",
description:
  "Where Prime Cuts Meet Perfection",
  icons: "/images/logo/res.png",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`dark:bg-gray-900`} suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              {children}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
