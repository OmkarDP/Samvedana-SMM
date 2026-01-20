/**
 * History page - displays event history with filtering and status
 * Shows published events, drafts, and failed attempts
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Search, 
  Filter, 
  Calendar,
  ExternalLink,
  Edit,
  Eye,
  RefreshCw
} from 'lucide-react';
import { getHistory, HistoryItem } from '@/utils/api';

export default function History() {
  const [events, setEvents] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, [statusFilter, dateFilter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        params.start_date = startDate.toISOString();
        params.end_date = now.toISOString();
      }

      const response = await getHistory(params);
      setEvents(response.events);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'draft':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'failed':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Event History</h1>
            <p className="text-muted-foreground">
              Track all your social media campaigns and their performance
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/event/create')}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            Create New Event
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button
                onClick={loadHistory}
                disabled={loading}
                variant="outline"
                className="px-3"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Events ({filteredEvents.length})</CardTitle>
            <CardDescription>
              {searchTerm && `Showing results for "${searchTerm}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner className="mr-2" />
                <span className="text-muted-foreground">Loading events...</span>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div
                    key={event.event_id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <Badge className={`${getStatusColor(event.status)} text-xs`}>
                            {event.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Created {formatDate(event.created_at)}
                          </div>
                          
                          {event.published_at && (
                            <div className="flex items-center gap-1">
                              Published {formatDate(event.published_at)}
                            </div>
                          )}
                        </div>

                        {/* Platforms */}
                        {event.platforms && event.platforms.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Platforms:</span>
                            <div className="flex gap-1">
                              {event.platforms.map(platform => (
                                <Badge key={platform} variant="outline" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Links */}
                        {event.links && Object.keys(event.links).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(event.links).map(([platform, link]) => (
                              <a
                                key={platform}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-light underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {platform} post
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {event.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/event/${event.event_id}/drafts`)}
                            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Continue
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/event/${event.event_id}/view`)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  {searchTerm ? 'No events found' : 'No events yet'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first social media event to get started'
                  }
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate('/event/create')}
                    className="mt-4 bg-gradient-primary text-primary-foreground"
                  >
                    Create Event
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}