import React from "react";
import Github from "./Github";
import Globe from "./Globe";

const Buttons = ({
  classname,
  color,
  github,
  live,
}: {
  classname: string;
  color: string;
  github: string;
  live: string;
}) => {
  return (
    <>
      <a
        href={github}
        target="_blank"
        className={`${classname} px-6 py-1.5 rounded-md flex items-center gap-2 font-medium`}>
        <Github colors={`${color}`} />
        Github
      </a>
      <a
        href={live}
        target="_blank"
        className={`${classname} px-6 py-1.5 rounded-md flex items-center gap-2 font-medium`}>
        <Globe colors={`${color}`} />
        Live Link
      </a>
    </>
  );
};

export default Buttons;
