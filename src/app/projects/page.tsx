import type { Metadata } from "next";
import Link from "next/link";
import Wrapper from "@/components/Wrapper";
import ProjectGrid from "@/components/Projects/ProjectGrid";
import { projects } from "@/components/Projects/data";

export const metadata: Metadata = {
  title: "Projects | Ramit Vishwakarma",
  description:
    "Every project worth showing, from recruitment platforms used by hundreds of students to client sites, open-source tools and research.",
};

const page = () => {
  return (
    <Wrapper>
      <main className="py-20">
        <Link href="/" className="text-grey-300 hover:text-green">
          ← Home
        </Link>
        <h1 className="text-white text-6xl text-center pt-6 pb-4 font-Anton">
          All Projects
        </h1>
        <p className="text-grey-300 text-center pb-10 max-w-2xl mx-auto">
          {projects.length} projects, from platforms that real students and
          clients used to open-source tools and research. Hover a card to watch
          it run.
        </p>
        <ProjectGrid />
      </main>
    </Wrapper>
  );
};

export default page;
