import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function MainLayout({ menuItems }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
      <div className="app-body">
        <Sidebar items={menuItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
