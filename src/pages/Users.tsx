import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Grid, List } from 'lucide-react';
import { mockUsers, API_BASE } from '@/lib/auth';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export default function Users() {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [users, setUsers] = useState<typeof mockUsers>(mockUsers);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/api/users`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) setUsers(data);
      })
      .catch(() => {});
    return () => { mounted = false };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name')),
      email: String(formData.get('email')),
      phone: String(formData.get('phone') || ''),
      department: String(formData.get('department') || ''),
      role: String(formData.get('role') || 'employee'),
      designation: String(formData.get('designation') || ''),
      password: String(formData.get('password') || 'password123'),
    };
    // simple client-side validation
    if (!payload.name || !payload.email) {
      toast({ title: 'Validation', description: 'Name and email are required', variant: 'destructive' });
      return;
    }

    // submit
    try {
      (e.target as HTMLFormElement).querySelector('button[type="submit"]')?.setAttribute('disabled','true');
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data && data.message ? data.message : `Create failed (${res.status})`;
        throw new Error(msg);
      }
      setUsers((u) => [data, ...u]);
      setOpen(false);
      toast({ title: 'User Created', description: 'New user has been added successfully.' });
    } catch (err: any) {
      console.error('Create user failed:', err);
      const message = err && err.message ? err.message : 'Could not create user';
      toast({ title: 'Failed', description: message, variant: 'destructive' });
    } finally {
      (e.target as HTMLFormElement).querySelector('button[type="submit"]')?.removeAttribute('disabled');
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      admin: 'destructive',
      hr_officer: 'secondary',
      payroll_officer: 'secondary',
      employee: 'default',
    };
    return (
      <Badge variant={variants[role] || 'default'}>
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage employees and user accounts"
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9 w-64" />
            </div>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new employee account</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="john@workzen.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="+1234567890" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <select id="department" name="department" className="input w-full">
                          <option value="">Select department</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Finance">Finance</option>
                          <option value="Sales">Sales</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select id="role" name="role" className="input w-full">
                          <option value="employee">Employee</option>
                          <option value="hr_officer">HR Officer</option>
                          <option value="payroll_officer">Payroll Officer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input id="designation" name="designation" placeholder="Software Engineer" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" placeholder="password123" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create User</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {user.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.designation}</p>
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">{user.department}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Role</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium truncate max-w-[150px]">{user.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.designation}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
