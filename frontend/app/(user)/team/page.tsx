/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { APP } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamDirect } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Copy, CheckCircle2, UserPlus, TrendingUp, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";

// We use a client component here because of the copy-to-clipboard functionality and local state filtering
// If this was a purely server-side page, we would extract the copy logic to a smaller client component



export default function TeamPage() {
  const { user } = useAuthStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Real state
  const [directs, setDirects] = useState<TeamDirect[]>([]);
  const [stats, setStats] = useState({
    active_volume: 0,
    levels_unlocked: 0,
    is_working: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Basic filtering states
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const referralCode = user?.referralCode || "MUSICA_A98F2X";
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const referralLink = origin ? `${origin}/register?ref=${referralCode}` : `https://musica.arenergy.us/register?ref=${referralCode}`;

  useEffect(() => {
    async function fetchData() {
      try {
        const [directRes, statsRes] = await Promise.all([
          api.get("/team/direct"),
          api.get("/team/stats")
        ]);
        
        const directsData = directRes.data.data || [];
        setDirects(directsData.map((d: TeamDirect) => ({
          ...d,
          level: "Level 1", // All directs are Level 1
          status: d.is_active ? "ACTIVE" : "INACTIVE",
          investment: d.total_investment || 0 // if available, else 0
        })));
        
        if (statsRes.data.data) {
          setStats(statsRes.data.data);
        }
      } catch (error) {
        console.error("Failed to load team data", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCopy = (text: string, type: "LINK" | "CODE") => {
    navigator.clipboard.writeText(text);
    if (type === "LINK") {
      setCopiedLink(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filteredTeam = directs.filter(member => {
    const matchesLevel = levelFilter === "ALL" || member.level === levelFilter;
    const matchesSearch = (member.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <PageHeader
        title="My Network"
        description="Track your referrals, team structure, and network volume."
      />

      {/* Referral Link & Code Section */}
      <Card className="bg-primary/5 border-primary/20 shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-1 z-10 w-full md:w-auto">
            <h3 className="font-semibold text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" /> 
              Invite Friends & Earn
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Share your referral link to receive Level Revenue Share credits when your friends join and participate in Musica pools.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto z-10">
            <div className="flex items-center space-x-2 bg-background border rounded-md p-1 pr-2 shadow-sm">
              <div className="bg-muted px-3 py-1.5 rounded text-sm font-mono font-medium text-foreground">
                {referralCode}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopy(referralCode, "CODE")}
                className="h-8 px-3"
              >
                {copiedCode ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy Code</span>
              </Button>
            </div>
            
            <Button onClick={() => handleCopy(referralLink, "LINK")} className="shadow-sm">
              {copiedLink ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {copiedLink ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Direct Referrals
              <Users className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{directs.length}</div>
            <p className="text-xs text-emerald-500 font-medium mt-1">L1 Members</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Levels Unlocked
              <UserPlus className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.levels_unlocked || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on active directs</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Active Referrals
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{directs.filter(d => d.status === "ACTIVE").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Members with investment</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex justify-between items-center">
              Team Volume
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatCurrency(stats.active_volume || 0)}</div>
            <p className="text-xs text-primary/70 font-medium mt-1">Total network investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Table Section */}
      <Card className="shadow-sm border">
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
          <CardTitle className="text-lg">Network Directory</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search member..."
                className="pl-9 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={levelFilter} onValueChange={(val) => setLevelFilter(val || "ALL")}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="Level 1">Level 1</SelectItem>
                <SelectItem value="Level 2">Level 2</SelectItem>
                <SelectItem value="Level 3">Level 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Member Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Investment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.length > 0 ? (
                filteredTeam.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/10">
                    <TableCell className="pl-6 font-medium">{member.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {member.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date((member.createdAt as string) || (member.created_at as string) || '').toLocaleDateString()}</TableCell>
                    <TableCell>
                      {member.status === "ACTIVE" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 font-semibold">
                      {formatCurrency(member.investment || 0)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No members found in your network.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
