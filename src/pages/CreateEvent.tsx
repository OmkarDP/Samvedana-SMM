import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Upload,
  X,
  Image as ImageIcon,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { createEvent } from "@/utils/api";
import { APP_CONFIG } from "@/lib/config";

interface ImagePreview {
  file: File;
  url: string;
  id: string;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [datetime, setDatetime] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "creating" | "uploading">("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // ✅ IMAGE SELECTION HANDLER
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > APP_CONFIG.MAX_IMAGES_PER_EVENT) {
      setError(`Maximum ${APP_CONFIG.MAX_IMAGES_PER_EVENT} images allowed.`);
      return;
    }

    const validFiles: ImagePreview[] = [];
    files.forEach((file) => {
      if (!APP_CONFIG.SUPPORTED_IMAGE_FORMATS.includes(file.type as any)) {
        setError(`Unsupported format: ${file.type}`);
        return;
      }
      if (file.size > APP_CONFIG.MAX_IMAGE_SIZE) {
        setError(`File ${file.name} is too large (max 5MB).`);
        return;
      }
      validFiles.push({
        file,
        url: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      });
    });

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles]);
      setError(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return updated;
    });
  };

  // ✅ SUBMIT HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !user) return;

    if (!title.trim()) return setError("Title is required");
    if (!description.trim()) return setError("Description is required");
    if (!datetime) return setError("Date and time required");
    if (images.length === 0) return setError("At least one image required");

    setIsSubmitting(true);
    setError(null);

    try {
      // STEP 1: Create event via automation webhook
      setStage("creating");
      const response: any = await createEvent({
        prompt_text: `${title}\n\n${description}`,
        date_time: datetime,
        created_by: user?.name || user?.mobile_number || "admin",
      });

      const eventId = response?.event_id;
      if (!eventId) throw new Error("No event_id returned from createEvent");

      // Save AI drafts locally (if available)
      if (response?.platform_drafts) {
        localStorage.setItem(`drafts_${eventId}`, JSON.stringify(response));
      }

      // STEP 2: Convert images to Base64
      setStage("uploading");
      const base64Images = await Promise.all(
        images.map((img) => fileToBase64(img.file))
      );

      // STEP 3: Upload images to media server
      const uploadResponse = await fetch(
        "https://media.mysamvedana.org/api/upload-event-images",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: eventId,
            images_base64: base64Images,
          }),
        }
      );

      const uploadData = await uploadResponse.json();
      if (!uploadData.success) throw new Error("Image upload failed");

      // ✅ STEP 4: Construct full image URLs from { files, base_url }
      const imageUrls =
        uploadData.urls ||
        (uploadData.files && uploadData.base_url
          ? uploadData.files.map((f: string) => `${uploadData.base_url}${f}`)
          : []);

      console.log("🧾 Upload API returned:", uploadData);
      console.log("✅ Constructed image URLs:", imageUrls);

      // ✅ STEP 5: Merge image URLs into existing draft in localStorage
      if (imageUrls.length > 0) {
        const existingDrafts = JSON.parse(
          localStorage.getItem(`drafts_${eventId}`) || "{}"
        );

        const updatedDrafts = {
          ...existingDrafts,
          event_id: eventId,
          uploaded_images: Array.isArray(existingDrafts.uploaded_images)
            ? [...existingDrafts.uploaded_images, ...imageUrls]
            : [...imageUrls],
        };

        localStorage.setItem(
          `drafts_${eventId}`,
          JSON.stringify(updatedDrafts)
        );
        console.log("✅ Saved uploaded_images to localStorage:", updatedDrafts);
      } else {
        console.warn("⚠️ No image URLs derived from uploadData:", uploadData);
      }

      // STEP 6: Success notification
      toast({
        title: "Event Created Successfully",
        description: `Event ID: ${eventId}`,
      });

      navigate(`/event/${eventId}/drafts`);
    } catch (err: any) {
      console.error("❌ Create event error:", err);
      setError(err.message || "Failed to create event");
      toast({
        title: "Creation Failed",
        description: err.message || "See console for details",
        variant: "destructive",
      });
    } finally {
      setStage("idle");
      setIsSubmitting(false);
    }
  };

  const getMinDateTime = () => new Date().toISOString().slice(0, 16);

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="text-muted-foreground">
            Generate AI content and manage event uploads
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Details
            </CardTitle>
            <CardDescription>Provide details for your event</CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Label>Event Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />

              <Label>Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />

              <Label>Date & Time *</Label>
              <Input
                type="date"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                // min={getMinDateTime()}
                disabled={isSubmitting}
              />

              <Label>Event Images *</Label> 
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload Images
                </Button>
                <span className="text-sm text-muted-foreground">
                  {images.length} selected
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={APP_CONFIG.SUPPORTED_IMAGE_FORMATS.join(",")}
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative group"
                    >
                      <img
                        src={image.url}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No images selected.
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner
                        size="sm"
                        className="mr-2"
                      />
                      {stage === "creating"
                        ? "Creating Event..."
                        : stage === "uploading"
                        ? "Uploading Images..."
                        : "Processing..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" /> Create Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
