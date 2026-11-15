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
        brand: 'GREYSON AUTOMATION',
        homeLabel: 'Home',
        servicesLabel: 'Diensten',
        useCasesLabel: 'Voorbeelden',
        processLabel: 'Werkwijze',
        aboutLabel: 'Over mij',
        contactLabel: 'Contact',
        dashboardLabel: 'Dashboard',
        languageLabel: 'Taal kiezen',
      },
      sections: {
        services: {
          number: '01',
          eyebrow: '01 • Diensten & Oplossingen',
        },
        useCases: {
          number: '02',
          eyebrow: '02 • Praktijkvoorbeelden',
        },
        process: {
          number: '03',
          eyebrow: '03 • Werkwijze & Het Eerlijke Verhaal',
        },
        about: {
          number: '04',
          eyebrow: '04 • Over mij',
        },
        contact: {
          number: '05',
          eyebrow: '05 • Contact',
        },
      },
      hero: {
        badge: 'Friesland • AI & Procesautomatisering',
        title: 'Praktische AI & snellere software voor bedrijven in Friesland.',
        subtitle:
          'AI ontwikkelt zich razendsnel, en daar wordt veel onzin over verkocht. Onder de hype zijn de tools nu écht sterk genoeg voor praktisch werk: uren aan repeterend kantoorwerk wegnemen bij je team, of nieuwe websites en maatwerk-apps bouwen in dagen in plaats van maanden — voor een fractie van traditionele bureaukosten.',
        primaryCta: 'Vrijblijvend kennismaken',
        secondaryCta: 'Bekijk praktijkvoorbeelden',
      },
      storyTitle: 'Waarom dit juist nu interessant is — zonder verkooppraatjes',
      storyParagraphs: [
        'Als ondernemer in het Friese MKB hoor je elke dag over AI, terwijl jij en je team ondertussen nog steeds uren kwijt zijn aan handmatige offertes, mailverwerking, losse Excel-lijsten en verouderde software. Je hebt geen dure "AI-strategie" of dik adviesrapport nodig — je wilt nuchtere oplossingen die maandagochtend gewoon tijd opleveren.',
        'Ik ben Greyson Beimers, software engineer, en werk direct samen met ondernemers in Friesland. Doordat ik moderne AI slim inzet tijdens het programmeren, bouw ik automatiseringen, interne tools en moderne websites vele malen sneller en betaalbaarder dan traditionele bureaus — zonder accountmanagers of tussenlagen.',
        'Jouw bedrijfsdata blijft van jou. We richten systemen zo in dat gevoelige klant- en financiële gegevens niet in publieke trainingsmodellen terechtkomen, koppelen netjes met de pakketten die je al gebruikt, en bouwen alleen iets dat zichzelf terugbetaalt in tijdwinst of nieuwe opdrachten.',
      ],
      pillarsTitle: 'Twee manieren waarop je er direct voordeel uit haalt',
      pillarsSubtitle:
        'Heldere focus op wat in het MKB direct tijd bespaart of nieuw werk oplevert.',
      pillars: [
        {
          id: 'workflow-automation',
          tag: '01 • Uren besparen per week',
          title: 'Taken & Werkprocessen Automatiseren',
          summary:
            'Haal repeterend administratief werk bij je team weg. Van inkomende e-mails sorteren en offertes voorbereiden tot factuuropvolging en gegevens overtypen: betrouwbare automatisering pakt het routinewerk op, zodat jullie aandacht naar klanten en vakwerk gaat.',
          highlights: [
            'Automatische e-mailtriage en conceptantwoorden in jullie eigen toon',
            'Snellere offertevoorbereiding, aanvraagintake en factuurverwerking',
            'Geen nieuwe software nodig: koppelt met je bestaande mail, CRM of Excel',
          ],
        },
        {
          id: 'websites-and-apps',
          tag: '02 • Sneller & betaalbaarder live',
          title: 'Snellere, Betaalbare Websites & Apps',
          summary:
            'Moderne AI versnelt hoe een ervaren software engineer code schrijft, test en oplevert. Daardoor kosten maatwerk web-apps, klantportalen en strakke bedrijfswebsites nog maar een fractie van traditionele bureau-offertes en staan ze in dagen of weken live in plaats van maanden.',
          highlights: [
            'Maatwerk websites, aanvraagstraten en klantportalen in dagen of weken live',
            'Een fractie van klassieke bureautarieven met heldere afspraken vooraf',
            'Schone, snelle en toegankelijke code volledig in eigen beheer',
          ],
        },
      ],
      useCasesTitle: 'Concrete voorbeelden voor Friese bedrijven',
      useCasesSubtitle:
        'Geen vage beloftes, maar toepassingen die in het lokale MKB direct merkbaar werk schelen.',
      useCases: [
        {
          id: 'quotes-intake',
          category: 'Verkoop & Administratie',
          title: 'Geautomatiseerde Offertes & Klantintake',
          description:
            'Zet binnenkomende e-mails, PDF-aanvragen of formulieren binnen seconden om in een net offerteconcept en complete klantaanvraag, klaar voor jouw laatste controle.',
          example:
            'Handig voor installateurs, bouwbedrijven en groothandels met dagelijkse aanvragen.',
        },
        {
          id: 'knowledge-assistant',
          category: 'Teamproductiviteit',
          title: 'Interne AI Kennis- & Documentassistent',
          description:
            'Laat medewerkers direct vragen stellen aan eigen handleidingen, werkinstructies, oude projecten en bedrijfsregels — veilig afgeschermd op jullie eigen data.',
          example:
            'Handig voor buitendienst, binnendienst en het sneller inwerken van nieuwe collega’s.',
        },
        {
          id: 'portals-websites',
          category: 'Web & Klantbeleving',
          title: 'Maatwerk Webportalen & Moderne Websites',
          description:
            'Vervang een verouderde website of eindeloos heen-en-weer gemail door een razendsnelle website, afsprakenflow of klantportaal dat op elke telefoon fijn werkt.',
          example:
            'Handig voor bedrijven die toe zijn aan een professionele site of eigen klantportaal.',
        },
        {
          id: 'tool-integrations',
          category: 'Koppelingen',
          title: 'Bestaande Systemen & Spreadsheets Koppelen',
          description:
            'Stop met handmatig overtypen tussen Excel, boekhouding, planning en e-mail. Stille achtergrondkoppelingen houden alle lijsten en systemen automatisch synchroon.',
          example:
            'Handig voor teams die elke week uren verliezen aan dubbel invoerwerk.',
        },
      ],
      processTitle: 'Werkwijze in drie heldere stappen',
      processSubtitle:
        'Van een eerste bak koffie of belletje tot een werkende oplossing — overzichtelijk en zonder verrassingen achteraf.',
      processSteps: [
        {
          number: '01',
          tag: '01 • Vrijblijvend kennismaken',
          title: 'Vrijblijvend kennismaken',
          description:
            'We kijken samen waar jij en je team nu uren verliezen aan handwerk, of wat voor website, portaal of web-app je graag wilt neerzetten.',
        },
        {
          number: '02',
          tag: '02 • Duidelijk & betaalbaar voorstel',
          title: 'Duidelijk & betaalbaar voorstel',
          description:
            'Je krijgt vooraf een helder plan met vaste scope en een eerlijke prijs — zonder dikke adviesrapporten of verborgen bureaukosten.',
        },
        {
          number: '03',
          tag: '03 • Snel live & merkbaar resultaat',
          title: 'Snel live & merkbaar resultaat',
          description:
            'Door moderne AI slim in te zetten bij het bouwen staat jouw automatisering of site vaak al binnen dagen of enkele weken live.',
        },
      ],
      regionTitle: 'Lokaal actief in heel Friesland',
      regionSubtitle:
        'Gewoon even kennismaken aan tafel in Friesland of direct via een korte videocall — net wat jou het beste uitkomt.',
      aboutTeaser: {
        title: 'Direct samenwerken met de bouwer — wel zo duidelijk',
        summary:
          'Geen tussenlagen, verkoopteam of doorverwijzingen: je werkt rechtstreeks met Greyson Beimers. Lees meer over mijn achtergrond, waarom moderne AI software betaalbaarder maakt en hoe je direct contact legt.',
        ctaLabel: 'Lees meer over mij & contact',
      },
      aboutPage: {
        badge: 'Over Greyson Beimers • Friesland & Nederland',
        title: 'Nuchtere software & praktische AI — gebouwd in direct contact.',
        subtitle:
          'Ik help bedrijven in Friesland om repeterend werk te automatiseren en nieuwe websites of maatwerk-apps veel sneller en betaalbaarder te bouwen dan traditionele bureaus.',
        introTitle: 'Wie ik ben en waarom ik dit doe',
        introParagraphs: [
          'Ik ben Greyson Beimers, software engineer. De afgelopen tijd is het bouwen van software door AI blijvend veranderd: maatwerk websites, klantportalen en slimme koppelingen waar je vroeger maanden op moest wachten tegen hoge bureautarieven, kunnen nu schoon en betrouwbaar in dagen of weken worden gebouwd.',
          'Ondernemers in het Friese MKB horen ondertussen elke dag grote verhalen over AI, maar hebben geen tijd om uit te zoeken wat in de praktijk echt werkt. Daarom werk ik graag direct met lokale bedrijven: samen kijken waar uren weglekt of wat er beter kan, en het daarna nuchter opleveren.',
          'Geen dikke rapporten of verplichte dure abonnementen. Alleen praktische techniek die je team direct tijd scheelt en waarbij jouw bedrijfsdata veilig in eigen beheer blijft.',
        ],
        highlightsTitle: 'Waarom ondernemers voor directe samenwerking kiezen',
        highlights: [
          {
            id: 'direct-line',
            tag: '01 • Eén aanspreekpunt',
            title: 'Directe lijn met de bouwer',
            description:
              'Je schakelt rechtstreeks met de engineer die jouw automatisering of website bouwt. Korte lijntjes, snel duidelijkheid.',
          },
          {
            id: 'faster-affordable',
            tag: '02 • Eerlijk voordeel',
            title: 'Sneller & betaalbaarder door moderne AI',
            description:
              'Door moderne AI slim te combineren met degelijk programmeerwerk dalen doorlooptijd en kosten drastisch vergeleken met klassieke bureaus.',
          },
          {
            id: 'privacy-ownership',
            tag: '03 • Veilig & van jou',
            title: 'Privacy & volledig eigen beheer',
            description:
              'Geen klantgegevens in publieke trainingsmodellen en geen lock-in. Code, accounts en data blijven netjes van jouw bedrijf.',
          },
        ],
        backgroundTitle: 'Profiel & achtergrond',
        backgroundText:
          'Full-stack software engineer met ervaring in TypeScript, React, Node.js, Python, interactieve 3D-webapplicaties (WebGL / Three.js) en praktische AI- en API-automatiseringen. Werkzaam voor bedrijven in heel Friesland (o.a. Leeuwarden, Sneek, Heerenveen en Drachten) en Amsterdam.',
        skillsLabel: 'Techniek & specialismen',
        skills: [
          'TypeScript',
          'React',
          'Node.js',
          'Python',
          'AI & Automatisering',
          'WebGL / Three.js',
          'API-koppelingen',
        ],
        locationLabel: 'Werkgebied',
        locationValue: 'Friesland & Amsterdam, Nederland',
        emailLabel: 'E-mail',
        linkedinLabel: 'LinkedIn',
        backHomeLabel: 'Terug naar overzicht',
        directContactTitle: 'Rechtstreeks contact opnemen',
        directContactSubtitle:
          'Liever even mailen of verbinden via LinkedIn? Stuur gerust een bericht.',
        ctaTitle: 'Vrijblijvend even sparren of kennismaken?',
        ctaSubtitle:
          'Vul hieronder kort je vraag in of mail rechtstreeks naar grey.beimers@gmail.com. Je krijgt snel en eerlijk antwoord.',
      },
      form: {
        title: 'Laten we vrijblijvend kijken wat bij jou tijd scheelt',
        subtitle:
          'Vertel kort wat er speelt in je bedrijf. Je krijgt rechtstreeks antwoord van Greyson — geen verkooptrechter, wel eerlijk advies over wat haalbaar en betaalbaar is.',
        nameLabel: 'Naam',
        namePlaceholder: 'Bijv. Jan de Vries',
        companyLabel: 'Bedrijf / Organisatie',
        companyPlaceholder: 'Bijv. Installatiebedrijf Fryslân',
        contactLabel: 'E-mailadres of telefoonnummer',
        contactPlaceholder: 'naam@bedrijf.nl of 06-...',
        interestLabel: 'Waar kunnen we je het beste bij helpen?',
        interestOptions: [
          'Taken & werkprocessen automatiseren',
          'Nieuwe website of maatwerk web-app',
          'Bestaande tools & spreadsheets koppelen',
          'Vrijblijvend sparren over praktische AI',
        ],
        messageLabel: 'Korte toelichting',
        messagePlaceholder:
          'Waar verlies je nu de meeste tijd aan, of wat wil je graag laten bouwen?',
        submitButton: 'Open e-mailbericht',
        copyFallbackButton: 'Kopieer bericht & e-mailadres (grey.beimers@gmail.com)',
        copiedNotice: 'Bericht en grey.beimers@gmail.com gekopieerd naar klembord.',
        directEmailNote:
          'Liever zelf een mail sturen? Mail rechtstreeks naar grey.beimers@gmail.com.',
        submittedTitle: 'Je e-mailprogramma wordt geopend',
        submittedDescription:
          'Gebruik je webmail in de browser en opent er niets automatisch? Kopieer het ingevulde bericht met één klik hieronder.',
        validationError:
          'Vul je naam, contactgegevens en een korte toelichting in voordat je verstuurt.',
      },
      footer: {
        note: 'Greyson Beimers — Praktische AI, automatisering & maatwerk software voor Friesland.',
        aboutLinkLabel: 'Over Greyson & contact',
      },
    },
    en: {
      nav: {
        brand: 'GREYSON AUTOMATION',
        homeLabel: 'Home',
        servicesLabel: 'Services',
        useCasesLabel: 'Use Cases',
        processLabel: 'How It Works',
        aboutLabel: 'About Me',
        contactLabel: 'Contact',
        dashboardLabel: 'Dashboard',
        languageLabel: 'Select language',
      },
      sections: {
        services: {
          number: '01',
          eyebrow: '01 • Services & Solutions',
        },
        useCases: {
          number: '02',
          eyebrow: '02 • Practical Use Cases',
        },
        process: {
          number: '03',
          eyebrow: '03 • How It Works & Our Approach',
        },
        about: {
          number: '04',
          eyebrow: '04 • About Me',
        },
        contact: {
          number: '05',
          eyebrow: '05 • Contact',
        },
      },
      hero: {
        badge: 'Friesland • AI & Workflow Automation',
        title: 'Practical AI & faster software for local businesses in Friesland.',
        subtitle:
          'AI is advancing fast, and most of the headlines are noisy hype. Underneath that noise, the tools are now genuinely capable of real work: saving your team hours of repetitive admin, or building custom websites and web apps in days instead of months — at a fraction of traditional agency quotes.',
        primaryCta: 'Start a conversation',
        secondaryCta: 'See practical examples',
      },
      storyTitle: 'Why this matters right now — without the sales pitch',
      storyParagraphs: [
        'If you run an SME in Friesland, you hear about AI every day while your team still loses hours every week to manual quotes, inbox sorting, messy spreadsheets, and outdated software. You do not need a grand "AI strategy" or an expensive consultancy deck — you need practical tools that quietly save time starting Monday morning.',
        'I am Greyson Beimers, a software engineer working directly with local business owners across Friesland. Because modern AI accelerates how I write, test, and ship code, I build custom automations, internal tools, and fast websites far quicker and more affordably than traditional agencies — with zero middlemen.',
        'Your business data stays yours. We keep sensitive customer and financial records out of public training models, connect cleanly to the tools your team already relies on, and only build what clearly pays for itself in saved hours or new customers.',
      ],
      pillarsTitle: 'Two direct ways this helps your business',
      pillarsSubtitle:
        'Focused on practical improvements that either free up weekly team hours or ship custom software faster.',
      pillars: [
        {
          id: 'workflow-automation',
          tag: '01 • Save Hours Weekly',
          title: 'Task & Workflow Automation',
          summary:
            'Eliminate repetitive admin, email triage, quoting, invoicing, and manual data entry so your team focuses on real work. Reliable background workflows handle the busywork while keeping you in full control.',
          highlights: [
            'Automatic inbox triage and draft replies matched to your tone',
            'Faster quote preparation, customer intake, and invoice follow-ups',
            'No rip-and-replace: connects to your existing email, CRM, or Excel',
          ],
        },
        {
          id: 'websites-and-apps',
          tag: '02 • Faster & Fairly Priced',
          title: 'Faster, More Affordable Websites & Apps',
          summary:
            'Because modern AI accelerates software engineering, custom web apps, client portals, and modern websites now cost a fraction of traditional agency quotes and launch in days or weeks instead of months.',
          highlights: [
            'Custom websites, booking flows, and client portals launched in days or weeks',
            'A fraction of traditional agency pricing with clear upfront scope',
            'Clean, fast, accessible code you fully own — zero template lock-in',
          ],
        },
      ],
      useCasesTitle: 'Concrete use cases for local companies',
      useCasesSubtitle:
        'Grounded, everyday improvements built around how regional teams actually work.',
      useCases: [
        {
          id: 'quotes-intake',
          category: 'Sales & Admin',
          title: 'Automated Quotes & Customer Intake',
          description:
            'Turn incoming emails, PDF attachments, or web inquiries into structured quote drafts and clean customer records in seconds, ready for your quick final review.',
          example:
            'Built for installers, trades, contractors, and B2B suppliers with daily quote requests.',
        },
        {
          id: 'knowledge-assistant',
          category: 'Team Productivity',
          title: 'Internal AI Knowledge & Document Assistant',
          description:
            'Let staff search manuals, safety guidelines, past projects, and company policies in plain Dutch or English — kept private on your own company documents.',
          example:
            'Built for field crews, service desks, and growing teams onboarding new staff.',
        },
        {
          id: 'portals-websites',
          category: 'Web & Customer Experience',
          title: 'Custom Web Portals & Modern Websites',
          description:
            'Replace an outdated site or endless email threads with a fast website, intake flow, or customer portal that works cleanly on every phone and desktop.',
          example:
            'Built for local businesses ready for a modern online presence or self-service portal.',
        },
        {
          id: 'tool-integrations',
          category: 'Integrations',
          title: 'Connecting Existing Tools & Spreadsheets',
          description:
            'Stop copy-pasting between Excel, accounting software, scheduling tools, and email. Quiet background integrations keep every system accurately in sync.',
          example:
            'Built for teams losing hours every week to manual re-typing across separate tools.',
        },
      ],
      processTitle: 'How it works in three clear steps',
      processSubtitle:
        'From an informal coffee or quick call to a working solution — transparent scope and zero agency overhead.',
      processSteps: [
        {
          number: '01',
          tag: '01 • Free intro chat',
          title: 'No-obligation intro chat',
          description:
            'Together we look at where your team loses hours to manual work today, or what website, portal, or custom web app you want to launch.',
        },
        {
          number: '02',
          tag: '02 • Clear & affordable proposal',
          title: 'Clear & affordable proposal',
          description:
            'You get a plain-language plan with fixed scope and transparent pricing upfront — no bloated slide decks or surprise agency fees.',
        },
        {
          number: '03',
          tag: '03 • Fast launch & real results',
          title: 'Fast launch & real results',
          description:
            'By pairing modern AI with solid software engineering, your automation or website goes live in days or weeks instead of months.',
        },
      ],
      regionTitle: 'Working locally across Friesland',
      regionSubtitle:
        'Happy to meet over coffee at your office in Friesland or start with a quick call — whatever works best for you.',
      aboutTeaser: {
        title: 'Collaborate directly with the engineer building your tools',
        summary:
          'No middlemen, sales funnels, or rotating account managers: you work directly with Greyson Beimers. Read about my background, why AI makes custom software far more affordable, and how to get in touch.',
        ctaLabel: 'Read more about me & contact',
      },
      aboutPage: {
        badge: 'About Greyson Beimers • Friesland & Netherlands',
        title: 'Grounded software & practical AI — built in direct collaboration.',
        subtitle:
          'I help businesses in Friesland automate repetitive work and ship custom websites or web apps far faster and more affordably than traditional agencies.',
        introTitle: 'Who I am and why I work this way',
        introParagraphs: [
          'I am Greyson Beimers, a software engineer. Modern AI has permanently changed how software is built: custom websites, client portals, and reliable integrations that used to take months and hefty agency budgets can now be engineered cleanly in days or weeks.',
          'Meanwhile, most SME owners in Friesland mostly see loud AI headlines without time to sort out what actually works. That is why I partner directly with local companies: look honestly at where hours are wasted or what needs building, then deliver something reliable.',
          'No bloated consultancy decks or forced retainers. Just practical engineering that saves your team time starting right away, while keeping your business data safely under your own control.',
        ],
        highlightsTitle: 'Why local owners work directly with me',
        highlights: [
          {
            id: 'direct-line',
            tag: '01 • Direct access',
            title: 'Direct line to the engineer',
            description:
              'You talk straight to the engineer writing your automation or website. Short communication lines, fast decisions.',
          },
          {
            id: 'faster-affordable',
            tag: '02 • Real cost edge',
            title: 'Faster & more affordable with modern AI',
            description:
              'Combining modern AI workflows with seasoned software engineering cuts delivery time and project cost drastically versus traditional agencies.',
          },
          {
            id: 'privacy-ownership',
            tag: '03 • Safe & yours',
            title: 'Privacy & full ownership',
            description:
              'Your company records stay out of public training models, with zero lock-in. Code, integrations, and accounts stay yours.',
          },
        ],
        backgroundTitle: 'Profile & background',
        backgroundText:
          'Full-stack software engineer focused on TypeScript, React, Node.js, Python, interactive 3D web applications (WebGL / Three.js), and dependable API & AI workflow automations. Working with companies across Friesland (Leeuwarden, Sneek, Heerenveen, Drachten) and Amsterdam.',
        skillsLabel: 'Core stack & specialties',
        skills: [
          'TypeScript',
          'React',
          'Node.js',
          'Python',
          'AI & Automation',
          'WebGL / Three.js',
          'API Integrations',
        ],
        locationLabel: 'Location',
        locationValue: 'Friesland & Amsterdam, Netherlands',
        emailLabel: 'Email',
        linkedinLabel: 'LinkedIn',
        backHomeLabel: 'Back to overview',
        directContactTitle: 'Reach out directly',
        directContactSubtitle:
          'Prefer to email directly or connect on LinkedIn? Both are always open.',
        ctaTitle: 'Want to explore what is possible?',
        ctaSubtitle:
          'Fill in the short note below or email grey.beimers@gmail.com directly. You will get an honest reply within one business day.',
      },
      form: {
        title: 'Let’s look at what saves your team time',
        subtitle:
          'Share briefly what you are looking to simplify or build. You get a direct reply from Greyson — no sales funnel, just honest engineering advice on scope and cost.',
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
          'Where does your team lose the most time right now, or what would you like to build?',
        submitButton: 'Open email draft',
        copyFallbackButton: 'Copy message & email (grey.beimers@gmail.com)',
        copiedNotice: 'Message and grey.beimers@gmail.com copied to clipboard.',
        directEmailNote:
          'Prefer to email directly? Write anytime to grey.beimers@gmail.com.',
        submittedTitle: 'Opening your email app',
        submittedDescription:
          'Using webmail in your browser and nothing opened? Copy the pre-filled message below with one click.',
        validationError:
          'Please enter your name, contact details, and a short message before continuing.',
      },
      footer: {
        note: 'Greyson Beimers — Practical AI, workflow automation & custom software for Friesland.',
        aboutLinkLabel: 'About Greyson & contact',
      },
    },
  },
} as const;

export type AutomateConfig = typeof automateConfig;
