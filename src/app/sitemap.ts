import { MetadataRoute } from "next";
import { getApprovedEvents } from "@/lib/db";
import { getCityIndex } from "@/lib/cities";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://illinoistrivia.com";
  const events = getApprovedEvents();
  const cities = getCityIndex();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/map`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/trivia`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/pub-quiz`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/pub-quiz/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/past-events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  const cityPages: MetadataRoute.Sitemap = cities.map(city => ({
    url: `${base}/trivia/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const eventPages: MetadataRoute.Sitemap = events.map(event => ({
    url: `${base}/events/${event.id}`,
    lastModified: new Date(event.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...cityPages, ...eventPages];
}
