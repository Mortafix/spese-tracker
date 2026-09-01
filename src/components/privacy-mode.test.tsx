/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  PrivacyDetails,
  PrivacyModeProvider,
  PrivateNumberInput,
  PrivateValue,
  usePrivacyMode,
} from "@/components/privacy-mode";
import { PRIVACY_COOKIE_NAME } from "@/lib/privacy";

afterEach(() => {
  cleanup();
  document.cookie = `${PRIVACY_COOKIE_NAME}=; Max-Age=0; Path=/`;
});

function PrivacyToggle() {
  const { enabled, toggle } = usePrivacyMode();

  return (
    <button type="button" aria-pressed={enabled} onClick={toggle}>
      {enabled ? "Mostra importi" : "Nascondi importi"}
    </button>
  );
}

describe("privacy mode", () => {
  it("masks sensitive text and removes the real value from the accessibility tree", () => {
    render(
      <PrivacyModeProvider initialEnabled>
        <PrivateValue>€ 1.234,56</PrivateValue>
      </PrivacyModeProvider>,
    );

    expect(screen.queryByText("€ 1.234,56")).not.toBeInTheDocument();
    expect(screen.getByText("Valore nascosto")).toBeInTheDocument();
    expect(screen.getByText("••••")).toHaveAttribute("aria-hidden", "true");
  });

  it("toggles immediately and persists the preference in a cookie", () => {
    render(
      <PrivacyModeProvider initialEnabled={false}>
        <PrivacyToggle />
        <PrivateValue>€ 42,00</PrivateValue>
      </PrivacyModeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nascondi importi" }));

    expect(screen.getByRole("button", { name: "Mostra importi" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("€ 42,00")).not.toBeInTheDocument();
    expect(document.cookie).toContain(`${PRIVACY_COOKIE_NAME}=1`);
  });

  it("closes disclosures, blocks reopening, and leaves them closed after unlocking", async () => {
    render(
      <PrivacyModeProvider initialEnabled={false}>
        <PrivacyToggle />
        <PrivacyDetails>
          <summary>Modifica</summary>
          <form aria-label="Modulo modifica" />
        </PrivacyDetails>
      </PrivacyModeProvider>,
    );

    const details = screen.getByText("Modifica").parentElement as HTMLDetailsElement;
    fireEvent.click(screen.getByText("Modifica"));
    expect(details.open).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Nascondi importi" }));
    await waitFor(() => expect(details.open).toBe(false));

    fireEvent.click(screen.getByText("Modifica"));
    expect(details.open).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Mostra importi" }));
    expect(details.open).toBe(false);

    fireEvent.click(screen.getByText("Modifica"));
    expect(details.open).toBe(true);
  });

  it("masks and preserves a sensitive value in a non-collapsible form", () => {
    const { container } = render(
      <PrivacyModeProvider initialEnabled>
        <PrivateNumberInput name="ratio" defaultValue={60} />
      </PrivacyModeProvider>,
    );

    expect(screen.getByLabelText("Valore nascosto")).toBeDisabled();
    expect(container.querySelector('input[type="hidden"][name="ratio"]')).toHaveValue("60");
  });
});
