/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { KycRequest } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  FileSearch,
  FileCheck,
  FileX,
  CreditCard,
  UserCheck
} from "lucide-react";

export default function AdminKycPage() {
  const [kycRequests, setKycRequests] = useState<KycRequest[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchKYC();
  }, []);

  const fetchKYC = async () => {
    try {
      // In a real app we might fetch all and filter or just fetch pending
      const res = await api.get("/admin/kyc");
      if (res.data.data) {
        const mapped = res.data.data.map((u: KycRequest) => ({
          id: u.id,
          user: u.name,
          email: u.email,
          submittedDate: new Date(u.created_at || '').toLocaleString(),
          aadhaarNumber: "1234 5678 9012", // mock for now
          panNumber: "ABCDE1234F", // mock for now
          status: u.kyc_status,
          docs: {
            aadhaarFront: "https://via.placeholder.com/400x250/e2e8f0/64748b?text=Aadhaar+Front",
            aadhaarBack: "https://via.placeholder.com/400x250/e2e8f0/64748b?text=Aadhaar+Back",
            panCard: "https://via.placeholder.com/400x250/e2e8f0/64748b?text=PAN+Card"
          }
        }));
        setKycRequests(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch KYC", err);
    }
  };

  const handleAction = async (actionType: "approve" | "reject") => {
    if (!activeRequest) return;
    try {
      // The API endpoint is /admin/kyc/:id for both approve/reject or just PUT? 
      // Currently backend only has /admin/kyc/:id which approves.
      // We will just do approve for now.
      if (actionType === "approve") {
        await api.put(`/admin/kyc/${activeRequest.id}`);
        toast.success("KYC Approved successfully");
      } else {
        await api.put(`/admin/kyc/${activeRequest.id}/reject`, { reason: rejectReason });
        toast.success("KYC Rejected successfully");
      }
      setReviewModalOpen(false);
      fetchKYC();
    } catch (err) {
      toast.error(`Failed to ${actionType} KYC`);
    }
  };
  
  const filteredRequests = kycRequests.filter(req => {
    const matchesFilter = filter === "ALL" || req.status === filter;
    const matchesSearch = ((req.user as string) || "").toLowerCase().includes(searchQuery.toLowerCase()) || ((req.email as string) || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openReview = (req: KycRequest) => {
    setActiveRequest(req);
    setIsRejecting(false);
    setRejectReason("");
    setReviewModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><FileCheck className="mr-1 h-3 w-3"/> Approved</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><FileSearch className="mr-1 h-3 w-3"/> Under Review</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30"><FileX className="mr-1 h-3 w-3"/> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">KYC Verification</h1>
        <p className="text-muted-foreground">
          Review and verify user identity documents.
        </p>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b bg-muted/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          <Tabs defaultValue="PENDING" onValueChange={setFilter} className="w-full sm:w-auto">
            <TabsList className="bg-background border flex overflow-x-auto justify-start sm:inline-flex h-auto p-1">
              <TabsTrigger value="PENDING" className="whitespace-nowrap px-4 py-2">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED" className="whitespace-nowrap px-4 py-2">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED" className="whitespace-nowrap px-4 py-2">Rejected</TabsTrigger>
              <TabsTrigger value="ALL" className="whitespace-nowrap px-4 py-2">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">User Details</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/10">
                    <TableCell className="pl-6">
                      <div className="font-medium">{req.user as string}</div>
                      <div className="text-sm text-muted-foreground">{req.email as string}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {req.submittedDate as string}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="font-normal text-xs">
                          <CreditCard className="mr-1 h-3 w-3" /> Aadhaar
                        </Badge>
                        <Badge variant="secondary" className="font-normal text-xs">
                          <UserCheck className="mr-1 h-3 w-3" /> PAN
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right pr-6">
                      {req.status === "PENDING" ? (
                        <Button size="sm" onClick={() => openReview(req)}>
                          Review Docs
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => openReview(req)}>
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No KYC requests found in this category.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* KYC Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>KYC Application Review</DialogTitle>
            <DialogDescription>
              Verify the documents submitted by <span className="font-medium text-foreground">{activeRequest?.user}</span>.
            </DialogDescription>
          </DialogHeader>
          
          {activeRequest && (
            <div className="space-y-6 py-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-muted/10">
                  <p className="text-sm text-muted-foreground mb-1">Aadhaar Number</p>
                  <p className="font-mono text-lg">{activeRequest.aadhaarNumber}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/10">
                  <p className="text-sm text-muted-foreground mb-1">PAN Number</p>
                  <p className="font-mono text-lg uppercase">{activeRequest.panNumber}</p>
                </div>
              </div>

              {activeRequest.docs ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Submitted Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Aadhaar (Front)</p>
                      <div className="aspect-[1.6/1] rounded-md overflow-hidden border bg-muted flex items-center justify-center relative group cursor-pointer">
                        { }
                        <img src={activeRequest.docs.aadhaarFront} alt="Aadhaar Front" className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Search className="text-white h-6 w-6" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Aadhaar (Back)</p>
                      <div className="aspect-[1.6/1] rounded-md overflow-hidden border bg-muted flex items-center justify-center relative group cursor-pointer">
                        { }
                        <img src={activeRequest.docs.aadhaarBack} alt="Aadhaar Back" className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Search className="text-white h-6 w-6" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">PAN Card</p>
                      <div className="aspect-[1.6/1] rounded-md overflow-hidden border bg-muted flex items-center justify-center relative group cursor-pointer">
                        { }
                        <img src={activeRequest.docs.panCard} alt="PAN Card" className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Search className="text-white h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground">
                  Documents are no longer available for preview (Purged for security after processing).
                </div>
              )}

              {activeRequest.status === "REJECTED" && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600">
                  <p className="font-semibold text-sm mb-1">Rejection Reason:</p>
                  <p className="text-sm">{activeRequest.reason}</p>
                </div>
              )}

              {isRejecting && activeRequest.status === "PENDING" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="reason" className="text-rose-600">Rejection Reason</Label>
                  <Input 
                    id="reason" 
                    placeholder="e.g. Document image is blurry / Details mismatch" 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="border-rose-500/30 focus-visible:ring-rose-500"
                  />
                </div>
              )}

            </div>
          )}
          
          <DialogFooter className="gap-2 sm:justify-end">
            {activeRequest?.status === "PENDING" ? (
              isRejecting ? (
                <>
                  <Button variant="ghost" onClick={() => setIsRejecting(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => handleAction("reject")} disabled={!rejectReason}>
                    Confirm Rejection
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="border-rose-500 text-rose-600 hover:bg-rose-500/10" onClick={() => setIsRejecting(true)}>
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction("approve")}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve KYC
                  </Button>
                </>
              )
            ) : (
              <Button onClick={() => setReviewModalOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
