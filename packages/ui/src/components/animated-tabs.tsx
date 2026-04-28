"use client"; // @NOTE: Add in case you are using Next.js

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

type AnimatedTabItem = {
  href?: string;
  label: ReactNode;
  value: string;
};

type AnimatedTabsProps = {
  tabs: Array<string | AnimatedTabItem>;
  value?: string;
  onValueChange?: (value: string) => void;
};

function normalizeTab(tab: string | AnimatedTabItem): AnimatedTabItem {
  if (typeof tab === "string") {
    return {
      href: "#",
      label: tab,
      value: tab,
    };
  }

  return tab;
}

export function AnimatedTabs({
  tabs,
  value,
  onValueChange,
}: AnimatedTabsProps) {
  const normalizedTabs = tabs.map(normalizeTab);
  const [activeTab, setActiveTab] = useState(
    value ?? normalizedTabs[0]?.value ?? ""
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (value) {
      setActiveTab(value);
    }
  }, [value]);

  useEffect(() => {
    const container = containerRef.current;

    if (container && activeTab) {
      const activeTabElement = activeTabRef.current;

      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;

        const clipLeft = offsetLeft;
        const clipRight = offsetLeft + offsetWidth;

        container.style.clipPath = `inset(0 ${Number(
          100 - (clipRight / container.offsetWidth) * 100
        ).toFixed()}% 0 ${Number(
          (clipLeft / container.offsetWidth) * 100
        ).toFixed()}% round 17px)`;
      }
    }
  }, [activeTab]);

  const handleTabClick = (nextValue: string) => {
    setActiveTab(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div className="relative flex w-fit flex-col items-center rounded-full">
      <div
        ref={containerRef}
        className="absolute z-10 w-full overflow-hidden [clip-path:inset(0px_75%_0px_0%_round_17px)] [transition:clip-path_0.25s_ease]"
      >
        <div className="relative flex w-full justify-center bg-primary/10">
          {normalizedTabs.map((tab) =>
            tab.href ? (
              <a
                key={tab.value}
                href={tab.href}
                onClick={() => handleTabClick(tab.value)}
                className={cn(
                  "flex h-8 items-center rounded-full p-3 px-4 font-medium text-neutral-900 text-sm/5.5 cursor-pointer"
                )}
                tabIndex={-1}
              >
                {tab.label}
              </a>
            ) : (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabClick(tab.value)}
                className={cn(
                  "flex h-8 items-center rounded-full p-3 px-4 font-medium text-neutral-900 text-sm/5.5 cursor-pointer"
                )}
                tabIndex={-1}
              >
                {tab.label}
              </button>
            )
          )}
        </div>
      </div>
      <div className="relative flex w-full justify-center">
        {normalizedTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const activeRef = isActive
            ? (node: HTMLAnchorElement | HTMLButtonElement | null) => {
                activeTabRef.current = node;
              }
            : undefined;

          return tab.href ? (
            <a
              key={tab.value}
              href={tab.href}
              ref={activeRef}
              onClick={() => handleTabClick(tab.value)}
              className="flex h-8 items-center rounded-full p-3 px-4 font-medium text-primary-muted text-sm/5.5 cursor-pointer"
            >
              {tab.label}
            </a>
          ) : (
            <button
              key={tab.value}
              type="button"
              ref={activeRef}
              onClick={() => handleTabClick(tab.value)}
              className="flex h-8 items-center rounded-full p-3 px-4 font-medium text-primary-muted text-sm/5.5 cursor-pointer"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
