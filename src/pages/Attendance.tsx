import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Download, Filter } from 'lucide-react';
import { mockAttendance } from '@/lib/mockData';
import { API_BASE } from '@/lib/auth';
import { useEffect } from 'react';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Attendance() {
  const user = getCurrentUser();
  const canViewAll = hasRole(['admin', 'hr_officer']);
  // derive today's attendance from fetched records for current user
  const [records, setRecords] = useState<typeof mockAttendance>(mockAttendance);
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false);
  const [isProcessingCheckOut, setIsProcessingCheckOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/api/attendance`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setRecords(data.map((d) => {
            // normalize date to YYYY-MM-DD so comparisons work regardless of server formatting
            const rawDate = d.date || d.startDate || d.created_at || null;
            const dateOnly = rawDate ? new Date(rawDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            return {
              id: String(d.id),
              userId: String(d.user_id || d.userId),
              userName: d.user_name || d.userName,
              date: dateOnly,
              checkIn: d.check_in || d.checkIn,
              checkOut: d.check_out || d.checkOut,
              status: d.status,
            };
          }));
        }
      })
      .catch(() => {})
      .finally(() => {
        // no-op
      })
    return () => { mounted = false; };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = records.find((r) => r.userId === user?.id && r.date === todayStr);
  const hasCheckedIn = Boolean(todayRecord?.checkIn);
  const hasCheckedOut = Boolean(todayRecord?.checkOut);

  const handleCheckIn = () => {
    const payload = {
      userId: user?.id,
      userName: user?.name,
      date: new Date().toISOString().split('T')[0],
      checkIn: new Date().toLocaleTimeString(),
      status: 'present',
    };
    setIsProcessingCheckIn(true);
    fetch(`${API_BASE}/api/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(() => {
        toast({ title: 'Checked In', description: `Check-in recorded at ${new Date().toLocaleTimeString()}` });
        // refresh list from server
        fetch(`${API_BASE}/api/attendance`).then((r) => r.json()).then((data) => {
          if (Array.isArray(data)) {
            setRecords(data.map((d) => ({
              id: String(d.id), userId: String(d.user_id || d.userId), userName: d.user_name || d.userName, date: d.date || new Date().toISOString().split('T')[0], checkIn: d.check_in || d.checkIn, checkOut: d.check_out || d.checkOut, status: d.status
            })));
          }
        }).catch(() => {});
      })
      .catch((err) => {
        console.error('CheckIn error', err);
        // optimistic local insert when offline
        const today = new Date().toISOString().split('T')[0];
        const newRec = {
          id: `${Date.now()}-local`,
          userId: user?.id,
          userName: user?.name,
          date: today,
          checkIn: new Date().toLocaleTimeString(),
          checkOut: null,
          status: 'present',
        } as any;
        setRecords((prev) => [newRec, ...prev]);
        toast({ title: 'Checked In', description: `Check-in recorded (offline)` });
      })
      .finally(() => setIsProcessingCheckIn(false));
  };

  const handleCheckOut = () => {
    const payload = {
      userId: user?.id,
      userName: user?.name,
      date: new Date().toISOString().split('T')[0],
      checkOut: new Date().toLocaleTimeString(),
      status: 'present',
    };
    // try to find today's attendance for this user and update it with PUT, otherwise create a new record
    const today = new Date().toISOString().split('T')[0];
    const existing = records.find((r) => r.userId === user?.id && r.date === today);
    if (existing) {
      setIsProcessingCheckOut(true);
      fetch(`${API_BASE}/api/attendance/${existing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkOut: payload.checkOut }) })
        .then((res) => {
          if (!res.ok) return res.text().then((t) => { throw new Error(`Server ${res.status}: ${t}`); });
          return res.json();
        })
        .then((updated) => {
          toast({ title: 'Checked Out', description: `Check-out recorded at ${payload.checkOut}` });
          // update local record with returned payload
          setRecords((prev) => prev.map((r) => r.id === String(updated.id) ? ({
            id: String(updated.id),
            userId: String(updated.user_id || updated.userId),
            userName: updated.user_name || updated.userName,
            date: updated.date ? new Date(updated.date).toISOString().split('T')[0] : today,
            checkIn: updated.check_in || updated.checkIn,
            checkOut: updated.check_out || updated.checkOut,
            status: updated.status,
          }) : r));
        })
        .catch((err) => {
          console.error('CheckOut PUT error', err);
          // optimistic local update
          setRecords((prev) => prev.map((r) => r.id === existing.id ? { ...r, checkOut: payload.checkOut } : r));
          toast({ title: 'Checked Out', description: `Check-out recorded (offline)` });
        })
        .finally(() => setIsProcessingCheckOut(false));
    } else {
      setIsProcessingCheckOut(true);
      fetch(`${API_BASE}/api/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then((res) => {
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          return res.json();
        })
        .then((created) => {
          toast({ title: 'Checked Out', description: `Check-out recorded at ${payload.checkOut}` });
          setRecords((prev) => [
            {
              id: String(created.id),
              userId: String(created.user_id || created.userId),
              userName: created.user_name || created.userName,
              date: created.date ? new Date(created.date).toISOString().split('T')[0] : today,
              checkIn: created.check_in || created.checkIn,
              checkOut: created.check_out || created.checkOut,
              status: created.status,
            },
            ...prev,
          ]);
        })
        .catch((err) => {
          console.error('CheckOut POST error', err);
          // optimistic add
          const newRec = {
            id: `${Date.now()}-local-out`,
            userId: user?.id,
            userName: user?.name,
            date: today,
            checkIn: null,
            checkOut: payload.checkOut,
            status: 'present',
          } as any;
          setRecords((prev) => [newRec, ...prev]);
          toast({ title: 'Checked Out', description: `Check-out recorded (offline)` });
        })
        .finally(() => setIsProcessingCheckOut(false));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'destructive' | 'warning'> = {
      present: 'success',
      absent: 'destructive',
      leave: 'warning',
      half_day: 'default',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track and manage employee attendance"
        actions={
          canViewAll && (
            <>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )
        }
      />

      {!canViewAll && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-2xl font-bold">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{hasCheckedIn ? (hasCheckedOut ? 'Completed' : 'Present') : 'Not Marked'}</p>
              </div>
            </div>

            {hasCheckedIn && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Check In</p>
                  <p className="text-lg font-semibold text-success">{todayRecord?.checkIn || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check Out</p>
                  <p className="text-lg font-semibold text-destructive">{todayRecord?.checkOut || '-'}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={handleCheckIn} disabled={hasCheckedIn}>
                Check In
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleCheckOut}
                disabled={!hasCheckedIn || hasCheckedOut}
              >
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {canViewAll ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Employees</TabsTrigger>
                <TabsTrigger value="present">Present</TabsTrigger>
                <TabsTrigger value="absent">Absent</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.userName}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.checkIn || '-'}</TableCell>
                        <TableCell>{record.checkOut || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="present">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records
                      .filter((r) => r.status === 'present')
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.userName}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.checkIn || '-'}</TableCell>
                          <TableCell>{record.checkOut || '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="absent">
                <div className="text-center py-8 text-muted-foreground">
                  No absent records for today
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {records
                  .filter((r) => r.userId === user?.id)
                  .map((record) => (
                    <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.userName}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.checkIn || '-'}</TableCell>
                        <TableCell>{record.checkOut || '-'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
