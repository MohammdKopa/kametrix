'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/generated/prisma/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Bot, Building2, MessageSquare, Mic } from 'lucide-react';
import { ELEVENLABS_VOICES } from '@/lib/constants/voices';

interface AgentFormProps {
  agent?: Agent;
  mode: 'create' | 'edit';
}

// ElevenLabs German voices
const VOICE_OPTIONS = ELEVENLABS_VOICES.map((v) => ({
  id: v.id,
  name: `${v.name} (${v.gender === 'female' ? 'Weiblich' : 'Maennlich'})`,
}));

export function AgentForm({ agent, mode }: AgentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: agent?.name || '',
    businessName: agent?.businessName || '',
    businessDescription: agent?.businessDescription || '',
    greeting: agent?.greeting || '',
    systemPrompt: agent?.systemPrompt || '',
    voiceId: agent?.voiceId || ELEVENLABS_VOICES[0].id,
    isActive: agent?.isActive ?? true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.greeting.trim()) {
      newErrors.greeting = 'Greeting is required';
    } else if (formData.greeting.length > 500) {
      newErrors.greeting = 'Greeting must be 500 characters or less';
    }

    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required';
    }

    if (!formData.voiceId) {
      newErrors.voiceId = 'Voice is required';
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
      const url = mode === 'create' ? '/api/agents' : `/api/agents/${agent?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save agent');
      }

      router.push('/dashboard/agents');
      router.refresh();
    } catch (error) {
      console.error('Error saving agent:', error);
      alert(error instanceof Error ? error.message : 'Failed to save agent');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="glass-card border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bot className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Create New Agent' : 'Edit Agent'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Agent Identity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Bot className="h-4 w-4" />
              Agent Identity
            </div>

            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Agent Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Customer Support Agent"
                  className={errors.name ? 'border-destructive focus-visible:ring-destructive/50' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              {mode === 'edit' && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-medium">
                      Agent Active
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isActive ? 'Agent is receiving calls' : 'Agent is paused'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Business Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Business Information
            </div>

            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g., Acme Inc"
                  className={errors.businessName ? 'border-destructive focus-visible:ring-destructive/50' : ''}
                />
                {errors.businessName && (
                  <p className="text-sm text-destructive">{errors.businessName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">
                  Business Description
                </Label>
                <Textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description of your business (optional)"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Voice & Greeting Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mic className="h-4 w-4" />
              Voice & Greeting
            </div>

            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="voiceId">
                  Voice <span className="text-destructive">*</span>
                </Label>
                <select
                  id="voiceId"
                  name="voiceId"
                  value={formData.voiceId}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  {VOICE_OPTIONS.map((voice) => (
                    <option key={voice.id} value={voice.id} className="bg-popover text-popover-foreground">
                      {voice.name}
                    </option>
                  ))}
                </select>
                {errors.voiceId && (
                  <p className="text-sm text-destructive">{errors.voiceId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="greeting">
                  Greeting <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="greeting"
                  name="greeting"
                  value={formData.greeting}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g., Hello! Thank you for calling Acme Inc. How can I help you today?"
                  maxLength={500}
                  className={errors.greeting ? 'border-destructive focus-visible:ring-destructive/50' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.greeting.length}/500 characters
                </p>
                {errors.greeting && (
                  <p className="text-sm text-destructive">{errors.greeting}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* System Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Behavior Configuration
            </div>

            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">
                  System Prompt <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleChange}
                  rows={6}
                  placeholder="You are a helpful customer service agent for Acme Inc. Your role is to..."
                  className={`font-mono text-xs ${errors.systemPrompt ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                />
                {errors.systemPrompt && (
                  <p className="text-sm text-destructive">{errors.systemPrompt}</p>
                )}
              </div>
            </div>
          </div>
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
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              mode === 'create' ? 'Create Agent' : 'Save Changes'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
