# ViviGioia

Sito turistico-culturale del Comune di **Gioia dei Marsi** (AQ), nel cuore della Marsica e alle porte del Parco Nazionale d'Abruzzo, Lazio e Molise.

> *La terra che ricorda, la terra che vive.*

Sito statico **mobile-first** ad alto impatto visivo: HTML + CSS + JavaScript (GSAP, ScrollTrigger, Lenis, Swiper, tutti self-hosted). Nessun build step necessario per il deploy: i file in questo repository **sono** il sito, pronti per essere serviti.

## Struttura

```
index.html              Homepage
storia.html             La storia di Gioia
terremoto-1915.html     Il terremoto del 1915 (memoria)
gioia-vecchio.html      Gioia Vecchio e la Torre di Sperone
patrimonio.html         Chiese e patrimonio
tradizioni.html         Tradizioni e ricamo
gastronomia.html        Gastronomia del Fucino
natura.html             Natura, Parco e l'orso marsicano
sentieri.html           Sentieri ed escursioni
radici.html             Le tue radici (turismo delle radici)
eventi.html             Eventi e appuntamenti
ricettivita.html        Dove dormire e mangiare
contatti.html           Contatti e come arrivare
assets/
  css/    main.css + swiper
  js/     app.js + vendor (gsap, scrolltrigger, lenis, swiper)
  font/   Fraunces + Manrope (woff2, self-hosted)
  img/    foto responsive WebP/JPG + favicon
  video/  hero (mp4) + poster
robots.txt · sitemap.xml · site.webmanifest · .htaccess
```

## Deploy su Cloudways (via Git)

1. Su Cloudways: **Application → Deployment via Git**.
2. Collega questo repository (`github.com/assistenza-digital-world/vivi-gioia`), branch `main`.
3. Lascia la **deployment path** vuota: la radice del repository è già la radice del sito (`index.html`).
4. **Deploy Now**. Ad ogni `git push` successivo basta ripetere il pull/deploy.
5. Attiva il certificato **HTTPS** (Let's Encrypt) e, se vuoi, scommenta la regola "Forza HTTPS" in `.htaccess`.

## Da verificare con il Comune prima della pubblicazione definitiva

Alcuni contenuti usano dati di ricerca prudenti e vanno confermati:

- **Recapiti istituzionali** (telefono, email, PEC, indirizzo esatto del municipio).
- **Calendario eventi** con date precise di ogni edizione (le date attuali sono indicative).
- **Strutture ricettive e ristoranti** reali, con contatti, da inserire in `ricettivita.html`.
- **Tracce GPX e mappe** dei sentieri (al momento segnaposto in `sentieri.html`).
- Cifre storiche delicate (es. vittime del terremoto del 1915): presentate come stime, da validare.
- Moduli (contatti, radici, newsletter): **dimostrativi**, da collegare a un servizio reale.

## Crediti

Foto e video del territorio di Gioia dei Marsi. Caratteri: Fraunces e Manrope (SIL Open Font License).
