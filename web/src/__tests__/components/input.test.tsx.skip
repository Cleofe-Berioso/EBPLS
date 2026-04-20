import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  it("shows hint text", () => {
    render(<Input label="Phone" hint="Philippine mobile number" />);
    expect(screen.getByText("Philippine mobile number")).toBeInTheDocument();
  });

  it("shows required indicator", () => {
    render(<Input label="Name" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("handles value changes", () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value: "test" } });
    expect(input.value).toBe("test");
  });
});
