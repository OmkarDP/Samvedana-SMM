// src/pages/Dashboard.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  History,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react";
import { getHistory, HistoryItem } from "@/utils/api";

export default function Dashboard() {
  const [recentEvents, setRecentEvents] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentEvents();
  }, []);

  const loadRecentEvents = async () => {
    try {
      const response = await getHistory({ limit: 5 });
      if (Array.isArray(response.events)) {
        setRecentEvents(response.events);
      } else {
        console.error("API response format is incorrect. Expected an array.");
        setRecentEvents([]);
      }
    } catch (error) {
      console.error("Failed to load recent events:", error);
      setRecentEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const publishedCount = recentEvents.filter(
      (e) => e.status === "published"
    ).length;
    const draftCount = recentEvents.filter((e) => e.status === "draft").length;

    return [
      {
        title: "Total Events",
        value: recentEvents.length.toString(),
        description: "Events created this month",
        icon: Calendar,
      },
      {
        title: "Published",
        value: publishedCount.toString(),
        description: "Successfully published",
        icon: TrendingUp,
      },
      {
        title: "In Draft",
        value: draftCount.toString(),
        description: "Awaiting publication",
        icon: Activity,
      },
    ];
  }, [recentEvents]);

  const quickActions = [
    {
      title: "Create New Event",
      description: "Start a new social media campaign",
      icon: PlusCircle,
      action: () => navigate("/event/create"),
      className: "bg-gradient-primary text-primary-foreground hover:opacity-90",
    },
    {
      title: "View History",
      description: "Browse past events and campaigns",
      icon: History,
      action: () => navigate("/history"),
      className: "bg-accent text-accent-foreground hover:bg-accent-light",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to SMM Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your social media campaigns and track performance from one
            place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <Button
                  onClick={action.action}
                  className={`w-full h-auto p-4 flex items-center gap-4 ${action.className}`}
                >
                  <action.icon className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-sm opacity-90">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Your latest social media campaigns and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">
                  Loading events...
                </span>
              </div>
            ) : recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.event_id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">
                        {event.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Created{" "}
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === "published"
                            ? "bg-accent/20 text-accent"
                            : event.status === "draft"
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {event.status}
                      </span>
                      {event.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/event/${event.event_id}/drafts`)
                          }
                        >
                          Continue
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  No events yet
                </h3>
                <p className="text-muted-foreground mt-2">
                  Create your first social media event to get started.
                </p>
                <Button
                  onClick={() => navigate("/event/create")}
                  className="mt-4 bg-gradient-primary text-primary-foreground"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
