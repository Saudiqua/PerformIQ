import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useOrg } from '@/contexts/OrgContext';
import { Building2 } from 'lucide-react';

export default function OrgSetup() {
  const { setOrgId } = useOrg();
  const [orgIdInput, setOrgIdInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgIdInput.trim()) {
      toast({
        title: 'Organization ID required',
        description: 'Please enter your organization ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      setOrgId(orgIdInput.trim());
      toast({
        title: 'Organization selected',
        description: 'You can now access your dashboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set organization',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Select Organization</CardTitle>
            <CardDescription>
              Enter your organization ID to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgId">Organization ID</Label>
              <Input
                id="orgId"
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={orgIdInput}
                onChange={(e) => setOrgIdInput(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This is the UUID of your organization from the database
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
