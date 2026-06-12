import React from 'react';

const FormLabel = ({ children, required = false, htmlFor }) => {
  return (
    <label className="mc-form-label" htmlFor={htmlFor}>
      {children}
      {required && <span className="text-danger ms-1">*</span>}
    </label>
  );
};

export default FormLabel;
