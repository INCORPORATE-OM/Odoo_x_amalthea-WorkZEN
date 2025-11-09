import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check, X } from 'lucide-react';
import { mockLeaves } from '@/lib/mockData';
import { API_BASE } from '@/lib/auth';
import { useEffect } from 'react';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Leave() {
  const user = getCurrentUser();
  const canManage = hasRole(['payroll_officer', 'admin']);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaveTypeValue, setLeaveTypeValue] = useState<string>('sick');

  const handleApprove = (leaveId: string) => {
    // optimistic update pattern: call API, then replace the leave in state with updated record
    const url = `${API_BASE}/api/leaves/${leaveId}/action`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', approvedBy: user?.name }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to approve');
        }
        return r.json();
      })
      .then((updated) => {
        setLeaves((prev) => prev.map((l) => (l.id === String(updated.id) ? {
          id: String(updated.id),
          userId: String(updated.user_id || updated.userId),
          userName: updated.user_name || updated.userName,
          leaveType: updated.leave_type || updated.leaveType,
          startDate: updated.start_date || updated.startDate,
          endDate: updated.end_date || updated.endDate,
          reason: updated.reason,
          status: updated.status,
          approvedBy: updated.approved_by || updated.approvedBy,
        } : l)));
        toast({ title: 'Leave Approved', description: 'The leave request has been approved successfully.' });
      })
      .catch((err) => {
        console.error('Approve error', err);
        toast({ title: 'Approve failed', description: err.message || 'Approved (offline)' , variant: 'destructive'});
      });
  };

  const handleReject = (leaveId: string) => {
    const url = `${API_BASE}/api/leaves/${leaveId}/action`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', approvedBy: user?.name }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to reject');
        }
        return r.json();
      })
      .then((updated) => {
        setLeaves((prev) => prev.map((l) => (l.id === String(updated.id) ? {
          id: String(updated.id),
          userId: String(updated.user_id || updated.userId),
          userName: updated.user_name || updated.userName,
          leaveType: updated.leave_type || updated.leaveType,
          startDate: updated.start_date || updated.startDate,
          endDate: updated.end_date || updated.endDate,
          reason: updated.reason,
          status: updated.status,
          approvedBy: updated.approved_by || updated.approvedBy,
        } : l)));
        toast({ title: 'Leave Rejected', description: 'The leave request has been rejected.' , variant: 'destructive' });
      })
      .catch((err) => {
        console.error('Reject error', err);
        toast({ title: 'Reject failed', description: err.message || 'Rejected (offline)', variant: 'destructive' });
      });
  };

  const fetchLeaves = () => {
    setIsLoading(true);
    return fetch(`${API_BASE}/api/leaves`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((d) => ({
            id: String(d.id),
            userId: String(d.user_id || d.userId),
            userName: d.user_name || d.userName,
            leaveType: d.leave_type || d.leaveType,
            startDate: d.start_date || d.startDate,
            endDate: d.end_date || d.endDate,
            reason: d.reason,
            status: d.status,
            approvedBy: d.approved_by || d.approvedBy,
          }));
          console.debug('Loaded leaves', mapped);
          setLeaves(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const payload = {
      userId: user?.id,
      userName: user?.name,
      leaveType: fd.get('leaveType') || leaveTypeValue,
      startDate: fd.get('startDate'),
      endDate: fd.get('endDate'),
      reason: fd.get('reason'),
    };
    fetch(`${API_BASE}/api/leaves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(() => {
        setOpen(false);
        toast({ title: 'Leave Request Submitted', description: 'Your leave request has been submitted for approval.' });
        // refresh list
        fetchLeaves();
      })
      .catch(() => {
        setOpen(false);
        toast({ title: 'Leave Request Submitted', description: 'Submitted (offline)' });
      });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'destructive' | 'warning'> = {
      approved: 'success',
      rejected: 'destructive',
      pending: 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const [leaves, setLeaves] = useState<typeof mockLeaves>(mockLeaves);

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchLeaves();
    return () => { mounted = false };
  }, []);

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const myLeaves = leaves.filter((l) => l.userId === user?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Apply for leave and track your requests"
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => fetchLeaves()} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>Submit a new leave request</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Leave Type</Label>
                    {/* Controlled Select - keep a hidden input with name so FormData picks it up */}
                    <Select onValueChange={(v) => setLeaveTypeValue(String(v))} value={leaveTypeValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="leaveType" value={leaveTypeValue} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input id="endDate" name="endDate" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Please provide a reason for your leave..."
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Request</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-1">days remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Used Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">7</div>
            <p className="text-xs text-muted-foreground mt-1">days this year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingLeaves.length}</div>
            <p className="text-xs text-muted-foreground mt-1">awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={canManage ? 'manage' : 'history'} className="w-full">
            <TabsList>
              {canManage && <TabsTrigger value="manage">Manage Requests</TabsTrigger>}
              <TabsTrigger value="history">My Requests</TabsTrigger>
            </TabsList>

            {canManage && (
              <TabsContent value="manage" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLeaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">{leave.userName}</TableCell>
                        <TableCell>{leave.leaveType}</TableCell>
                        <TableCell>{leave.startDate}</TableCell>
                        <TableCell>{leave.endDate}</TableCell>
                        <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(leave.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(leave.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            )}

            <TabsContent value="history" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.leaveType}</TableCell>
                      <TableCell>{leave.startDate}</TableCell>
                      <TableCell>{leave.endDate}</TableCell>
                      <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
