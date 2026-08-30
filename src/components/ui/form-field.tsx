import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";

const CONTROL_TAGS = new Set(["input", "select", "textarea"]);

function mergeDescribedBy(...values: Array<string | undefined>): string | undefined {
  const ids = values.filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function enhanceControls(
  node: ReactNode,
  attrs: {
    id: string;
    describedBy?: string;
    invalid?: boolean;
    labelId: string;
    label: string;
  }
): ReactNode {
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const type = element.type;

  if (typeof type === "string" && CONTROL_TAGS.has(type)) {
    const existingDescribedBy =
      typeof element.props["aria-describedby"] === "string" ? element.props["aria-describedby"] : undefined;

    return cloneElement(element, {
      id: (element.props.id as string | undefined) ?? attrs.id,
      "aria-label": (element.props["aria-label"] as string | undefined) ?? attrs.label,
      "aria-describedby": mergeDescribedBy(attrs.describedBy, existingDescribedBy),
      "aria-invalid": attrs.invalid ? true : element.props["aria-invalid"],
    });
  }

  if (typeof type !== "string") {
    const existingDescribedBy =
      typeof element.props["aria-describedby"] === "string" ? element.props["aria-describedby"] : undefined;

    return cloneElement(element, {
      id: (element.props.id as string | undefined) ?? attrs.id,
      labelId: attrs.labelId,
      ariaLabel: (element.props.ariaLabel as string | undefined) ?? attrs.label,
      "aria-describedby": mergeDescribedBy(attrs.describedBy, existingDescribedBy),
      "aria-invalid": attrs.invalid ? true : element.props["aria-invalid"],
    });
  }

  const childProps = element.props as { children?: ReactNode };
  if (childProps.children) {
    return cloneElement(
      element,
      {},
      Children.map(childProps.children, (child) => enhanceControls(child, attrs))
    );
  }

  return node;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const labelId = `${fieldId}-label`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = mergeDescribedBy(hintId, errorId);

  const enhancedChildren = enhanceControls(children, {
    id: fieldId,
    describedBy,
    invalid: Boolean(error),
    labelId,
    label,
  });

  return (
    <div className="block space-y-1.5">
      <label
        id={labelId}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--foreground)]"
        htmlFor={fieldId}
      >
        {label}
        {required ? <span className="text-[var(--danger)]">*</span> : null}
      </label>
      <div>{enhancedChildren}</div>
      {error ? (
        <p id={errorId} className="ui-inline-error" role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id={hintId} className="text-xs leading-4 text-[var(--ink-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
