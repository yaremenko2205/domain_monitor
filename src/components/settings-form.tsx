"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, X } from "lucide-react";
import { toast } from "sonner";

interface SettingsData {
  notification_thresholds: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  email_recipients: string;
  email_enabled: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  telegram_enabled: string;
  check_cron_schedule: string;
  [key: string]: string;
}

export function SettingsForm() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [newThreshold, setNewThreshold] = useState("");
  const [newRecipient, setNewRecipient] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: string, value: string) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  function getThresholds(): number[] {
    if (!settings) return [];
    try {
      return JSON.parse(settings.notification_thresholds || "[]");
    } catch {
      return [];
    }
  }

  function addThreshold() {
    const val = parseInt(newThreshold);
    if (isNaN(val) || val <= 0) return;
    const thresholds = getThresholds();
    if (thresholds.includes(val)) return;
    thresholds.push(val);
    thresholds.sort((a, b) => b - a);
    updateField("notification_thresholds", JSON.stringify(thresholds));
    setNewThreshold("");
  }

  function removeThreshold(val: number) {
    const thresholds = getThresholds().filter((t) => t !== val);
    updateField("notification_thresholds", JSON.stringify(thresholds));
  }

  function getRecipients(): string[] {
    if (!settings) return [];
    try {
      return JSON.parse(settings.email_recipients || "[]");
    } catch {
      return [];
    }
  }

  function addRecipient() {
    const email = newRecipient.trim();
    if (!email || !email.includes("@")) return;
    const recipients = getRecipients();
    if (recipients.includes(email)) return;
    recipients.push(email);
    updateField("email_recipients", JSON.stringify(recipients));
    setNewRecipient("");
  }

  function removeRecipient(email: string) {
    const recipients = getRecipients().filter((r) => r !== email);
    updateField("email_recipients", JSON.stringify(recipients));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Settings saved");
        fetchSettings();
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestNotification(channel: "email" | "telegram") {
    const setter = channel === "email" ? setTestingEmail : setTestingTelegram;
    setter(true);
    try {
      // Save first to make sure latest settings are used
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Test ${channel} sent successfully`);
      } else {
        toast.error(data.error || `Test ${channel} failed`);
      }
    } catch {
      toast.error(`Test ${channel} failed`);
    } finally {
      setter(false);
    }
  }

  if (loading || !settings) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Notification Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Thresholds</CardTitle>
          <CardDescription>
            Get notified when domains are within these many days of expiration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {getThresholds().map((t) => (
              <Badge key={t} variant="secondary" className="gap-1 text-sm">
                {t} days
                <button
                  onClick={() => removeThreshold(t)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Add threshold (days)"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addThreshold()}
              className="max-w-[200px]"
            />
            <Button variant="outline" size="sm" onClick={addThreshold}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure SMTP settings for email alerts.</CardDescription>
            </div>
            <Switch
              checked={settings.email_enabled === "true"}
              onCheckedChange={(checked) =>
                updateField("email_enabled", String(checked))
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={settings.smtp_host}
                onChange={(e) => updateField("smtp_host", e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                value={settings.smtp_port}
                onChange={(e) => updateField("smtp_port", e.target.value)}
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Username</Label>
              <Input
                value={settings.smtp_user}
                onChange={(e) => updateField("smtp_user", e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                value={settings.smtp_pass}
                onChange={(e) => updateField("smtp_pass", e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>From Address</Label>
            <Input
              value={settings.smtp_from}
              onChange={(e) => updateField("smtp_from", e.target.value)}
              placeholder="Domain Monitor <monitor@example.com>"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {getRecipients().map((r) => (
                <Badge key={r} variant="secondary" className="gap-1">
                  {r}
                  <button
                    onClick={() => removeRecipient(r)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Add recipient email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                className="max-w-[300px]"
              />
              <Button variant="outline" size="sm" onClick={addRecipient}>
                Add
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => handleTestNotification("email")}
            disabled={testingEmail}
          >
            {testingEmail ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Test Email
          </Button>
        </CardContent>
      </Card>

      {/* Telegram Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Telegram Notifications</CardTitle>
              <CardDescription>Configure Telegram bot for instant alerts.</CardDescription>
            </div>
            <Switch
              checked={settings.telegram_enabled === "true"}
              onCheckedChange={(checked) =>
                updateField("telegram_enabled", String(checked))
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bot Token</Label>
            <Input
              type="password"
              value={settings.telegram_bot_token}
              onChange={(e) => updateField("telegram_bot_token", e.target.value)}
              placeholder="123456:ABC-DEF..."
            />
          </div>
          <div className="space-y-2">
            <Label>Chat ID</Label>
            <Input
              value={settings.telegram_chat_id}
              onChange={(e) => updateField("telegram_chat_id", e.target.value)}
              placeholder="-1001234567890"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => handleTestNotification("telegram")}
            disabled={testingTelegram}
          >
            {testingTelegram ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Test Telegram
          </Button>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Check Schedule</CardTitle>
          <CardDescription>
            Cron expression for automatic domain checks. Default: daily at 8am.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={settings.check_cron_schedule}
            onChange={(e) => updateField("check_cron_schedule", e.target.value)}
            placeholder="0 8 * * *"
            className="max-w-[300px] font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Examples: <code>0 8 * * *</code> (daily 8am), <code>0 */6 * * *</code> (every 6h), <code>0 8 * * 1</code> (Mondays 8am)
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
