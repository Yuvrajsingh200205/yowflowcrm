import Image from 'next/image';
import { Camera, Heart } from 'lucide-react';
import { BRAND } from '@/config/brand';

export function LoginHero() {
  return (
    <section aria-label={`${BRAND.name} introduction`} className="relative min-h-24 overflow-hidden bg-[#131512] px-5 py-4 text-[#fff4ed] sm:min-h-44 sm:px-10 sm:py-6 lg:min-h-0 lg:px-[7%] lg:py-[clamp(24px,4vh,48px)]">
      <Image
        src="/images/hero-aperture.svg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="(min-width: 1280px) 48vw, (min-width: 1024px) 46vw, 100vw"
        className="absolute inset-0 object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,22,19,.72),rgba(24,25,23,.14)_55%,rgba(11,22,19,.55))]" />
      <div className="relative z-1 flex items-center gap-3 uppercase tracking-[.16em] sm:gap-4.5">
        <Camera className="size-10 stroke-[1.35] text-[#f1cbb7] sm:size-12 lg:size-16" />
        <div><strong className="block font-serif text-base font-medium leading-[1.14] sm:text-lg lg:text-2xl">Wedding<br />Photo Planet</strong><span className="mt-2 hidden text-[9px] font-extrabold tracking-[.22em] sm:block">Capturing memories, creating stories</span></div>
      </div>
      <div className="relative z-1 mt-5 hidden sm:block lg:mt-[clamp(24px,5vh,60px)]">
        <p className="hidden font-serif text-2xl lg:block lg:text-[27px]">Welcome Back to</p>
        <h1 className="font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] tracking-[-.03em] lg:mt-2 lg:text-[clamp(32px,3vw,49px)]">{BRAND.name} <em className="not-italic text-[#9CA398]">CRM</em></h1>
        <div className="mt-6 hidden w-36 items-center gap-2 text-[#A6ADA3] lg:flex"><span className="h-px flex-1 bg-[#dfa786]" /><Heart className="size-3.5 fill-current" /><span className="h-px flex-1 bg-[#dfa786]" /></div>
        <h2 className="mt-6 hidden text-[17px] font-medium leading-[1.65] text-[#f1dfda] lg:block">Manage your clients, projects, shoots &amp; memories<br />all in one beautiful place.</h2>
      </div>
      <blockquote className="absolute bottom-7 left-[8%] right-[30%] z-1 hidden rounded-[20px] border border-white/12 bg-[rgba(14,20,19,.78)] p-5.5 text-center font-serif text-sm leading-[1.7] backdrop-blur-[10px] lg:block">
        <span className="block text-left text-[34px] leading-[.6] text-[#f4d9c7]">“</span>Behind every successful wedding is a team that<br />plans perfectly and captures beautifully.
      </blockquote>
    </section>
  );
}
