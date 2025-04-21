"use client";

import { useState, useEffect } from "react";
import { getDocs, collectionGroup, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Car, Clock, PercentIcon, AlertTriangle } from "lucide-react";
import { EntryDetails, VehicleStatus } from "@/lib/firestore-service";
import { useFirebase } from "@/contexts/firebase-context";
import Loading from "@/components/loading";


type Activity = EntryDetails & { id: string; lot: string };

export default function Dashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [utilization, setUtilization] = useState(0);
  const { loading, user, userData } = useFirebase()

  useEffect(() => {

    async function fetchData() {
      // fetch all active entries subcollections
      const col = collection(db, "lots");
      const entriesSnap = await getDocs(collectionGroup(db, "active"));
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const entries: Activity[] = entriesSnap.docs.map((doc) => {
        const data = doc.data() as EntryDetails;
        const lotId = doc.ref.parent?.parent?.id || "";
        return { id: doc.id, lot: lotId, ...data };
      });
      setActivities(entries);

      // compute metrics
      const revenue = entries
        .filter(e => e.exitedTime && e.exitedTime.toDate() >= startOfDay)
        .reduce((sum, e) => sum + (e.feePaid ?? e.fee), 0);
      setTotalRevenue(revenue);

      const active = entries.filter(e => e.status === "active").length;
      setActiveCount(active);

      const overdue = entries.filter(
        e =>
          e.status === "active" &&
          now.getTime() > e.exitTime.toDate().getTime()
      ).length;
      setOverdueCount(overdue);

      // fetch lots to compute utilization (assumes each lot doc has a `capacity` field)
      const lotsSnap = await getDocs(collection(db, "lots"));
      let totalCapacity = 0;
      lotsSnap.docs.forEach(doc => {
        const lotData = doc.data() as { capacity?: number };
        totalCapacity += lotData.capacity ?? 0;
      });
      setUtilization(totalCapacity > 0 ? Math.round((active / totalCapacity) * 100) : 0);
    }

    fetchData();
  }, []);

  if (loading || !userData) return <Loading/>;

  const formatTime = (ts: { toDate(): Date }) =>
    ts.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const badgeVariant = (status: VehicleStatus) =>
    status === "fraud" ? "destructive" : status === "active" ? "outline" : "default";

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Dashboard" />

      <div className="flex-1 p-4 pt-6 md:p-6">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {userData.role === "owner" ? "Total Revenue Today" : "Pending Dues"}
                </p>
                <h3 className="text-2xl font-bold">₹{totalRevenue}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
                <h3 className="text-2xl font-bold">{activeCount}</h3>
              </div>
            </CardContent>
          </Card>

          {userData.role === "owner" && (
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
                  <h3 className="text-2xl font-bold">{overdueCount}</h3>
                </div>
              </CardContent>
            </Card>
          )}

          {userData.role === "owner" && (
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <PercentIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lot Utilization</p>
                  <h3 className="text-2xl font-bold">{utilization}%</h3>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Entry Time</TableHead>
                      <TableHead>Exit Time</TableHead>
                      {userData.role === "owner" && <TableHead>Lot</TableHead>}
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((act) => (
                      <TableRow key={act.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{act.enteredPlate}</p>
                            <p className="text-xs text-muted-foreground">{act.enteredType}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(act.entryTime)}</TableCell>
                        <TableCell>
                          {act.exitedTime
                            ? formatTime(act.exitedTime)
                            : formatTime(act.exitTime)}
                        </TableCell>
                        {userData.role === "owner" && <TableCell>{act.lot}</TableCell>}
                        <TableCell>₹{act.feePaid ?? act.fee}</TableCell>
                        <TableCell>
                          <Badge variant={badgeVariant(act.status)}>{act.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ... other owner-only cards ... */}
        </div>
      </div>
    </div>
  );
}
