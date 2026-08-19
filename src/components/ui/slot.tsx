import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A minimal Slot component that merges its props onto its single child element.
 * This replaces @radix-ui/react-slot for the asChild pattern.
 */
interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement<Record<string, unknown>>(children)) {
      const childProps = children.props as Record<string, unknown>;
      return React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        {
          ...props,
          ...(childProps as object),
          ref,
          className: cn(
            props.className as string | undefined,
            childProps.className as string | undefined
          ),
        }
      );
    }

    if (React.Children.count(children) > 1) {
      React.Children.only(null);
    }

    return null;
  }
);

Slot.displayName = "Slot";

export { Slot };
