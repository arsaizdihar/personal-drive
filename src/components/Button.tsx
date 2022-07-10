import classNames from "classnames";
import { ButtonHTMLAttributes } from "react";
type Variant = "primary" | "danger";

const classMap: Record<Variant, string> = {
  primary: "bg-blue-500 hover:bg-blue-400 text-white disabled:bg-blue-300",
  danger: "bg-red-500 hover:bg-red-400 text-white disabled:bg-red-300",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps & {
  variant?: Variant;
}) {
  return (
    <button
      className={classNames("px-3 py-1 rounded", classMap[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
