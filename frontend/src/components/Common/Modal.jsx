import React, { useEffect } from 'react';

const SIZE_MAP = {
  sm: 'mc-modal-sm',
  md: 'mc-modal-md',
  lg: 'mc-modal-lg',
  xl: 'mc-modal-xl',
};

const Modal = ({
  show,
  onClose,
  title,
  icon: Icon,
  size = 'lg',
  children,
  footer,
  scrollable = false,
}) => {
  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.lg;

  return (
    <div className="modal-backdrop-blur d-flex align-items-center justify-content-center p-3">
      <div className={`mc-modal w-100 ${sizeClass}`} role="dialog">
        <div className="modal-dialog modal-dialog-centered mx-auto my-0">
        <div className="modal-content">
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title page-header-title d-flex align-items-center gap-2 mb-0 fs-5">
              {Icon && <Icon size={20} className="text-primary" />}
              <span>{title}</span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          <div className={`modal-body px-4 py-4 ${scrollable ? 'modal-body--scroll' : ''}`}>
            {children}
          </div>
          {footer && (
            <div className="modal-footer border-top px-4 py-3 bg-light d-flex gap-2 justify-content-end">
              {footer}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
