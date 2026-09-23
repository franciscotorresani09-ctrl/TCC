export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <article className="container-page max-w-3xl py-10 sm:py-16 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted">
      {children}
    </article>
  );
}
