'use client';

interface ShareButtonsProps {
  title: string;
  slug: string;
  id: string;
}

export function ShareButtons({ title, slug, id }: ShareButtonsProps) {
  const url = typeof window !== 'undefined' 
    ? `${window.location.origin}/blog/${slug || id}`
    : `/blog/${slug || id}`;

  const handleShareX = () => {
    // Create a well-formatted tweet with title and URL
    // Use both text and url parameters for better Twitter card support
    const tweetText = `${title}\n\n#Bitcoin #Africa #PanAfricaBitcoinAcademy #panABTC`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleShareNostr = () => {
    // TODO: Implement Nostr sharing with nostr-tools
    alert('Nostr sharing coming soon!');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
      <h3 className="mb-4 text-lg font-semibold text-purple-200">Share This Post</h3>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleShareX}
          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20"
        >
          Share on X
        </button>
        <button
          onClick={handleShareNostr}
          className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-4 py-2 text-sm font-medium text-purple-300 transition hover:bg-purple-400/20"
        >
          Share on Nostr
        </button>
        <button
          onClick={handleCopyLink}
          className="rounded-lg border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/20"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}
