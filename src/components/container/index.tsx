import React from 'react';

interface IProps {
  className?: string;
  children: React.ReactNode;
  notPadding?: boolean;
}

const Container: React.FC<IProps> = ({ children, className, notPadding }) => (
  <div
    className={`container lg:max-w-[1180px] md:max-w-[960px] sm:max-w-[720px] w-full mx-auto ${className} ${
      !notPadding && 'py-10'
    }`}
  >
    {children}
  </div>
);

export default React.memo(Container);
