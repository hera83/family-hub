import { useState, useRef } from "react";
import { isFeatureActive } from "@/config/capabilities";
import { Button } from "@/components/ui/button";
import { Upload, X, AlertCircle } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}

export function ImageUpload({ value, onChange, folder = "uploads" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadEnabled = isFeatureActive("imageUpload");

  const upload = async (file: File) => {
    if (!uploadEnabled) return;
    setUploading(true);
    try {
      const { imageApi } = await import("@/lib/api/imageApi");
      const url = await imageApi.upload(file, folder);
      onChange(url);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative">
          <img src={value} alt="Upload" className="w-full h-32 object-cover rounded-md border" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => onChange(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : uploadEnabled ? (
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[44px] gap-2"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploader..." : "Upload billede"}
        </Button>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-md border border-dashed text-muted-foreground text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Billedupload afventer API-understøttelse</span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
