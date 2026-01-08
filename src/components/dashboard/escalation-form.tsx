'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  PhoneForwarded,
  Clock,
  AlertTriangle,
  Share2,
  Voicemail,
  MessageSquare,
  Plus,
  X,
  Phone,
  Building2,
} from 'lucide-react';
import type { EscalationConfigInput } from '@/types/escalation';

interface EscalationFormProps {
  agentId: string;
  agentName: string;
  initialConfig?: EscalationConfigInput & { id?: string; configured?: boolean };
}

const TIMEZONE_OPTIONS = [
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
  { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'UTC', label: 'UTC' },
];

const BUSINESS_DAYS = [
  { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' },
  { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' },
  { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
  { value: 'Sun', label: 'Sunday' },
];

const DEFAULT_TRIGGER_PHRASES = [
  'ich moechte mit einem menschen sprechen',
  'verbinden sie mich mit einem mitarbeiter',
  'einen mitarbeiter bitte',
  'speak to a human',
  'human agent',
];

export function EscalationForm({ agentId, agentName, initialConfig }: EscalationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newPhrase, setNewPhrase] = useState('');

  const [formData, setFormData] = useState<EscalationConfigInput>({
    enabled: initialConfig?.enabled ?? true,
    // Forwarding
    forwardingNumber: initialConfig?.forwardingNumber || '',
    forwardingQueue: initialConfig?.forwardingQueue || '',
    forwardingDepartment: initialConfig?.forwardingDepartment || '',
    fallbackNumber: initialConfig?.fallbackNumber || '',
    // Voicemail
    voicemailEnabled: initialConfig?.voicemailEnabled ?? true,
    voicemailGreeting: initialConfig?.voicemailGreeting || '',
    // Business hours
    businessHoursStart: initialConfig?.businessHoursStart || '09:00',
    businessHoursEnd: initialConfig?.businessHoursEnd || '18:00',
    businessDays: initialConfig?.businessDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    afterHoursNumber: initialConfig?.afterHoursNumber || '',
    afterHoursMessage: initialConfig?.afterHoursMessage || '',
    timezone: initialConfig?.timezone || 'Europe/Berlin',
    // Triggers
    maxCallDuration: initialConfig?.maxCallDuration ?? 300,
    maxClarifications: initialConfig?.maxClarifications ?? 3,
    sentimentThreshold: initialConfig?.sentimentThreshold ?? -0.5,
    triggerPhrases: initialConfig?.triggerPhrases || [...DEFAULT_TRIGGER_PHRASES],
    // Transfer
    maxTransferWaitTime: initialConfig?.maxTransferWaitTime ?? 60,
    announceTransfer: initialConfig?.announceTransfer ?? true,
    transferMessage: initialConfig?.transferMessage || '',
    holdMusicUrl: initialConfig?.holdMusicUrl || '',
    // Context sharing
    shareTranscript: initialConfig?.shareTranscript ?? true,
    shareSummary: initialConfig?.shareSummary ?? true,
    shareCallerInfo: initialConfig?.shareCallerInfo ?? true,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSwitchChange = (name: keyof EscalationConfigInput, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: keyof EscalationConfigInput, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const currentDays = prev.businessDays || [];
      if (currentDays.includes(day)) {
        return { ...prev, businessDays: currentDays.filter((d) => d !== day) };
      } else {
        return { ...prev, businessDays: [...currentDays, day] };
      }
    });
  };

  const handleAddPhrase = () => {
    if (newPhrase.trim() && !formData.triggerPhrases?.includes(newPhrase.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        triggerPhrases: [...(prev.triggerPhrases || []), newPhrase.trim().toLowerCase()],
      }));
      setNewPhrase('');
    }
  };

  const handleRemovePhrase = (phrase: string) => {
    setFormData((prev) => ({
      ...prev,
      triggerPhrases: (prev.triggerPhrases || []).filter((p) => p !== phrase),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // If enabled, require at least one forwarding destination
    if (formData.enabled && !formData.forwardingNumber && !formData.forwardingQueue) {
      newErrors.forwardingNumber = 'At least a forwarding number or queue is required when escalation is enabled';
    }

    // Validate phone number format if provided
    if (formData.forwardingNumber && !/^\+?[0-9\s-]{6,}$/.test(formData.forwardingNumber)) {
      newErrors.forwardingNumber = 'Please enter a valid phone number';
    }

    if (formData.fallbackNumber && !/^\+?[0-9\s-]{6,}$/.test(formData.fallbackNumber)) {
      newErrors.fallbackNumber = 'Please enter a valid phone number';
    }

    if (formData.afterHoursNumber && !/^\+?[0-9\s-]{6,}$/.test(formData.afterHoursNumber)) {
      newErrors.afterHoursNumber = 'Please enter a valid phone number';
    }

    // Validate time format
    if (formData.businessHoursStart && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.businessHoursStart)) {
      newErrors.businessHoursStart = 'Please enter a valid time (HH:MM)';
    }

    if (formData.businessHoursEnd && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.businessHoursEnd)) {
      newErrors.businessHoursEnd = 'Please enter a valid time (HH:MM)';
    }

    // Validate numeric ranges
    if (formData.maxCallDuration !== undefined && (formData.maxCallDuration < 0 || formData.maxCallDuration > 3600)) {
      newErrors.maxCallDuration = 'Must be between 0 and 3600 seconds';
    }

    if (formData.maxClarifications !== undefined && (formData.maxClarifications < 1 || formData.maxClarifications > 10)) {
      newErrors.maxClarifications = 'Must be between 1 and 10';
    }

    if (formData.maxTransferWaitTime !== undefined && (formData.maxTransferWaitTime < 10 || formData.maxTransferWaitTime > 300)) {
      newErrors.maxTransferWaitTime = 'Must be between 10 and 300 seconds';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/agents/${agentId}/escalation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save escalation configuration');
      }

      router.refresh();
      // Show success message
      alert('Escalation settings saved successfully!');
    } catch (error) {
      console.error('Error saving escalation config:', error);
      alert(error instanceof Error ? error.message : 'Failed to save escalation configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="glass-card border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <PhoneForwarded className="h-5 w-5 text-primary" />
            Call Escalation Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure when and how calls should be transferred to human operators for {agentName}
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Enable/Disable Section */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-sm font-medium">
                Enable Call Escalation
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.enabled
                  ? 'Calls can be transferred to human operators'
                  : 'Call transfers are disabled'}
              </p>
            </div>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => handleSwitchChange('enabled', checked)}
            />
          </div>

          {formData.enabled && (
            <>
              <Separator />

              {/* Forwarding Destinations Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Forwarding Destinations
                </div>

                <div className="space-y-4 pl-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="forwardingNumber">
                        Primary Forwarding Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="forwardingNumber"
                        name="forwardingNumber"
                        value={formData.forwardingNumber}
                        onChange={handleInputChange}
                        placeholder="+49 30 12345678"
                        className={errors.forwardingNumber ? 'border-destructive' : ''}
                      />
                      {errors.forwardingNumber && (
                        <p className="text-sm text-destructive">{errors.forwardingNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fallbackNumber">Fallback Number</Label>
                      <Input
                        id="fallbackNumber"
                        name="fallbackNumber"
                        value={formData.fallbackNumber}
                        onChange={handleInputChange}
                        placeholder="+49 30 87654321"
                        className={errors.fallbackNumber ? 'border-destructive' : ''}
                      />
                      {errors.fallbackNumber && (
                        <p className="text-sm text-destructive">{errors.fallbackNumber}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Used if primary number is unavailable
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="forwardingQueue">Queue Name</Label>
                      <Input
                        id="forwardingQueue"
                        name="forwardingQueue"
                        value={formData.forwardingQueue}
                        onChange={handleInputChange}
                        placeholder="e.g., support, sales"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="forwardingDepartment">Department</Label>
                      <Input
                        id="forwardingDepartment"
                        name="forwardingDepartment"
                        value={formData.forwardingDepartment}
                        onChange={handleInputChange}
                        placeholder="e.g., Customer Service"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Business Hours Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Business Hours
                </div>

                <div className="space-y-4 pl-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="businessHoursStart">Opening Time</Label>
                      <Input
                        id="businessHoursStart"
                        name="businessHoursStart"
                        type="time"
                        value={formData.businessHoursStart}
                        onChange={handleInputChange}
                        className={errors.businessHoursStart ? 'border-destructive' : ''}
                      />
                      {errors.businessHoursStart && (
                        <p className="text-sm text-destructive">{errors.businessHoursStart}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessHoursEnd">Closing Time</Label>
                      <Input
                        id="businessHoursEnd"
                        name="businessHoursEnd"
                        type="time"
                        value={formData.businessHoursEnd}
                        onChange={handleInputChange}
                        className={errors.businessHoursEnd ? 'border-destructive' : ''}
                      />
                      {errors.businessHoursEnd && (
                        <p className="text-sm text-destructive">{errors.businessHoursEnd}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) => handleSelectChange('timezone', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Business Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {BUSINESS_DAYS.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={formData.businessDays?.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleDayToggle(day.value)}
                        >
                          {day.label.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="afterHoursNumber">After Hours Number</Label>
                      <Input
                        id="afterHoursNumber"
                        name="afterHoursNumber"
                        value={formData.afterHoursNumber}
                        onChange={handleInputChange}
                        placeholder="+49 30 99999999"
                        className={errors.afterHoursNumber ? 'border-destructive' : ''}
                      />
                      {errors.afterHoursNumber && (
                        <p className="text-sm text-destructive">{errors.afterHoursNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="afterHoursMessage">After Hours Message</Label>
                      <Textarea
                        id="afterHoursMessage"
                        name="afterHoursMessage"
                        value={formData.afterHoursMessage}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="We are currently closed. Please call back during business hours..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Escalation Triggers Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Escalation Triggers
                </div>

                <div className="space-y-4 pl-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="maxCallDuration">
                        Max Call Duration (seconds)
                      </Label>
                      <Input
                        id="maxCallDuration"
                        name="maxCallDuration"
                        type="number"
                        min={0}
                        max={3600}
                        value={formData.maxCallDuration}
                        onChange={handleInputChange}
                        className={errors.maxCallDuration ? 'border-destructive' : ''}
                      />
                      {errors.maxCallDuration && (
                        <p className="text-sm text-destructive">{errors.maxCallDuration}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        0 = disabled. Auto-escalate after this duration.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxClarifications">
                        Max Clarification Attempts
                      </Label>
                      <Input
                        id="maxClarifications"
                        name="maxClarifications"
                        type="number"
                        min={1}
                        max={10}
                        value={formData.maxClarifications}
                        onChange={handleInputChange}
                        className={errors.maxClarifications ? 'border-destructive' : ''}
                      />
                      {errors.maxClarifications && (
                        <p className="text-sm text-destructive">{errors.maxClarifications}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Escalate after this many clarification requests
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sentimentThreshold">
                        Sentiment Threshold
                      </Label>
                      <Input
                        id="sentimentThreshold"
                        name="sentimentThreshold"
                        type="number"
                        min={-1}
                        max={0}
                        step={0.1}
                        value={formData.sentimentThreshold}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Escalate when sentiment drops below this (-1 to 0)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger Phrases</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Phrases that will immediately trigger escalation to a human operator
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={newPhrase}
                        onChange={(e) => setNewPhrase(e.target.value)}
                        placeholder="Add a trigger phrase..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPhrase();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddPhrase}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.triggerPhrases?.map((phrase) => (
                        <span
                          key={phrase}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                        >
                          {phrase}
                          <button
                            type="button"
                            onClick={() => handleRemovePhrase(phrase)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Transfer Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Transfer Settings
                </div>

                <div className="space-y-4 pl-6">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="announceTransfer" className="text-sm font-medium">
                        Announce Transfer
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Play a message to the caller before transfer
                      </p>
                    </div>
                    <Switch
                      id="announceTransfer"
                      checked={formData.announceTransfer}
                      onCheckedChange={(checked) => handleSwitchChange('announceTransfer', checked)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxTransferWaitTime">
                        Max Wait Time (seconds)
                      </Label>
                      <Input
                        id="maxTransferWaitTime"
                        name="maxTransferWaitTime"
                        type="number"
                        min={10}
                        max={300}
                        value={formData.maxTransferWaitTime}
                        onChange={handleInputChange}
                        className={errors.maxTransferWaitTime ? 'border-destructive' : ''}
                      />
                      {errors.maxTransferWaitTime && (
                        <p className="text-sm text-destructive">{errors.maxTransferWaitTime}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="holdMusicUrl">Hold Music URL</Label>
                      <Input
                        id="holdMusicUrl"
                        name="holdMusicUrl"
                        value={formData.holdMusicUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/hold-music.mp3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transferMessage">Custom Transfer Message</Label>
                    <Textarea
                      id="transferMessage"
                      name="transferMessage"
                      value={formData.transferMessage}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Please hold while I connect you with a team member..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use default German message
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Voicemail Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Voicemail className="h-4 w-4" />
                  Voicemail Settings
                </div>

                <div className="space-y-4 pl-6">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="voicemailEnabled" className="text-sm font-medium">
                        Enable Voicemail
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow callers to leave a message if no operators are available
                      </p>
                    </div>
                    <Switch
                      id="voicemailEnabled"
                      checked={formData.voicemailEnabled}
                      onCheckedChange={(checked) => handleSwitchChange('voicemailEnabled', checked)}
                    />
                  </div>

                  {formData.voicemailEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="voicemailGreeting">Voicemail Greeting</Label>
                      <Textarea
                        id="voicemailGreeting"
                        name="voicemailGreeting"
                        value={formData.voicemailGreeting}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="Please leave your name, number, and a brief message..."
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Context Sharing Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                  Context Sharing
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Choose what information to share with the human operator
                </p>

                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="shareTranscript" className="text-sm font-medium">
                        Share Transcript
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Send conversation history to operator
                      </p>
                    </div>
                    <Switch
                      id="shareTranscript"
                      checked={formData.shareTranscript}
                      onCheckedChange={(checked) => handleSwitchChange('shareTranscript', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="shareSummary" className="text-sm font-medium">
                        Share AI Summary
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Send AI-generated conversation summary
                      </p>
                    </div>
                    <Switch
                      id="shareSummary"
                      checked={formData.shareSummary}
                      onCheckedChange={(checked) => handleSwitchChange('shareSummary', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="shareCallerInfo" className="text-sm font-medium">
                        Share Caller Info
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Send caller&apos;s phone number and details
                      </p>
                    </div>
                    <Switch
                      id="shareCallerInfo"
                      checked={formData.shareCallerInfo}
                      onCheckedChange={(checked) => handleSwitchChange('shareCallerInfo', checked)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
