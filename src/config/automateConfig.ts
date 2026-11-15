export type AutomateLocale = 'nl' | 'en';

export const automateConfig = {
  brandName: 'GREYSON AUTOMATION',
  domain: 'automate.greyson.nl',
  primaryDomains: [
    'greyson.nl',
    'automation.greyson.nl',
    'automate.greyson.nl',
  ],
  siteUrl: 'https://automate.greyson.nl',
  portfolioUrl: 'https://greyson.nl',
  aboutPath: '/over-mij',
  dashboardPath: '/dashboard',
  email: 'grey.beimers@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/greyson-beimers-68749b1a1/',
  region: 'Friesland, Nederland',
  cities: [
    'Leeuwarden',
    'Sneek',
    'Heerenveen',
    'Drachten',
    'Harlingen',
    'Franeker',
    'Dokkum',
  ],
  copy: {
    nl: {
      nav: {
        brand: 'GREYSON',
        homeLabel: 'Home',
        servicesLabel: 'Aanpak',
        useCasesLabel: 'In de praktijk',
        processLabel: 'Het verhaal',
        aboutLabel: 'Over mij',
        contactLabel: 'Contact',
        dashboardLabel: 'Dashboard',
        languageLabel: 'Taal kiezen',
      },
      hero: {
        badge: 'Software, AI & Automatisering — Friesland',
        title: 'Minder handwerk op kantoor. Snellere software zonder bureauprijzen.',
        subtitle:
          'AI gaat hard vooruit, maar tussen alle grote verhalen door draait het voor een ondernemer in Friesland om één simpel ding: dat uren aan mail, offertes en losse Excel-lijsten vanzelf lopen — en dat een nieuwe website of web-app in dagen klaarstaat in plaats van maanden.',
        primaryCta: 'Plan een kennismaking',
        secondaryCta: 'Bekijk wat er kan',
      },
      heroShowcase: {
        kicker: 'Live werkstroom-voorbeeld',
        caption:
          'Klik door drie herkenbare situaties om te zien hoe techniek stil op de achtergrond meedraait.',
        inputLabel: 'Wat er binnenkomt',
        engineLabel: 'Wat er automatisch gebeurt',
        outputLabel: 'Wat jij maandagochtend ziet',
        metricLabel: 'Verschil in praktijk',
        scenarios: [
          {
            id: 'intake',
            tab: 'Offertes & Intake',
            headline: 'Van aanvraag in de mailbox naar uitgewerkt concept',
            input:
              'Een klant stuurt ’s avonds laat een mail met maten, een PDF-tekening en drie losse vragen.',
            engine:
              'De aanvraag wordt gelezen, vergeleken met jullie eigen prijsregels en direct gekoppeld aan de klantkaart.',
            output:
              'Om 08:30 uur ligt er een compleet offerteconcept en net conceptantwoord klaar voor jouw laatste akkoord.',
            metric: 'Binnen 2 minuten voorbereid i.p.v. 40 minuten typen',
          },
          {
            id: 'knowledge',
            tab: 'Interne Kennisbank',
            headline: 'Meteen het juiste antwoord uit eigen handleidingen',
            input:
              'Een monteur op locatie of nieuwe collega zoekt naar een specifieke montage-instructie of oude projectafspraak.',
            engine:
              'Jullie afgeschermde bedrijfsassistent doorzoekt alleen eigen handleidingen, voorschriften en projecthistorie.',
            output:
              'Direct het exacte antwoord inclusief bronvermelding, terwijl jullie bedrijfsdata volledig privé blijft.',
            metric: 'Geen gezoek in mappen en nul data naar publieke modellen',
          },
          {
            id: 'portal',
            tab: 'Websites & Portalen',
            headline: 'Een modern webportaal gebouwd in dagen, niet maanden',
            input:
              'Klanten moeten steeds bellen of mailen voor afspraken, statusupdates of het aanleveren van bestanden.',
            engine:
              'Dankzij AI-versnelde engineering wordt een strakke site of eigen web-app direct schoon opgebouwd en getest.',
            output:
              'Jouw eigen professionele platform live in eigen beheer, voor een fractie van traditionele bureau-offertes.',
            metric: 'Weken sneller live & volledig in eigen eigendom',
          },
        ],
      },
      services: {
        eyebrow: 'Wat wij samen neerzetten',
        title: 'Geen losse lijstjes of dikke rapporten, maar werkende techniek om je team te ontlasten.',
        intro:
          'De meeste software- en AI-bureaus verkopen uren en presentaties. Ik bouw liever direct het systeem dat bij jou op de achtergrond draait of het platform waarmee je klanten sneller bedient.',
        automationEyebrow: 'Workflow & Taakautomatisering',
        automationTitle: 'Laat repeterend administratief werk stilletjes weglopen',
        automationBody:
          'Elke werkdag zitten teams uren achter het scherm om dezelfde handelingen te herhalen: aanvragen overtypen uit de mail, facturen naast Excel leggen, of collega’s steeds opnieuw uitleggen waar een document staat. Door slimme koppelingen tussen je bestaande pakketten — van mailbox en boekhouding tot planning — pakt software dat voorbereidende werk direct op. Jij houdt zelf de regie en geeft alleen nog het laatste akkoord.',
        automationPipeline: [
          {
            stage: 'Bestaande tools',
            detail: 'Mail, PDF’s, CRM & Excel',
          },
          {
            stage: 'Slimme logica',
            detail: 'Filteren, controleren & opmaken',
          },
          {
            stage: 'Klaar voor akkoord',
            detail: 'Jij beslist met één druk op de knop',
          },
        ],
        softwareEyebrow: 'Snellere Websites & Maatwerk Web-Apps',
        softwareTitle: 'Professionele software zonder maanden wachttijd',
        softwareBody:
          'Wie vroeger een nieuwe website, aanvraagstraat of klantportaal wilde laten bouwen, kreeg offertes van duizenden euro’s en wachttijden van een half jaar. Moderne AI verandert het tempo waarmee ik als software engineer code schrijf en toets compleet. Wat goed blijft is degelijke architectuur, veiligheid en snelheid — alleen de doorlooptijd en rekening zakken drastisch omlaag.',
        softwareComparison: [
          {
            label: 'Traditioneel bureau',
            value: '3–6 maanden & zware overhead',
            tone: 'muted',
          },
          {
            label: 'Met Greyson (AI-versneld)',
            value: 'Dagen tot weken & direct contact met de bouwer',
            tone: 'accent',
          },
        ],
      },
      useCases: {
        eyebrow: 'In de praktijk bij Friese bedrijven',
        title: 'Herkenbare knelpunten waar techniek meteen rust geeft',
        intro:
          'Geen futuristische beloftes, maar alledaags werk dat we bij lokale bedrijven stap voor stap eenvoudiger maken.',
        items: [
          {
            id: 'quotes',
            tag: 'Verkoop & Binnendienst',
            situation:
              '“We krijgen elke dag tientallen aanvragen binnen via mail en WhatsApp, en ’s avonds zit iemand alsnog alles handmatig in een offerte te kloppen.”',
            title: 'Aanvragen direct vertalen naar een offerteconcept',
            narrative:
              'Zodra er een aanvraag of bouwtekening binnenkomt, leest een afgeschermde workflow alle specificaties uit en zet ze direct klaar in jullie eigen offertesjabloon. De volgende ochtend hoef je alleen nog maar na te kijken, bij te schaven en te versturen.',
          },
          {
            id: 'knowledge',
            tag: 'Vakkennis & Inwerken',
            situation:
              '“Alleen twee ervaren medewerkers weten precies hoe alles hoort, waardoor anderen steeds moeten bellen of eindeloos zoeken op de server.”',
            title: 'Een eigen, afgeschermde vraagbaak voor je hele team',
            narrative:
              'We brengen werkinstructies, oude projecten en voorschriften samen in een privé-assistent speciaal voor jouw bedrijf. Medewerkers stellen in gewoon Nederlands een vraag en krijgen direct het juiste antwoord — zonder dat jouw gegevens ooit de deur uit gaan naar publieke trainingsmodellen.',
          },
          {
            id: 'web',
            tag: 'Uitstraling & Zelfservice',
            situation:
              '“Onze website is verouderd of onduidelijk op mobiel, en klanten moeten voor simpele aanpassingen of afspraken nog steeds bellen.”',
            title: 'Een snelle site of eigen portaal waar klanten wijzer van worden',
            narrative:
              'Of het nu gaat om een heldere bedrijfswebsite die direct vertrouwen geeft of een handig klantportaal waarin afspraken en documenten samenkomen: we zetten in korte tijd iets neer dat razendsnel laadt en precies past bij hoe jouw bedrijf werkt.',
          },
          {
            id: 'sync',
            tag: 'Administratie & Planning',
            situation:
              '“Orders worden in de webshop of mailbox gezet, daarna overgetypt naar Excel, en vervolgens nog eens ingevoerd voor de facturatie.”',
            title: 'Systemen stil laten praten in plaats van overtypen',
            narrative:
              'Stille achtergrondkoppelingen zorgen ervoor dat nieuwe klanten, orders en uren automatisch doorlopen naar planning en boekhouding. Minder kans op tikfouten en uren tijdswinst per week zonder dat iedereen aan compleet nieuwe programma’s hoeft te wennen.',
          },
        ],
      },
      story: {
        eyebrow: 'Het eerlijke verhaal',
        title: 'AI verandert software snel — laten we dat nuchter in jouw voordeel gebruiken.',
        paragraphs: [
          'Ik ben Greyson Beimers, software engineer, en werk het liefst gewoon aan tafel bij ondernemers in Friesland of via een kort videomoment. Je hoort overal dat AI alles op zijn kop zet, en daar zit veel lucht bij. Wat wél klopt, is dat de techniek het bouwen van goede software en slimme koppelingen voor het eerst écht betaalbaar maakt voor het MKB.',
          'Waar grote bureaus rekening houden met vergaderlagen, accountmanagers en lange planningen, bouw ik rechtsstreeks samen met jou. Doordat ik moderne AI slim meeneem tijdens het programmeren, ontstaat ruimte om sneller te schakelen, vaker tussendoor mee te kijken en oplossingen te bouwen die zichzelf binnen korte tijd terugverdienen.',
          'Daarbij geldt altijd één vaste regel: jouw bedrijfsgegevens blijven van jou. Gevoelige klant- en offerte-informatie gaat nooit zomaar richting openbare modellen, en alles wat we bouwen — van code en domeinnaam tot koppelingen — staat netjes op jouw eigen naam.',
        ],
        processTitle: 'Hoe een samenwerking verloopt',
        steps: [
          {
            phase: 'Stap 1 — Even meekijken',
            title: 'Vrijblijvend gesprek op locatie of online',
            text: 'We nemen een half uur de tijd aan tafel in Leeuwarden, Sneek, Heerenveen, Drachten of via videobellen om te zien waar nu het meeste handwerk zit.',
          },
          {
            phase: 'Stap 2 — Eerlijk voorstel',
            title: 'Duidelijk plan en vaste prijs vooraf',
            text: 'Je hoort meteen of automatiseren of nieuwbouw zin heeft, wat het oplevert en wat het precies kost. Zonder verrassingen achteraf.',
          },
          {
            phase: 'Stap 3 — Gebouwd in eigen beheer',
            title: 'Snel opgeleverd en direct bruikbaar',
            text: 'Binnen dagen tot enkele weken draait de oplossing mee in je bedrijf, getest op veiligheid en klaar voor dagelijks gebruik door je team.',
          },
        ],
        regionLine:
          'Actief in heel Friesland (o.a. Leeuwarden, Sneek, Heerenveen, Drachten, Harlingen, Franeker en Dokkum) en daarbuiten.',
      },
      aboutTeaser: {
        eyebrow: 'Wie er achter de code zit',
        title: 'Direct schakelen met de bouwer — wel zo helder.',
        summary:
          'Geen verkoopafdeling en geen doorgeefluik: je werkt rechtstreeks samen met Greyson Beimers. Lees op de over-mij-pagina hoe mijn achtergrond als full-stack engineer en dit nieuwe tijdperk van AI-gedreven software samenkomen.',
        ctaLabel: 'Lees mijn verhaal & bekijk alle contactopties',
      },
      aboutPage: {
        badge: 'Over Greyson Beimers — Friesland & Amsterdam',
        title: 'Nuchtere techniek, snelle oplevering en direct menselijk contact.',
        subtitle:
          'Ik help bedrijven in Friesland om alledaags kantoorwerk te versimpelen met praktische AI en bouw websites en maatwerk web-apps in een fractie van de gebruikelijke tijd en kosten.',
        introTitle: 'Waarom ik dit zo direct aanpak',
        introParagraphs: [
          'De afgelopen tijd is mijn vak als software engineer fundamenteel veranderd. Tools die ik vroeger dagen moest opzetten, draaien en koppelen nu vele malen sneller omdat AI mij als ervaren programmeur ondersteunt bij het schrijven, controleren en verfijnen van code.',
          'Voor lokale bedrijven in Friesland betekent dat concreet twee kansen: bestaande knelpunten in mail, planning of Excel zijn eindelijk betaalbaar te automatiseren, en een moderne website of eigen web-app hoeft geen tienduizenden euro’s of een half jaar wachten meer te kosten.',
          'Ik kies bewust voor rechtstreekse samenwerking zonder poespas. Je praat met de persoon die het systeem ontwerpt, bouwt en beveiligt, terwijl alle code en bedrijfsdata volledig van jouw onderneming blijven.',
        ],
        principlesTitle: 'Waar je op kunt rekenen',
        principles: [
          {
            title: 'Rechtstreeks contact met de engineer',
            body: 'Geen tussenpersonen of wisselende projectmanagers. Als iets aangepast of uitgebreid moet worden, schakelen we binnen een dag direct door.',
          },
          {
            title: 'Sneller en eerlijker geprijsd door moderne AI',
            body: 'Omdat code sneller ontstaat en getest wordt, blijft het budget overzichtelijk en zie je binnen enkele dagen de eerste werkende versie.',
          },
          {
            title: 'Veilig en volledig jouw eigendom',
            body: 'Bedrijfsgevoelige stukken belanden niet in publieke trainingsdata en alle code, accounts en domeinen blijven keurig op naam van jouw bedrijf.',
          },
        ],
        profileTitle: 'Profiel in vogelvlucht',
        profileBody:
          'Full-stack software engineer gespecialiseerd in TypeScript, React, Node.js, Python, interactieve webtoepassingen en betrouwbare API- en AI-koppelingen. Actief voor MKB-bedrijven in heel Friesland (Leeuwarden, Sneek, Heerenveen, Drachten) en Amsterdam.',
        stackLine:
          'Dagelijks inzetbaar met o.a. TypeScript, React, Node.js, Python, API-koppelingen, veilige AI-workflows en Cloud-hosting.',
        locationLabel: 'Werkgebied',
        locationValue: 'Friesland & Amsterdam, Nederland',
        emailLabel: 'E-mail',
        linkedinLabel: 'LinkedIn',
        backHomeLabel: 'Terug naar de voorpagina',
        directContactTitle: 'Direct een bericht sturen',
        directContactSubtitle:
          'Een korte vraag per mail of even sparren via LinkedIn mag altijd — vaak reageer ik dezelfde werkdag nog.',
        ctaTitle: 'Even kennismaken of iets voorleggen?',
        ctaSubtitle:
          'Laat hieronder kort achter waar je tegenaan loopt, of mail rechtstreeks naar grey.beimers@gmail.com.',
      },
      form: {
        eyebrow: 'Vrijblijvend contact',
        title: 'Zullen we eens kijken wat er bij jou slimmer kan?',
        subtitle:
          'Omschrijf kort waar nu tijd weglekt of wat voor site of tool je voor ogen hebt. Je krijgt direct antwoord van Greyson — nuchter en zonder verkooppraatje.',
        nameLabel: 'Jouw naam',
        namePlaceholder: 'Bijv. Jan de Vries',
        companyLabel: 'Bedrijf / Organisatie',
        companyPlaceholder: 'Bijv. Installatiebedrijf Fryslân',
        contactLabel: 'E-mailadres of telefoonnummer',
        contactPlaceholder: 'naam@bedrijf.nl of 06-...',
        interestLabel: 'Waar gaat je gedachte naar uit?',
        interestOptions: [
          'Taken & werkprocessen automatiseren',
          'Nieuwe website of maatwerk web-app',
          'Bestaande tools & spreadsheets koppelen',
          'Vrijblijvend sparren over praktische AI',
        ],
        messageLabel: 'Korte toelichting',
        messagePlaceholder:
          'Vertel kort welk werk nu veel tijd kost of wat je graag wilt laten bouwen...',
        submitButton: 'Stuur bericht per e-mail',
        copyFallbackButton: 'Kopieer bericht & e-mailadres (grey.beimers@gmail.com)',
        copiedNotice: 'Bericht en grey.beimers@gmail.com gekopieerd naar klembord.',
        directEmailNote:
          'Liever zelf een mail openen? Stuur gerust direct een bericht naar grey.beimers@gmail.com.',
        submittedTitle: 'Je e-mailprogramma wordt geopend',
        submittedDescription:
          'Gebruik je webmail in de browser en opent er niets vanzelf? Klik hieronder om alles met één druk op de knop te kopiëren.',
        validationError:
          'Vul je naam, contactgegevens en een korte toelichting in voordat je verstuurt.',
      },
      footer: {
        note: 'Greyson Beimers — Praktische AI, automatisering & moderne software voor Friesland.',
        aboutLinkLabel: 'Over mij & contact',
      },
    },
    en: {
      nav: {
        brand: 'GREYSON',
        homeLabel: 'Home',
        servicesLabel: 'Approach',
        useCasesLabel: 'In Practice',
        processLabel: 'Our Story',
        aboutLabel: 'About Me',
        contactLabel: 'Contact',
        dashboardLabel: 'Dashboard',
        languageLabel: 'Select language',
      },
      hero: {
        badge: 'Software, AI & Automation — Friesland',
        title: 'Less manual busywork. Faster software without agency prices.',
        subtitle:
          'AI is moving fast, and most headlines are pure noise. For business owners in Friesland it comes down to one simple thing: letting emails, quote prep, and messy spreadsheets run quietly in the background — and launching custom websites or web apps in days instead of months.',
        primaryCta: 'Start a conversation',
        secondaryCta: 'Explore how it works',
      },
      heroShowcase: {
        kicker: 'Interactive workflow preview',
        caption:
          'Switch between three everyday scenarios to see how practical engineering works behind the scenes.',
        inputLabel: 'What arrives',
        engineLabel: 'What runs quietly',
        outputLabel: 'What you see Monday morning',
        metricLabel: 'Real-world impact',
        scenarios: [
          {
            id: 'intake',
            tab: 'Quotes & Intake',
            headline: 'Turn raw inbox requests into structured quote drafts',
            input:
              'A customer emails dimensions, a PDF sketch, and three follow-up questions late in the evening.',
            engine:
              'The request is extracted, checked against your own pricing sheet, and matched cleanly to the customer profile.',
            output:
              'By 08:30 AM a complete draft quote and reply are waiting for your quick final review.',
            metric: 'Prepared in 2 minutes instead of 40 minutes of typing',
          },
          {
            id: 'knowledge',
            tab: 'Company Knowledge',
            headline: 'Instant answers straight from your own manuals',
            input:
              'A technician on site or a new colleague searches for a specific guideline or historical project detail.',
            engine:
              'Your private company assistant queries only your manuals, safety docs, and past project records.',
            output:
              'An exact, cited answer in seconds while all company data stays completely private.',
            metric: 'Zero folder hunting & zero leakage to public models',
          },
          {
            id: 'portal',
            tab: 'Sites & Portals',
            headline: 'Modern web portals built in days, not months',
            input:
              'Customers repeatedly call or email for scheduling, status updates, or submitting project files.',
            engine:
              'AI-accelerated engineering lets a senior developer build, test, and refine a custom site or portal rapidly.',
            output:
              'A fast, custom platform under your own domain at a fraction of traditional agency quotes.',
            metric: 'Launched weeks faster with full code ownership',
          },
        ],
      },
      services: {
        eyebrow: 'What we build together',
        title: 'Not bulleted checklists or consultancy decks — working software that clears your week.',
        intro:
          'Most AI consultancies sell workshops and slide decks. I prefer building the actual workflow or custom web platform that runs reliably for your business.',
        automationEyebrow: 'Workflow & Task Automation',
        automationTitle: 'Take repetitive back-office steps off your team’s plate',
        automationBody:
          'Every week skilled people spend hours copying emails into quotes, reconciling invoices against Excel, or answering the exact same internal questions. Clean integrations between the tools you already rely on—email, accounting, scheduling, and spreadsheets—handle that busywork quietly so you just review and approve.',
        automationPipeline: [
          {
            stage: 'Existing tools',
            detail: 'Email, PDFs, CRM & Excel',
          },
          {
            stage: 'Quiet logic',
            detail: 'Extract, validate & prepare',
          },
          {
            stage: 'Ready for review',
            detail: 'You stay firmly in control',
          },
        ],
        softwareEyebrow: 'Faster Websites & Custom Web Apps',
        softwareTitle: 'Clean, modern software without six-month timelines',
        softwareBody:
          'Previously, getting a custom website, intake flow, or client portal meant agency quotes deep in five figures and months of back-and-forth. Modern AI transforms how fast an experienced engineer writes, tests, and ships reliable software—bringing timelines down to days or weeks while keeping quality and ownership high.',
        softwareComparison: [
          {
            label: 'Traditional agency',
            value: '3–6 months & heavy overhead',
            tone: 'muted',
          },
          {
            label: 'With Greyson (AI-accelerated)',
            value: 'Days to weeks & direct line to the builder',
            tone: 'accent',
          },
        ],
      },
      useCases: {
        eyebrow: 'Real situations across Friesland',
        title: 'Everyday bottlenecks where quiet engineering brings immediate relief',
        intro:
          'Grounded examples built around how regional trades, installers, and B2B teams actually work.',
        items: [
          {
            id: 'quotes',
            tag: 'Sales & Back-Office',
            situation:
              '“Requests arrive daily across email and forms, and someone still spends every evening re-typing specs into quote templates.”',
            title: 'Turn inbound requests into ready-to-check quote drafts',
            narrative:
              'Whenever an email inquiry or PDF drawing lands, a private workflow extracts the dimensions and line items directly into your own template. The next morning you simply verify, tweak if needed, and send.',
          },
          {
            id: 'knowledge',
            tag: 'Team Knowledge',
            situation:
              '“Only two senior colleagues know where every rule and exception lives, so everyone else keeps calling or searching folders.”',
            title: 'A private question-and-answer hub over your own files',
            narrative:
              'Manuals, technical notes, and past project specs become instantly searchable in plain Dutch or English for your own team—safely isolated so business data never trains public AI models.',
          },
          {
            id: 'web',
            tag: 'Customer Experience',
            situation:
              '“Our website feels dated on mobile, and customers still have to call just to check a status or upload a file.”',
            title: 'A sharp website or customer portal that works everywhere',
            narrative:
              'Whether it is an approachable, fast-loading company site or a dedicated portal for bookings and documents, we launch clean, custom software tailored cleanly to your customers.',
          },
          {
            id: 'sync',
            tag: 'Operations & Admin',
            situation:
              '“Orders arrive in email or a webshop, get copied into Excel, and then re-entered again into invoicing software.”',
            title: 'Let your existing systems talk silently in the background',
            narrative:
              'Dependable background bridges keep customer records, schedules, and invoices aligned across tools—eliminating typos and freeing up weekly hours without forcing staff to learn complex new apps.',
          },
        ],
      },
      story: {
        eyebrow: 'An honest perspective',
        title: 'AI is changing software fast — let’s put that change quietly to work for you.',
        paragraphs: [
          'I am Greyson Beimers, a software engineer who prefers sitting down for coffee in Friesland—or hopping on a focused call—over slick agency pitches. AI headlines are noisy, yet beneath them sits a genuine shift: automation and custom software are finally fast and affordable enough for everyday local businesses.',
          'Without account managers or consultancy layers, I pair modern AI tooling with disciplined full-stack engineering. That means shorter turnarounds, clear upfront pricing, and practical improvements that earn back their cost quickly.',
          'And one principle never changes: your data and software remain yours. Sensitive client and financial records stay strictly private, and code, domains, and integrations live directly under your own accounts.',
        ],
        processTitle: 'How working together unfolds',
        steps: [
          {
            phase: 'Step 1 — Honest look',
            title: 'Friendly chat at your office or online',
            text: 'We spend thirty minutes looking at where manual busywork piles up in Leeuwarden, Sneek, Heerenveen, Drachten, or over a quick video call.',
          },
          {
            phase: 'Step 2 — Clear scope',
            title: 'Fixed plan and upfront pricing',
            text: 'You hear straight away what makes practical sense, how much time it saves, and exact cost before anything is built.',
          },
          {
            phase: 'Step 3 — Fast delivery',
            title: 'Tested, secure, and ready for Monday morning',
            text: 'Within days or a couple of weeks your automation or web platform runs reliably in production under your own control.',
          },
        ],
        regionLine:
          'Working locally across Friesland (Leeuwarden, Sneek, Heerenveen, Drachten, Harlingen, Franeker, Dokkum) and across the Netherlands.',
      },
      aboutTeaser: {
        eyebrow: 'Behind the work',
        title: 'Work straight with the engineer building your system.',
        summary:
          'No sales funnel, no middlemen: you work directly with Greyson Beimers. Read more on the About page about my full-stack background and how direct, AI-accelerated engineering works.',
        ctaLabel: 'Read about me & view direct contact options',
      },
      aboutPage: {
        badge: 'About Greyson Beimers — Friesland & Amsterdam',
        title: 'Grounded engineering, fast turnaround, and direct collaboration.',
        subtitle:
          'I help companies in Friesland simplify daily admin with practical AI and build custom websites or web apps in a fraction of traditional timelines.',
        introTitle: 'Why I work directly with business owners',
        introParagraphs: [
          'Software engineering has changed permanently. Systems that once required weeks of boilerplate setup can now be crafted, verified, and refined dramatically faster by pairing solid architecture with modern AI development workflows.',
          'For local companies across Friesland, that opens up two real opportunities: automating everyday inbox, quoting, and spreadsheet friction, and building modern websites or custom portals without five-figure agency budgets.',
          'Working directly means zero layers between your idea and the code. You talk with the person designing, building, and securing your system, and you own everything we ship.',
        ],
        principlesTitle: 'What you can count on',
        principles: [
          {
            title: 'Direct line to the engineer',
            body: 'No rotating account managers or middlemen. Whenever you want an adjustment or new idea shipped, you speak directly to the builder.',
          },
          {
            title: 'Faster & fairer pricing through modern AI',
            body: 'Accelerated engineering means lower overhead, transparent scope, and seeing real working software within days rather than quarters.',
          },
          {
            title: 'Privacy & complete ownership',
            body: 'Company records never feed public training models, and source code, integrations, and domain infrastructure remain completely yours.',
          },
        ],
        profileTitle: 'Profile at a glance',
        profileBody:
          'Full-stack software engineer focused on TypeScript, React, Node.js, Python, interactive web platforms, and dependable API & AI workflows. Serving SMEs across Friesland (Leeuwarden, Sneek, Heerenveen, Drachten) and Amsterdam.',
        stackLine:
          'Daily stack spans TypeScript, React, Node.js, Python, API bridges, private AI workflows, and modern cloud hosting.',
        locationLabel: 'Location',
        locationValue: 'Friesland & Amsterdam, Netherlands',
        emailLabel: 'Email',
        linkedinLabel: 'LinkedIn',
        backHomeLabel: 'Back to overview',
        directContactTitle: 'Get in touch directly',
        directContactSubtitle:
          'Happy to answer a quick question by email or connect on LinkedIn — usually replying within one business day.',
        ctaTitle: 'Want to talk through an idea or bottleneck?',
        ctaSubtitle:
          'Leave a short note below or email grey.beimers@gmail.com directly for a straight, honest response.',
      },
      form: {
        eyebrow: 'Get in touch',
        title: 'Let’s look at what saves your team real time',
        subtitle:
          'Share briefly what you want to simplify or build. You hear back directly from Greyson — plain advice, never a hard sell.',
        nameLabel: 'Your name',
        namePlaceholder: 'e.g. Jan de Vries',
        companyLabel: 'Company / Organization',
        companyPlaceholder: 'e.g. Installatiebedrijf Fryslân',
        contactLabel: 'Email or phone number',
        contactPlaceholder: 'name@company.nl or +31 6 ...',
        interestLabel: 'What are you most interested in?',
        interestOptions: [
          'Task & workflow automation',
          'New website or custom web app',
          'Connecting existing tools & spreadsheets',
          'Exploring practical AI opportunities',
        ],
        messageLabel: 'Short note',
        messagePlaceholder:
          'Where does your team lose time right now, or what would you like to build?',
        submitButton: 'Open email draft',
        copyFallbackButton: 'Copy message & email (grey.beimers@gmail.com)',
        copiedNotice: 'Message and grey.beimers@gmail.com copied to clipboard.',
        directEmailNote:
          'Prefer writing directly? Email anytime at grey.beimers@gmail.com.',
        submittedTitle: 'Opening your email app',
        submittedDescription:
          'Using browser webmail and nothing popped open? Copy your prepared note cleanly below.',
        validationError:
          'Please enter your name, contact details, and a short note before continuing.',
      },
      footer: {
        note: 'Greyson Beimers — Practical AI, workflow automation & custom software for Friesland.',
        aboutLinkLabel: 'About me & contact',
      },
    },
  },
} as const;

export type AutomateConfig = typeof automateConfig;
