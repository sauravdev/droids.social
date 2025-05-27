import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, MessageSquare, BarChart3, Lightbulb, Sparkles, UserCircle, Brain, Image } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

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
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white p-6">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                active={isActive(item.to)}
                icon={item.icon}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
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
}

function NavLink({ to, active, icon, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
        active
          ? 'bg-purple-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}