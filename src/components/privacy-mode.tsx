"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Input } from "@/components/ui/input";
import {
  PRIVACY_COOKIE_MAX_AGE,
  PRIVACY_COOKIE_NAME,
} from "@/lib/privacy";
import { cn } from "@/lib/utils";

type PrivacyModeContextValue = {
  enabled: boolean;
  toggle: () => void;
};

const PrivacyModeContext = createContext<PrivacyModeContextValue | null>(null);

function persistPrivacyMode(enabled: boolean) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${PRIVACY_COOKIE_NAME}=${enabled ? "1" : "0"}; Max-Age=${PRIVACY_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function PrivacyModeProvider({
  initialEnabled,
  children,
}: {
  initialEnabled: boolean;
  children: ReactNode;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);

  function toggle() {
    setEnabled((current) => {
      const next = !current;
      persistPrivacyMode(next);
      return next;
    });
  }

  return (
    <PrivacyModeContext.Provider value={{ enabled, toggle }}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyMode() {
  const context = useContext(PrivacyModeContext);

  if (!context) {
    throw new Error("usePrivacyMode must be used inside PrivacyModeProvider");
  }

  return context;
}

export function PrivateValue({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { enabled } = usePrivacyMode();

  if (!enabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={className}>
      <span className="sr-only">Valore nascosto</span>
      <span aria-hidden="true">••••</span>
    </span>
  );
}

export function PrivacyDetails({
  children,
  className,
  onClickCapture,
  onKeyDownCapture,
  onToggle,
  ...props
}: ComponentPropsWithoutRef<"details">) {
  const { enabled } = usePrivacyMode();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (enabled && detailsRef.current?.open) {
      detailsRef.current.open = false;
    }
  }, [enabled]);

  function targetsOwnSummary(target: EventTarget | null) {
    const element = target instanceof Element ? target : null;
    const summary = element?.closest("summary");
    return summary?.parentElement === detailsRef.current;
  }

  function handleClick(event: MouseEvent<HTMLDetailsElement>) {
    onClickCapture?.(event);

    if (enabled && targetsOwnSummary(event.target)) {
      event.preventDefault();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    onKeyDownCapture?.(event);

    if (
      enabled &&
      targetsOwnSummary(event.target) &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
    }
  }

  return (
    <details
      ref={detailsRef}
      data-privacy-locked={enabled ? "true" : "false"}
      aria-disabled={enabled || undefined}
      className={cn(className)}
      onClickCapture={handleClick}
      onKeyDownCapture={handleKeyDown}
      onToggle={(event) => {
        if (enabled && event.currentTarget.open) {
          event.currentTarget.open = false;
        }
        onToggle?.(event);
      }}
      {...props}
    >
      {children}
    </details>
  );
}

export function PrivateNumberInput({
  defaultValue,
  name,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const { enabled } = usePrivacyMode();

  if (!enabled) {
    return <Input name={name} defaultValue={defaultValue} {...props} />;
  }

  const preservedValue = props.value ?? defaultValue;

  return (
    <>
      {name && preservedValue !== undefined ? (
        <input type="hidden" name={name} value={String(preservedValue)} />
      ) : null}
      <Input
        {...props}
        name={undefined}
        type="text"
        value="••••"
        readOnly
        disabled
        aria-label="Valore nascosto"
      />
    </>
  );
}
