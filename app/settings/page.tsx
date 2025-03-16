"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import Header from "@/components/header"
import RateConfiguration from "@/components/rate-configuration"

export default function Settings() {
  const [user, setUser] = useState<{ role: string } | null>(null)

  useEffect(() => {
    // In a real app, you would get this from your auth context
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Settings" />

      <div className="flex-1 p-4 pt-6 md:p-6">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6 flex w-full flex-wrap overflow-x-auto">
            <TabsTrigger value="profile" className="flex-shrink-0">
              Profile
            </TabsTrigger>
            {user.role === "owner" && (
              <>
                <TabsTrigger value="payment" className="flex-shrink-0">
                  Payment Settings
                </TabsTrigger>
                <TabsTrigger value="users" className="flex-shrink-0">
                  User Management
                </TabsTrigger>
                <TabsTrigger value="system" className="flex-shrink-0">
                  System Settings
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue="+91 9876543210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue={user.role} disabled />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {user.role === "owner" && (
            <TabsContent value="payment" className="space-y-6">
              {/* Replace the old table with our new Rate Configuration component */}
              <RateConfiguration />

              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Configure accepted payment methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="cash" defaultChecked />
                      <Label htmlFor="cash">Cash</Label>
                    </div>
                    <Select defaultValue="enabled">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="card" defaultChecked />
                      <Label htmlFor="card">Credit/Debit Card</Label>
                    </div>
                    <Select defaultValue="enabled">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="upi" defaultChecked />
                      <Label htmlFor="upi">UPI</Label>
                    </div>
                    <Select defaultValue="enabled">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Payment Methods</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}

          {user.role === "owner" && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage managers and their permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Assigned Lot</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>John Doe</TableCell>
                          <TableCell>john@example.com</TableCell>
                          <TableCell>Manager</TableCell>
                          <TableCell>Lot A</TableCell>
                          <TableCell>
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              Active
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Jane Smith</TableCell>
                          <TableCell>jane@example.com</TableCell>
                          <TableCell>Manager</TableCell>
                          <TableCell>Lot B</TableCell>
                          <TableCell>
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              Active
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Bob Johnson</TableCell>
                          <TableCell>bob@example.com</TableCell>
                          <TableCell>Manager</TableCell>
                          <TableCell>Lot C</TableCell>
                          <TableCell>
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              Active
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New User
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {user.role === "owner" && (
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Configure system-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" defaultValue="ParkEasy Solutions" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input id="contact-email" type="email" defaultValue="contact@parkeasy.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Contact Phone</Label>
                    <Input id="contact-phone" defaultValue="+91 9876543210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input id="tax-rate" type="number" defaultValue="18" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="receipt" defaultChecked />
                    <Label htmlFor="receipt">Print Receipt on Exit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="sms" defaultChecked />
                    <Label htmlFor="sms">Send SMS Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="email" defaultChecked />
                    <Label htmlFor="email">Send Email Notifications</Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save System Settings</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Camera & ML Configuration</CardTitle>
                  <CardDescription>Configure camera and machine learning settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confidence">ML Confidence Threshold (%)</Label>
                    <Input id="confidence" type="number" defaultValue="85" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="camera-refresh">Camera Refresh Rate (seconds)</Label>
                    <Input id="camera-refresh" type="number" defaultValue="2" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-detect" defaultChecked />
                    <Label htmlFor="auto-detect">Auto-Detect Vehicle Type</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="save-images" defaultChecked />
                    <Label htmlFor="save-images">Save Vehicle Images</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-retention">Image Retention Period (days)</Label>
                    <Input id="image-retention" type="number" defaultValue="30" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Camera Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

