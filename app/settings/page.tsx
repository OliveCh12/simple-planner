"use client";

import React, { useState } from "react";
import { Moon, Sun, Bell, Shield, Database, Palette, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { containerClasses } from "@/lib/utils";
import { clearAllData } from "@/lib/db";

interface SettingsState {
  // Appearance
  theme: string;
  language: string;
  dateFormat: string;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderNotifications: boolean;
  weeklyDigest: boolean;

  // Privacy
  dataCollection: boolean;
  analytics: boolean;
  marketingEmails: boolean;

  // Preferences
  weekStartsOn: string;
  timeZone: string;
  defaultView: string;
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<SettingsState>({
    // Appearance
    theme: "system",
    language: "en",
    dateFormat: "MM/dd/yyyy",

    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    reminderNotifications: true,
    weeklyDigest: true,

    // Privacy
    dataCollection: false,
    analytics: true,
    marketingEmails: false,

    // Preferences
    weekStartsOn: "monday",
    timeZone: "UTC",
    defaultView: "month",
  });

  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const updateSetting = (key: keyof SettingsState, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleClearAllData = async () => {
    setIsClearingData(true);
    try {
      await clearAllData();
      setShowClearDataDialog(false);
      // Optionally redirect to home or show success message
      alert('All data has been cleared successfully.');
      // You might want to redirect to home page or reload the app
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setIsClearingData(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={`py-8 ${containerClasses()}`}>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your application preferences and account settings.
            </p>
          </div>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => updateSetting("theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => updateSetting("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) => updateSetting("dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reminder Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming objectives
                    </p>
                  </div>
                  <Switch
                    checked={settings.reminderNotifications}
                    onCheckedChange={(checked) => updateSetting("reminderNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of your progress
                    </p>
                  </div>
                  <Switch
                    checked={settings.weeklyDigest}
                    onCheckedChange={(checked) => updateSetting("weeklyDigest", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Week Starts On</Label>
                  <Select
                    value={settings.weekStartsOn}
                    onValueChange={(value) => updateSetting("weekStartsOn", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select
                    value={settings.timeZone}
                    onValueChange={(value) => updateSetting("timeZone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default View</Label>
                  <Select
                    value={settings.defaultView}
                    onValueChange={(value) => updateSetting("defaultView", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month View</SelectItem>
                      <SelectItem value="week">Week View</SelectItem>
                      <SelectItem value="day">Day View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Collection</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow collection of usage data for improvements
                    </p>
                  </div>
                  <Switch
                    checked={settings.dataCollection}
                    onCheckedChange={(checked) => updateSetting("dataCollection", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app with anonymous analytics
                    </p>
                  </div>
                  <Switch
                    checked={settings.analytics}
                    onCheckedChange={(checked) => updateSetting("analytics", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => updateSetting("marketingEmails", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button variant="outline" className="justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Backup Data
                </Button>
                <Button 
                  variant="destructive" 
                  className="justify-start"
                  onClick={() => setShowClearDataDialog(true)}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear All Data
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete all your roadmaps, 
              objectives, and settings from the application.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to clear all data? Make sure you have exported any important 
              data before proceeding.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowClearDataDialog(false)}
              disabled={isClearingData}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearAllData}
              disabled={isClearingData}
            >
              {isClearingData ? 'Clearing...' : 'Clear All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
