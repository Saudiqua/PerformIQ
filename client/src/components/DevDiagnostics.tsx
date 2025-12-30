import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function DevDiagnostics() {
  const { session, user } = useAuth();
  const [apiStatus, setApiStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [apiMessage, setApiMessage] = useState<string>('');

  useEffect(() => {
    if (!session?.access_token) return;

    fetch('/api/integrations', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
      .then(async (res) => {
        if (res.ok) {
          setApiStatus('success');
          setApiMessage(`API responded with ${res.status}`);
        } else {
          const text = await res.text();
          setApiStatus('error');
          setApiMessage(`${res.status}: ${text}`);
        }
      })
      .catch((err) => {
        setApiStatus('error');
        setApiMessage(err.message);
      });
  }, [session]);

  if (import.meta.env.PROD) return null;

  return (
    <Card className="mb-6 border-purple-500 bg-purple-50 dark:bg-purple-950/20">
      <CardHeader>
        <CardTitle className="text-sm font-mono">🔧 Dev Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span>Supabase Session:</span>
          {session ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              None
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span>Access Token:</span>
          {session?.access_token ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Present ({session.access_token.substring(0, 20)}...)
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Missing
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span>User ID:</span>
          {user?.id ? (
            <Badge variant="outline">{user.id.substring(0, 8)}...</Badge>
          ) : (
            <Badge variant="secondary">No user</Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span>First API Call:</span>
          {apiStatus === 'pending' && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Waiting...
            </Badge>
          )}
          {apiStatus === 'success' && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              200 OK
            </Badge>
          )}
          {apiStatus === 'error' && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          )}
        </div>

        {apiStatus === 'error' && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-red-800 dark:text-red-200">
            <div className="font-bold">API Error:</div>
            <div className="mt-1">{apiMessage}</div>
            <div className="mt-2 text-xs">
              💡 Check if SUPABASE_SERVICE_ROLE_KEY is set in backend .env
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-800">
          <div className="text-purple-700 dark:text-purple-300">
            <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL?.substring(0, 30)}...</div>
            <div>Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
