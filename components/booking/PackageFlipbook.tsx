"use client";

import Image from 'next/image';
import { BookOpen, ExternalLink, Maximize2, X } from 'lucide-react';
import { useRef, useState } from 'react';

import styles from './PackageFlipbook.module.css';

const FLIPBOOK_URL = 'https://heyzine.com/flip-book/eeabcd2f18.html';

export default function PackageFlipbook() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const readerRef = useRef<HTMLElement>(null);

  const openFlipbook = () => {
    setIsExpanded(true);
    setIsLoading(true);
  };

  const openFullscreen = () => {
    void readerRef.current?.requestFullscreen?.();
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={openFlipbook}
        className={styles.coverButton}
        aria-label="Open Zion package magazine"
      >
        <span className={styles.pageStack} aria-hidden="true" />
        <span className={styles.magazineEdge} aria-hidden="true" />
        <span className={styles.coverRule} aria-hidden="true" />
        <span className={styles.coverIssue}>No. 01</span>
        <span className={styles.coverInner}>
          <span className={styles.coverMeta}>
            <span className={styles.coverKicker}>
              The Event Issue
            </span>
            <span className={styles.coverTitle}>ZION</span>
            <span className={styles.coverTitleSmall}>Celebration Journal</span>
          </span>

          <span className={styles.logoSeal} aria-hidden="true">
            <Image
              src="/zion-logo.png"
              alt=""
              width={260}
              height={260}
              className={styles.logoImage}
            />
          </span>

          <span className={styles.coverSubtitle}>
            A curated edit of elegant spaces, refined packages, and unforgettable moments.
          </span>

          <span className={styles.coverAction}>
            <BookOpen className="h-4 w-4" strokeWidth={1.8} />
            Open Magazine
          </span>
        </span>
      </button>
    );
  }

  return (
    <section ref={readerRef} className={styles.readerShell} aria-label="Zion package magazine reader">
      <div className={styles.readerHeader}>
        <div>
          <p className={styles.readerKicker}>Celebration Journal</p>
          <h3 className={styles.readerTitle}>Zion Event Issue</h3>
        </div>

        <div className={styles.readerActions}>
          <a
            href={FLIPBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconButton}
            title="Open in new tab"
            aria-label="Open package magazine in a new tab"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.8} />
          </a>
          <button
            type="button"
            className={styles.iconButton}
            onClick={openFullscreen}
            title="Fullscreen"
            aria-label="View package magazine fullscreen"
          >
            <Maximize2 className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              setIsExpanded(false);
              setIsLoading(true);
            }}
            title="Close"
            aria-label="Close package magazine"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className={styles.iframeFrame}>
        {isLoading && (
          <div className={styles.loadingOverlay} aria-live="polite">
            <span className={styles.loadingMark} aria-hidden="true">
              <Maximize2 className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <span>Preparing magazine</span>
          </div>
        )}
        <iframe
          src={FLIPBOOK_URL}
          className={styles.flipbookFrame}
          allowFullScreen
          scrolling="no"
          title="Zion Events Place package magazine"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </section>
  );
}
