'use client';
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export interface TourStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
  };
}

const STORAGE_KEY = 'ledgr_tours_seen';

function getSeenTours(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function markTourSeen(tourId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const seen = getSeenTours();
    seen[tourId] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // localStorage blocked
  }
}

export function hasTourBeenSeen(tourId: string): boolean {
  return getSeenTours()[tourId] === true;
}

export function clearTourSeen(tourId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const seen = getSeenTours();
    delete seen[tourId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // ignore
  }
}

interface ProductTourProps {
  tourId: string;
  steps: TourStep[];
  /** Milliseconds to wait before starting the tour (default 1200ms) */
  delay?: number;
}

export function ProductTour({ tourId, steps, delay = 1200 }: ProductTourProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasTourBeenSeen(tourId)) return;

    const timeout = setTimeout(() => {
      console.log('[Tour] Timer fired for:', tourId);
      // Filter steps to only include those whose elements actually exist in the DOM
      const validSteps = steps.filter(s => {
        const el = document.querySelector(s.element);
        console.log('[Tour] Step element', s.element, '→', el ? 'FOUND' : 'MISSING');
        return el !== null;
      });

      // Need at least 1 valid step to start
      if (validSteps.length === 0) { console.log('[Tour] No valid steps, aborting'); return; }

      const driverObj = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: 'Next',
        prevBtnText: 'Prev',
        doneBtnText: 'Done',
        animate: true,
        smoothScroll: true,
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        stagePadding: 8,
        stageRadius: 12,
        allowClose: true,
        popoverClass: 'ledgr-tour-popover',
        steps: validSteps.map(s => ({
          element: s.element,
          popover: {
            title: s.popover.title,
            description: s.popover.description,
            side: s.popover.side ?? 'bottom',
            align: 'start',
          },
        })),
        onDestroyStarted: () => {
          markTourSeen(tourId);
          driverObj.destroy();
        },
      });

      console.log('[ProductTour] Starting tour:', tourId, 'with', validSteps.length, 'steps');
      try {
        driverObj.drive();
        console.log('[ProductTour] drive() called successfully');
      } catch (err) {
        console.error('[ProductTour] drive() failed:', err);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, []); // empty deps — only runs once per mount

  return <div data-product-tour={tourId} style={{ display: 'none' }} />;
}
