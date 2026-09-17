import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";

interface AuthButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
  loadingLabel?: string;
  icon?: React.ReactNode;
}

export function AuthButton({
  label,
  loadingLabel = "Please wait...",
  icon,
  isLoading,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      fullWidth
      isLoading={isLoading}
      className={className}
      {...props}
    >
      {!isLoading && icon && <span className="mr-2 shrink-0">{icon}</span>}
      <span>{isLoading ? loadingLabel : label}</span>
    </Button>
  );
}
