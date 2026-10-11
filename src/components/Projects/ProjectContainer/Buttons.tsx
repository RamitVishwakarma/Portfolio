import React from "react";
import Link from "next/link";
import Github from "./Github";
import Globe from "./Globe";

const Buttons = ({
  classname,
  color,
  github,
  live,
  story,
}: {
  classname: string;
  color: string;
  github?: string;
  live?: string;
  story?: string;
}) => {
  return (
    <>
      {github && (
        <a
          href={github}
          target="_blank"
          className={`${classname} px-6 py-1.5 rounded-md flex items-center gap-2 font-medium max-sm:px-2`}>
          <Github colors={`${color}`} />
          Github
        </a>
      )}
      {live && (
        <a
          href={live}
          target="_blank"
          className={`${classname} px-6 py-1.5 rounded-md flex items-center gap-2 font-medium text-nowrap max-sm:px-2`}>
          <Globe colors={`${color}`} />
          Live Link
        </a>
      )}
      {story && (
        <Link
          href={story}
          className={`${classname} px-6 py-1.5 rounded-md flex items-center gap-2 font-medium text-nowrap max-sm:px-2`}>
          Read the story
        </Link>
      )}
    </>
  );
};

export default Buttons;
