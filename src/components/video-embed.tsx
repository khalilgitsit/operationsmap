'use client';

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // YouTube
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.hostname.includes('youtu.be')
        ? parsed.pathname.slice(1)
        : parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (parsed.hostname.includes('vimeo.com')) {
      const match = parsed.pathname.match(/\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }

    // Loom
    if (parsed.hostname.includes('loom.com')) {
      const match = parsed.pathname.match(/\/share\/([a-zA-Z0-9]+)/);
      if (match) return `https://www.loom.com/embed/${match[1]}`;
    }

    // Google Drive
    if (parsed.hostname.includes('drive.google.com')) {
      const match = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }

    return null;
  } catch {
    return null;
  }
}

export function VideoEmbed({ url }: { url: string }) {
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline"
      >
        {url}
      </a>
    );
  }

  return (
    <div className="aspect-video w-full rounded-md overflow-hidden border">
      <iframe
        src={embedUrl}
        className="h-full w-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
