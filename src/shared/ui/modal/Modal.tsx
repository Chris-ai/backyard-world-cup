import type { ReactNode } from "react";
import "./Modal.css";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  titleId: string;
  descriptionId?: string;
  className?: string;
};

export function Modal({
  children,
  isOpen,
  titleId,
  descriptionId,
  className = "",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <section
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="modal-stripes" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
        {children}
      </section>
    </div>
  );
}
