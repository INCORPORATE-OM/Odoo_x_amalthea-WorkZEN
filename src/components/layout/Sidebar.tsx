import { LayoutDashboard, Clock, FileText, IndianRupee, Users, Settings, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { getCurrentUser, logout, hasRole } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const Sidebar = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'employee', 'hr_officer', 'payroll_officer'] },
    { icon: Clock, label: 'Attendance', path: '/attendance', roles: ['admin', 'employee', 'hr_officer', 'payroll_officer'] },
    { icon: FileText, label: 'Leave', path: '/leave', roles: ['admin', 'employee', 'hr_officer', 'payroll_officer'] },
  { icon: IndianRupee, label: 'Payroll', path: '/payroll', roles: ['admin', 'payroll_officer'] },
    { icon: Users, label: 'Users', path: '/users', roles: ['admin', 'hr_officer'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'employee', 'hr_officer', 'payroll_officer'] },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">WorkZen</h1>
        <p className="text-sm text-muted-foreground">HRMS</p>
      </div>

      <Separator />

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const canAccess = hasRole(item.roles as any);
          
          if (!canAccess) return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <Separator />

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};
