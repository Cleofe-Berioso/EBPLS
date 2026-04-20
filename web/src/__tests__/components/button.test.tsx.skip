import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-blue-600");
  });

  it("renders destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-red-600");
  });

  it("renders outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("border");
  });

  it("renders small size", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("h-8");
  });

  it("renders large size", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("h-12");
  });

  it("shows loading state", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("disables button when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button").className).toContain("custom-class");
  });
});
