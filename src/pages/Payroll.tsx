import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { mockPayroll, calculatePayroll } from '@/lib/mockData';
import { API_BASE } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function Payroll() {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0,7));
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [basicSalary, setBasicSalary] = useState('50000');
  const [hra, setHra] = useState('10000');
  const [allowances, setAllowances] = useState('5000');

  const calculated = calculatePayroll(
    Number(basicSalary),
    Number(hra),
    Number(allowances)
  );

  const [payslips, setPayslips] = useState<typeof mockPayroll>(mockPayroll);

  useEffect(() => {
    let mounted = true;
    // load employees for select
    fetch(`${API_BASE}/api/users`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) {
        setEmployees(data);
        if (!selectedEmployeeId && data.length) {
          const firstNonAdmin = data.find((u: any) => u.role !== 'admin');
          setSelectedEmployeeId(String((firstNonAdmin || data[0]).id));
        }
      }
    }).catch(() => {});
    fetch(`${API_BASE}/api/payroll`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setPayslips(
            data.map((d) => ({
              id: String(d.id),
              userId: String(d.user_id || d.userId),
              userName: d.user_name || d.userName,
              month: d.month,
              year: d.year,
              basicSalary: d.basic_salary || d.basicSalary,
              hra: d.hra,
              allowances: d.allowances,
              pf: d.pf,
              professionalTax: d.professional_tax || d.professionalTax,
              netPay: d.net_pay || d.netPay,
              generatedBy: d.generated_by || d.generatedBy,
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
  // determine month/year from selectedMonth (format YYYY-MM)
  const [yearStr, monthStr] = (selectedMonth || '').split('-');
  const month = Number(monthStr || '11');
  const year = Number(yearStr || '2025');

    // compute unpaid leave days for this employee in the target month
    fetch(`${API_BASE}/api/leaves`)
      .then((r) => r.json())
      .then((leaves) => {
        let unpaidDays = 0;
        if (Array.isArray(leaves)) {
          leaves.forEach((l: any) => {
            if (!l.unpaid) return;
            // overlap between leave range and month
            const s = new Date(l.start_date || l.startDate);
            const e = new Date(l.end_date || l.endDate);
            if (s.getFullYear() > year || e.getFullYear() < year) return;
            // compute overlapping days in month
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0);
            const overlapStart = s > monthStart ? s : monthStart;
            const overlapEnd = e < monthEnd ? e : monthEnd;
            if (overlapStart <= overlapEnd) {
              const days = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              unpaidDays += days;
            }
          });
        }

        const basic = Number(basicSalary);
        const pf = Math.round(basic * 0.12);
        const profTax = 200;
        // pro-rate deduction for unpaid days (assuming month days = days in month)
        const daysInMonth = new Date(year, month, 0).getDate();
        const unpaidDeduction = Math.round((basic / daysInMonth) * unpaidDays);

        const employee = employees.find((e) => String(e.id) === String(selectedEmployeeId)) || employees[0];
        const payload = {
          userId: selectedEmployeeId || (employee && String(employee.id)) || '2',
          userName: employee ? employee.name : 'John Doe',
          month,
          year,
          basicSalary: basic,
          hra: Number(hra),
          allowances: Number(allowances),
          unpaidDays,
          unpaidDeduction,
        };

        fetch(`${API_BASE}/api/payroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then((r) => r.json())
          .then((created) => {
              setOpen(false);
              setPayslips([created, ...payslips]);
              toast({ title: 'Payroll Generated', description: 'Payslip has been generated successfully.' });
          })
          .catch(() => {
            setOpen(false);
            toast({ title: 'Payroll Generated', description: 'Generated (offline)' });
          });
      })
      .catch(() => {
        // fallback: generate without unpaid days
        const employee = employees.find((e) => String(e.id) === String(selectedEmployeeId)) || employees[0];
        const payload = {
          userId: selectedEmployeeId || (employee && String(employee.id)) || '2',
          userName: employee ? employee.name : 'John Doe',
          month: Number((selectedMonth || '2025-11').split('-')[1]),
          year: Number((selectedMonth || '2025-11').split('-')[0]),
          basicSalary: Number(basicSalary),
          hra: Number(hra),
          allowances: Number(allowances),
        };
        fetch(`${API_BASE}/api/payroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then((r) => r.json())
          .then((created) => {
              setOpen(false);
              setPayslips([created, ...payslips]);
              toast({ title: 'Payroll Generated', description: 'Payslip has been generated successfully.' });
            })
          .catch(() => {
            setOpen(false);
            toast({ title: 'Payroll Generated', description: 'Generated (offline)' });
          });
      });
  };

  const handleViewPayslip = (payslip: any) => {
    setSelectedPayslip(payslip);
    setViewOpen(true);
  };

  const generatePayslipPDF = (payslip: any) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text('Payslip', 20, 20);
      doc.setFontSize(11);
      doc.text(`Employee: ${payslip.user_name || payslip.userName}`, 20, 40);
      doc.text(`Month: ${payslip.month}/${payslip.year}`, 20, 50);
      doc.text(`Basic Salary: ₹${(payslip.basic_salary || payslip.basicSalary || 0).toLocaleString()}`, 20, 60);
      doc.text(`Net Pay: ₹${(payslip.net_pay || payslip.netPay || 0).toLocaleString()}`, 20, 70);
      doc.save(`payslip-${payslip.id}.pdf`);
    } catch (e) {
      console.error('PDF generation failed', e);
      toast({ title: 'Download failed', description: 'Could not generate PDF' , variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        description="Generate and manage employee payroll"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Payroll</DialogTitle>
                <DialogDescription>Create a new payslip for an employee</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleGenerate}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee">Employee</Label>
                      <Select value={selectedEmployeeId ?? ''} onValueChange={(v) => setSelectedEmployeeId(String(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="month">Month/Year</Label>
                        <Input id="month" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basicSalary">Basic Salary</Label>
                      <Input
                        id="basicSalary"
                        type="number"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hra">HRA</Label>
                      <Input
                        id="hra"
                        type="number"
                        value={hra}
                        onChange={(e) => setHra(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allowances">Allowances</Label>
                      <Input
                        id="allowances"
                        type="number"
                        value={allowances}
                        onChange={(e) => setAllowances(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Card className="bg-muted">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Calculated Deductions & Net Pay</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">PF (12% of Basic):</span>
                        <span className="font-medium">₹{calculated.pf.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Professional Tax:</span>
                        <span className="font-medium">₹{calculated.professionalTax}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Net Pay:</span>
                        <span className="text-primary">₹{calculated.netPay.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Generate Payslip</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Generated Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">{payslip.userName}</TableCell>
                  <TableCell>
                    {new Date(payslip.year, payslip.month - 1).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>₹{payslip.basicSalary.toLocaleString()}</TableCell>
                  <TableCell>₹{(payslip.pf + payslip.professionalTax).toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-primary">
                    ₹{payslip.netPay.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewPayslip(payslip)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => generatePayslipPDF(payslip)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
            <DialogDescription>
              {selectedPayslip &&
                `${new Date(selectedPayslip.year, selectedPayslip.month - 1).toLocaleDateString(
                  'en-US',
                  { month: 'long', year: 'numeric' }
                )}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee Name</p>
                  <p className="text-lg font-medium">{selectedPayslip.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="text-lg font-medium">WZ-{selectedPayslip.userId}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Earnings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-medium">₹{selectedPayslip.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HRA</span>
                    <span className="font-medium">₹{selectedPayslip.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Allowances</span>
                    <span className="font-medium">₹{selectedPayslip.allowances.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Gross Earnings</span>
                    <span>
                      ₹
                      {(
                        selectedPayslip.basicSalary +
                        selectedPayslip.hra +
                        selectedPayslip.allowances
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Deductions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provident Fund (PF)</span>
                    <span className="font-medium">₹{selectedPayslip.pf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Professional Tax</span>
                    <span className="font-medium">₹{selectedPayslip.professionalTax}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Deductions</span>
                    <span>
                      ₹{(selectedPayslip.pf + selectedPayslip.professionalTax).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Net Pay</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{selectedPayslip.netPay.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => generatePayslipPDF(selectedPayslip)}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
