import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, MessageSquare, BarChart3, Lightbulb, Sparkles, UserCircle, Brain, Image, Menu, X } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
    { to: "/strategy", icon: <Lightbulb />, label: "AI Post generator" },
    { to: "/generator", icon: <Sparkles />, label: "Custom generator" },
    { to: "/carousel", icon: <Image />, label: "Carousel Generator" },
    { to: "/calendar", icon: <Calendar />, label: "Content Calendar" },
    // { to: "/engage", icon: <MessageSquare />, label: "Engagement" },
    { to: "/analytics", icon: <BarChart3 />, label: "Analytics" },
    { to: "/models", icon: <Brain />, label: "Custom Models" },
    { to: "/settings", icon: <UserCircle />, label: "Profile Settings" }
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      
      {/* Mobile menu button */}
      <div className="lg:hidden bg-gray-800 p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2 rounded-lg hover:bg-gray-700 transition"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      <div className="flex-1 flex relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          w-64 bg-gray-800 text-white p-6 transition-transform duration-300 ease-in-out z-30
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed lg:relative h-full lg:h-auto top-0 left-0
        `}>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                active={isActive(item.to)}
                icon={item.icon}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

interface NavLinkProps {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavLink({ to, active, icon, children, onClick }: NavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
        active
          ? 'bg-purple-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}