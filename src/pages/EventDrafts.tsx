import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  RotateCcw,
  AlertCircle,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

// ✅ NEW: import dialog components (shadcn style)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Platform = "linkedin" | "instagram" | "facebook" | "twitter";

interface Draft {
  text: string;
  hashtags?: string;
  seo_keywords?: string;
  alt_text?: string;
  cta?: string;
}

interface EventDraftResponse {
  event_id: string;
  title?: string;
  platform_drafts: Record<Platform, Draft>;
}

const platformIcons = {
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
};

const platformColors = {
  linkedin: "bg-blue-100 text-blue-800 border-blue-200",
  instagram: "bg-pink-100 text-pink-800 border-pink-200",
  facebook: "bg-indigo-100 text-indigo-800 border-indigo-200",
  twitter: "bg-sky-100 text-sky-800 border-sky-200",
};

export default function EventDrafts() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [draftData, setDraftData] = useState<EventDraftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // MVP: only Facebook + Twitter visible/active
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "facebook",
    "twitter",
  ]);

  // ✅ NEW: modal visibility state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!eventId) {
      navigate("/dashboard");
      return;
    }
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Try loading from localStorage first
      const localData = localStorage.getItem(`drafts_${eventId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        setDraftData(parsed);
        setLoading(false);
        return;
      }

      // Step 2: Fallback to webhook
      const response = await fetch(
        `https://automation.mysamvedana.org/webhook/create-event?event_id=${eventId}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const parsed = Array.isArray(data) ? data[0] : data;
      if (!parsed?.platform_drafts)
        throw new Error("No drafts found in webhook response");

      setDraftData(parsed);
    } catch (err: any) {
      console.error("Failed to load drafts:", err);
      setError("Could not load drafts (check local data or webhook)");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    platform: Platform,
    field: keyof Draft,
    value: string
  ) => {
    if (!draftData) return;
    setHasUnsavedChanges(true);
    setDraftData({
      ...draftData,
      platform_drafts: {
        ...draftData.platform_drafts,
        [platform]: {
          ...draftData.platform_drafts[platform],
          [field]: value,
        },
      },
    });
  };

  const handleSaveLocal = () => {
    if (!draftData) return;
    localStorage.setItem(`drafts_${eventId}`, JSON.stringify(draftData));
    toast({
      title: "Drafts Saved",
      description: "Your edits have been saved locally.",
    });
    setHasUnsavedChanges(false);
  };

  const revertChanges = () => {
    localStorage.removeItem(`drafts_${eventId}`);
    loadDrafts();
    toast({
      title: "Reverted",
      description: "Reverted to original AI drafts.",
    });
    setHasUnsavedChanges(false);
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  // Publish drafts to webhook
  const handlePublish = async () => {
    if (!draftData) return;
    try {
      toast({
        title: "Publishing...",
        description: "Your posts are being sent to automation flow.",
      });

      const localStored = JSON.parse(
        localStorage.getItem(`drafts_${eventId}`) || "{}"
      );

      const payload = {
        event_id: draftData.event_id,
        platforms: selectedPlatforms,
        final_drafts: Object.fromEntries(
          selectedPlatforms.map((p) => [p, draftData.platform_drafts[p]])
        ),
        uploaded_images: localStored.uploaded_images || [],
      };

      const response = await fetch(
        "https://automation.mysamvedana.org/webhook/publish",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      // Optional toast
      toast({
        title: "Published Successfully",
        description: `Published to: ${selectedPlatforms.join(", ")}`,
      });

      localStorage.removeItem(`drafts_${eventId}`);
      console.log("✅ Publish response:", result);

      // ✅ NEW: show blocking success modal
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("❌ Publish failed:", err);
      toast({
        title: "Publish Failed",
        description: err.message || "See console for details",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Event Drafts</h1>
            <p className="text-muted-foreground">
              Review and edit AI-generated content before publishing.
            </p>
          </div>
          <div className="flex gap-2">
            {hasUnsavedChanges && (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600"
              >
                Unsaved
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              Back
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {draftData && (
          <Card>
            <CardHeader>
              <CardTitle>
                Drafts for: {draftData.title || draftData.event_id}
              </CardTitle>
              <CardDescription>
                Edit captions, hashtags, or SEO text
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs
                defaultValue="facebook"
                className="space-y-4"
              >
                {/* MVP: Only Facebook + Twitter */}
                <TabsList className="grid grid-cols-2">
                  {(["facebook", "twitter"] as Platform[]).map((platform) => {
                    const Icon = platformIcons[platform];
                    return (
                      <TabsTrigger
                        key={platform}
                        value={platform}
                        className="capitalize"
                      >
                        <Icon className="w-4 h-4 mr-2" /> {platform}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* MVP: Only Facebook + Twitter content */}
                {(["facebook", "twitter"] as Platform[]).map((platform) => {
                  const draft = draftData.platform_drafts[platform];
                  if (!draft) return null;

                  return (
                    <TabsContent
                      key={platform}
                      value={platform}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <Badge className={platformColors[platform]}>
                          {platform}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Post Content
                          </label>
                          <Textarea
                            value={draft.text}
                            onChange={(e) =>
                              handleChange(platform, "text", e.target.value)
                            }
                            rows={6}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Hashtags
                          </label>
                          <Textarea
                            value={draft.hashtags || ""}
                            onChange={(e) =>
                              handleChange(platform, "hashtags", e.target.value)
                            }
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            SEO Keywords
                          </label>
                          <Textarea
                            value={draft.seo_keywords || ""}
                            onChange={(e) =>
                              handleChange(
                                platform,
                                "seo_keywords",
                                e.target.value
                              )
                            }
                            rows={2}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {draftData && (
          <div className="space-y-4 mt-6">
            <div className="flex flex-wrap gap-2">
              {/* MVP: Only Facebook + Twitter toggles */}
              {(["facebook", "twitter"] as Platform[]).map((platform) => (
                <Button
                  key={platform}
                  variant={
                    selectedPlatforms.includes(platform) ? "default" : "outline"
                  }
                  onClick={() => togglePlatform(platform)}
                >
                  {selectedPlatforms.includes(platform) ? "✓ " : ""} {platform}
                </Button>
              ))}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={revertChanges}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Revert
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveLocal}
                  variant="secondary"
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="w-4 h-4 mr-2" /> Save Drafts
                </Button>

                <Button
                  onClick={handlePublish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Publish Selected
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ BLOCKING SUCCESS MODAL */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Posts published successfully</DialogTitle>
            <DialogDescription>
              Your selected platform drafts have been published via the
              automation flow.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/dashboard");
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
