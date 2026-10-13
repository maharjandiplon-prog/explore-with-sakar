'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { BlogPost, BlogBlock, GalleryPhoto } from '@/types';
import { Maximize2, CheckCircle, Info } from 'lucide-react';

const Lightbox = dynamic(() => import('@/components/gallery/Lightbox'), { ssr: false });


interface ArticleContentProps {
  post: BlogPost;
}

export default function ArticleContent({ post }: ArticleContentProps) {
  // Extract all inline images for Lightbox integration
  const inlineImages: GalleryPhoto[] = [];
  post.content.forEach((block, idx) => {
    if (block.type === 'image') {
      inlineImages.push({
        id: `block-img-${idx}`,
        title: post.title,
        category: 'heritage',
        categoryLabel: post.category,
        location: 'Nepal',
        image: block.image.src,
        alt: block.image.alt,
        orientation: 'landscape',
        caption: block.caption || block.image.caption || '',
      });
    } else if (block.type === 'twoImages') {
      inlineImages.push({
        id: `block-two-left-${idx}`,
        title: post.title,
        category: 'heritage',
        categoryLabel: post.category,
        location: 'Nepal',
        image: block.left.src,
        alt: block.left.alt,
        orientation: 'landscape',
        caption: block.left.caption || '',
      });
      inlineImages.push({
        id: `block-two-right-${idx}`,
        title: post.title,
        category: 'heritage',
        categoryLabel: post.category,
        location: 'Nepal',
        image: block.right.src,
        alt: block.right.alt,
        orientation: 'landscape',
        caption: block.right.caption || '',
      });
    } else if (block.type === 'storyImageText') {
      inlineImages.push({
        id: `block-story-${idx}`,
        title: post.title,
        category: 'heritage',
        categoryLabel: post.category,
        location: 'Nepal',
        image: block.image.src,
        alt: block.image.alt,
        orientation: 'portrait',
        caption: block.image.caption || '',
      });
    }
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightboxBySrc = (src: string) => {
    const idx = inlineImages.findIndex((img) => img.image === src);
    if (idx !== -1) setLightboxIndex(idx);
  };

  return (
    <div className="py-12 bg-parchment-100">
      <div className="editorial-container max-w-3xl mx-auto px-4 sm:px-6">
        {/* Sample / Draft Notice Banner */}
        {post.isDraftSample && (
          <div className="mb-8 p-4 rounded-xl bg-sand border border-parchment-300 flex items-start space-x-3 text-xs text-himalaya-700">
            <Info className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-himalaya-950 block mb-0.5">
                Editorial Note:
              </strong>
              <span>
                This story represents the experiential tone and narrative philosophy of Sakar&apos;s Journal. Factual personal anecdotes are curated with Sakar&apos;s guidance.
              </span>
            </div>
          </div>
        )}

        {/* Story Content Blocks */}
        <div className="space-y-8 text-himalaya-900 leading-relaxed font-light text-base sm:text-lg">
          {post.content.map((block, index) => {
            switch (block.type) {
              case 'paragraph':
                const isFirstParagraph = index === 0 || post.content.findIndex(b => b.type === 'paragraph') === index;
                const fontFamilyClass =
                  block.fontFamily === 'serif' ? 'font-editorial-serif' :
                  block.fontFamily === 'sans' ? 'font-sans' :
                  block.fontFamily === 'display' ? 'font-display-serif' :
                  block.fontFamily === 'mono' ? 'font-mono' :
                  post.fontFamily === 'sans' ? 'font-sans' :
                  post.fontFamily === 'display' ? 'font-display-serif' :
                  post.fontFamily === 'mono' ? 'font-mono' :
                  post.fontFamily === 'serif' ? 'font-editorial-serif' : '';

                const fontSizeClass =
                  block.fontSize === 'sm' ? 'text-sm sm:text-base leading-relaxed' :
                  block.fontSize === 'base' ? 'text-base sm:text-lg leading-[1.85]' :
                  block.fontSize === 'lg' ? 'text-lg sm:text-xl leading-[1.95]' :
                  block.fontSize === 'xl' ? 'text-xl sm:text-2xl leading-[2]' :
                  post.fontSize === 'sm' ? 'text-sm sm:text-base leading-relaxed' :
                  post.fontSize === 'lg' ? 'text-lg sm:text-xl leading-[1.95]' :
                  post.fontSize === 'xl' ? 'text-xl sm:text-2xl leading-[2]' : 'text-base sm:text-lg leading-[1.9]';

                const fontWeightClass =
                  block.fontWeight === 'light' ? 'font-light' :
                  block.fontWeight === 'normal' ? 'font-normal' :
                  block.fontWeight === 'medium' ? 'font-medium' :
                  block.fontWeight === 'bold' ? 'font-bold' : 'font-light';

                return (
                  <p
                    key={index}
                    style={block.textColor ? { color: block.textColor } : undefined}
                    className={`${fontSizeClass} ${fontFamilyClass} ${fontWeightClass} ${block.textColor ? '' : 'text-himalaya-800'} ${isFirstParagraph ? 'first-letter:font-editorial-serif first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-terracotta' : ''}`}
                  >
                    {block.content}
                  </p>
                );

              case 'heading':
                const headingFontClass =
                  block.fontFamily === 'sans' ? 'font-sans' :
                  block.fontFamily === 'display' ? 'font-display-serif' : 'font-editorial-serif';

                if (block.level === 2) {
                  return (
                    <h2
                      key={index}
                      style={block.textColor ? { color: block.textColor } : undefined}
                      className={`${headingFontClass} text-3xl sm:text-4xl font-bold ${block.textColor ? '' : 'text-himalaya-950'} tracking-tight mt-16 pt-4 pb-4 border-b border-parchment-300`}
                    >
                      {block.content}
                    </h2>
                  );
                }
                return (
                  <h3
                    key={index}
                    style={block.textColor ? { color: block.textColor } : undefined}
                    className={`${headingFontClass} text-2xl sm:text-3xl font-bold ${block.textColor ? '' : 'text-himalaya-950'} mt-10`}
                  >
                    {block.content}
                  </h3>
                );

              case 'quote':
                return (
                  <blockquote
                    key={index}
                    className="my-12 p-8 sm:p-12 rounded-3xl bg-white border border-parchment-300 shadow-editorial relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-himalaya-900 pointer-events-none">
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>
                    <p className="font-display-serif italic text-2xl sm:text-3xl text-himalaya-950 font-normal leading-snug relative z-10 text-center max-w-2xl mx-auto">
                      &ldquo;{block.content}&rdquo;
                    </p>
                    {block.attribution && (
                      <cite className="text-xs uppercase tracking-widest font-bold text-terracotta block not-italic mt-6 text-center relative z-10">
                        — {block.attribution}
                      </cite>
                    )}
                  </blockquote>
                );

              case 'image':
                return (
                  <figure
                    key={index}
                    className="my-8 cursor-pointer group"
                    onClick={() => openLightboxBySrc(block.image.src)}
                  >
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-editorial bg-sand">
                      <Image
                        src={block.image.src}
                        alt={block.image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-himalaya-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5 drop-shadow" />
                      </div>
                    </div>
                    {block.caption && (
                      <figcaption className="text-xs text-himalaya-600 font-light mt-2 text-center italic">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );

              case 'twoImages':
                return (
                  <div key={index} className="my-8 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group shadow-subtle bg-sand"
                        onClick={() => openLightboxBySrc(block.left.src)}
                      >
                        <Image
                          src={block.left.src}
                          alt={block.left.alt}
                          fill
                          sizes="(max-width: 640px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-himalaya-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>

                      <div
                        className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group shadow-subtle bg-sand"
                        onClick={() => openLightboxBySrc(block.right.src)}
                      >
                        <Image
                          src={block.right.src}
                          alt={block.right.alt}
                          fill
                          sizes="(max-width: 640px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-himalaya-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    {block.caption && (
                      <p className="text-xs text-himalaya-600 font-light text-center italic pt-1">
                        {block.caption}
                      </p>
                    )}
                  </div>
                );

              case 'storyImageText':
                return (
                  <div
                    key={index}
                    className="my-8 p-6 rounded-2xl bg-sand border border-parchment-300 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center shadow-subtle"
                  >
                    <div
                      className={`sm:col-span-5 relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer group ${
                        block.imagePosition === 'right' ? 'sm:order-2' : 'sm:order-1'
                      }`}
                      onClick={() => openLightboxBySrc(block.image.src)}
                    >
                      <Image
                        src={block.image.src}
                        alt={block.image.alt}
                        fill
                        sizes="300px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div
                      className={`sm:col-span-7 space-y-2 ${
                        block.imagePosition === 'right' ? 'sm:order-1' : 'sm:order-2'
                      }`}
                    >
                      <p className="text-sm sm:text-base text-himalaya-800 font-light leading-relaxed">
                        {block.text}
                      </p>
                    </div>
                  </div>
                );

              case 'practicalTips':
                return (
                  <div
                    key={index}
                    className="my-8 rounded-2xl bg-parchment-50 border border-terracotta/30 p-6 sm:p-8 shadow-subtle space-y-4"
                  >
                    <h3 className="font-editorial-serif text-xl font-bold text-himalaya-950 flex items-center text-terracotta">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span>{block.title}</span>
                    </h3>

                    <div className="space-y-3 pt-2">
                      {block.items.map((item, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-white border border-parchment-300 space-y-1"
                        >
                          <h4 className="text-sm font-bold text-himalaya-950 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-terracotta mr-2" />
                            {item.point}
                          </h4>
                          <p className="text-xs text-himalaya-700 font-light pl-4 leading-relaxed">
                            {item.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>

      <Lightbox
        photos={inlineImages}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
}
