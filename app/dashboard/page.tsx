"use client";

import { useState, useEffect } from "react";
import { onSnapshot, collectionGroup } from "firebase/firestore";
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
  const { loading, user, userData } = useFirebase()

  useEffect(() => {
    // restore user role

    // subscribe to all "active" subcollections across lots
    const q = collectionGroup(db, "active");
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => {
        const entry = doc.data() as EntryDetails;
        const lotId = doc.ref.parent?.parent?.id || "";
        return { id: doc.id, lot: lotId, ...entry };
      });
      setActivities(data);
    });
    return () => unsub();
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
            <CardContent className="flex flex-row items-center p-6">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {userData.role === "owner" ? "Total Revenue Today" : "Pending Dues"}
                </p>
                <h3 className="text-2xl font-bold">₹4,550</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
                <h3 className="text-2xl font-bold">{activities.filter(a => a.status === "active").length}</h3>
              </div>
            </CardContent>
          </Card>

          {userData.role === "owner" && (
            <Card>
              <CardContent className="flex flex-row items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
                  <h3 className="text-2xl font-bold">
                    {activities.filter(a => a.status === "active" && Date.now() - a.exitTime.toDate().getTime() > 0).length}
                  </h3>
                </div>
              </CardContent>
            </Card>
          )}

          {userData.role === "owner" && (
            <Card>
              <CardContent className="flex flex-row items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <PercentIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lot Utilization</p>
                  <h3 className="text-2xl font-bold">78%</h3>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="col-span-1">
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

          {userData.role === "owner" && (
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {/* ... your existing chart code ... */}
              </CardContent>
            </Card>
          )}

          {userData.role === "owner" && (
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader className="flex flex-row items-center">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* ... your existing alerts ... */}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
