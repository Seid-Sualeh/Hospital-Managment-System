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
            <div className="modal-header px-4 py-3">
              <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
                {Icon && (
                  <span
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: 'rgba(37,99,235,0.09)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {title}
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
                style={{ opacity: 0.5 }}
              />
            </div>

            <div className={`modal-body px-4 py-4 ${scrollable ? 'modal-body--scroll' : ''}`}>
              {children}
            </div>

            {footer && (
              <div
                className="modal-footer px-4 py-3 d-flex gap-2 justify-content-end"
                style={{ borderTop: '1px solid #f1f5f9', background: '#fafbff' }}
              >
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
