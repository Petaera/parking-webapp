"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, Calendar, TrendingUp, PieChart as PieIcon } from "lucide-react"
import Header from "@/components/header"
import { useFirebase } from "@/contexts/firebase-context"
import { getLots, getFilteredVehicles, Lot } from "@/lib/firestore-service"
import Loading from "@/components/loading"

// Utility functions
const formatTime = (ts: any) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (ts: any) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getStartOfRange = (range: string) => {
  const now = new Date();
  switch (range) {
    case 'day': 
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function Reports() {
  const { loading, user, userData } = useFirebase();
  const [timeRange, setTimeRange] = useState('week');
  const [selectedLot, setSelectedLot] = useState<string>("");
  const [lots, setLots] = useState<Lot[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [lotData, setLotData] = useState<any[]>([]);
  const [vehicleTypeData, setVehicleTypeData] = useState<any[]>([]);
  // const [fraudData, setFraudData] = useState<EntryDetails[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalVehicles: 0,
    avgRevenue: 0,
    peakHour: '',
    revenueByType: { twoWheeler: 0, fourWheeler: 0 }
  });
  const [loadingData, setLoadingData] = useState(true);

  // Fetch lots on mount
  useEffect(() => {
    const fetchLots = async () => {
      const lots = await getLots();
      setLots(lots);
      if (lots.length > 0) {
        setSelectedLot(lots[0].id);
      }
    };
    fetchLots();
  }, []);

  // Fetch report data when lot or time range changes
  useEffect(() => {
    if (!selectedLot) return;
    
    const fetchReportData = async () => {
      setLoadingData(true);
      
      try {
        const startDate = getStartOfRange(timeRange);
        const { vehicles } = await getFilteredVehicles(
          selectedLot,
          {},
          { limit: 1000 }
        );

        // Filter vehicles in time range
        const filteredVehicles = vehicles.filter((v: any) => 
          v.enteredEntryTime.toDate() >= startDate
        );

        // Calculate metrics
        const revenue = filteredVehicles.reduce((sum: number, v: any) => sum + v.fee, 0);
        const vehicleCount = filteredVehicles.length;
        const avgRevenue = vehicleCount > 0 ? Math.round(revenue / vehicleCount) : 0;
        
        // Group by date for revenue trend
        const revenueByDate: Record<string, { revenue: number, vehicles: number }> = {};
        filteredVehicles.forEach((v: any) => {
          const dateKey = formatDate(v.enteredEntryTime);
          if (!revenueByDate[dateKey]) {
            revenueByDate[dateKey] = { revenue: 0, vehicles: 0 };
          }
          revenueByDate[dateKey].revenue += v.fee;
          revenueByDate[dateKey].vehicles += 1;
        });
        
        // Group by hour for peak hours
        const hourlyCount: Record<number, number> = {};
        filteredVehicles.forEach((v: any) => {
          const hour = v.enteredEntryTime.toDate().getHours();
          hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
        });
        
        // Find peak hour
        let peakHour = '';
        let maxCount = 0;
        Object.entries(hourlyCount).forEach(([hour, count]) => {
          if (count > maxCount) {
            maxCount = count;
            peakHour = `${hour}:00 - ${parseInt(hour)+1}:00`;
          }
        });
        
        // Revenue by vehicle type
        const revenueByType = filteredVehicles.reduce((acc: any, v: any) => {
          const type = v.enteredType.includes('2') ? 'twoWheeler' : 'fourWheeler';
          acc[type] = (acc[type] || 0) + v.fee;
          return acc;
        }, { twoWheeler: 0, fourWheeler: 0 });
        
        // Set states
        setRevenueData(
          Object.entries(revenueByDate).map(([date, data]) => ({
            date,
            revenue: data.revenue,
            vehicles: data.vehicles
          }))
        );
        
        setMetrics({
          totalRevenue: revenue,
          totalVehicles: vehicleCount,
          avgRevenue,
          peakHour,
          revenueByType
        });
        
        // Set lot data (for occupancy)
        const currentLot = lots.find(l => l.id === selectedLot);
        if (currentLot) {
          const activeVehicles = vehicles.filter((v: any) => v.status === 'active');
          setLotData([{
            name: currentLot.name,
            value: activeVehicles.length,
            capacity: currentLot.capacity
          }]);
        }
        
        // Set vehicle type distribution
        const typeCount = filteredVehicles.reduce((acc: any, v: any) => {
          const type = v.enteredType.includes('2') ? '2-wheeler' : '4-wheeler';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, { '2-wheeler': 0, '4-wheeler': 0 });
        
        setVehicleTypeData([
          { name: '2-wheeler', value: typeCount['2-wheeler'] },
          { name: '4-wheeler', value: typeCount['4-wheeler'] }
        ]);
        
        // Fraud data
        // const fraudCases = vehicles.filter((v: any) => v.status === 'fraud');
        // setFraudData(fraudCases);
        
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoadingData(false);
      }
    };
    
    if (selectedLot && lots.length > 0) {
      fetchReportData();
    }
  }, [selectedLot, timeRange, lots]);

  if (!userData || userData.role !== 'owner') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Reports & Analytics">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button> */}
        </div>
      </Header>
      
      {lots.length > 0 && (
        <div className="px-6 pt-2 flex items-center gap-4">
          <label className="font-medium">Select Lot:</label>
          <select
            className="border rounded px-2 py-1 bg-white"
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
          >
            {lots.map(lot => (
              <option key={lot.id} value={lot.id}>{lot.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 p-4 pt-6 md:p-6">
        <Tabs defaultValue="revenue">
          <TabsList className="mb-6 flex w-full flex-wrap overflow-x-auto">
            <TabsTrigger value="revenue" className="flex-shrink-0">Revenue</TabsTrigger>
            <TabsTrigger value="occupancy" className="flex-shrink-0">Occupancy</TabsTrigger>
            {/* <TabsTrigger value="fraud" className="flex-shrink-0">Fraud Detection</TabsTrigger> */}
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            {loadingData ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{metrics.totalRevenue}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.totalVehicles}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Revenue/Vehicle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{metrics.avgRevenue}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" /> Peak Hour
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.peakHour || 'N/A'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-1">
                        <PieIcon className="h-4 w-4" /> Revenue by Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>2-wheelers:</span>
                          <span>₹{metrics.revenueByType.twoWheeler}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>4-wheelers:</span>
                          <span>₹{metrics.revenueByType.fourWheeler}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => value}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`₹${value}`, "Revenue"]}
                            labelFormatter={(label) => label}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Lot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                          <Legend />
                          <Bar dataKey="value" name="Revenue (₹)" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="occupancy" className="space-y-6">
            {loadingData ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {[1, 2].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-[300px] bg-gray-200 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lot Occupancy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={lotData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip
                              formatter={(value, name) => [`${value} vehicles`, name === "value" ? "Current" : "Capacity"]}
                            />
                            <Legend />
                            <Bar dataKey="value" name="Current" fill="#3b82f6" />
                            <Bar dataKey="capacity" name="Capacity" fill="#e5e7eb" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Vehicle Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <Pie
                              data={vehicleTypeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {vehicleTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* <TabsContent value="fraud" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fraud Detection Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Vehicle Number</TableHead>
                        <TableHead>Issue Type</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fraudData.length > 0 ? (
                        fraudData.slice(0, 10).map((fraud, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(fraud.enteredEntryTime)} {formatTime(fraud.enteredEntryTime)}</TableCell>
                            <TableCell>{fraud.enteredPlate}</TableCell>
                            <TableCell>
                              {fraud.status === 'fraud' ? 'Confirmed Fraud' : 
                              fraud.enteredPlate !== fraud.plate ? 'Plate Mismatch' : 'Manual Override'}
                            </TableCell>
                            <TableCell>{lots.find(l => l.id === selectedLot)?.name || 'N/A'}</TableCell>
                            <TableCell>{fraud.enteredCreatedByName || 'Unknown'}</TableCell>
                            <TableCell>
                              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                                Confirmed Fraud
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No fraud cases detected
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fraud Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Suspicious Activities</h3>
                    <p className="text-2xl font-bold">{fraudData.length}</p>
                    <p className="text-xs text-muted-foreground">Last {timeRange}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Confirmed Fraud Cases</h3>
                    <p className="text-2xl font-bold">{fraudData.filter(f => f.status === 'fraud').length}</p>
                    <p className="text-xs text-muted-foreground">Last {timeRange}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Revenue Loss Prevented</h3>
                    <p className="text-2xl font-bold">₹{fraudData.reduce((sum, f) => sum + f.fee, 0)}</p>
                    <p className="text-xs text-muted-foreground">Last {timeRange}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  )
}
