'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Moon, Sun, Monitor, User, Shield, Bell, Lock, Mail } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()

  // Notification preferences (stored locally until backend supports user metadata)
  const [emailCritical, setEmailCritical] = useState(true)
  const [emailDigest, setEmailDigest] = useState(true)

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast({ title: 'Signed out' })
    router.push('/login')
  }

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters', variant: 'destructive' })
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast({ title: 'Password updated successfully' })
      setNewPassword('')
      setShowPasswordForm(false)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update password', variant: 'destructive' })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Appearance</CardTitle>
            </div>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-border hover:bg-accent/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${theme === value ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>Configure email alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-critical" className="text-sm font-medium">Critical & high severity emails</Label>
                <p className="text-xs text-muted-foreground">Receive email alerts for critical and high-priority events</p>
              </div>
              <Switch
                id="email-critical"
                checked={emailCritical}
                onCheckedChange={(v) => { setEmailCritical(v); toast({ title: `Critical emails ${v ? 'enabled' : 'disabled'}` }) }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-digest" className="text-sm font-medium">Daily digest email</Label>
                <p className="text-xs text-muted-foreground">Receive a daily summary of all investor activity at 7:00 AM UTC</p>
              </div>
              <Switch
                id="email-digest"
                checked={emailDigest}
                onCheckedChange={(v) => { setEmailDigest(v); toast({ title: `Daily digest ${v ? 'enabled' : 'disabled'}` }) }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Session</p>
                <p className="text-xs text-muted-foreground">Signed in via Supabase Auth</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <Separator />

            {/* Password */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Password</p>
                  <p className="text-xs text-muted-foreground">Update your account password</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  <Lock className="w-3.5 h-3.5" />
                  {showPasswordForm ? 'Cancel' : 'Change'}
                </Button>
              </div>
              {showPasswordForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-end gap-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={changingPassword || newPassword.length < 6}
                    onClick={handlePasswordChange}
                  >
                    {changingPassword ? 'Updating...' : 'Update'}
                  </Button>
                </motion.div>
              )}
            </div>

            <Separator />
            <Button variant="destructive" size="sm" onClick={handleSignOut} className="w-full sm:w-auto">
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Platform</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Backend', 'FastAPI + LangGraph'],
                ['Database', 'PostgreSQL + pgvector'],
                ['AI Models', 'GPT-4o / GPT-4o-mini'],
                ['Auth', 'Supabase Auth'],
                ['Embeddings', 'text-embedding-3-small'],
                ['Scheduler', 'APScheduler'],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-mono text-xs text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
