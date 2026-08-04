import type { Metadata } from "next";
import Link from "next/link";
import { getCityIndex } from "@/lib/cities";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trivia Nights by City",
  description:
    "Browse trivia night fundraisers and pub quizzes by city across Illinois — Chicago, Springfield, Peoria, Rockford and more.",
  alternates: { canonical: "/trivia" },
};

export default function CitiesPage() {
  const cities = getCityIndex();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#0B1C3A] mb-2">Trivia Nights by City</h1>
        <p className="text-gray-600">
          Every Illinois city with a trivia night fundraiser or pub quiz listed on the site.
        </p>
      </header>

      {cities.length === 0 ? (
        <div className="bg-white rounded-lg border shadow-sm p-8 text-center text-gray-500">
          No cities listed yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map(city => (
            <Link
              key={city.slug}
              href={`/trivia/${city.slug}`}
              className="bg-white rounded-lg border shadow-sm p-4 hover:border-[#C83803] transition-colors"
            >
              <h2 className="font-semibold text-[#0B1C3A]">{city.city}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {[
                  city.upcoming > 0 && `${city.upcoming} upcoming`,
                  city.quizzes > 0 && `${city.quizzes} pub quiz${city.quizzes === 1 ? "" : "zes"}`,
                  city.upcoming === 0 && city.quizzes === 0 && city.past > 0 && `${city.past} past`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
