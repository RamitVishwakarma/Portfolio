import React from "react";
import Github from "./Github";
import Globe from "./Globe";

const Buttons = ({
  classname,
  color,
}: {
  classname: string;
  color: string;
}) => {
  return (
    <>
      <button
        className={`${classname} px-6 py-1.5 rounded-md flex items-center gap-2 font-medium`}>
        <Github colors={`${color}`} />
        Github
      </button>
      <button
        className={`${classname} px-6 py-1.5 rounded-md flex items-center gap-2 font-medium`}>
        <Globe colors={`${color}`} />
        Live Link
      </button>
    </>
  );
};

export default Buttons;
