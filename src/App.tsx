import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";
import FlowerIntro from "./FlowerIntro";

type Message = {
  text: string;
  highlights: string[];
};

const messages: Message[] = [
  { text: "Aujourd’hui, vous partez à la retraite.", highlights: ["retraite"] },
  { text: "Et même si on est heureux pour vous.", highlights: ["heureux pour vous"] },
  {
    text: "Il faut l’avouer : vous allez beaucoup nous manquer.",
    highlights: ["beaucoup nous manquer"],
  },
  {
    text: "Qui va nous sauver quand les cartons vont s’empiler?",
    highlights: ["nous sauver", "cartons"],
  },
  { text: "Ou quand les boîtes de fromage vont déborder?", highlights: ["boîtes de fromage"] },
  { text: "Qui va apporter ce sourire contagieux?", highlights: ["sourire contagieux"] },
  {
    text: "Ce sourire qui illuminait nos journées.",
    highlights: ["illuminait", "nos journées"],
  },
  { text: "Même les plus longues.", highlights: ["plus longues"] },
  {
    text: "Personne ne peut vraiment savoir toutes les épreuves que vous avez traversées.",
    highlights: ["épreuves", "traversées"],
  },
  {
    text: "Mais sachez que je suis fier de vous.",
    highlights: ["je suis fier de vous"],
  },
  {
    text: "Fier de ce que vous êtes devenue.",
    highlights: ["vous êtes devenue"],
  },
  {
    text: "Et fier de tout ce que vous avez accompli.",
    highlights: ["accompli"],
  },
  {
    text: "Merci d’avoir partagé autant d’amour.",
    highlights: ["Merci", "amour"],
  },
  {
    text: "Autant de tendresse et de gentillesse autour de vous.",
    highlights: ["tendresse", "gentillesse"],
  },
  { text: "Merci pour votre sourire.", highlights: ["sourire"] },
  { text: "Merci pour votre lumière.", highlights: ["lumière"] },
  { text: "Merci pour votre présence.", highlights: ["présence"] },
  {
    text: "Vous avez été une super amie pour beaucoup.",
    highlights: ["super amie"],
  },
  { text: "Une super mère pour vos enfants.", highlights: ["super mère", "enfants"] },
  {
    text: "Et vous serez sûrement une merveilleuse grand-mère pour votre petit-fils.",
    highlights: ["merveilleuse grand-mère", "petit-fils"],
  },
  {
    text: "Pour moi, vous resterez ma seconde maman du Québec.",
    highlights: ["seconde maman du Québec"],
  },
  {
    text: "Désolé si le monde ne peut pas toujours vous rendre ne serait-ce que 10 %.",
    highlights: ["Désolé", "10 %"],
  },
  {
    text: "De la gentillesse que vous lui offrez.",
    highlights: ["gentillesse", "offrez"],
  },
  {
    text: "Mais sachez que votre lumière restera dans le cœur de beaucoup de gens.",
    highlights: ["lumière", "cœur", "beaucoup de gens"],
  },
  { text: "Au revoir.", highlights: ["Au revoir"] },
  { text: "Bonne retraite Sonia.", highlights: ["Bonne retraite", "Sonia"] },
];

const AUTO_ADVANCE_DELAY = 5200;
const INTRO_REQUIRED_CLICKS = 3;
const AUDIO_SRC = "/audio/Sonia,%20prends%20le%20temps.mp3";

type PhotoMode = "camera" | "upload" | null;

function App() {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isPhotoSectionVisible, setIsPhotoSectionVisible] = useState(false);
  const [photoMode, setPhotoMode] = useState<PhotoMode>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isTransformingPhoto, setIsTransformingPhoto] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [introClickCount, setIntroClickCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const introClickCountRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasReachedFinalMessage = currentMessageIndex >= messages.length;

  useEffect(() => {
    if (!isCardOpen || hasReachedFinalMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      showNextMessage();
    }, AUTO_ADVANCE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [currentMessageIndex, hasReachedFinalMessage, isCardOpen]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (photoMode !== "camera") {
      stopCameraStream();
    }
  }, [photoMode]);

  const openCard = useCallback(async () => {
    setIsCardOpen(true);
    setCurrentMessageIndex(0);
    setIntroClickCount(0);
    introClickCountRef.current = 0;

    if (!audioRef.current) {
      return;
    }

    try {
      await audioRef.current.play();
    } catch {
      return;
    }
  }, []);

  const handleIntroClick = useCallback(() => {
    const nextClickCount = introClickCountRef.current + 1;

    if (nextClickCount >= INTRO_REQUIRED_CLICKS) {
      void openCard();
      return;
    }

    introClickCountRef.current = nextClickCount;
    setIntroClickCount(nextClickCount);
  }, [openCard]);

  const showNextMessage = () => {
    setCurrentMessageIndex((index) => {
      if (index >= messages.length) {
        return index;
      }

      return index + 1;
    });
  };

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showNextMessage();
    }
  };

  const startCamera = async () => {
    setPhotoMode("camera");
    setSelectedImage(null);
    setTransformedImage(null);
    setCameraError("");
    setIsCameraReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("La caméra n’est pas disponible sur cet appareil ou ce navigateur.");
      return;
    }

    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch {
      setCameraError(
        "L’accès à la caméra a été refusé ou n’est pas disponible. Tu peux importer une photo à la place.",
      );
    }
  };

  const stopCameraStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraReady(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Impossible de capturer la photo avec ce navigateur.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSelectedImage(canvas.toDataURL("image/png"));
    setTransformedImage(null);
    stopCameraStream();
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPhotoMode("upload");
    setCameraError("");
    setTransformedImage(null);
    stopCameraStream();

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const openUploadPicker = () => {
    setPhotoMode("upload");
    fileInputRef.current?.click();
  };

  const transformPhoto = async () => {
    if (!selectedImage) {
      setCameraError("Ajoute ou prends une photo avant de créer l’emballage.");
      return;
    }

    setCameraError("");
    setIsTransformingPhoto(true);

    try {
      const result = await requestPhotoTransformation(selectedImage);
      setTransformedImage(result.image);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer cette photo à GPT Image pour le moment.",
      );
    } finally {
      setIsTransformingPhoto(false);
    }
  };

  const downloadTransformedPhoto = () => {
    if (!transformedImage) {
      return;
    }

    const link = document.createElement("a");
    link.href = transformedImage;
    link.download = "sonia-qui-rit.png";
    link.click();
  };

  return (
    <main className="app-shell">
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        loop
        preload="none"
      />

      {!isCardOpen ? (
        <FlowerIntro clickCount={introClickCount} onIntroClick={handleIntroClick} />
      ) : (
        <section className="card-experience" aria-live="polite">
          {!hasReachedFinalMessage ? (
            <article
              className="message-card"
              key={currentMessageIndex}
              role="button"
              tabIndex={0}
              onClick={showNextMessage}
              onKeyDown={handleMessageKeyDown}
            >
              <HighlightedMessage message={messages[currentMessageIndex]} />
            </article>
          ) : (
            <article className="final-section">
              <h1>
                <span className="final-highlight">Bonne retraite</span> Sonia
              </h1>
              {!isPhotoSectionVisible ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setIsPhotoSectionVisible(true)}
                >
                  Créer un souvenir photo
                </button>
              ) : (
                <PhotoMemorySection
                  cameraError={cameraError}
                  fileInputRef={fileInputRef}
                  isCameraReady={isCameraReady}
                  onCapturePhoto={capturePhoto}
                  onImageUpload={handleImageUpload}
                  onStartCamera={startCamera}
                  onTransformPhoto={transformPhoto}
                  onUploadClick={openUploadPicker}
                  photoMode={photoMode}
                  selectedImage={selectedImage}
                  transformedImage={transformedImage}
                  isTransformingPhoto={isTransformingPhoto}
                  videoRef={videoRef}
                  onDownloadPhoto={downloadTransformedPhoto}
                />
              )}
            </article>
          )}
        </section>
      )}
    </main>
  );
}

function HighlightedMessage({ message }: { message: Message }) {
  const parts: Array<{ text: string; highlight: boolean }> = [];
  let cursor = 0;

  message.highlights.forEach((highlight) => {
    const index = message.text.indexOf(highlight, cursor);

    if (index === -1) {
      return;
    }

    if (index > cursor) {
      parts.push({ text: message.text.slice(cursor, index), highlight: false });
    }

    parts.push({ text: highlight, highlight: true });
    cursor = index + highlight.length;
  });

  if (cursor < message.text.length) {
    parts.push({ text: message.text.slice(cursor), highlight: false });
  }

  return (
    <p>
      {parts.map((part, index) => {
        if (!part.highlight) {
          return <span key={`${part.text}-${index}`}>{part.text}</span>;
        }

        const tone = Math.abs(
          Array.from(part.text).reduce((total, character) => total + character.charCodeAt(0), 0),
        ) % 5;

        return (
          <span className={`message-highlight message-highlight-${tone}`} key={`${part.text}-${index}`}>
            {part.text}
          </span>
        );
      })}
    </p>
  );
}

type PhotoMemorySectionProps = {
  cameraError: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isCameraReady: boolean;
  onCapturePhoto: () => void;
  onDownloadPhoto: () => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onStartCamera: () => void;
  onTransformPhoto: () => void;
  onUploadClick: () => void;
  isTransformingPhoto: boolean;
  photoMode: PhotoMode;
  selectedImage: string | null;
  transformedImage: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

function PhotoMemorySection({
  cameraError,
  fileInputRef,
  isCameraReady,
  isTransformingPhoto,
  onCapturePhoto,
  onDownloadPhoto,
  onImageUpload,
  onStartCamera,
  onTransformPhoto,
  onUploadClick,
  photoMode,
  selectedImage,
  transformedImage,
  videoRef,
}: PhotoMemorySectionProps) {
  return (
    <section className="photo-section" aria-label="Souvenir photo">
      <div className="photo-actions">
        <button className="secondary-button" type="button" onClick={onStartCamera}>
          Prendre une photo
        </button>
        <button className="secondary-button" type="button" onClick={onUploadClick}>
          Importer une photo
        </button>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={onImageUpload}
        />
      </div>

      <div className="photo-preview">
        {photoMode === "camera" && !selectedImage ? (
          <>
            <video ref={videoRef} playsInline muted aria-label="Aperçu caméra" />
            <button
              className="primary-button capture-button"
              type="button"
              onClick={onCapturePhoto}
              disabled={!isCameraReady}
            >
              Capturer la photo
            </button>
          </>
        ) : null}

        {selectedImage ? <img src={selectedImage} alt="Souvenir sélectionné" /> : null}
      </div>

      <button
        className="primary-button"
        type="button"
        onClick={onTransformPhoto}
        disabled={!selectedImage || isTransformingPhoto}
      >
        {isTransformingPhoto ? "Envoi à GPT Image..." : "Créer l’emballage avec GPT Image"}
      </button>

      {transformedImage ? (
        <div className="photo-result">
          <img src={transformedImage} alt="Photo transformée façon emballage Sonia qui rit" />
          <button className="secondary-button" type="button" onClick={onDownloadPhoto}>
            Télécharger l’image
          </button>
        </div>
      ) : null}

      {cameraError ? <p className="camera-error">{cameraError}</p> : null}
    </section>
  );
}

async function requestPhotoTransformation(source: string) {
  const response = await fetch("/api/transform-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: source }),
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("La route API de modification photo n’est pas disponible sur cette version déployée.");
  }

  const payload = (await response.json()) as { image?: string; error?: string };

  if (!response.ok || !payload.image) {
    throw new Error(payload.error ?? "Impossible d’envoyer cette photo à GPT Image pour le moment.");
  }

  return { image: payload.image };
}

export default App;
