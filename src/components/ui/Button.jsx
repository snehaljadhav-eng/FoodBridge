import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  as = "button",
  ...props
}) {
  const Tag = as;
  return (
    <Tag className={`btn btn-${variant}`} {...props}>
      {children}
    </Tag>
  );
}
