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
        servicesLabel: 'De omslag',
        useCasesLabel: 'Voorbeelden',
        processLabel: 'Aanpak',
        aboutLabel: 'Over mij',
        contactLabel: 'Contact',
        dashboardLabel: 'Dashboard',
        languageLabel: 'Taal kiezen',
      },
      hero: {
        badge: 'AI & Custom Tools — Friesland (2026)',
        title:
          'Wat vóór 2025 maanden maatwerk kostte, bouwen we nu vaak in één middag of dag.',
        subtitle:
          'AI gaat razendsnel. Elk bedrijf heeft knelpunten of vastgeroeste werkwijzen die vroeger vanwege de kosten bleven liggen. Ik breng jullie proces visueel in kaart en bouw direct een custom tool of AI-flow die het werk efficiënter én leuker maakt.',
        primaryCta: 'Breng mijn proces in kaart',
        secondaryCta: 'Bekijk de omslag (< 2025 vs. Nu)',
        missionStrip: [
          { step: '1', label: 'Werkwijze in kaart' },
          { step: '2', label: 'Custom tool in 1 dag' },
          { step: '3', label: 'Efficiënter & leuker werk' },
        ],
      },
      heroShowcase: {
        kicker: '< 2025 vs. 2026 — In één oogopslag',
        caption:
          'Klik door drie herkenbare situaties en zie hoe een uitgesteld probleem binnen één dag verdwijnt.',
        eraBefore: {
          tag: '< 2025',
          title: 'Uitgesteld wegens kosten',
          detail: '6–12 wkn maatwerk · €€€ → bleef liggen',
        },
        eraNow: {
          tag: 'Nu in 2026',
          title: 'Klaar in 1 middag of dag',
          detail: 'Custom AI-tool · Direct werkplezier',
        },
        inputLabel: 'Vastgeroeste werkwijze (< 2025)',
        engineLabel: 'Custom AI Tool (2026)',
        outputLabel: 'Resultaat op de werkvloer',
        metricLabel: 'Verschil in tijd',
        scenarios: [
          {
            id: 'intake',
            tab: 'Offertes & Mail',
            buildTime: 'Bouwtijd: 1 middag',
            oldDuration: '45 min handwerk',
            newDuration: '30 sec controle',
            oldFlow: ['Mail + PDF', 'Overtypen', 'Excel / Word'],
            newFlow: ['AI leest aanvraag', 'Concept klaar', '1-klik akkoord'],
            headline: 'Van losse mail-aanvraag naar kant-en-klare offerte',
            input:
              'Klant stuurt ’s avonds maten, foto’s of een PDF-tekening in losse mails.',
            engine:
              'Jullie custom AI-tool leest direct maten en regels uit zonder overtypen.',
            output:
              'Om 08:30 uur staat het complete offerteconcept klaar voor één laatste klik.',
            metric: 'Van 45 min typen naar 30 sec checken — direct gebouwd in 1 middag',
          },
          {
            id: 'excel',
            tab: 'Oude Excel-lijsten',
            buildTime: 'Bouwtijd: 1 dag',
            oldDuration: '4 losse lijsten',
            newDuration: '1 live tool',
            oldFlow: ['Mailtjes', '3x Excel kopiëren', 'Foutgevoelig'],
            newFlow: ['1 Custom Dashboard', 'Automatische sync', 'Direct overzicht'],
            headline: 'Van aan elkaar geplakte spreadsheets naar één eigen tool',
            input:
              'Orders, uren en voorraad worden op meerdere plekken handmatig bijgewerkt.',
            engine:
              'Eén overzichtelijke web-app die stil op de achtergrond met jullie pakketten praat.',
            output:
              'Altijd live cijfers op één plek — geen dubbele invoer of zoekgeraakte versies.',
            metric: 'Eindelijk van de Excel-rompslomp af — gebouwd in 1 dag',
          },
          {
            id: 'kennis',
            tab: 'Interne Vraagbaak',
            buildTime: 'Bouwtijd: 1 middag',
            oldDuration: '20 min zoeken',
            newDuration: '3 sec antwoord',
            oldFlow: ['Mappen zoeken', 'Collega bellen', 'Wachten'],
            newFlow: ['Vraag in NL', 'Eigen AI-zoektool', 'Direct bron + antwoord'],
            headline: 'Nooit meer graven in mappen of collega’s storen',
            input:
              'Monteur of binnendienst zoekt naar een voorschrift, handleiding of oude afspraak.',
            engine:
              'Een eigen afgeschermde zoektool doorzoekt alleen jullie interne documenten.',
            output:
              'Binnen 3 seconden het juiste antwoord met bronpagina, 100% privé.',
            metric: 'Van 20 min zoeken naar 3 sec — gebouwd in 1 middag',
          },
        ],
      },
      services: {
        eyebrow: 'De omslag in beeld',
        title: '1 plaatje zegt genoeg: waarom wachten niet meer hoeft.',
        intro:
          'Ik neem contact op met bedrijven in Friesland, maak knelpunten visueel helder en los ze direct op.',
        infographicPanels: [
          {
            id: 'map',
            step: 'Stap 1',
            title: 'Werkwijze inzichtelijk maken',
            caption: 'We tekenen samen waar mail, Excel en handwerk vastlopen.',
            beforeLabel: 'Mail / Excel / App',
            afterLabel: 'Helder proces',
          },
          {
            id: 'build',
            step: 'Stap 2',
            title: 'In 1 middag of dag gebouwd',
            caption: 'Wat vóór 2025 maanden kostte, staat nu razendsnel als custom tool.',
            oldTag: '< 2025: 6–12 wkn',
            newTag: '2026: 1 middag/dag',
          },
          {
            id: 'joy',
            step: 'Stap 3',
            title: 'Efficiënter én leuker werk',
            caption: 'Minder saai overtypen, meer tijd voor klanten en vakwerk.',
            statLabel: 'Minder handwerk',
            statValue: '-80% saai tikwerk',
          },
        ],
        automationEyebrow: 'Processen & AI-koppelingen',
        automationTitle: 'Van inzicht naar werkende workflow',
        automationBody:
          'Geen dik adviesrapport, maar in korte stappen van probleem naar een betrouwbaar systeem.',
        automationPipeline: [
          {
            badge: 'Stap 1 · 30 min',
            stage: 'Proces tekenen',
            detail: 'Knelpunt en oude gewoontes direct scherp',
          },
          {
            badge: 'Stap 2 · 1 middag/dag',
            stage: 'Custom AI-tool bouwen',
            detail: 'Koppeling tussen mail, PDF, CRM of planning',
          },
          {
            badge: 'Stap 3 · Direct live',
            stage: 'Rust op kantoor',
            detail: 'Jij keurt goed, het saai werk verdwijnt',
          },
        ],
        softwareEyebrow: 'De nieuwe realiteit van 2026',
        softwareTitle: 'Maatwerk dat voorheen te duur was',
        softwareBody:
          'Moderne AI versnelt het bouwen van eigen software zo sterk dat lokale MKB-wensen direct haalbaar zijn.',
        softwareComparison: [
          {
            label: '< 2025 · Traditioneel maatwerk',
            value: 'Maanden wachttijd & hoge kosten → Bleef liggen',
            tone: 'muted',
          },
          {
            label: '2026 · Custom Tool met AI',
            value: 'In 1 middag of dag gebouwd → Direct efficiënter & leuker',
            tone: 'accent',
          },
        ],
      },
      useCases: {
        eyebrow: 'Voor & Na in de praktijk',
        title: 'Vastgeroeste gewoontes vertaald naar 1-dag tools',
        intro:
          'Vier alledaagse voorbeelden die vóór 2025 te kostbaar leken, maar nu direct op te lossen zijn.',
        oldRowPrefix: '< 2025 · Vastgeroest',
        newRowPrefix: '2026 · Custom Tool',
        items: [
          {
            id: 'quotes',
            tag: 'Offertes & Intake',
            buildBadge: 'Gebouwd in 1 middag',
            title: 'Aanvragen direct naar een offerteconcept',
            situation:
              '“Elke avond zitten we mailtjes en PDF’s handmatig om te zetten.”',
            oldWayLabel: 'Oud',
            newWayLabel: 'Nieuw',
            oldSteps: ['Mail lezen', 'Maten overtypen', 'Offerte kloppen'],
            newSteps: ['AI leest PDF', 'Regels gevuld', '1 klik versturen'],
            narrative:
              'Geen verloren uren meer; de aanvraag staat de volgende ochtend al klaar.',
          },
          {
            id: 'excel',
            tag: 'Planning & Admin',
            buildBadge: 'Gebouwd in 1 dag',
            title: 'Weg met de wirwar van losse Excel-lijsten',
            situation:
              '“Iedereen werkt in een ander tabblad en niemand heeft live overzicht.”',
            oldWayLabel: 'Oud',
            newWayLabel: 'Nieuw',
            oldSteps: ['Mailtje', 'Excel A + B', 'Handmatig factuur'],
            newSteps: ['1 Web-tool', 'Live planning', 'Auto-export'],
            narrative:
              'Eén strakke tool op maat waar het hele team zonder fouten in werkt.',
          },
          {
            id: 'knowledge',
            tag: 'Team & Vakkennis',
            buildBadge: 'Gebouwd in 1 middag',
            title: 'Privé vraagbaak op eigen documenten',
            situation:
              '“Nieuwe collega’s blijven bellen omdat voorschriften verstopt zitten.”',
            oldWayLabel: 'Oud',
            newWayLabel: 'Nieuw',
            oldSteps: ['Mappen klikken', 'Collega bellen', 'Halfuur kwijt'],
            newSteps: ['Vraag typen', 'Eigen AI zoekt', 'Antwoord + bron'],
            narrative:
              'Direct antwoord uit jullie eigen bestanden zonder dat data het pand verlaat.',
          },
          {
            id: 'portal',
            tag: 'Klantportaal & Site',
            buildBadge: 'Gebouwd in 1 dag',
            title: 'Modern portaal in eigen hand',
            situation:
              '“Klanten bellen steeds voor statusupdates en bestandjes.”',
            oldWayLabel: 'Oud',
            newWayLabel: 'Nieuw',
            oldSteps: ['Klant belt', 'Status zoeken', 'Terugmailen'],
            newSteps: ['Eigen portaal', 'Klant logt in', 'Direct geregeld'],
            narrative:
              'Snelle professionele uitstraling én minder telefoontjes op de zaak.',
          },
        ],
      },
      story: {
        eyebrow: 'De missie achter Greyson',
        title: 'Ik help bedrijven uit hun vastgeroeste routine.',
        paragraphs: [
          'AI gaat zo snel dat softwareproblemen waarvoor je vóór 2025 een duur bureau moest inhuren, nu vaak in één middag of dag op te lossen zijn.',
          'Daarom ga ik actief met ondernemers in Friesland om tafel: we brengen samen in beeld waar het schuurt en bouwen direct een tool die het werk lichter, slimmer en leuker maakt.',
        ],
        shiftCard: {
          title: 'Waarom nu het moment is',
          oldLabel: 'Vóór 2025',
          oldStat: 'Weken wachttijd · Vaak uitgesteld',
          newLabel: 'In 2026 met AI',
          newStat: '1 middag tot 1 dag · Direct rendement & werkplezier',
        },
        processTitle: 'In 3 korte stappen geregeld',
        steps: [
          {
            badge: '30 min',
            phase: '1 · Inzichtelijk maken',
            title: 'Samen kijken waar het vastloopt',
            text: 'Aan tafel of online tekenen we het proces uit en kiezen het grootste pijnpunt.',
          },
          {
            badge: '1 middag / 1 dag',
            phase: '2 · Direct bouwen',
            title: 'Een werkende custom tool of AI-flow',
            text: 'Geen maandenlange trajecten — je ziet bijna meteen iets dat werkt op jouw eigen data.',
          },
          {
            badge: 'Elke dag plezier',
            phase: '3 · Efficiënter werken',
            title: 'Minder handwerk, volledig in eigen bezit',
            text: 'Veilig geïnstalleerd op jouw eigen omgeving zodat het team elke dag tijd bespaart.',
          },
        ],
        regionLine:
          'Actief in heel Friesland: Leeuwarden, Sneek, Heerenveen, Drachten, Harlingen, Franeker & Dokkum.',
      },
      aboutTeaser: {
        eyebrow: 'Wie er langskomt',
        title: 'Rechtstreeks bouwen met Greyson Beimers.',
        summary:
          'Geen verkopers, wel nuchtere full-stack engineering in Friesland. Bekijk op de over-mij-pagina hoe ik werk.',
        ctaLabel: 'Over mij & direct contact',
      },
      aboutPage: {
        badge: 'Over Greyson Beimers — Friesland & Amsterdam',
        title: 'Oude knelpunten oplossen met de snelheid van 2026.',
        subtitle:
          'Ik breng vastgeroeste bedrijfsprocessen visueel in kaart en bouw binnen een middag of dag een custom tool of AI-flow die het werk leuker maakt.',
        introTitle: 'Waarom ik dit doe',
        introParagraphs: [
          'Tot voor kort bleven kleine en middelgrote irritaties op kantoor liggen omdat maatwerksoftware simpelweg te traag en te duur was. Door moderne AI schrijf en test ik diezelfde oplossingen nu vele malen sneller.',
          'Mijn doel is simpel: langskomen bij bedrijven, luisteren waar de energie weglekt en binnen no-time een eigen tool neerzetten die rust en werkplezier terugbrengt.',
        ],
        principlesTitle: 'Waarom het werkt',
        principles: [
          {
            icon: 'insight',
            title: 'Proces eerst visueel scherp',
            body: 'We brengen zonder vakjargon in beeld welke stappen overbodig zijn geworden.',
          },
          {
            icon: 'speed',
            title: 'Gebouwd in een middag of dag',
            body: 'Dankzij AI staat een werkend prototype of directe koppeling razendsnel klaar.',
          },
          {
            icon: 'shield',
            title: '100% privé & eigen eigendom',
            body: 'Bedrijfsdata traint geen publieke modellen en alle code blijft van jouw bedrijf.',
          },
        ],
        profileTitle: '< 2025 vs. 2026 · Profiel',
        profileBody:
          'Full-stack software engineer (TypeScript, React, Node.js, Python & AI-workflows) die lokaal in Friesland bedrijven helpt versnellen.',
        stackLine:
          'TypeScript · React · Node.js · Python · Veilige AI-flows · Custom Web Tools',
        locationLabel: 'Werkgebied',
        locationValue: 'Friesland & Amsterdam, Nederland',
        emailLabel: 'E-mail',
        linkedinLabel: 'LinkedIn',
        backHomeLabel: 'Terug naar overzicht',
        directContactTitle: 'Direct een bericht sturen',
        directContactSubtitle:
          'Kom ik een keer meekijken? Mail gerust direct — meestal reageer ik dezelfde dag.',
        ctaTitle: 'Zullen we jouw proces eens bekijken?',
        ctaSubtitle:
          'Vertel kort waar het schuurt of stuur direct een mail naar grey.beimers@gmail.com.',
      },
      form: {
        eyebrow: 'Kennismaken',
        title: 'Welk vastgeroest klusje pakken we als eerste aan?',
        subtitle:
          'Stuur kort wat nu veel tijd kost. Binnen één werkdag denk ik vrijblijvend met je mee.',
        nameLabel: 'Jouw naam',
        namePlaceholder: 'Bijv. Jan de Vries',
        companyLabel: 'Bedrijf / Organisatie',
        companyPlaceholder: 'Bijv. Installatiebedrijf Fryslân',
        contactLabel: 'E-mailadres of telefoonnummer',
        contactPlaceholder: 'naam@bedrijf.nl of 06-...',
        interestLabel: 'Waar loop je tegenaan?',
        interestOptions: [
          'Vastgeroest proces / handwerk automatiseren',
          'Custom tool of mini-app in 1 dag laten bouwen',
          'Losse Excel-lijsten & systemen koppelen',
          'Even vrijblijvend proces in kaart brengen',
        ],
        messageLabel: 'Korte toelichting',
        messagePlaceholder:
          'Welk terugkerend klusje kost jullie nu de meeste frustratie of tijd?',
        submitButton: 'Stuur bericht per e-mail',
        copyFallbackButton: 'Kopieer bericht & e-mailadres (grey.beimers@gmail.com)',
        copiedNotice: 'Bericht en grey.beimers@gmail.com gekopieerd naar klembord.',
        directEmailNote:
          'Liever zelf een mail sturen? Gebruik direct grey.beimers@gmail.com.',
        submittedTitle: 'Je e-mailprogramma wordt geopend',
        submittedDescription:
          'Opent er niets vanzelf in de browser? Kopieer het bericht dan met één klik hieronder.',
        validationError:
          'Vul je naam, contactgegevens en een korte toelichting in voordat je verstuurt.',
      },
      footer: {
        note: 'Greyson Beimers — Custom tools & AI-processen in 1 dag voor Friesland.',
        aboutLinkLabel: 'Over mij & contact',
      },
    },
    en: {
      nav: {
        brand: 'GREYSON',
        homeLabel: 'Home',
        servicesLabel: 'The Shift',
        useCasesLabel: 'Examples',
        processLabel: 'Approach',
        aboutLabel: 'About Me',
        contactLabel: 'Contact',
        dashboardLabel: 'Dashboard',
        languageLabel: 'Select language',
      },
      hero: {
        badge: 'AI & Custom Tools — Friesland (2026)',
        title:
          'What took months of costly custom code before 2025 now takes an afternoon or a day.',
        subtitle:
          'AI is advancing at breakneck speed. Every company has bottlenecks or rusty habits they put off due to cost. I map your workflow visually and build a custom tool or AI flow that makes work faster and more enjoyable.',
        primaryCta: 'Map my process',
        secondaryCta: 'See the shift (< 2025 vs. Now)',
        missionStrip: [
          { step: '1', label: 'Map the bottleneck' },
          { step: '2', label: 'Custom tool in 1 day' },
          { step: '3', label: 'Faster & more fun work' },
        ],
      },
      heroShowcase: {
        kicker: '< 2025 vs. 2026 — At a glance',
        caption:
          'Click through three everyday workflows to see postponed admin vanish in one day.',
        eraBefore: {
          tag: '< 2025',
          title: 'Shelved due to cost',
          detail: '6–12 wks custom build · €€€ → postponed',
        },
        eraNow: {
          tag: 'Now in 2026',
          title: 'Built in 1 afternoon or day',
          detail: 'Custom AI tool · Immediate relief',
        },
        inputLabel: 'Rusty manual habit (< 2025)',
        engineLabel: 'Custom AI Tool (2026)',
        outputLabel: 'On-the-floor result',
        metricLabel: 'Time difference',
        scenarios: [
          {
            id: 'intake',
            tab: 'Quotes & Email',
            buildTime: 'Build time: 1 afternoon',
            oldDuration: '45 min typing',
            newDuration: '30 sec review',
            oldFlow: ['Email + PDF', 'Manual re-typing', 'Excel / Word'],
            newFlow: ['AI reads request', 'Draft ready', '1-click send'],
            headline: 'From messy inbox requests to ready-to-send quotes',
            input:
              'Customers email measurements, photos, or PDF drawings late at night.',
            engine:
              'Your custom AI tool extracts dimensions and pricing rules automatically.',
            output:
              'By 08:30 AM a finished quote draft awaits one final click.',
            metric: '45 min of typing down to 30 sec check — built in 1 afternoon',
          },
          {
            id: 'excel',
            tab: 'Legacy Spreadsheets',
            buildTime: 'Build time: 1 day',
            oldDuration: '4 separate files',
            newDuration: '1 live tool',
            oldFlow: ['Emails', 'Copy to 3 sheets', 'Error-prone'],
            newFlow: ['1 Custom Dashboard', 'Auto sync', 'Instant clarity'],
            headline: 'Replace patched spreadsheets with one clean custom tool',
            input:
              'Orders, hours, and stock are updated manually across multiple sheets.',
            engine:
              'A single tailored web tool synced quietly with your existing software.',
            output:
              'Live numbers in one place with zero duplicate typing.',
            metric: 'Spreadsheet chaos gone for good — built in 1 day',
          },
          {
            id: 'kennis',
            tab: 'Team Knowledge',
            buildTime: 'Build time: 1 afternoon',
            oldDuration: '20 min searching',
            newDuration: '3 sec answer',
            oldFlow: ['Dig in folders', 'Call colleague', 'Wait'],
            newFlow: ['Ask in plain text', 'Private AI tool', 'Exact source'],
            headline: 'Instant cited answers from your own manuals',
            input:
              'Staff search for safety rules, installation steps, or old project notes.',
            engine:
              'A private internal search tool querying only your verified company docs.',
            output:
              'Exact cited answers in 3 seconds with 100% data privacy.',
            metric: '20 min digging down to 3 sec — built in 1 afternoon',
          },
        ],
      },
      services: {
        eyebrow: 'Visualizing the shift',
        title: 'One visual says it all: why postponed fixes can happen now.',
        intro:
          'I reach out to businesses in Friesland, map out bottlenecks visually, and build practical tools right away.',
        infographicPanels: [
          {
            id: 'map',
            step: 'Step 1',
            title: 'Visualize the workflow',
            caption: 'Together we map where email, Excel, and manual work stall.',
            beforeLabel: 'Mail / Excel / Chat',
            afterLabel: 'Clear flow',
          },
          {
            id: 'build',
            step: 'Step 2',
            title: 'Built in 1 afternoon or day',
            caption: 'What took months before 2025 now launches in a single day.',
            oldTag: '< 2025: 6–12 wks',
            newTag: '2026: 1 day/afternoon',
          },
          {
            id: 'joy',
            step: 'Step 3',
            title: 'Faster & more fun work',
            caption: 'Less tedious copy-pasting, more focus on craft and clients.',
            statLabel: 'Manual work cut',
            statValue: '-80% repetitive work',
          },
        ],
        automationEyebrow: 'Processes & AI Bridges',
        automationTitle: 'From mapped bottleneck to live system',
        automationBody:
          'No long consultancy decks — three crisp steps from problem to reliable daily tool.',
        automationPipeline: [
          {
            badge: 'Step 1 · 30 min',
            stage: 'Map the process',
            detail: 'Pinpoint rusty routines and wasted hours',
          },
          {
            badge: 'Step 2 · 1 day',
            stage: 'Build custom AI tool',
            detail: 'Bridge inbox, PDFs, spreadsheets & planning',
          },
          {
            badge: 'Step 3 · Live now',
            stage: 'Enjoyable workflow',
            detail: 'You stay in charge, busywork disappears',
          },
        ],
        softwareEyebrow: 'The 2026 Reality',
        softwareTitle: 'Custom tools that used to be out of reach',
        softwareBody:
          'Modern AI shrinks build time dramatically so local businesses no longer shelve smart ideas.',
        softwareComparison: [
          {
            label: '< 2025 · Traditional custom build',
            value: 'Months of wait & high agency fees → Shelved',
            tone: 'muted',
          },
          {
            label: '2026 · Custom Tool powered by AI',
            value: 'Built in 1 afternoon or day → Faster & more fun',
            tone: 'accent',
          },
        ],
      },
      useCases: {
        eyebrow: 'Before & After in practice',
        title: 'Rusty daily routines turned into 1-day tools',
        intro:
          'Four familiar bottlenecks that seemed too expensive before 2025, solved cleanly today.',
        oldRowPrefix: '< 2025 · Rusty habit',
        newRowPrefix: '2026 · Custom Tool',
        items: [
          {
            id: 'quotes',
            tag: 'Quotes & Intake',
            buildBadge: 'Built in 1 afternoon',
            title: 'Turn emails directly into ready quote drafts',
            situation:
              '“Every evening we still re-type emails and PDFs into quotes.”',
            oldWayLabel: 'Old',
            newWayLabel: 'New',
            oldSteps: ['Read email', 'Retype specs', 'Build quote'],
            newSteps: ['AI reads PDF', 'Lines filled', '1-click send'],
            narrative:
              'Wake up to ready drafts instead of spending evenings typing.',
          },
          {
            id: 'excel',
            tag: 'Planning & Admin',
            buildBadge: 'Built in 1 day',
            title: 'Replace tangled spreadsheets with one live app',
            situation:
              '“Everyone edits a different sheet and nobody trusts the numbers.”',
            oldWayLabel: 'Old',
            newWayLabel: 'New',
            oldSteps: ['Inbox note', 'Sheet A + B', 'Manual invoice'],
            newSteps: ['1 Web Tool', 'Live schedule', 'Auto sync'],
            narrative:
              'One clean custom interface built around how your team actually works.',
          },
          {
            id: 'knowledge',
            tag: 'Team Knowledge',
            buildBadge: 'Built in 1 afternoon',
            title: 'Private Q&A hub over company files',
            situation:
              '“New hires keep calling because instructions sit in buried folders.”',
            oldWayLabel: 'Old',
            newWayLabel: 'New',
            oldSteps: ['Browse folders', 'Call senior', '30 min lost'],
            newSteps: ['Ask question', 'Private AI', 'Cited answer'],
            narrative:
              'Instant answers from your own manuals while files stay 100% private.',
          },
          {
            id: 'portal',
            tag: 'Client Portal',
            buildBadge: 'Built in 1 day',
            title: 'Clean customer self-service portal',
            situation:
              '“Clients keep calling for simple updates or file uploads.”',
            oldWayLabel: 'Old',
            newWayLabel: 'New',
            oldSteps: ['Client calls', 'Look up file', 'Reply manually'],
            newSteps: ['Live portal', 'Client logs in', 'Sorted'],
            narrative:
              'Sharper customer experience and far fewer interruptions.',
          },
        ],
      },
      story: {
        eyebrow: 'The Mission',
        title: 'Helping companies break free from outdated routines.',
        paragraphs: [
          'AI moves so fast that workflow problems requiring months of expensive custom engineering before 2025 can now often be solved in one afternoon or day.',
          'I sit down with local companies, visualize where daily frustration lives, and build a tailored tool or AI process that makes work noticeably smoother and more enjoyable.',
        ],
        shiftCard: {
          title: 'Why right now matters',
          oldLabel: 'Before 2025',
          oldStat: 'Weeks to months · Usually postponed',
          newLabel: 'In 2026 with AI',
          newStat: '1 afternoon to 1 day · Immediate ROI & joy',
        },
        processTitle: 'Sorted in 3 crisp steps',
        steps: [
          {
            badge: '30 min',
            phase: '1 · Map the bottleneck',
            title: 'Visualize where time leaks',
            text: 'Together we sketch the workflow and pick the highest-impact bottleneck.',
          },
          {
            badge: '1 afternoon / 1 day',
            phase: '2 · Rapid build',
            title: 'Ship a working custom AI tool',
            text: 'No months of waiting — you test a live tool tailored to your exact setup fast.',
          },
          {
            badge: 'Daily relief',
            phase: '3 · Better workdays',
            title: 'Faster, safer & yours forever',
            text: 'Installed cleanly under your own ownership so the team saves hours every week.',
          },
        ],
        regionLine:
          'Working across Friesland: Leeuwarden, Sneek, Heerenveen, Drachten, Harlingen, Franeker & Dokkum.',
      },
      aboutTeaser: {
        eyebrow: 'Who visits your team',
        title: 'Build directly with Greyson Beimers.',
        summary:
          'No sales layers, just grounded full-stack engineering in Friesland. See how I work on the About page.',
        ctaLabel: 'About me & direct contact',
      },
      aboutPage: {
        badge: 'About Greyson Beimers — Friesland & Amsterdam',
        title: 'Solving yesterday’s bottlenecks at 2026 speed.',
        subtitle:
          'I map rusty business workflows visually and build custom tools or AI flows in an afternoon or day so work becomes faster and more fun.',
        introTitle: 'Why I work this way',
        introParagraphs: [
          'Before 2025, everyday operational headaches stayed unresolved because bespoke software took too long and cost too much. Pairing modern AI with full-stack craft shrinks that build cycle down to hours.',
          'My goal is straightforward: meet business owners, visualize where energy is wasted, and ship a custom tool that restores clarity and enjoyment at work.',
        ],
        principlesTitle: 'Why it works',
        principles: [
          {
            icon: 'insight',
            title: 'Workflow mapped visually first',
            body: 'No buzzwords — we picture every wasted step clearly before building.',
          },
          {
            icon: 'speed',
            title: 'Built in an afternoon or day',
            body: 'Modern AI tooling lets us launch real working software in record time.',
          },
          {
            icon: 'shield',
            title: 'Private & 100% your ownership',
            body: 'Company records never feed public models and all code belongs to you.',
          },
        ],
        profileTitle: '< 2025 vs. 2026 · Profile',
        profileBody:
          'Full-stack software engineer (TypeScript, React, Node.js, Python & AI workflows) helping SMEs across Friesland move faster.',
        stackLine:
          'TypeScript · React · Node.js · Python · Private AI Flows · Custom Web Apps',
        locationLabel: 'Region',
        locationValue: 'Friesland & Amsterdam, Netherlands',
        emailLabel: 'Email',
        linkedinLabel: 'LinkedIn',
        backHomeLabel: 'Back to overview',
        directContactTitle: 'Send a direct message',
        directContactSubtitle:
          'Want me to map your workflow? Email anytime — I usually reply the same day.',
        ctaTitle: 'Ready to simplify a rusty workflow?',
        ctaSubtitle:
          'Share your bottleneck below or email grey.beimers@gmail.com directly.',
      },
      form: {
        eyebrow: 'Get in touch',
        title: 'Which manual headache should we eliminate first?',
        subtitle:
          'Tell me briefly what slows your team down. Expect a practical reply within one business day.',
        nameLabel: 'Your name',
        namePlaceholder: 'e.g. Jan de Vries',
        companyLabel: 'Company / Organization',
        companyPlaceholder: 'e.g. Installatiebedrijf Fryslân',
        contactLabel: 'Email or phone number',
        contactPlaceholder: 'name@company.nl or +31 6 ...',
        interestLabel: 'Where do you get stuck?',
        interestOptions: [
          'Automate a rusty manual workflow',
          'Build a custom 1-day tool or web app',
          'Connect spreadsheets & existing software',
          'Map out our workflow together first',
        ],
        messageLabel: 'Short note',
        messagePlaceholder:
          'Which recurring task creates the most friction or wasted time right now?',
        submitButton: 'Open email draft',
        copyFallbackButton: 'Copy message & email (grey.beimers@gmail.com)',
        copiedNotice: 'Message and grey.beimers@gmail.com copied to clipboard.',
        directEmailNote:
          'Prefer emailing directly? Write anytime to grey.beimers@gmail.com.',
        submittedTitle: 'Opening your email app',
        submittedDescription:
          'Using webmail and nothing opened automatically? Copy the ready message below.',
        validationError:
          'Please enter your name, contact details, and a short note before continuing.',
      },
      footer: {
        note: 'Greyson Beimers — Custom 1-day tools & AI workflows for Friesland.',
        aboutLinkLabel: 'About me & contact',
      },
    },
  },
} as const;

export type AutomateConfig = typeof automateConfig;
