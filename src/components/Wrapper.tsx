import React, { ReactNode } from "react";

const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="max-w-[90rem] lg:px-[7.5rem] md:px-20 px-10 mx-auto">
      {children}
    </div>
  );
};

export default Wrapper;
