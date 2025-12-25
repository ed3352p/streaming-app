import { useState } from 'react';
import api from '../../services/api';

export default function BulkScraper() {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [extractedMovies, setExtractedMovies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scrapeMode, setScrapeMode] = useState('single'); // 'single', 'full', or 'categories'
  const [stopScraping, setStopScraping] = useState(false);

  const extractMoviesFromPage = async () => {
    if (!scrapeUrl.trim()) {
      setError('Veuillez entrer une URL');
      return;
    }

    setScraping(true);
    setError('');
    setExtractedMovies([]);
    setStopScraping(false);
    setSelectedMovies(new Set());

    try {
      let allMovies = [];
      
      if (scrapeMode === 'single') {
        // Mode page unique
        const response = await api.scrapeUrl(scrapeUrl);
        const html = response.html;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extraire tous les films de la liste
        const movieLinks = doc.querySelectorAll('#hann a[href*="/b/miwav/"]');

        for (const link of movieLinks) {
          const fullText = link.textContent.trim();
          const href = link.getAttribute('href');
          
          // Extraire le titre et l'année
          let title = fullText.replace(/HD|VOSTFR|\[|\]/gi, '').trim();
          const yearMatch = title.match(/\((\d{4})\)/);
          const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
          title = title.replace(/\(\d{4}\)/, '').trim();

          // Construire l'URL complète du film
          const fullUrl = href.startsWith('http') ? href : `${new URL(scrapeUrl).origin}${href}`;

          allMovies.push({
            id: href.split('/').pop(),
            title,
            year,
            url: fullUrl,
            originalText: fullText
          });
        }
      } else {
        // Mode site complet - extraire toutes les catégories et scraper chacune
        console.log(`🌐 MODE SITE COMPLET activé - Extraction des catégories...`);
        setSuccess(`🔄 Extraction des catégories du site...`);

        try {
          // Scraper la page d'accueil pour extraire les catégories
          const response = await api.scrapeUrl(scrapeUrl);
          const html = response.html;
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Extraire tous les liens de catégories du menu de navigation
          const categoryLinks = [];
          const seenUrls = new Set();
          const navLinks = doc.querySelectorAll('nav a[href*="/c/miwav/"], .drop-down__item[onclick*="/c/miwav/"]');
          
          for (const link of navLinks) {
            let href = link.getAttribute('href');
            
            // Si c'est un onclick, extraire l'URL
            if (!href && link.hasAttribute('onclick')) {
              const onclick = link.getAttribute('onclick');
              const match = onclick.match(/window\.location\.href='([^']+)'/);
              if (match) {
                href = match[1];
              }
            }
            
            if (href) {
              const fullUrl = href.startsWith('http') ? href : `${new URL(scrapeUrl).origin}${href}`;
              
              // Éviter les doublons en utilisant l'URL comme clé unique
              if (!seenUrls.has(fullUrl)) {
                seenUrls.add(fullUrl);
                const categoryName = link.textContent.trim();
                categoryLinks.push({
                  name: categoryName,
                  url: fullUrl
                });
              }
            }
          }

          console.log(`📁 ${categoryLinks.length} catégories trouvées:`, categoryLinks.map(c => c.name));
          setSuccess(`📁 ${categoryLinks.length} catégories trouvées ! Scraping en cours...`);

          // Scraper chaque catégorie
          for (let catIndex = 0; catIndex < categoryLinks.length && !stopScraping; catIndex++) {
            const category = categoryLinks[catIndex];
            console.log(`\n📂 Catégorie ${catIndex + 1}/${categoryLinks.length}: ${category.name}`);
            setSuccess(`� Scraping catégorie ${catIndex + 1}/${categoryLinks.length}: ${category.name} (${allMovies.length} films)`);

            // Scraper cette catégorie avec pagination
            let currentPageUrl = category.url;
            let pageNumber = 1;
            let hasMorePages = true;
            const maxPages = 50;
            let consecutiveEmptyPages = 0;
            const visitedUrls = new Set();

        while (hasMorePages && pageNumber <= maxPages && currentPageUrl && !stopScraping) {
          try {
            // Éviter de visiter la même URL deux fois
            if (visitedUrls.has(currentPageUrl)) {
              console.log(`⚠️ URL déjà visitée, arrêt`);
              break;
            }
            visitedUrls.add(currentPageUrl);

            console.log(`📄 Scraping page ${pageNumber}: ${currentPageUrl}`);
            setSuccess(`🔄 Scraping page ${pageNumber}/${maxPages}... (${allMovies.length} films trouvés)`);

            const response = await api.scrapeUrl(currentPageUrl);
            const html = response.html;
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extraire les films de cette page
            const movieLinks = doc.querySelectorAll('#hann a[href*="/b/miwav/"]');
            console.log(`✅ Page ${pageNumber}: ${movieLinks.length} films trouvés`);

            const beforeCount = allMovies.length;

            for (const link of movieLinks) {
              const fullText = link.textContent.trim();
              const href = link.getAttribute('href');
              
              let title = fullText.replace(/HD|VOSTFR|\[|\]/gi, '').trim();
              const yearMatch = title.match(/\((\d{4})\)/);
              const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
              title = title.replace(/\(\d{4}\)/, '').trim();

              const fullUrl = href.startsWith('http') ? href : `${new URL(scrapeUrl).origin}${href}`;

              if (!allMovies.find(m => m.id === href.split('/').pop())) {
                allMovies.push({
                  id: href.split('/').pop(),
                  title,
                  year,
                  url: fullUrl,
                  originalText: fullText
                });
              }
            }

            const newMoviesCount = allMovies.length - beforeCount;
            console.log(`➕ ${newMoviesCount} nouveaux films ajoutés (total: ${allMovies.length})`);

            // Chercher le lien "page suivante" dans le HTML
            let nextPageUrl = null;
            
            // Chercher les liens de pagination (plusieurs patterns possibles)
            const paginationLinks = doc.querySelectorAll('a[href*="/ml39aa757ynng/"]');
            
            for (const link of paginationLinks) {
              const href = link.getAttribute('href');
              const text = link.textContent.trim().toLowerCase();
              
              // Chercher "suivant", "next", "›", "»", ou un numéro de page supérieur
              if (text.includes('suivant') || text.includes('next') || text === '›' || text === '»' || 
                  (parseInt(text) === pageNumber + 1)) {
                nextPageUrl = href.startsWith('http') ? href : `${new URL(scrapeUrl).origin}${href}`;
                console.log(`🔗 Page suivante trouvée: ${nextPageUrl}`);
                break;
              }
            }

            if (newMoviesCount === 0) {
              consecutiveEmptyPages++;
              console.log(`⚠️ Page ${pageNumber}: 0 nouveaux films (${consecutiveEmptyPages} pages sans nouveaux films)`);
              
              if (consecutiveEmptyPages >= 3) {
                console.log(`🛑 Arrêt: ${consecutiveEmptyPages} pages consécutives sans nouveaux films`);
                hasMorePages = false;
                break;
              }
            } else {
              consecutiveEmptyPages = 0;
            }

            // Passer à la page suivante
            if (!nextPageUrl) {
              console.log(`🛑 Aucune page suivante trouvée, arrêt`);
              hasMorePages = false;
              break;
            }

            currentPageUrl = nextPageUrl;
            pageNumber++;
            
            // Pause entre les pages
            await new Promise(resolve => setTimeout(resolve, 5000));
            
          } catch (pageError) {
            console.error(`❌ Erreur page ${pageNumber}:`, pageError);
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= 2) {
              hasMorePages = false;
            }
            break;
          }
        }

            console.log(`✅ Catégorie "${category.name}" terminée: ${pageNumber} pages scrapées`);
            
            // Pause entre les catégories
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

          if (stopScraping) {
            console.log(`⏸️ Scraping arrêté par l'utilisateur: ${allMovies.length} films extraits`);
            setSuccess(`⏸️ Scraping arrêté: ${allMovies.length} films extraits et sauvegardés`);
          } else {
            console.log(`\n🎉 Scraping de toutes les catégories terminé: ${allMovies.length} films au total`);
            setSuccess(`✅ ${allMovies.length} films trouvés dans ${categoryLinks.length} catégories !`);
          }
          
        } catch (categoryError) {
          console.error('❌ Erreur lors du scraping des catégories:', categoryError);
          setError('Erreur: ' + categoryError.message);
        }
      }

      setExtractedMovies(allMovies);
      setScraping(false);
      
      if (allMovies.length === 0) {
        setError('Aucun film trouvé');
      } else {
        if (stopScraping) {
          setSuccess(`⏸️ ${allMovies.length} films extraits avant l'arrêt - prêts à importer !`);
        } else {
          setSuccess(`✅ ${allMovies.length} films trouvés${scrapeMode === 'full' ? ' sur toutes les pages' : ''} !`);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du scraping:', error);
      setError('Erreur: ' + error.message);
      setScraping(false);
    }
  };

  const toggleMovieSelection = (movieId) => {
    const newSelection = new Set(selectedMovies);
    if (newSelection.has(movieId)) {
      newSelection.delete(movieId);
    } else {
      newSelection.add(movieId);
    }
    setSelectedMovies(newSelection);
  };

  const selectAll = () => {
    setSelectedMovies(new Set(extractedMovies.map(m => m.id)));
  };

  const deselectAll = () => {
    setSelectedMovies(new Set());
  };

  const importSelectedMovies = async () => {
    if (selectedMovies.size === 0) {
      setError('Veuillez sélectionner au moins un film');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');
    
    const moviesToImport = extractedMovies.filter(m => selectedMovies.has(m.id));
    setImportProgress({ current: 0, total: moviesToImport.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < moviesToImport.length; i++) {
      const movie = moviesToImport[i];
      setImportProgress({ current: i + 1, total: moviesToImport.length });

      try {
        // Scraper la page individuelle du film
        const response = await api.scrapeUrl(movie.url);
        const html = response.html;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extraction des données
        let description = '';
        const paragraphs = doc.querySelectorAll('p[style*="text-align: left"]');
        for (const p of paragraphs) {
          const text = p.textContent.trim();
          if (text && text.length > 50 && !text.includes('CANEVAS') && !text.includes('LECTEUR')) {
            description = text;
            break;
          }
        }

        let imageUrl = '';
        const images = doc.querySelectorAll('img[src*="themoviedb.org"]');
        if (images.length > 0) {
          imageUrl = images[0].src;
        }

        let videoUrl = '';
        const iframe = doc.querySelector('iframe[src]');
        if (iframe) {
          videoUrl = iframe.src;
        }

        let genre = '';
        const categoryLink = doc.querySelector('.categoryt a');
        if (categoryLink) {
          const categoryText = categoryLink.textContent.trim();
          const genreMap = {
            "A L'AFFICHE": "Action",
            "ANIMATION": "Animation",
            "ACTION": "Action",
            "AVENTURE": "Aventure",
            "COMEDIE": "Comédie",
            "DRAME": "Drame",
            "FANTASTIQUE": "Fantastique",
            "HORREUR": "Horreur",
            "POLICIER": "Thriller",
            "SCIENCE-FICTION": "Sci-Fi",
            "THRILLER": "Thriller",
            "DOCUMENTAIRE": "Documentaire",
            "SPECTACLE": "Comédie"
          };
          genre = genreMap[categoryText] || 'Action';
        }

        // Créer le film
        await api.createMovie({
          title: movie.title,
          description: description || `Film ${movie.title}`,
          videoUrl: videoUrl || '',
          imageUrl: imageUrl || '',
          heroImageUrl: '',
          genre: genre || 'Action',
          year: movie.year,
          duration: '',
          rating: 0
        });

        successCount++;
        
        // Petite pause pour ne pas surcharger le serveur
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Erreur pour ${movie.title}:`, error);
        failCount++;
      }
    }

    setImporting(false);
    setSuccess(`✅ Import terminé ! ${successCount} films ajoutés, ${failCount} échecs`);
    
    // Réinitialiser après import
    setTimeout(() => {
      setExtractedMovies([]);
      setSelectedMovies(new Set());
      setScrapeUrl('');
    }, 3000);
  };

  return (
    <div className="container">
      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        <h2>🎬 Scraper en masse</h2>
        <p style={{color: '#94a3b8', marginBottom: '30px'}}>
          Extrayez et importez automatiquement plusieurs films depuis une page web
        </p>

        {/* Section de scraping */}
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '30px'}}>
          <h3 style={{color: '#a78bfa', marginBottom: '15px', fontSize: '18px'}}>
            🔍 Étape 1 : Choisir le mode et extraire
          </h3>
          
          {/* Mode selector */}
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
            <button
              onClick={() => setScrapeMode('single')}
              disabled={scraping || importing}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: scrapeMode === 'single' ? '2px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.3)',
                background: scrapeMode === 'single' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.05)',
                color: scrapeMode === 'single' ? '#a78bfa' : '#94a3b8',
                fontWeight: scrapeMode === 'single' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📄 Page unique
              <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.8}}>
                Scraper une seule page
              </div>
            </button>
            <button
              onClick={() => setScrapeMode('full')}
              disabled={scraping || importing}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: scrapeMode === 'full' ? '2px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.3)',
                background: scrapeMode === 'full' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.05)',
                color: scrapeMode === 'full' ? '#a78bfa' : '#94a3b8',
                fontWeight: scrapeMode === 'full' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🌐 Site complet
              <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.8}}>
                Scraper tout le site
              </div>
            </button>
          </div>
          
          {error && (
            <div style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', color: '#ef4444', marginBottom: '15px', fontSize: '14px'}}>
              ⚠️ {error}
            </div>
          )}

          {success && !importing && (
            <div style={{background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '12px', borderRadius: '8px', color: '#22c55e', marginBottom: '15px', fontSize: '14px'}}>
              ✅ {success}
            </div>
          )}

          <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
            <input 
              type="url"
              placeholder="https://example.com/page-avec-liste-films.html"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              disabled={scraping || importing}
              style={{flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)', color: 'white'}}
            />
            {scraping ? (
              <button 
                onClick={() => setStopScraping(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ⏹️ Arrêter
              </button>
            ) : (
              <button 
                onClick={extractMoviesFromPage}
                disabled={importing}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: importing ? '#64748b' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🚀 Extraire
              </button>
            )}
          </div>
        </div>

        {/* Liste des films extraits */}
        {extractedMovies.length > 0 && (
          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: '30px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px'}}>
              <div>
                <h3 style={{color: '#22c55e', fontSize: '20px', marginBottom: '8px'}}>
                  ✅ Étape 2 : Sélectionner les films
                </h3>
                <div style={{display: 'flex', gap: '20px', fontSize: '14px'}}>
                  <span style={{color: '#94a3b8'}}>
                    <strong style={{color: '#22c55e'}}>{extractedMovies.length}</strong> films extraits
                  </span>
                  <span style={{color: '#94a3b8'}}>
                    <strong style={{color: '#8b5cf6'}}>{selectedMovies.size}</strong> sélectionnés
                  </span>
                </div>
              </div>
              <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                <button 
                  onClick={selectAll}
                  disabled={importing}
                  style={{padding: '8px 16px', borderRadius: '6px', border: '1px solid #22c55e', background: 'transparent', color: '#22c55e', cursor: 'pointer', fontSize: '14px'}}
                >
                  Tout sélectionner
                </button>
                <button 
                  onClick={deselectAll}
                  disabled={importing}
                  style={{padding: '8px 16px', borderRadius: '6px', border: '1px solid #64748b', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '14px'}}
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px',
              maxHeight: '600px',
              overflowY: 'auto',
              marginBottom: '20px',
              padding: '5px'
            }}>
              {extractedMovies.map((movie) => (
                <div 
                  key={movie.id}
                  onClick={() => !importing && toggleMovieSelection(movie.id)}
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    border: selectedMovies.has(movie.id) ? '3px solid #22c55e' : '2px solid rgba(255,255,255,0.1)',
                    background: selectedMovies.has(movie.id) ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)',
                    cursor: importing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    aspectRatio: '2/3',
                    transform: selectedMovies.has(movie.id) ? 'scale(0.98)' : 'scale(1)',
                    boxShadow: selectedMovies.has(movie.id) ? '0 0 20px rgba(34, 197, 94, 0.4)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!importing) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!importing) {
                      e.currentTarget.style.transform = selectedMovies.has(movie.id) ? 'scale(0.98)' : 'scale(1)';
                      e.currentTarget.style.boxShadow = selectedMovies.has(movie.id) ? '0 0 20px rgba(34, 197, 94, 0.4)' : 'none';
                    }
                  }}
                >
                  {/* Image placeholder */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    color: 'rgba(139, 92, 246, 0.3)'
                  }}>
                    🎬
                  </div>
                  
                  {/* Overlay avec infos */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
                    padding: '40px 12px 12px',
                    color: 'white'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {movie.title}
                    </div>
                    <div style={{
                      color: '#94a3b8',
                      fontSize: '12px'
                    }}>
                      {movie.year}
                    </div>
                  </div>
                  
                  {/* Checkbox en haut à droite */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: selectedMovies.has(movie.id) ? '#22c55e' : 'rgba(0,0,0,0.6)',
                    border: selectedMovies.has(movie.id) ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s'
                  }}>
                    {selectedMovies.has(movie.id) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>

            {importing && (
              <div style={{marginBottom: '20px'}}>
                <div style={{color: '#a78bfa', marginBottom: '8px', fontSize: '14px'}}>
                  Import en cours... {importProgress.current}/{importProgress.total}
                </div>
                <div style={{width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden'}}>
                  <div style={{
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #8b5cf6, #22c55e)',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
              </div>
            )}

            <button 
              onClick={importSelectedMovies}
              disabled={importing || selectedMovies.size === 0}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                background: importing || selectedMovies.size === 0 ? '#64748b' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                fontWeight: '600',
                fontSize: '16px',
                cursor: importing || selectedMovies.size === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {importing ? `⏳ Import en cours... (${importProgress.current}/${importProgress.total})` : `📥 Importer ${selectedMovies.size} film(s)`}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '20px', borderRadius: '12px'}}>
          <h4 style={{color: '#60a5fa', marginBottom: '12px', fontSize: '16px'}}>ℹ️ Instructions</h4>
          
          <div style={{marginBottom: '15px'}}>
            <strong style={{color: '#60a5fa', fontSize: '14px'}}>📄 Mode Page unique :</strong>
            <ol style={{color: '#94a3b8', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', marginTop: '8px'}}>
              <li>Collez l'URL d'une page contenant une liste de films</li>
              <li>Scrape uniquement cette page</li>
            </ol>
          </div>

          <div style={{marginBottom: '15px'}}>
            <strong style={{color: '#60a5fa', fontSize: '14px'}}>🌐 Mode Site complet :</strong>
            <ol style={{color: '#94a3b8', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', marginTop: '8px'}}>
              <li>Collez l'URL de la page d'accueil (ex: https://site.com/home)</li>
              <li>Extrait automatiquement toutes les catégories du menu de navigation</li>
              <li>Scrape chaque catégorie avec pagination automatique</li>
              <li>Suit les vrais liens de pagination du site</li>
              <li>Pause de 5s entre pages, 3s entre catégories</li>
            </ol>
          </div>

          <p style={{color: '#64748b', fontSize: '13px', fontStyle: 'italic'}}>
            💡 Le scraper récupère automatiquement : description, image, vidéo, genre de chaque film
          </p>
        </div>
      </div>
    </div>
  );
}
