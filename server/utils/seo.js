import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const MOVIES_FILE = join(DATA_DIR, 'movies.json');
const SERIES_FILE = join(DATA_DIR, 'series.json');

function readData(file) {
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

// Generate sitemap.xml
export function generateSitemap(baseUrl = 'https://lumixar.online') {
  const movies = readData(MOVIES_FILE);
  const series = readData(SERIES_FILE);
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Homepage
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${baseUrl}/</loc>\n`;
  sitemap += `    <changefreq>daily</changefreq>\n`;
  sitemap += `    <priority>1.0</priority>\n`;
  sitemap += `  </url>\n`;
  
  // Films page
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${baseUrl}/films</loc>\n`;
  sitemap += `    <changefreq>daily</changefreq>\n`;
  sitemap += `    <priority>0.9</priority>\n`;
  sitemap += `  </url>\n`;
  
  // Series page
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${baseUrl}/series</loc>\n`;
  sitemap += `    <changefreq>daily</changefreq>\n`;
  sitemap += `    <priority>0.9</priority>\n`;
  sitemap += `  </url>\n`;
  
  // Individual movies
  movies.forEach(movie => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/movie/${movie.id}</loc>\n`;
    sitemap += `    <lastmod>${movie.createdAt || new Date().toISOString()}</lastmod>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `  </url>\n`;
  });
  
  // Individual series
  series.forEach(show => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/series/${show.id}</loc>\n`;
    sitemap += `    <lastmod>${show.createdAt || new Date().toISOString()}</lastmod>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `  </url>\n`;
  });
  
  sitemap += '</urlset>';
  
  return sitemap;
}

// Generate schema.org structured data for a movie
export function generateMovieSchema(movie, baseUrl = 'https://lumixar.online') {
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "description": movie.description,
    "image": movie.imageUrl,
    "datePublished": movie.year?.toString(),
    "genre": movie.genre,
    "aggregateRating": movie.rating ? {
      "@type": "AggregateRating",
      "ratingValue": movie.rating,
      "ratingCount": movie.ratingCount || 1,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "url": `${baseUrl}/movie/${movie.id}`,
    "potentialAction": {
      "@type": "WatchAction",
      "target": `${baseUrl}/player/${movie.id}`
    }
  };
}

// Generate schema.org structured data for a series
export function generateSeriesSchema(series, baseUrl = 'https://lumixar.online') {
  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": series.title,
    "description": series.description,
    "image": series.imageUrl,
    "genre": series.genre,
    "aggregateRating": series.rating ? {
      "@type": "AggregateRating",
      "ratingValue": series.rating,
      "ratingCount": series.ratingCount || 1,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "url": `${baseUrl}/series/${series.id}`
  };
}

// Generate meta tags for a movie
export function generateMovieMeta(movie) {
  return {
    title: `${movie.title} - Streaming Gratuit | Lumixar`,
    description: movie.description?.substring(0, 160) || `Regardez ${movie.title} en streaming gratuit sur Lumixar`,
    keywords: `${movie.title}, streaming, film, ${movie.genre}, ${movie.year}, gratuit`,
    ogTitle: movie.title,
    ogDescription: movie.description,
    ogImage: movie.imageUrl,
    ogType: 'video.movie',
    twitterCard: 'summary_large_image',
    twitterTitle: movie.title,
    twitterDescription: movie.description,
    twitterImage: movie.imageUrl
  };
}

// Generate robots.txt
export function generateRobotsTxt(baseUrl = 'https://lumixar.online') {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /player/

Sitemap: ${baseUrl}/sitemap.xml
`;
}

// Generate category pages for SEO
export function generateCategoryPages() {
  const movies = readData(MOVIES_FILE);
  const genres = [...new Set(movies.map(m => m.genre).filter(Boolean))];
  
  return genres.map(genre => {
    const genreMovies = movies.filter(m => m.genre === genre);
    return {
      genre,
      slug: genre.toLowerCase().replace(/\s+/g, '-'),
      count: genreMovies.length,
      meta: {
        title: `Films ${genre} en Streaming Gratuit | Lumixar`,
        description: `Découvrez notre collection de ${genreMovies.length} films ${genre} en streaming gratuit. Regardez les meilleurs films ${genre} en HD.`,
        keywords: `${genre}, films ${genre}, streaming ${genre}, ${genre} gratuit`
      }
    };
  });
}
