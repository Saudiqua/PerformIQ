import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  RefreshCw,
  Sun,
  Moon,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Link,
  Mail,
  MessageSquare,
  Video,
  Users,
  Calendar,
} from "lucide-react";
import { SiSlack, SiGmail, SiZoom } from "react-icons/si";

interface Integration {
  id: string;
  provider: string;
  status: string;
  connected_at: string | null;
  settings: Record<string, unknown> | null;
}

interface IntegrationsResponse {
  integrations: Integration[];
  oauthEnabled: boolean;
}

interface SyncState {
  org_id: string;
  provider: string;
  integration_account_id: string;
  last_synced_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

interface SyncStatusResponse {
  syncStates: SyncState[];
}

interface Event {
  id: string;
  org_id: string;
  provider: string;
  type: string;
  occurred_at: string;
  actor_external_id?: string;
  actor_email?: string;
  channel_or_thread_id?: string;
  external_id: string;
  subject?: string;
  body_preview?: string;
  metadata?: Record<string, unknown>;
}

interface EventsResponse {
  events: Event[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

const providerIcons: Record<string, React.ReactNode> = {
  slack: <SiSlack className="h-6 w-6 text-[#4A154B]" />,
  gmail: <SiGmail className="h-6 w-6 text-[#EA4335]" />,
  outlook: <Mail className="h-6 w-6 text-[#0078D4]" />,
  teams: <Users className="h-6 w-6 text-[#6264A7]" />,
  zoom: <SiZoom className="h-6 w-6 text-[#2D8CFF]" />,
};

const providerNames: Record<string, string> = {
  slack: "Slack",
  gmail: "Gmail",
  outlook: "Outlook",
  teams: "Microsoft Teams",
  zoom: "Zoom",
};

const allProviders = ["slack", "gmail", "outlook", "teams", "zoom"];

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: integrationsData, isLoading: integrationsLoading } = useQuery<IntegrationsResponse>({
    queryKey: ["/api/integrations"],
    retry: false,
  });

  const { data: syncStatusData, isLoading: syncLoading } = useQuery<SyncStatusResponse>({
    queryKey: ["/api/admin/jobs/status"],
    retry: false,
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery<EventsResponse>({
    queryKey: ["/api/events"],
    retry: false,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/jobs/run");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sync triggered", description: "All integrations are being synced." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (err: Error) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  const getIntegrationStatus = (provider: string): "connected" | "disconnected" | "error" => {
    const integration = integrationsData?.integrations?.find((i) => i.provider === provider);
    if (!integration) return "disconnected";
    if (integration.status === "connected") return "connected";
    return "disconnected";
  };

  const getSyncStatus = (provider: string): SyncState | undefined => {
    return syncStatusData?.syncStates?.find((s) => s.provider === provider);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const formatTimeAgo = (date: string | null) => {
    if (!date) return "Never";
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const connectedCount = integrationsData?.integrations?.filter((i) => i.status === "connected").length || 0;
  const eventsCount = eventsData?.events?.length || 0;
  const lastSyncTime = syncStatusData?.syncStates
    ?.map((s) => s.last_synced_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const oauthEnabled = integrationsData?.oauthEnabled ?? false;
  const apiError = !integrationsLoading && !integrationsData;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">PerformIQ</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-6 py-8">
        {apiError && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    API Authentication Required
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This dashboard requires JWT authentication. Configure Supabase and set up authentication to access the API.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!oauthEnabled && !apiError && (
          <Card className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Link className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    OAuth Not Configured
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Set ENCRYPTION_KEY_BASE64 and Supabase credentials to enable OAuth connections.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-connected-count">{connectedCount}</div>
              <p className="text-xs text-muted-foreground">of 5 integrations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-events-count">{eventsCount}</div>
              <p className="text-xs text-muted-foreground">synced events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-last-sync">{formatTimeAgo(lastSyncTime || null)}</div>
              <p className="text-xs text-muted-foreground">most recent sync</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || apiError}
                data-testid="button-sync-all"
              >
                {syncMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync All
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Integrations</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allProviders.map((provider) => {
              const status = getIntegrationStatus(provider);
              const syncState = getSyncStatus(provider);

              return (
                <Card key={provider} className="hover-elevate">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {providerIcons[provider]}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{providerNames[provider]}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {status === "connected" ? (
                          <Badge variant="success" data-testid={`badge-status-${provider}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary" data-testid={`badge-status-${provider}`}>
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {syncState ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last sync: {formatTimeAgo(syncState.last_synced_at)}
                          </div>
                          {syncState.last_error && (
                            <div className="flex items-center gap-1 text-destructive">
                              <XCircle className="h-3 w-3" />
                              {syncState.last_error}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Never synced
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Events</h2>
          </div>
          <Card>
            <CardContent className="p-0">
              {eventsLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading events...</div>
              ) : eventsData?.events?.length ? (
                <div className="divide-y">
                  {eventsData.events.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 hover-elevate"
                      data-testid={`row-event-${event.id}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {providerIcons[event.provider] || <MessageSquare className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {event.subject || event.type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {event.provider}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {event.body_preview || event.actor_email || event.actor_external_id}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(event.occurred_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No events synced yet</p>
                  <p className="text-xs mt-1">Connect an integration and trigger a sync</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
