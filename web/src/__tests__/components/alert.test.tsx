import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Alert } from "@/components/ui/alert";

describe("Alert", () => {
  it("renders with children", () => {
    const { container } = render(<Alert>Test message</Alert>);
    expect(container.textContent).toContain("Test message");
  });

  it("renders info variant by default", () => {
    const { container } = render(<Alert>Info</Alert>);
    expect(container.firstChild).toHaveClass("bg-[var(--accent-light)]");
  });

  it("renders success variant", () => {
    const { container } = render(<Alert variant="success">Success</Alert>);
    expect(container.firstChild).toHaveClass("bg-[var(--success-light)]");
  });

  it("renders error variant", () => {
    const { container } = render(<Alert variant="error">Error</Alert>);
    expect(container.firstChild).toHaveClass("bg-[var(--danger-light)]");
  });

  it("renders warning variant", () => {
    const { container } = render(<Alert variant="warning">Warning</Alert>);
    expect(container.firstChild).toHaveClass("bg-[var(--warning-light)]");
  });
});
