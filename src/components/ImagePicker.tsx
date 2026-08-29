import { useEffect, useRef, useState } from "react";
import { apiJson } from "../adminApi";
import { mediaUrl } from "../media";

type GalleryImage = {
  id: number;
  title: string;
  file_path: string;
  category: string;
};

type Props = {
  value: string;
  onChange: (path: string) => void;
  label?: string;
  help?: string;
};

export function ImagePicker({ value, onChange, label = "ছবি", help }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "gallery">("choose");
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open || mode !== "gallery") return;
    let cancelled = false;
    setLoading(true);
    setError("");
    apiJson<{ gallery: GalleryImage[] }>("/api/gallery.php?action=admin-list")
      .then((data) => {
        if (!cancelled) setItems(data.gallery.filter((item) => item.file_path));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "গ্যালারি লোড করা যায়নি।");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, mode]);

  const close = () => {
    if (uploading) return;
    setOpen(false);
    setMode("choose");
    setError("");
  };

  const uploadFromDevice = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("শুধু image file নির্বাচন করুন।");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("ছবির সর্বোচ্চ আকার ৮ MB।");
      return;
    }

    try {
      setUploading(true);
      setError("");
      const form = new FormData();
      form.append("file", file);
      const data = await apiJson<{ path: string }>("/api/activities.php?action=upload-image", {
        method: "POST",
        body: form,
      });
      onChange(data.path);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ছবি আপলোড করা যায়নি।");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="admin-image-picker-field">
      <span className="admin-image-picker-label">{label}</span>
      <div className="admin-image-picker-preview">
        {value ? (
          <img src={mediaUrl(value)} alt="নির্বাচিত ছবি" />
        ) : (
          <div className="admin-image-picker-empty">কোনো ছবি নির্বাচন করা হয়নি</div>
        )}
      </div>
      <div className="admin-image-picker-actions">
        <button type="button" className="admin-secondary-button" onClick={() => setOpen(true)}>
          🖼️ ছবি নির্বাচন করুন
        </button>
        {value && (
          <button type="button" className="admin-secondary-button admin-danger-light" onClick={() => onChange("")}>ছবি সরান</button>
        )}
      </div>
      {help && <small className="admin-field-help">{help}</small>}
      {value && <small className="admin-image-picker-path">{value}</small>}

      {open && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="admin-image-picker-modal" role="dialog" aria-modal="true" aria-label="ছবি নির্বাচন">
            <div className="admin-image-picker-modal-header">
              <div>
                <span className="admin-kicker">IMAGE SOURCE</span>
                <h3>ছবি নির্বাচন করুন</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={close}>×</button>
            </div>

            {mode === "choose" ? (
              <div className="admin-image-source-grid">
                <button type="button" className="admin-image-source-card" onClick={() => setMode("gallery")}>
                  <span className="admin-image-source-icon">🖼️</span>
                  <strong>গ্যালারি থেকে</strong>
                  <small>Database-এ থাকা gallery image নির্বাচন করুন</small>
                </button>
                <button type="button" className="admin-image-source-card" onClick={() => inputRef.current?.click()} disabled={uploading}>
                  <span className="admin-image-source-icon">📤</span>
                  <strong>{uploading ? "আপলোড হচ্ছে..." : "ডিভাইস থেকে Upload"}</strong>
                  <small>কম্পিউটার থেকে নতুন image upload করুন</small>
                </button>
              </div>
            ) : (
              <div>
                <div className="admin-image-picker-toolbar">
                  <button type="button" className="admin-secondary-button" onClick={() => setMode("choose")}>← ফিরে যান</button>
                  <strong>গ্যালারির ছবি</strong>
                </div>
                {error && <div className="admin-data-notice">{error}</div>}
                {loading ? (
                  <div className="admin-list-empty">গ্যালারি লোড হচ্ছে...</div>
                ) : items.length === 0 ? (
                  <div className="admin-list-empty">গ্যালারিতে কোনো ছবি নেই। আগে Gallery Management থেকে ছবি যোগ করুন।</div>
                ) : (
                  <div className="admin-picker-gallery-grid">
                    {items.map((item) => (
                      <button key={item.id} type="button" className="admin-picker-gallery-item" onClick={() => { onChange(item.file_path); close(); }}>
                        <img src={mediaUrl(item.file_path)} alt={item.title || "Gallery image"} />
                        <span>{item.title || "Untitled"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === "choose" && error && <div className="admin-data-notice">{error}</div>}
          </div>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFromDevice(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
