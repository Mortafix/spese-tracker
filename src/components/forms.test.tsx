/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ActiveField, Field, MoneyInput } from "@/components/forms";
import { Input } from "@/components/ui/input";

afterEach(cleanup);

describe("Field", () => {
  it("associates its visible label with a native control", () => {
    render(
      <Field label="Nome">
        <Input name="name" />
      </Field>,
    );

    const input = screen.getByLabelText("Nome");
    const label = screen.getByText("Nome");

    expect(input).toHaveAttribute("id");
    expect(label).toHaveAttribute("for", input.id);
  });

  it("generates unique ids for repeated form controls", () => {
    render(
      <>
        <Field label="Importo">
          <MoneyInput name="amount" />
        </Field>
        <Field label="Importo">
          <MoneyInput name="amount" />
        </Field>
      </>,
    );

    const inputs = screen.getAllByLabelText("Importo");

    expect(inputs[0].id).not.toBe("");
    expect(inputs[1].id).not.toBe("");
    expect(inputs[0].id).not.toBe(inputs[1].id);
  });

  it("forwards the generated id to composite checkbox controls", () => {
    render(
      <Field label="Stato">
        <ActiveField />
      </Field>,
    );

    expect(screen.getByLabelText("Stato")).toHaveAttribute("type", "checkbox");
  });
});
