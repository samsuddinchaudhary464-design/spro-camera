import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { CameraView, type CapturedPhoto } from "./components/CameraView";
import { GalleryView } from "./components/GalleryView";
import { PhotoDetail } from "./components/PhotoDetail";
import { QRScannerView } from "./components/QRScannerView";

type AppView = "camera" | "gallery" | "detail" | "qr";

const STORAGE_KEY = "snappro_photos";

function loadPhotos(): CapturedPhoto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CapturedPhoto[];
  } catch {
    return [];
  }
}

function savePhotos(photos: CapturedPhoto[]) {
  try {
    // Keep only last 30 photos to avoid storage overflow
    const trimmed = photos.slice(-30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn("localStorage full, could not save photo");
  }
}

export default function App() {
  const [view, setView] = useState<AppView>("camera");
  const [photos, setPhotos] = useState<CapturedPhoto[]>(loadPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(
    null,
  );

  // Persist photos to localStorage
  useEffect(() => {
    savePhotos(photos);
  }, [photos]);

  function handlePhotoCapture(photo: CapturedPhoto) {
    setPhotos((prev) => [...prev, photo]);
  }

  function handleSelectPhoto(photo: CapturedPhoto) {
    setSelectedPhoto(photo);
    setView("detail");
  }

  function handleDeletePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSavePhoto(updated: CapturedPhoto) {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPhoto(updated);
  }

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Meta for browser theming */}
      <meta name="theme-color" content="#050505" />

      {view === "camera" && (
        <CameraView
          photos={photos}
          onPhotoCapture={handlePhotoCapture}
          onGalleryOpen={() => setView("gallery")}
          onQROpen={() => setView("qr")}
        />
      )}

      {view === "qr" && <QRScannerView onBack={() => setView("camera")} />}

      {view === "gallery" && (
        <GalleryView
          photos={photos}
          onBack={() => setView("camera")}
          onSelect={handleSelectPhoto}
        />
      )}

      {view === "detail" && selectedPhoto && (
        <PhotoDetail
          photo={selectedPhoto}
          onBack={() => setView("gallery")}
          onDelete={handleDeletePhoto}
          onSave={handleSavePhoto}
        />
      )}

      <Toaster />
    </div>
  );
}
