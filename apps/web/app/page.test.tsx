import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Page from "./page";

it("トップページが見出しを描画する", () => {
  render(<Page />);

  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});
