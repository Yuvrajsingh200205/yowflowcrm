'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Download, Lock } from 'lucide-react';
import { shareLinksApi, type SharedGalleryDto } from '@/lib/api/gallery';
import { BTN_PRIMARY, FIELD } from '@/features/team/components/TeamUiKit';

/**
 * What a family member sees when they open a shared link. No sign-in: the token
 * is the credential, and the API decides what it unlocks.
 */
export const SharedGalleryScreen: React.FC<{ token: string }> = ({ token }) => {
  const [gallery, setGallery] = useState<SharedGalleryDto | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(
    async (pass?: string) => {
      setLoading(true);
      setError(null);
      try {
        setGallery(await shareLinksApi.open(token, pass));
        setNeedsPassword(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'This gallery could not be opened.';
        // 401 means a password is required or wrong; anything else is terminal.
        if (/password/i.test(message)) {
          setNeedsPassword(true);
          setError(pass ? 'That password is not correct.' : null);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void open();
  }, [open]);

  if (loading) {
    return <Shell><p className="text-sm font-bold text-slate-500">Opening the gallery…</p></Shell>;
  }

  if (needsPassword) {
    return (
      <Shell>
        <form
          onSubmit={(e) => { e.preventDefault(); void open(password); }}
          className="w-full max-w-xs space-y-3 text-center"
        >
          <Lock className="mx-auto size-6 text-[#464B43]" />
          <h1 className="font-serif text-xl text-[#1C1F1B]">This gallery is protected</h1>
          <p className="text-xs text-slate-500">Enter the password the couple shared with you.</p>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={FIELD} />
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <button type="submit" className={`${BTN_PRIMARY} w-full`}>Open gallery</button>
        </form>
      </Shell>
    );
  }

  if (error || !gallery) {
    return (
      <Shell>
        <div className="max-w-sm space-y-2 text-center">
          <h1 className="font-serif text-xl text-[#1C1F1B]">Gallery unavailable</h1>
          <p className="text-sm text-slate-500">{error || 'This link may have been revoked or expired.'}</p>
        </div>
      </Shell>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdfb]">
      <header className="sticky top-0 z-30 border-b border-[#e2d9d3] bg-white/95 backdrop-blur-md">
        <div className="h-1 bg-[linear-gradient(90deg,#CCEB8E_0%,#464B43_48%,#373B35_100%)]" />
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-6 xl:px-10">
          <div className="min-w-0">
            <p className="truncate font-serif text-base text-[#1C1F1B] sm:text-lg">{gallery.title}</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-[.14em] text-[#a07a4a]">
              {gallery.projectName} · {gallery.studioName}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[#CCEB8E] bg-[#F4FBE6] px-2.5 py-1 text-[10px] font-extrabold text-[#8a6d3b]">
            {gallery.media.length} {gallery.media.length === 1 ? 'photo' : 'photos'}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1800px] px-3 py-5 sm:px-5 lg:px-6 xl:px-10">
        {gallery.media.length === 0 ? (
          <p className="py-16 text-center text-sm font-bold text-slate-500">Nothing has been shared here yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-5">
            {gallery.media.map((item) => (
              <figure key={item.id} className="group relative overflow-hidden rounded-xl border border-[#e2d9d3] bg-slate-50">
                {item.mediaType === 'VIDEO' ? (
                  <video src={item.url} controls className="aspect-square w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.title} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                )}
                {gallery.downloadAllowed && (
                  <a
                    href={item.url}
                    download={item.originalName}
                    title="Download"
                    className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-[#373B35] opacity-0 shadow transition group-hover:opacity-100"
                  >
                    <Download className="size-3.5" />
                  </a>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="grid min-h-screen place-items-center bg-[#fffdfb] px-6">{children}</main>
);
