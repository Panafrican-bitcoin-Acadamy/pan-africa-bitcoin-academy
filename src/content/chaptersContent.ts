// Chapter content definitions for Pan-Africa Bitcoin Academy
// All chapters (1-20) with full detailed content, notes, tips, warnings, examples, and image placeholders

export type ChapterCallout = {
  type: "note" | "tip" | "warning" | "example";
  content: string;
};

export type ChapterImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type ChapterSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  callouts?: ChapterCallout[];
  images?: ChapterImage[];
};

export type ChapterContent = {
  slug: string;
  number: number;
  title: string;
  level: string;
  duration: string;
  type: "Theory" | "Practice" | "Mixed";
  hook: string;
  learn: string[];
  sections: ChapterSection[];
  activities: string[];
  summary: string[];
  keyTerms: string[];
  nextSlug?: string;
};

export const chaptersContent: ChapterContent[] = [
  {
    slug: "the-nature-of-money",
    number: 1,
    title: "The Nature of Money",
    level: "Beginner",
    duration: "45–60 min",
    type: "Theory",
    hook: "Money fixes barter’s double coincidence of wants, turning local swaps into markets.",
    learn: [
      "Why money emerged to solve barter limits",
      "Medium of exchange, store of value, unit of account",
      "Properties of sound money: durability, portability, divisibility, recognizability, scarcity",
      "How trust underpins money and trade",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Imagine waking up in a world without money. You have bananas, but you're craving bread. You walk to the baker and offer him your bananas. The baker frowns and says, 'I don't want bananas today, I want shoes.'",
          "Now you're stuck. To get bread, you must first find a shoemaker who wants bananas, trade with him, and then go back to the baker with shoes. This back-and-forth feels exhausting and uncertain. This problem has a name: the 'double coincidence of wants.' Both sides must want exactly what the other has, at the same time, in the correct quantity.",
          "This is why humans invented money. Not because they admired shiny coins or pretty paper, but because cash solved the headache of trade. Money became the bridge — a universal tool that allowed people to exchange value without endless searching or awkward swaps.",
        ],
        images: [
          {
            src: "/images/book_images/bannana-bread.png",
            alt: "Man exchanging bananas for shoes with baker",
            caption: "The exchange process in barter trade",
          },
          {
            src: "/images/book_images/banana-shoes.png",
            alt: "Man with bananas desiring shoes, facing baker with bread",
            caption: "You have bananas but the baker wants shoes",
          },
          {
            src: "/images/book_images/bannana.png",
            alt: "Man holding only bananas",
            caption: "You have bananas but need bread",
          },
          {
            src: "/images/book_images/barter_system.png",
            alt: "Circular diagram showing bananas, bread, and shoes in barter system",
            caption: "The barter system requires a double coincidence of wants",
          },
          {
            src: "/images/book_images/shoes-bread.png",
            alt: "Man with shoes, facing baker with bread",
            caption: "Finally, you can trade shoes for bread",
          },
        ],
      },
      {
        heading: "1.1 Why Humans Created Money",
        paragraphs: [
          "In the earliest communities, people survived through barter trade. They exchanged cattle for salt, beads for grain, or iron tools for cloth. But barter was clumsy. Imagine trying to pay your rent with cassava or buying a motorbike with goats!",
          "As villages grew and trade stretched across regions, people needed something that everyone would accept. Societies turned to special items: shells, salt, beads, and eventually precious metals like gold and silver. These worked because they were widely trusted, didn't rot easily, and could be carried in your pocket.",
          "In Africa, cowrie shells became a common currency. In other places, silver and gold coins took center stage. Later, banks issued paper notes backed by those metals. Over centuries, money kept evolving — but its purpose stayed the same: to make trade easier, faster, and more reliable.",
          "Without money, economies would remain tiny and local. With money, people could build markets, cities, and eventually global trade. Money was the invisible thread that tied human progress together.",
        ],
        callouts: [
          {
            type: "example",
            content: "In Africa, cowrie shells became a common currency. In other places, silver and gold coins took center stage.",
          },
        ],
      },
      {
        heading: "1.2 Functions of Money — Medium of Exchange, Store of Value, Unit of Account",
        paragraphs: [
          "Money isn't just paper or numbers on a screen. It has three powerful functions that make it unique:",
          "Together, these functions explain why money is far more than paper. It is the organizer of trade, savings, and planning in every society.",
        ],
        bullets: [
          "Medium of Exchange: Money removes the need for awkward bartering. Instead of finding someone who both wants your maize and has what you need, you can sell maize for money, then later buy anything else.",
          "Store of Value: Good money allows you to save for the future. If you work hard today, you want your earnings to keep their value tomorrow. But when money loses value, savings can vanish overnight.",
          "Unit of Account: Money provides a standard measure for prices. Instead of saying, 'one goat equals five chickens or three baskets of millet,' you simply say, 'one goat is 150,000 shillings.' This makes trade clear, simple, and consistent.",
        ],
        callouts: [
          {
            type: "example",
            content: "In Uganda today, you don't exchange sugarcane directly for airtime. You sell the sugarcane for shillings and use the shillings to buy airtime.",
          },
          {
            type: "warning",
            content: "Zimbabwe once experienced such extreme inflation that a loaf of bread cost billions of Zimbabwean dollars. People who saved in cash lost everything. Even in Uganda, the shilling has weakened against the US dollar, making imported goods more expensive year after year.",
          },
        ],
        images: [
          {
            src: "/images/book_images/money_usage.png",
            alt: "Illustration showing the three functions of money: Medium of Exchange, Store of Value, and Unit of Account",
            caption: "The three essential functions of money",
          },
        ],
      },
      {
        heading: "1.3 Properties of Sound Money",
        paragraphs: [
          "Not all money is equally valid. Some forms of money fail quickly, while others stand the test of time. The best money has certain properties that make it reliable:",
        ],
        bullets: [
          "Durable – It should last. Gold and silver survive centuries. Salt or maize spoil.",
          "Portable – It should be easy to carry. A pocket full of coins beats dragging a cow around.",
          "Divisible – You should be able to split it into smaller parts. A shilling can be divided into coins, but you can't divide a cow without losing its value.",
          "Recognizable – People should instantly know it's real and not fake.",
          "Scarce – If it's too easy to create, it loses value. Gold was rare, which made it precious.",
        ],
        callouts: [
          {
            type: "note",
            content: "When money has these qualities, people trust it. Without trust, money collapses, and trade falls apart. That's why history is full of failed currencies, and also why societies continue to search for stronger, more stable money.",
          },
        ],
        images: [
          {
            src: "/images/book_images/durable_money.png",
            alt: "Illustration showing durable money - money that lasts over time",
            caption: "Durable: Money should last. Gold and silver survive centuries",
          },
          {
            src: "/images/book_images/portable.png",
            alt: "Illustration showing portable money - easy to carry",
            caption: "Portable: Easy to carry and move around",
          },
          {
            src: "/images/book_images/divsible.png",
            alt: "Illustration showing divisible money - can be split into smaller parts",
            caption: "Divisible: Split into smaller parts without losing value",
          },
          {
            src: "/images/book_images/recognazable.png",
            alt: "Illustration showing recognizable money - people know it's real",
            caption: "Recognizable: Easy to identify as genuine",
          },
        ],
      },
    ],
    activities: [
      "Class Questions on 'What is Money?' (Open discussion – no wrong answers):",
      "• If money were to disappear tomorrow, how would people in your community trade?",
      "• Look around you: what item could work as money, and why?",
      "• Do you think your country's money is a good store of value? Why or why not?",
      "• Why do people still trust paper notes, even though they are no longer backed by gold or silver?",
      "• In your own words: What is money to you?",
    ],
    summary: [
      "Money solves the 'double coincidence of wants' problem that makes barter inefficient.",
      "Money has three essential functions: medium of exchange, store of value, and unit of account.",
      "Sound money must be durable, portable, divisible, recognizable, and scarce.",
      "Trust is the foundation of any monetary system — without it, money fails.",
      "Money enabled human progress by scaling trade from local to global markets.",
    ],
    keyTerms: [
      "Double coincidence of wants",
      "Medium of exchange",
      "Store of value",
      "Unit of account",
      "Durable",
      "Portable",
      "Divisible",
      "Recognizable",
      "Scarce",
    ],
    nextSlug: "the-journey-of-money",
  },
  {
    slug: "the-journey-of-money",
    number: 2,
    title: "The Journey of Money",
    level: "Beginner",
    duration: "45–60 min",
    type: "Theory",
    hook: "From shells to paper to fiat, each step tried to fix the limits of the last.",
    learn: [
      "Limits of barter and rise of commodity money",
      "How coinage improved portability and standards",
      "Why paper notes replaced metal",
      "Fiat’s trust-and-inflation trade-offs",
      "Cryptographic precursors to Bitcoin",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Money hasn't always been in the form of coins in your pocket, paper in your wallet, or numbers glowing on a phone screen. The story of money is a long, winding journey — shaped by human needs, survival, and the drive for creativity. It began with simple village trades, grew through precious metals and paper notes, and eventually arrived at the modern fiat currencies we know today.",
          "Each stage of this journey was not random. People kept asking the same question: How can we trade more easily, save value safely, and connect with others across distance and time? The answers they found slowly transformed money into the global force it is today.",
        ],
      },
      {
        heading: "2.1 From Barter to Commodity Exchange",
        paragraphs: [
          "Long before banks or cash, life depended on barter trade. A farmer might trade maize for fish, or a potter might swap clay pots for salt. This worked — but only when luck was on your side. Both parties had to want what the other had, at the same time, and in the right quantity.",
          "But imagine: the fisherman doesn't need maize today. Or the potter wants a goat, not pots. Suddenly, you're stuck. Barter made trade slow and frustrating. Communities could only grow as far as their local exchanges allowed.",
          "So people began to use commodities as common ground. These were items that everyone valued, not just a few. In East Africa, cowrie shells became a trusted medium. In other places, salt, spices, and even cattle served this role. These commodities became the earliest forms of money because they were widely useful, recognizable, and trusted.",
          "For the first time, trade became smoother — not perfect, but better than endless searching.",
        ],
        images: [
          {
            src: "/images/book_images/salt_bartering.jpg",
            alt: "Illustration showing salt bartering - an early form of commodity exchange",
            caption: "Salt was used as an early form of commodity money",
          },
          {
            src: "/images/book_images/massie_market.jpg",
            alt: "Illustration showing a marketplace where commodity exchange took place",
            caption: "Marketplaces facilitated commodity exchange",
          },
        ],
      },
      {
        heading: "2.2 Coinage and Precious Metals",
        paragraphs: [
          "As trade expanded between regions, people faced a new problem: carrying sacks of salt or herds of cows was impractical. They needed something more durable, portable, and easy to measure.",
          "This need gave rise to metal money. Gold and silver stood out as natural candidates. They were rare, beautiful, didn't rust, and could be divided into smaller pieces.",
          "Across the world, civilizations began to mint coins. In Africa, the Kingdom of Aksum (present-day Ethiopia and Eritrea) struck its own coins centuries ago, trading with neighboring kingdoms and even faraway merchants. Coins made it possible for traders from different lands to agree on a universal measure of value.",
          "For the first time, money could travel long distances in your pocket, linking villages, kingdoms, and eventually continents.",
        ],
        images: [
          {
            src: "/images/book_images/aksum_coins.jpg",
            alt: "Ancient Aksum coins from Ethiopia and Eritrea",
            caption: "Aksum coins enabled trade across regions",
          },
          {
            src: "/images/book_images/aksum_coins_2.jpg",
            alt: "Close-up of Aksum coinage showing detailed minting",
            caption: "A closer look at Aksum coinage",
          },
        ],
      },
      {
        heading: "2.3 Paper Money and Banknotes",
        paragraphs: [
          "As trade and wealth grew, another problem emerged: carrying too many coins was risky and heavy. Thieves, wars, and the difficulty of transporting large amounts made merchants uneasy.",
          "The solution came from trusted goldsmiths. People deposited their gold with them for safekeeping and in return received paper receipts. These receipts soon began to circulate as money, because everyone trusted they could be redeemed for real gold later.",
          "Governments noticed and eventually took over this system, issuing official banknotes backed by gold. A piece of paper no longer just symbolized money — it was money, because it represented a specific weight of gold.",
          "This shift was revolutionary. Trade became lighter, faster, and safer. Merchants across the world could accept a note, knowing it had gold behind it.",
        ],
        images: [
          {
            src: "/images/book_images/chinese_first_fiat_money.jpg",
            alt: "Jiaozi (交子) - the first fiat currency from ancient China",
            caption: "Jiaozi (交子) - the first fiat currency",
          },
        ],
      },
      {
        heading: "2.4 The Rise of Fiat Currencies",
        paragraphs: [
          "But history took another turn. In 1971, the United States ended the gold standard, meaning the dollar was no longer tied to gold. Other countries soon followed. From then on, most world currencies became fiat money.",
          "Fiat means 'by decree.' In other words, money was now valuable simply because governments declared it so — not because it was backed by a scarce resource like gold. Central banks could create more whenever they needed.",
          "This change gave governments new flexibility to respond to wars, recessions, or crises. But it also created risks. With no natural limit, money supplies grew rapidly, often leading to inflation.",
        ],
        bullets: [
          "In Zimbabwe during the late 2000s, inflation spiraled so badly that a loaf of bread cost trillions of Zimbabwean dollars.",
          "In Uganda, the shilling has steadily lost value compared to the US dollar. A family that once bought imported goods cheaply now needs far more shillings for the same items.",
        ],
        callouts: [
          {
            type: "warning",
            content: "The lesson: fiat money can be useful, but it also depends heavily on trust in governments and central banks. When that trust weakens, the money itself weakens.",
          },
        ],
        images: [
          {
            src: "/images/book_images/american_dollar.png",
            alt: "American dollar - a modern fiat currency",
            caption: "The US dollar became a fiat currency after 1971",
          },
          {
            src: "/images/book_images/american_note.png",
            alt: "American banknote showing fiat currency design",
            caption: "American banknotes represent fiat money backed by government decree",
          },
        ],
      },
      {
        heading: "2.5 Precursors to Bitcoin — Haber & Stornetta Time-Stamping (1991–92)",
        paragraphs: [
          "Long before Bitcoin, a quiet breakthrough took place. In 1991–92, two researchers, Stuart Haber and W. Scott Stornetta, invented a system to time-stamp digital documents. Their idea was simple but powerful: once a document was recorded, no one could change it without leaving evidence.",
          "They used cryptography to make records permanent and tamper-proof — a kind of digital 'seal of authenticity.' Though their invention wasn't money, it planted a seed. It demonstrated that technology can create trust without the need for central authorities.",
          "Years later, Satoshi Nakamoto built on these ideas to launch Bitcoin in 2009. However, the roots of Bitcoin can be traced back to Haber and Stornetta's time-stamping system.",
        ],
        callouts: [
          {
            type: "note",
            content: "This early cryptographic work showed that trust could be created through mathematics and code, rather than relying solely on institutions.",
          },
        ],
      },
    ],
    activities: [
      "Timeline of Money (Open Discussion):",
      "• Imagine living in a world without money. How would you trade for food, clothes, or transport?",
      "• What items in your community could work as money if paper money disappeared tomorrow?",
      "• Can you think of stories from your family or country about times when money lost its value, like inflation in Uganda or Zimbabwe?",
      "• Looking at the timeline from barter → commodities → coins → paper → fiat → digital, which stage do you think was the most revolutionary? Why?",
      "• Do you think Bitcoin and other digital currencies are the next step in this journey? Why or why not?",
    ],
    summary: [
      "Money evolved through stages: barter, commodities, coins, paper, and fiat — each solving the limits of the previous.",
      "Commodity money (shells, salt, metals) emerged to solve barter's matching problem.",
      "Coins standardized value and enabled long-distance trade across regions.",
      "Paper money lightened trade but required gold backing for trust.",
      "Fiat money (post-1971) relies on government decree, creating inflation risks when trust weakens.",
      "Early cryptographic work (Haber & Stornetta) showed technology could create trust without central authorities, paving the way for Bitcoin.",
    ],
    keyTerms: [
      "Commodity money",
      "Fiat money",
      "Inflation",
      "Time-stamping",
      "Gold standard",
      "Central bank",
      "Cryptography",
    ],
    nextSlug: "problems-with-traditional-fiat-money",
  },
  {
    slug: "problems-with-traditional-fiat-money",
    number: 3,
    title: "Problems with Traditional (Fiat) Money",
    level: "Beginner",
    duration: "40–50 min",
    type: "Theory",
    hook: "Fiat is convenient but quietly erodes savings, fairness, and trust.",
    learn: [
      "How inflation shrinks purchasing power",
      "Centralized control over money supply and access",
      "Financial exclusion and inequality",
      "System fragility in crises",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "By now, we've seen how money evolved from barter, to shells, to gold coins, to paper, and finally to fiat currencies — the shillings, dollars, euros, and pounds we use today. Fiat money made life easier in many ways. It's light, easy to carry, and accepted almost everywhere.",
          "However, fiat money also has problems — serious ones that impact how people live, save, and envision their future. Many of these problems are hidden, unfolding slowly over years, while others strike suddenly in times of crisis. To understand why new forms of money like Bitcoin matter, we first need to look honestly at what's broken in the system we rely on today.",
        ],
      },
      {
        heading: "3.1 Inflation and Loss of Purchasing Power",
        paragraphs: [
          "One of the biggest problems with fiat money is inflation.",
          "Inflation means that over time, the same amount of money buys you less. Think of your grandparents' stories: 'Back in the day, bread cost only a few shillings!' Today, that same loaf may cost hundreds or thousands of shillings. The money hasn't changed in appearance, but its power has shrunk.",
          "There are two ways to think about inflation:",
        ],
        bullets: [
          "Monetary inflation occurs when governments or central banks print more money, thereby increasing the money supply.",
          "Price inflation (CPI): When the prices of goods and services rise, it is often because the money supply has grown too much.",
        ],
        callouts: [
          {
            type: "example",
            content: "By the late 2000s, in Zimbabwe, people carried wheelbarrows of notes to buy groceries. Prices doubled within hours. In Uganda, inflation has been slower, but steady — meaning that your shillings today buy much less than they did 20 or 30 years ago.",
          },
          {
            type: "warning",
            content: "Inflation quietly eats away at savings. A farmer who keeps money under the mattress finds that after years, it buys less fertilizer, less fuel, or less school fees for the children.",
          },
        ],
        images: [
          {
            src: "/images/book_images/animals.png",
            alt: "Animals used in barter trade",
            caption: "",
          },
          {
            src: "/images/book_images/arrow.png",
            alt: "Arrow indicating progression",
            caption: "",
          },
          {
            src: "/images/book_images/animals.png",
            alt: "Animals used in barter trade",
            caption: "",
          },
          {
            src: "/images/book_images/zimbabwe_inflation.png",
            alt: "Zimbabwe hyperinflation showing wheelbarrows of money",
            caption: "",
          },
          {
            src: "/images/book_images/zimbabwe_money.png",
            alt: "Zimbabwean currency during hyperinflation",
            caption: "",
          },
        ],
      },
      {
        heading: "3.2 Centralized Control — Governments and Banks",
        paragraphs: [
          "Another challenge is that fiat money is controlled by a few powerful institutions. Governments and central banks decide:",
          "Commercial banks hold most people's money, but they can also restrict access — freezing accounts, setting withdrawal limits, or charging high fees.",
          "This centralized control means ordinary citizens have very little say. If leaders mismanage money, everyone suffers. For example, when governments print more to cover debts or fund wars, citizens pay the price through inflation and instability.",
        ],
        bullets: [
          "How much money to print?",
          "What interest rates to set?",
          "Who gets bailed out when crises hit?",
        ],
        images: [
          {
            src: "/images/book_images/printed_money.jpg",
            alt: "Printed money showing government control over currency",
            caption: "",
          },
          {
            src: "/images/book_images/printing_money.jpg",
            alt: "Money printing process showing centralized control",
            caption: "",
          },
        ],
      },
      {
        heading: "3.3 Financial Exclusion and Inequality",
        paragraphs: [
          "Fiat systems also leave many people out. In some countries, millions don't have access to a bank account. Without one, it's hard to save safely, receive payments, or access loans.",
          "Even for those who do, the system often favors the wealthy. Big corporations and elites get easier access to credit, lower interest rates, and rescue packages when they fail. Meanwhile, ordinary people struggle with high fees, loan rejections, and poor service.",
          "This deepens inequality. The rich have tools to protect themselves — diversifying into real estate, stocks, or foreign currency. The poor often watch their money lose value year after year.",
        ],
      },
      {
        heading: "3.4 Fragility of the Current System",
        paragraphs: [
          "Finally, fiat money systems are fragile. They look strong on the surface, but history shows they can collapse under stress.",
          "Banking crises, currency crashes, and debt defaults have happened again and again across the world. In 2008, the global financial system nearly collapsed, saved only by massive government bailouts. In countries like Lebanon, Sri Lanka, or Venezuela, banks limited withdrawals, and people's life savings vanished overnight.",
          "This fragility raises a painful question: If money is supposed to be the safest thing we own, why does it break so often?",
        ],
        callouts: [
          {
            type: "warning",
            content: "In countries like Lebanon, Sri Lanka, or Venezuela, banks limited withdrawals, and people's life savings vanished overnight.",
          },
        ],
      },
    ],
    activities: [
      "Class Discussion: 'Do We Trust Our Money?' (Open discussion – no wrong answers):",
      "• Do you think the money in your pocket will hold its value in 10 years? Why or why not?",
      "• Have you or your family experienced rising prices that made life harder? What was that like?",
      "• Do you believe banks and governments always act in the people's best interest when it comes to money? Why or why not?",
      "• If you could design a better money system, what would it look like?",
    ],
    summary: [
      "Inflation is a stealth tax that erodes purchasing power over time, destroying savings.",
      "Centralized control by governments and banks means ordinary citizens have little say in monetary policy.",
      "Financial exclusion leaves millions without access to banking, while the system favors the wealthy.",
      "Fiat systems are fragile and can collapse in crises, as seen in 2008 and various currency crises.",
      "These problems create the need for alternatives like Bitcoin that offer decentralization and fixed supply.",
    ],
    keyTerms: [
      "Inflation",
      "Monetary inflation",
      "Price inflation (CPI)",
      "Centralization",
      "Central bank",
      "Financial exclusion",
      "Bailout",
      "Purchasing power",
      "Fragility",
    ],
    nextSlug: "from-crisis-to-innovation",
  },
  {
    slug: "from-crisis-to-innovation",
    number: 4,
    title: "From Crisis to Innovation",
    level: "Beginner",
    duration: "30–40 min",
    type: "Theory",
    hook: "Broken trust in money opened the door to decentralized alternatives.",
    learn: [
      "Why cypherpunks pushed for private, free money",
      "How the 2008 crisis catalyzed Bitcoin",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "As we've seen in the previous chapters, the old financial system carried deep flaws that set the stage for Bitcoin's creation. Inflation steadily reduced the purchasing power of money, making everyday life more difficult — a parent in Kampala who once bought a full bag of sugar with 10,000 UGX might now only get half, while in Zimbabwe, runaway inflation forced people to carry wheelbarrows of cash just for bread.",
          "At the same time, governments around the world sank deeper into debt, with wealthy nations owing more than their entire economies, and developing countries struggling to repay loans at the expense of schools, hospitals, and roads. This combination of shrinking savings, rising inequality, and eroding trust revealed why the old system was failing — and why a new, decentralized alternative like Bitcoin became not just an idea, but a necessity.",
        ],
      },
      {
        heading: "4.1 The Cypherpunks & Early Digital Currencies → Satoshi's Breakthrough",
        paragraphs: [
          "In the 1990s, a group of computer rebels called cypherpunks saw the danger. They believed that if money stayed in the hands of governments and banks, privacy and freedom would vanish. They started experimenting with digital cash:",
          "Then came 2008. The global financial crisis hit. Banks collapsed, people lost homes, and governments bailed out the very institutions that caused the mess.",
          "At that exact moment, someone named Satoshi Nakamoto released a whitepaper describing Bitcoin — a new form of money without banks, governments, or middlemen.",
          "It was the first time in history that humans had digital money that no one could shut down, inflate, or control.",
        ],
        bullets: [
          "DigiCash (David Chaum) — early digital money, but it required a central company.",
          "E-gold — backed by gold, but was shut down by governments.",
          "Hashcash (Adam Back) — created as a way to fight email spam, but its 'proof of work' idea later inspired Bitcoin mining.",
        ],
        callouts: [
          {
            type: "note",
            content: "The cypherpunk movement combined cryptography, privacy advocacy, and libertarian ideals to create tools that would protect individual freedom from state control.",
          },
        ],
      },
    ],
    activities: [
      "End-of-Chapter Reflection:",
      "• Why do you think cypherpunks cared so much about privacy and freedom in money?",
    ],
    summary: [
      "The old financial system's failures — inflation, debt, inequality — created the conditions for Bitcoin's emergence.",
      "Cypherpunks in the 1990s experimented with digital cash but early attempts were either centralized or shut down.",
      "The 2008 financial crisis exposed the fragility of the traditional system and created the perfect moment for Bitcoin.",
      "Satoshi Nakamoto's breakthrough solved the problem of creating decentralized, trustless digital money.",
    ],
    keyTerms: [
      "Cypherpunk",
      "DigiCash",
      "E-gold",
      "Hashcash",
      "Proof of work",
      "Financial crisis",
      "Decentralization",
    ],
    nextSlug: "the-birth-of-bitcoin",
  },
  {
    slug: "the-birth-of-bitcoin",
    number: 5,
    title: "The Birth of Bitcoin",
    level: "Beginner",
    duration: "40–50 min",
    type: "Theory",
    hook: "In 2008’s chaos, Bitcoin introduced money no one can unilaterally control.",
    learn: [
      "2008 financial crisis context",
      "Satoshi’s whitepaper and anonymity",
      "Peer-to-peer electronic cash pillars",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Every great invention in history is born out of necessity. The wheel solved the problem of moving heavy loads. Electricity spread because people wanted light after sunset. The internet grew because humans wanted faster communication across the world.",
          "In the same way, Bitcoin was not created as a hobby project or a passing trend — it was born out of a global financial crisis that shook the world in 2008. This chapter tells the story of how Bitcoin emerged, who initiated it, and what made it unlike any other form of money that came before.",
        ],
      },
      {
        heading: "5.1 The 2008 Financial Crisis Context",
        paragraphs: [
          "In 2008, the world was struck by one of the biggest financial disasters in modern history. At the center of it were banks. For years, banks in the United States had been lending recklessly, giving out mortgages (home loans) to people who could not realistically repay them. These risky loans were packaged and sold around the world as if they were safe investments.",
          "When borrowers began defaulting, the house of cards collapsed. Huge banks that were considered 'too big to fail' were suddenly on the brink of bankruptcy. Panic spread across the globe.",
          "Governments rushed in to save the financial system, but their solution was to print trillions of new dollars and bail out the very banks that had caused the crisis. Ordinary people, however, received no lifeline. Families lost homes, jobs vanished overnight, and pensions and savings were wiped out.",
          "Imagine working hard for years, saving for your children's education — only to see that value evaporate because of mistakes made by bankers in distant boardrooms. This wasn't just a financial crisis. It was a trust crisis. People realized that the money system itself could be manipulated, and when it failed, ordinary citizens bore the heaviest burden.",
          "From this broken trust, a new idea was born.",
        ],
        images: [
          {
            src: "/images/book_images/US-Median-Home-Prices.jpg",
            alt: "US median home prices showing the impact of the 2008 financial crisis",
            caption: "US median home prices during the 2008 financial crisis",
          },
          {
            src: "/images/book_images/2008.jpg",
            alt: "2008 financial crisis - banks collapsing, people losing homes",
            caption: "The 2008 financial crisis exposed the fragility of the banking system",
          },
        ],
      },
      {
        heading: "5.2 Satoshi Nakamoto and the Whitepaper",
        paragraphs: [
          "On October 31, 2008 — right in the middle of the chaos — a mysterious figure (or group) named Satoshi Nakamoto sent an email to a small community of cryptographers. Attached was a 9-page document titled:",
          "'Bitcoin: A Peer-to-Peer Electronic Cash System.'",
          "No one knew who Satoshi was. Was it a man? A woman? A team? A government whistleblower? To this day, the true identity remains one of the internet's greatest mysteries.",
          "But what mattered was the idea inside the whitepaper. For the first time, someone had designed a form of money that didn't depend on banks, governments, or corporations. It was digital, global, and secure. Anyone, anywhere, could use it without asking permission.",
          "For the Cypherpunks — a group of privacy advocates and computer scientists who had been dreaming of digital money since the 1990s — this was the breakthrough they had been waiting for. Previous attempts, such as DigiCash, e-gold, and Hashcash, had failed, either because they were centralized or because governments shut them down.",
          "But Bitcoin was different. Satoshi's invention solved the hardest problem: how to create digital money that no one could forge, freeze, or control.",
        ],
        callouts: [
          {
            type: "note",
            content: "Satoshi's anonymity was likely intentional — to prevent governments from targeting the creator and to let the technology speak for itself. [Download the Bitcoin Whitepaper](https://bitcoin.org/bitcoin.pdf) to read the original 9-page document.",
          },
        ],
      },
      {
        heading: "5.3 Bitcoin as Peer-to-Peer Electronic Cash",
        paragraphs: [
          "So, how does Bitcoin work?",
          "Instead of a bank keeping the ledger (a record of who owns what), Bitcoin uses a public ledger called the blockchain. This ledger is stored and updated by thousands of computers all over the world. Anyone can see it, but no one can secretly change it.",
          "When you send Bitcoin, you don't need a bank's approval. You simply use your private key to sign the transaction, proving it's yours. The network checks it, confirms it, and adds it to the blockchain. Once confirmed, it can't be reversed or erased.",
          "This makes Bitcoin truly peer-to-peer electronic cash — just like handing over cash in person, but now possible over the internet, instantly, across borders, without middlemen.",
          "But Bitcoin was not just another type of money. It introduced three revolutionary features:",
          "For the first time in history, humanity had a tool to store and transfer value without relying on trust in powerful institutions.",
        ],
        bullets: [
          "Decentralization — no central bank or company controls it.",
          "Transparency — every transaction is recorded publicly.",
          "Scarcity — only 21 million bitcoins will ever exist, making it immune to the endless money-printing that causes inflation.",
        ],
      },
    ],
    activities: [
      "Activity: Reading a Simplified Whitepaper Excerpt",
      "Excerpt (simplified from Satoshi's whitepaper):",
      "'A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another without going through a financial institution.'",
      "Class Prompt for Discussion:",
      "• What problem is Satoshi trying to solve here?",
      "• In 2008, many people lost their savings due to bank failures. Do you think your community would have understood Bitcoin at that time?",
      "• Why do you think Satoshi chose to remain anonymous? Was it for safety, philosophy, or mystery?",
      "• Do you believe people today trust Bitcoin more than their local currency? Why or why not?",
    ],
    summary: [
      "Bitcoin was born from the 2008 financial crisis, which exposed the fragility of the traditional banking system.",
      "Satoshi Nakamoto's whitepaper introduced a revolutionary form of peer-to-peer electronic cash.",
      "Bitcoin's three key features are decentralization, transparency, and fixed scarcity (21 million).",
      "The blockchain replaces banks as the ledger, with cryptographic keys proving ownership.",
      "For the first time, humanity had a tool to store and transfer value without relying on trust in powerful institutions.",
    ],
    keyTerms: [
      "Blockchain",
      "Private key",
      "Public key",
      "Scarcity",
      "Decentralization",
      "Whitepaper",
      "Peer-to-peer",
      "Satoshi Nakamoto",
    ],
    nextSlug: "keys-and-transactions",
  },
  {
    slug: "keys-and-transactions",
    number: 6,
    title: "Keys and Transactions",
    level: "Beginner",
    duration: "45–60 min",
    type: "Mixed",
    hook: "Ownership is math: keys and signatures authorize every spend.",
    learn: [
      "Public/private keys and digital signatures",
      "Transaction flow from creation to confirmation",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "If you have a house, you lock it with a key. Only you can open the door, because you own the key. Bitcoin works similarly. Instead of a physical key, it uses digital keys — long strings of numbers and letters — that prove ownership. But how do these keys allow us to send Bitcoin safely over the internet, where anyone could try to cheat?",
          "The answer lies in digital signatures, a kind of mathematical stamp that proves, beyond doubt, that a transaction is real and belongs to you.",
          "In this chapter, we'll explore how Bitcoin utilizes keys and signatures to ensure that money cannot be stolen, copied, or forged.",
        ],
      },
      {
        heading: "Seed Phrase Example",
        paragraphs: [
          "A seed phrase is the most important part of your Bitcoin wallet. It is a list of 12 or 24 simple words that create and control your bitcoin. These words are not a password and they are not stored on the internet. Whoever has the seed phrase can fully access and spend the bitcoin in that wallet. This is why a seed phrase must be written down offline, kept private, and never shared with anyone.",
          "You should never take a screenshot of your seed phrase, store it in your phone, send it on WhatsApp, email, or cloud storage. Legitimate wallet apps, teachers, or support teams will never ask for your seed phrase. If you lose your phone but still have your seed phrase, you can recover your wallet on a new device. If someone else gets your seed phrase, they can take your bitcoin and there is no way to reverse it.",
          "In Bitcoin, there is no \"forgot password\" button and no customer support that can help you recover lost funds. Your seed phrase is your money, and protecting it is your responsibility. Treat it like physical cash or gold—once it's gone, it's gone.",
          "Example of a 24-word seed phrase:\n1. adult    7. absorb    13. adapt    19. address\n2. ahead    8. alert    14. airport    20. account\n3. alarm    9. absurd    15. acquire    21. accuse\n4. agent    10. achieve    16. ability    22. acid\n5. aisle    11. action    17. about    23. acoustic\n6. alien    12. age    18. absent    24. across",
        ],
        callouts: [
          {
            type: "warning",
            content: "If someone gets your seed phrase, they can take your coins without asking. Never share it, photograph it, or store it digitally.",
          },
          {
            type: "tip",
            content: "Write your seed phrase on paper, check spelling twice, and store it in a safe place where fire, water, and curious eyes can't reach.",
          },
        ],
        images: [],
      },
      {
        heading: "6.1 Public/Private Keys Explained Simply",
        paragraphs: [
          "Think of your Bitcoin wallet as a mailbox:",
          "This system is based on cryptography, but you don't need to be a mathematician to grasp the idea. Just remember:",
        ],
        bullets: [
          "The public key is like your mailbox address. Anyone can know it, and people use it to send you Bitcoin.",
          "The private key is like the key that opens the mailbox. Only you should have it. If you lose it, you lose access to your Bitcoin forever.",
          "Together, these keys form the heart of Bitcoin security:",
          "Your private key allows you to sign transactions (like writing your signature on a cheque).",
          "The public key allows others to verify that the signature is genuine.",
          "Public = address for receiving.",
          "Private = proof of ownership.",
        ],
        callouts: [
          {
            type: "warning",
            content: "If you lose your private key, you lose access to your Bitcoin forever. There is no recovery. This is why backing up your seed phrase is critical.",
          },
        ],
        images: [],
      },
      {
        heading: "6.2 Peer-to-Peer Transactions (P2P)",
        paragraphs: [
          "So how does a Bitcoin transaction actually happen? Let's follow the steps:",
          "This peer-to-peer process is what makes Bitcoin powerful: no bank, no government, and no middleman—just cryptography and consensus.",
        ],
        bullets: [
          "Creating the Transaction – Alice wants to send 0.01 BTC to Bob. She opens her wallet app, enters Bob's public address, and signs the transaction with her private key.",
          "Broadcasting – The signed transaction is sent out to the Bitcoin network (like announcing to the whole world: 'I'm sending this money to Bob').",
          "Verification – Thousands of computers (called nodes) verify the signature against Alice's public key to ensure its valid and not a forgery. If it checks out, the transaction is considered legitimate.",
          "Confirmation – Miners collect valid transactions into blocks. Once Alice's transaction is added to a block and confirmed by the network, it becomes permanent. No one can erase it, no one can double-spend it.",
        ],
        images: [
          {
            src: "/images/book_images/p2p.jpg",
            alt: "Diagram showing the flow: Alice creates transaction → broadcasts → nodes verify → miners confirm",
            caption: "Peer-to-peer transaction flow",
          },
        ],
      },
    ],
    activities: [
      "Activity: Role-play a Bitcoin Transaction",
      "This is a fun way to make the process real for students.",
      "Setup:",
      "• Choose 5–6 volunteers to act out different roles.",
      "• Give each role a simple prop:",
      "  - Alice (sender) — a piece of paper labeled 'Private Key.'",
      "  - Bob (receiver) — a paper labeled 'Public Key/Address.'",
      "  - Verifiers (2–3 students) — 'Network Nodes.'",
      "  - Miner — 'Block Builder.'",
      "Steps:",
      "1. Alice creates a transaction: She writes on paper: 'I want to send 0.01 BTC to Bob,' then 'signs' it with her private key.",
      "2. Broadcast: She hands it to the 'network.'",
      "3. Verification: The network students check if Alice's private key matches her public key. If valid, they shout: 'Transaction approved!'",
      "4. Miner: The miner collects the approved transaction and tapes it to a big sheet labeled 'Block.'",
      "5. Final Confirmation: The class now sees that Alice's payment is locked into the blockchain.",
    ],
    summary: [
      "Bitcoin uses public/private key cryptography to prove ownership and authorize transactions.",
      "Public keys are like mailbox addresses — anyone can send Bitcoin to them.",
      "Private keys are like mailbox keys — only the owner should have them.",
      "Transactions flow: create → sign → broadcast → verify → confirm.",
      "The peer-to-peer network verifies transactions without banks or middlemen.",
    ],
    keyTerms: [
      "Private key",
      "Public key",
      "Digital signature",
      "Node",
      "Miner",
      "Broadcast",
      "Verification",
      "Confirmation",
    ],
    nextSlug: "blockchain-basics",
  },
  {
    slug: "blockchain-basics",
    number: 7,
    title: "Blockchain Basics",
    level: "Beginner",
    duration: "45–60 min",
    type: "Theory",
    hook: "Blocks are linked pages; change one and you break the chain.",
    learn: [
      "Blocks, hashes, chaining",
      "Immutability and tamper-evidence",
      "Role of miners and Proof of Work",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Imagine you and your friends are keeping a notebook where you write down who owes whom money. At first, it seems simple: whenever someone pays or borrows, you record it. But soon, problems appear. What if someone erases a line? What if someone changes the numbers later to make themselves look richer? Who is supposed to guard the notebook so nobody cheats?",
          "Blockchain is a clever solution to this problem. It's like a special notebook that everyone shares, where the pages are locked together in such a way that nobody can secretly change them. Each page represents a 'block,' and when all the pages are linked, we get a 'blockchain.'",
        ],
      },
      {
        heading: "7.0 What Is a Block?",
        paragraphs: [
          "A block is like one page in this shared notebook. On it, you'll find a list of transactions — basically, records of who sent money to whom. But there's something extra: each block also contains a unique code called a hash, along with a link to the block that came before it. This design is what makes blockchain so secure. If anyone tries to change even a single line in one block, its hash will change too. And since the next block depends on the old hash, the entire chain would instantly cease to match. In other words, the blocks lock each other in place like puzzle pieces, making history nearly impossible to rewrite.",
        ],
        images: [
          {
            src: "/images/block-structure.png",
            alt: "Diagram showing block structure: transactions, hash, previous block hash",
            caption: "Structure of a Bitcoin block",
          },
        ],
      },
      {
        heading: "7.1 Why Hashes Matter",
        paragraphs: [
          "The hash is the secret ingredient that keeps blockchain tamper-proof. You can think of it like a fingerprint for information. No two pieces of information share the same fingerprint, and even the tiniest change — like switching one letter in a sentence — completely changes the fingerprint. Because every block depends on the hash of the block before it, the blockchain is quick to expose tampering. If someone alters a block, all the fingerprints after it no longer fit.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Think of hashes like a fingerprint: even a tiny change creates a completely different hash, making tampering immediately obvious.",
          },
        ],
        images: [
          {
            src: "/images/hash-fingerprint.png",
            alt: "Diagram showing how a tiny change in data creates a completely different hash",
            caption: "Hashes are like fingerprints - tiny changes create completely different results",
          },
        ],
      },
      {
        heading: "7.2 Why It's Called a Chain",
        paragraphs: [
          "The term 'blockchain' comes from the way blocks are connected. Each new block points back to the one before it, forming a long chain of history. Block 2 points to Block 1, Block 3 points to Block 2, and so on. This simple design makes the entire system extremely strong. If someone wanted to change something profound in the past, they wouldn't just have to fix that one block — they would need to rebuild every block after it as well. For all practical purposes, that's impossible.",
        ],
        images: [
          {
            src: "/images/why_chain.jpg",
            alt: "Diagram showing blocks linked in a chain, each pointing to the previous block",
            caption: "Blocks linked in a chain - each depends on the previous",
          },
        ],
      },
      {
        heading: "7.3 Who Adds the Blocks?",
        paragraphs: [
          "New blocks don't appear by magic; they are added by people called miners. Miners gather fresh transactions and bundle them into a block. To seal the block, they solve a math puzzle that requires time and computing power. Once a miner finds the correct solution, the block is locked in place and added to the chain, and everyone else on the network updates their copy of the notebook. This process, known as Proof of Work, ensures that no one can cheaply rewrite history — it's always far easier to be honest than to try to cheat.",
        ],
      },
      {
        heading: "7.4 Why Blockchain Matters",
        paragraphs: [
          "The beauty of the blockchain is that it makes history permanent. Once something is written, it cannot be erased or quietly edited later. That means we no longer need a middleman like a bank or a government official to 'guarantee' the records. Instead, the security comes from math, from the way the blocks are linked, and from the shared effort of the network. Cheating is expensive, while honesty comes naturally. This is what makes Bitcoin possible — a financial system where the rules are written in code, not controlled by a single authority.",
        ],
        callouts: [
          {
            type: "note",
            content: "Blockchain's immutability means that once a transaction is confirmed, it becomes part of permanent history that cannot be altered.",
          },
        ],
        images: [],
      },
    ],
    activities: [
      "Activity: Build a Human Blockchain",
      "To really understand how it works, imagine each student in a classroom is a block. Each one holds a piece of paper with a few fake transactions written down, plus a made-up 'hash' — maybe just a random number. The first student starts with a hash of '0000,' and every student after that writes the hash of the block before them at the top of their paper. Then they all connect with a string or by holding hands, forming a 'human blockchain.' Now, if one student changes a transaction on their paper, the hash no longer matches the one that the next student wrote down—the whole chain breaks.",
      "This simple game shows why blockchain is so powerful: once something is written into the chain, changing it without everyone noticing is almost impossible.",
    ],
    summary: [
      "A block contains transactions, a hash, and a link to the previous block.",
      "Hashes act like fingerprints — any change creates a completely different hash.",
      "Blocks are chained together, making it nearly impossible to alter past transactions.",
      "Miners add new blocks by solving Proof of Work puzzles.",
      "Blockchain creates tamper-evident, permanent history without needing a central authority.",
    ],
    keyTerms: [
      "Block",
      "Hash",
      "Proof of Work",
      "Immutability",
      "Blockchain",
      "Miner",
      "Tamper-evident",
    ],
    nextSlug: "exchange-software-wallet",
  },
  {
    slug: "exchange-software-wallet",
    number: 8,
    title: "Software Wallet & Exchange",
    level: "Beginner",
    duration: "60–75 min",
    type: "Practice",
    hook: "Exchanges are bridges; wallets are keys—withdraw and own your coins.",
    learn: [
      "How exchanges work and why to withdraw",
      "Create a software wallet and back up the seed",
      "Send/receive first transaction; fee basics",
      "Privacy starters: address reuse, VPN, local-first",
    ],
    sections: [
      {
        heading: "8.0 What Is an Exchange? How to Acquire Bitcoin (centralized on-ramp)",
        paragraphs: [
          "Imagine a bustling bus station where people arrive with various currencies and depart with tickets to new destinations. A centralized crypto exchange works like that station. It matches buyers and sellers, shows a price, and lets you swap your local money for bitcoin. Because it involves banks and national payment rails, an exchange typically requests identity documents. This is called KYC (Know Your Customer). It can feel annoying, but it's how these companies follow the law and keep their bank accounts open.",
          "For a first purchase, think small—an amount you would be comfortable losing if you make a mistake. Fees matter, so check both the explicit fee and the 'spread' (the hidden difference between buy and sell prices). The safest rhythm for beginners is simple: buy a small amount, withdraw to your own wallet, and confirm that it arrived before buying more. That last step—moving coins off the exchange—teaches the core lesson of Bitcoin: if you don't hold the keys, you're only renting access. Treat the exchange like a temporary bridge, not a home.",
          "If you live in a place where exchanges are limited, people often use peer-to-peer marketplaces, money-transfer shops, or trusted community meetups. These methods can work, but they add human risk. Meet in public places, bring a friend, and never let anyone rush you. Bitcoin is global and fast, but your decisions should be slow and deliberate.",
        ],
        callouts: [
          {
            type: "warning",
            content: "If you don't hold the keys, you're only renting access. Always withdraw your Bitcoin from exchanges to your own wallet.",
          },
          {
            type: "tip",
            content: "For first purchases, start small. Buy a small amount, withdraw to your wallet, and confirm it arrived before buying more.",
          },
        ],
        images: [
          {
            src: "/images/book_images/exchange.png",
            alt: "Diagram showing exchange flow: local currency → exchange → Bitcoin → withdraw to wallet",
            caption: "Exchange flow: buy Bitcoin, then withdraw to your own wallet",
          },
          {
            src: "/images/book_images/exchange2.jpg",
            alt: "Exchange interface and wallet withdrawal process",
            caption: "Exchange interface and withdrawal process",
          },
        ],
      },
      {
        heading: "8.1 Software Signer (mobile/desktop): create wallet, seed backup",
        paragraphs: [
          "A Bitcoin 'wallet' is really two things: a signer and a notebook. The signer is the part that holds your secret—your private keys—and uses them to sign transactions. The notebook is the interface that helps you see balances and create payments. Many apps bundle both into one, so we simply refer to it as a wallet.",
          "Creating a wallet feels like opening a new lockbox. The app will generate a seed phrase—usually 12 or 24 simple words. Those words are the master key to every present and future address your wallet will create. Write them carefully on paper, check the spelling, and store the paper where fire, water, and curious eyes can't reach. Don't take photos, don't put the words in cloud storage, and don't paste them into chat apps. If someone gets that phrase, they can take your coins without asking. If you lose it and your phone dies, no company can help you recover—Bitcoin is a bearer asset.",
        ],
        callouts: [],
        images: [],
      },
      {
        heading: "8.2 Complete a First Transaction (send/receive)",
        paragraphs: [
          "On Bitcoin, coins don't 'move' like a physical object—instead, the global ledger updates to reflect your signed instruction. To receive, your wallet will show you a fresh address—often as both text and a QR code. Share that with the sender. Good wallets avoid address reuse by generating a new one each time; this helps protect your privacy because reused addresses create an easy trail.",
          "To send, you paste or scan the recipient's address, enter the amount, and choose a network fee. Fees go to miners and vary with network traffic. Low fees may confirm slowly; higher fees confirm faster. Your wallet will propose a sensible default—don't be shy to accept it while you learn. After you hit send, the transaction is broadcast to the network. Within seconds, other nodes can see it. A miner then bundles it into a block, and once confirmed, it becomes part of Bitcoin's permanent history. The first confirmation is usually enough for small payments. For larger amounts, people wait for more confirmations.",
          "If anything looks wrong, pause. Check the first and last few characters of the address, and check the amount unit (BTC vs sats). When in doubt, do a tiny 'test send' first. A careful habit today saves tears tomorrow.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Always do a small test send first when sending to a new address. Check the first and last few characters of the address carefully.",
          },
          {
            type: "warning",
            content: "Check the amount unit (BTC vs sats). Sending 1 BTC when you meant 1 sat is a costly mistake.",
          },
        ],
      },
      {
        heading: "8.3 Privacy Basics (VPN, address reuse awareness, local-first tools)",
        paragraphs: [
          "Bitcoin is public by design. That transparency is a strength, but it also means careless habits can expose your financial life. Start with the basics. Avoid reusing addresses; most wallets handle this automatically. Be mindful when posting screenshots or sharing transaction IDs—those breadcrumbs can be linked together. Using a reputable VPN on untrusted Wi-Fi can protect your internet traffic from local snoops, though it does not make your on-chain transactions private. Think of a VPN like curtains on a window: helpful, but not a brick wall.",
          "Where possible, prefer 'local-first' features. A wallet that can verify transactions using simplified proofs (SPV) or your own node leaks less data to third-party servers than one that requires you to send every detail to a company. If that sounds advanced, don't worry; you can start simple and grow into it. The key idea is to develop the habit of asking, 'Who learns something about me when I click this button?' Good tools minimize that answer.",
          "Finally, protect your identity on the exchange side. SIM-swap fraud and email takeovers are common. Use an authenticator app for 2FA instead of SMS, set strong, unique passwords, and keep recovery emails safe. Privacy is not one switch; it's a posture—a collection of small, steady choices.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Use an authenticator app for 2FA instead of SMS to protect against SIM-swap attacks.",
          },
          {
            type: "note",
            content: "Privacy is not one switch; it's a posture—a collection of small, steady choices.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Testnet Walkthrough — 'Buy' mock sats → send to class wallets",
      "Activity: Create and Explore a Wallet (Mock Exercise):",
      "1. Create a Wallet – Students write down a 12-word seed phrase (provided or generated). Explain that this seed is the master key.",
      "2. Generate Addresses – From the seed, students create a few mock addresses. Discuss why wallets use new addresses for privacy.",
      "3. Receive Coins – The Instructor assigns each student a mock balance. Students 'receive' coins at one of their addresses.",
      "4. Send Coins – Students 'send' a portion of their balance to a classmate's address, noting from/to addresses, amount, and fee. Explain how real transactions are signed with private keys.",
      "5. Recover Wallet – Students erase their mock wallet and restore it using the seed. Confirm balances and addresses reappear.",
    ],
    summary: [
      "Exchanges are bridges to acquire Bitcoin, but always withdraw to your own wallet.",
      "Seed phrases are the master key—write them on paper, never digitally, and practice recovery.",
      "Use a new address for each receive to protect privacy.",
      "Always verify addresses and do test sends when uncertain.",
      "Privacy is built through small, consistent habits: avoid address reuse, use VPN on untrusted networks, prefer local-first tools.",
    ],
    keyTerms: [
      "Exchange",
      "KYC (Know Your Customer)",
      "Seed phrase",
      "Passphrase",
      "Address reuse",
      "Fee",
      "Testnet",
      "VPN",
      "2FA",
      "SPV",
    ],
    nextSlug: "utxos-fees-coin-control",
  },
  {
    slug: "utxos-fees-coin-control",
    number: 9,
    title: "UTXOs, Fees & Coin Control",
    level: "Intermediate",
    duration: "50–60 min",
    type: "Practice",
    hook: "Your balance is a pile of UTXO coins; choosing inputs changes fees and privacy.",
    learn: [
      "UTXO model vs account model",
      "Fees depend on size (vbytes), not amount",
      "When and why to consolidate",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "When you open your Bitcoin wallet, you usually just see a single number: your balance. But under the hood, Bitcoin doesn't actually work like a simple bank account. Instead, it uses something called the UTXO model — short for Unspent Transaction Outputs. You can think of these UTXOs like individual coins in your pocket. Some are big, some are small, and together they add up to your total balance.",
          "Whenever you spend Bitcoin, you don't just 'subtract' money from your balance like a bank would. Instead, you pick specific UTXOs to spend, and if the one you use is larger than what you owe, you get change back — just like paying for a coffee with a $20 bill. This difference between 'account balances' and 'coin outputs' is one of the most important (and often misunderstood) parts of how Bitcoin works.",
        ],
      },
      {
        heading: "9.0 What You Really Own — The UTXO Model",
        paragraphs: [
          "Each time you receive Bitcoin, it arrives as a new UTXO. You can imagine each UTXO as a digital coin with a fixed value stamped on it. For example, if someone sends you 0.015 BTC, that creates one coin of exactly 0.015 BTC in your wallet. If another person sends you 0.003 BTC, that's another coin.",
          "When you make a payment, your wallet selects one or more of these coins to spend. If the total is bigger than the amount you need, your wallet automatically creates a 'change output' and sends the leftover Bitcoin back to a new address you control. This way, every spend creates new UTXOs for the receiver and often one for yourself. Ownership in Bitcoin, then, really means owning the right to spend specific UTXOs.",
        ],
        images: [
          {
            src: "/images/book_images/utxo.png",
            alt: "Diagram showing UTXOs as individual coins that make up your balance",
            caption: "UTXOs are like individual coins in your wallet",
          },
        ],
      },
      {
        heading: "9.1 Fees and Input Selection",
        paragraphs: [
          "Unlike credit card payments or bank transfers, Bitcoin transaction fees aren't based on the amount of money being sent. Instead, fees are determined by the size of the transaction in virtual bytes (vB). More inputs and outputs make a transaction larger, and larger transactions cost more to include in the blockchain.",
          "Here's where input selection matters:",
          "Most wallets automatically choose inputs for you, but understanding this process helps you save money on fees and keep better control over your privacy.",
        ],
        bullets: [
          "If you use many small UTXOs to pay, the transaction grows bigger, and fees increase.",
          "If you use fewer, larger UTXOs, the transaction is smaller and cheaper, but you may reveal more information about your balance.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Fees depend on transaction size (vbytes), not the amount being sent. A transaction sending 0.001 BTC can cost the same as one sending 1 BTC if they're the same size.",
          },
        ],
      },
      {
        heading: "9.2 UTXO Management & When to Consolidate",
        paragraphs: [
          "Managing your UTXOs is like deciding which coins to carry in your pocket. If you always keep lots of small coins, paying exact amounts is easy — but your wallet becomes heavy, and when you finally spend them all at once, it takes more effort. In Bitcoin, too many small UTXOs can lead to high fees later because each one adds weight to a transaction.",
          "On the other hand, keeping only a few large UTXOs makes spending simpler but can hurt your privacy, since large outputs make your payments more identifiable. That's where consolidation comes in. Consolidation means combining many small UTXOs into a single one, usually when fees are cheap. It's like exchanging a handful of coins for a single bill at the bank. The trick is choosing the right time to consolidate so you stay efficient without overspending on fees.",
        ],
        callouts: [
          {
            type: "note",
            content: "Consolidate during low-fee periods to save money. But be aware that consolidating can link your UTXOs together, potentially reducing privacy.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Plan a Spend from a UTXO Set",
      "To see how this works, students can practice with a mock wallet. Each group gets a sheet of paper with several UTXOs of different sizes (e.g., 0.002 BTC, 0.005 BTC, 0.01 BTC). The task is to make a payment of, say, 0.007 BTC to a merchant.",
      "• Which UTXOs should they pick?",
      "• How much change will they get back?",
      "• How many inputs and outputs will the transaction have, and what will the fee look like?",
      "Once everyone has a plan, groups compare strategies. Some will pick the exact match, while others will use a bigger UTXO and take change. The discussion highlights the trade-offs between fee savings, privacy, and future flexibility. By the end, students see that every Bitcoin payment involves small but important decisions — and that UTXO management is a key skill for responsible Bitcoin use.",
    ],
    summary: [
      "Bitcoin uses the UTXO model, not account balances — you own specific digital coins.",
      "Each receive creates a new UTXO; spending selects UTXOs and creates change.",
      "Fees depend on transaction size (vbytes), not the amount being sent.",
      "Too many small UTXOs increase fees; too few large ones reduce privacy.",
      "Consolidation combines UTXOs efficiently, but timing and privacy matter.",
    ],
    keyTerms: [
      "UTXO",
      "Unspent Transaction Output",
      "Input",
      "Output",
      "Change",
      "vBytes",
      "Consolidation",
      "Transaction size",
    ],
    nextSlug: "good-bitcoin-hygiene",
  },
  {
    slug: "good-bitcoin-hygiene",
    number: 10,
    title: "Good Bitcoin Hygiene",
    level: "Intermediate",
    duration: "40–50 min",
    type: "Practice",
    hook: "Small habits—fresh addresses, labels, coin control—protect privacy and sanity.",
    learn: [
      "Use a new receive address and verify on device",
      "Label transactions/UTXOs for clarity",
      "Avoid harmful merges and address reuse",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Owning Bitcoin safely isn't just about storing it in a wallet — it's also about developing strong habits. Just like brushing your teeth or washing your hands protects your health, following good Bitcoin hygiene protects your privacy, security, and long-term control of your funds. These small practices, when done consistently, make it much harder for attackers, trackers, or mistakes to compromise your Bitcoin.",
        ],
      },
      {
        heading: "10.0 New Receive Address Each Time; Verify on the Device",
        paragraphs: [
          "One of the most important habits is to use a fresh receiving address for every payment you receive. Reusing the same address again and again allows outsiders to link all of your transactions together, which can compromise your privacy. By generating a new address each time, you make it much harder for anyone to see how much Bitcoin you own or how you're spending it.",
          "But addresses themselves can be targets for attacks. Malicious software, for example, could swap your real address with one that belongs to a hacker. That's why it's critical to always verify the receiving address on your hardware wallet or secure device screen before sharing it. If the address on your device matches the one in your wallet app, you know it hasn't been tampered with. This simple double-check adds a powerful layer of protection.",
        ],
        callouts: [
          {
            type: "warning",
            content: "Malicious software can swap your receiving address. Always verify the address on your hardware device screen before sharing it.",
          },
          {
            type: "tip",
            content: "Most modern wallets automatically generate a new address for each receive. Make sure your wallet has this feature enabled.",
          },
        ],
      },
      {
        heading: "10.1 Labeling Transactions and UTXOs for Future Spending",
        paragraphs: [
          "Another good habit is labeling. Every time you receive Bitcoin, you're actually creating a UTXO — a digital 'coin' in your wallet. Without context, it's easy to forget where that coin came from or what it was meant for. By labeling transactions (for example, 'Payment from Alice for tutoring' or 'Savings transfer'), you create a financial journal that helps you stay organized.",
          "Labeling UTXOs makes it easier to decide later which ones are safe to spend and which ones you may want to hold. It also helps if you need to audit your funds, review your history, or prepare records. Think of it as writing notes in the margins of your Bitcoin notebook — it keeps things clear and avoids confusion down the road.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Label transactions immediately when you receive them. Future you will thank present you for the clarity.",
          },
        ],
      },
      {
        heading: "10.2 Basic Privacy Habits (Avoid Reuse; Payment Flow Awareness)",
        paragraphs: [
          "Privacy in Bitcoin isn't just about using new addresses — it's also about how you combine and move your coins. For example, if you take two unrelated UTXOs and spend them together in one transaction, anyone looking at the blockchain can link those coins and assume they belong to the same person. That may not seem like a big deal, but over time it can reveal patterns about your finances.",
          "Good hygiene means thinking carefully about payment flows. Avoid reusing addresses, minimize combining unrelated funds, and be mindful that each transaction leaves a trace. By practicing these habits, you reduce the chances of someone piecing together your financial life from the blockchain.",
        ],
        callouts: [
          {
            type: "warning",
            content: "Combining unrelated UTXOs in one transaction links them together on the blockchain, potentially revealing your financial patterns.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Hygiene Checklist Audit on a Demo Wallet",
      "To make these ideas practical, students can perform a Hygiene Checklist Audit on a demo wallet. Together, they review the transaction history to see:",
      "• Was a new address used for every incoming payment?",
      "• Are transactions and UTXOs clearly labeled?",
      "• Do any payments combine unrelated coins in ways that reduce privacy?",
    ],
    summary: [
      "Use a new receiving address for every payment to protect privacy.",
      "Always verify addresses on your hardware device screen to prevent address-swap attacks.",
      "Label transactions and UTXOs to maintain clarity and organization.",
      "Avoid combining unrelated UTXOs in single transactions to protect privacy.",
      "Good Bitcoin hygiene is built through consistent small habits.",
    ],
    keyTerms: ["Address reuse", "Coin control", "Labeling", "Change output"],
    nextSlug: "hardware-signers",
  },
  {
    slug: "hardware-signers",
    number: 11,
    title: "Hardware Signers",
    level: "Intermediate",
    duration: "50–60 min",
    type: "Practice",
    hook: "Hardware keeps keys offline; malware hears only static.",
    learn: [
      "Threats hardware mitigates vs hot wallets",
      "Setup, seed/backup, passphrase basics",
      "PSBT signing flow and on-device verification",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "When it comes to protecting your Bitcoin, one of the most powerful tools you can use is a hardware signer (commonly called a hardware wallet). Unlike software wallets that live on your phone or computer, hardware signers are dedicated devices built with one purpose: keeping your private keys safe. By storing your keys offline and isolating them from internet-connected devices, hardware signers significantly reduce the risks of theft, hacking, or accidental loss. In this chapter, we'll explore why these devices are essential, how to set them up correctly, and how to use them safely for transactions.",
        ],
      },
      {
        heading: "11.0 Why Hardware (Threats It Mitigates; Hot vs Cold)",
        paragraphs: [
          "A hardware wallet protects against many threats that software wallets cannot. Because your private keys never touch the internet, they're shielded from malware, viruses, phishing attacks, and even a compromised computer. This security makes hardware signers the gold standard for safeguarding long-term Bitcoin savings.",
          "It's important to understand the difference between hot wallets and cold wallets. Hot wallets are connected to the internet and offer convenience for frequent spending — like a checking account. Cold wallets, on the other hand, are kept offline, providing maximum protection for long-term storage — like a vault. A hardware signer is a practical balance between these two: it stays offline for key security but can still interact with your software wallet when you want to spend, giving you both usability and safety.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Hardware wallets are the gold standard for securing Bitcoin. They keep your private keys offline, safe from malware and hackers.",
          },
        ],
        images: [
          {
            src: "/images/book_images/jade.png",
            alt: "Jade hardware wallet device",
            caption: "Hardware wallets keep your keys offline and secure",
          },
        ],
      },
      {
        heading: "11.1 Setup, Backup, and Test Recovery (Seed vs Passphrase Basics)",
        paragraphs: [
          "When setting up a hardware wallet, the device generates a seed phrase — usually 12 or 24 words — which acts as the master key to your Bitcoin. This phrase is the single most important backup: anyone who has it can control your funds. Writing it down securely (never digitally) and storing it in a safe place is essential.",
          "For added protection, you can use a passphrase, sometimes called a '25th word.' This works like an extra password layered on top of the seed phrase. Even if someone steals your seed, they would still need your secret passphrase to access the wallet.",
          "Testing your backup is just as important as creating it. By doing a dry-run recovery on a fresh device or in recovery mode, you confirm that your seed and passphrase actually work without risking real funds. This gives you confidence that if your hardware signer is lost or destroyed, you can always recover your Bitcoin.",
        ],
        callouts: [
          {
            type: "warning",
            content: "Anyone who has your seed phrase can control your funds. Never share it, photograph it, or store it digitally.",
          },
          {
            type: "tip",
            content: "Always test your recovery before storing real Bitcoin. Wipe the device and restore from your seed phrase to confirm it works.",
          },
        ],
      },
      {
        heading: "11.2 Spending Safely with a Hardware Signer (PSBT Flow Where Applicable)",
        paragraphs: [
          "When you want to spend Bitcoin, the hardware signer ensures your private keys never leave the secure device. The transaction is first prepared on your computer or phone as a Partially Signed Bitcoin Transaction (PSBT). The unsigned transaction is then sent to the hardware signer, which securely signs it without ever exposing the keys. The signed transaction is finally returned to the computer or wallet app, ready to broadcast to the Bitcoin network.",
          "This process keeps your funds safe even if your computer is infected with malware, since the sensitive signing step happens only inside the secure hardware device. Always verify the transaction details — like addresses and amounts — directly on the device's screen before signing. This step prevents attackers from secretly changing payment details in the software.",
        ],
        callouts: [
          {
            type: "warning",
            content: "Always verify transaction details (address and amount) on the hardware device screen before signing. Malware can change details in the software.",
          },
        ],
        images: [
          {
            src: "/images/psbt-flow.png",
            alt: "Diagram showing PSBT flow: create on computer → sign on hardware → broadcast",
            caption: "PSBT flow keeps keys secure on hardware device",
          },
        ],
      },
    ],
    activities: [
      "Activity: Dry-Run Recovery + Sign a Testnet PSBT",
      "To practice safely, perform a dry-run recovery of your hardware wallet using only your seed phrase and passphrase, but without any real Bitcoin. This ensures you know how to recover funds if the device is ever lost. Next, create and sign a testnet PSBT transaction. The testnet is a version of Bitcoin with no real value, so you can experiment freely. By completing this exercise, you'll gain hands-on experience with both recovery and secure spending, ensuring you're fully prepared to manage Bitcoin confidently and safely.",
    ],
    summary: [
      "Hardware wallets keep private keys offline, protecting them from malware and hackers.",
      "Hot wallets are convenient but less secure; cold wallets are most secure but less convenient.",
      "Hardware wallets balance security and usability.",
      "Seed phrases are the master key — write them on paper, never digitally, and test recovery.",
      "Passphrases add an extra layer of security on top of the seed phrase.",
      "PSBT flow keeps signing secure on the hardware device, even if your computer is compromised.",
      "Always verify transaction details on the device screen before signing.",
    ],
    keyTerms: [
      "Hardware wallet",
      "Hardware signer",
      "PSBT",
      "Passphrase",
      "Cold storage",
      "Hot wallet",
      "Seed phrase",
      "Recovery",
    ],
    nextSlug: "verify-for-yourself-block-explorers-nodes",
  },
  {
    slug: "verify-for-yourself-block-explorers-nodes",
    number: 12,
    title: "Verify for Yourself — Block Explorers & Nodes",
    level: "Intermediate",
    duration: "60 min",
    type: "Practice",
    hook: "Don't trust—verify your own transactions and the network.",
    learn: [
      "Use explorers for txids, confirmations, fees",
      "Merkle path inclusion (conceptual)",
      "Why run a node; mempool visibility; policy/relay basics",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "One of Bitcoin's core principles is 'don't trust, verify.' This means you shouldn't rely on others to tell you what's true about your transactions or the network — you should verify it yourself. Block explorers and Bitcoin nodes are two essential tools for doing exactly that. Block explorers are websites that let you search and view Bitcoin transactions, while running your own node gives you complete independence to verify everything yourself. In this chapter, we'll explore both tools and understand when to use each.",
        ],
      },
      {
        heading: "12.0 Using a Block Explorer (Txids, Confirmations, Fees, Mempool)",
        paragraphs: [
          "A block explorer is like a search engine for the Bitcoin blockchain. You can paste in a transaction ID (txid) or address and see its history, status, and details. This is incredibly useful for checking if a payment you sent has been confirmed, how many confirmations it has, what fee was paid, and whether it's still waiting in the mempool (the pool of unconfirmed transactions).",
          "When you receive a payment, you can look up the txid on a block explorer to verify it independently of your wallet. This helps you catch errors, understand delays, and confirm that transactions are progressing as expected. Block explorers are also great for learning — you can browse recent transactions, see how fees fluctuate, and understand network activity.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Always verify transactions on a block explorer, especially for large payments. Don't rely solely on your wallet's status.",
          },
        ],
        images: [
          {
            src: "/images/block-explorer.png",
            alt: "Screenshot of block explorer showing transaction details",
            caption: "Block explorers let you verify transactions independently",
          },
        ],
      },
      {
        heading: "12.1 Proving Inclusion (Merkle Path Concept)",
        paragraphs: [
          "How can you prove that a transaction is included in a block without downloading the entire blockchain? Bitcoin uses something called a Merkle tree. Think of it like a family tree, but for transactions. Each transaction is hashed, then pairs of hashes are combined and hashed again, and this continues until you reach a single root hash at the top. This root is stored in the block header.",
          "A Merkle path (or Merkle proof) is a small set of hashes that proves your transaction is part of the tree without needing all the other transactions. By following the path from your transaction up to the root, you can mathematically prove inclusion. This is how lightweight wallets can verify transactions without storing the full blockchain — they just need the Merkle proof, not every single transaction.",
        ],
        callouts: [
          {
            type: "note",
            content: "Merkle proofs enable lightweight verification — you can prove a transaction is in a block without downloading the entire blockchain.",
          },
        ],
        images: [
          {
            src: "/images/merkle-tree.png",
            alt: "Diagram showing Merkle tree structure with transaction hashes",
            caption: "Merkle trees enable efficient transaction verification",
          },
        ],
      },
      {
        heading: "12.2 Why Run a Node (Independent Validation; Mempool Visibility; Policy/Relay Basics)",
        paragraphs: [
          "While block explorers are useful, they're run by third parties. If that third party is compromised, censored, or simply wrong, you might get incorrect information. Running your own Bitcoin node solves this problem by giving you complete independence. Your node downloads and validates the entire blockchain, checking every transaction and block according to Bitcoin's rules. No one can lie to you about what's on the blockchain because you're verifying it yourself.",
          "Your node also gives you direct access to the mempool — the pool of transactions waiting to be confirmed. This visibility helps you understand network congestion, estimate fees accurately, and see what's happening in real-time. Additionally, your node enforces your own policy rules about which transactions to relay, giving you control over what you participate in.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Running your own node is the ultimate form of Bitcoin sovereignty. You verify everything yourself, with no trusted third parties.",
          },
        ],
      },
      {
        heading: "12.3 First-Time Node Sync (Full vs Pruned/Light; Storage/Bandwidth Planning)",
        paragraphs: [
          "When you first run a Bitcoin node, it needs to download and verify the entire blockchain — currently over 500 GB of data. This initial sync can take days or weeks depending on your internet connection and hardware. You have a few options:",
          "For most users, a pruned node offers the best balance — you get full validation with much less storage. Plan ahead for the initial sync time and bandwidth usage, and don't worry about advanced configurations until you're comfortable with the basics.",
        ],
        bullets: [
          "Full node: Downloads and stores the complete blockchain. Maximum security and features, but requires significant storage (500+ GB).",
          "Pruned node: Downloads the full chain but deletes old blocks after verification, keeping only recent ones. Saves storage (about 5 GB) while maintaining full validation.",
          "Light node: Doesn't download the full chain, relies on others for some data. Less secure but uses minimal resources.",
        ],
        callouts: [
          {
            type: "tip",
            content: "A pruned node gives you full validation with minimal storage. It's the best starting point for most users.",
          },
        ],
      },
    ],
    activities: [],
    summary: [
      "Block explorers are useful tools for checking transaction status, but they're run by third parties.",
      "Merkle proofs enable lightweight verification without downloading the full blockchain.",
      "Running your own node gives you complete independence and sovereignty over verification.",
      "Nodes provide direct access to the mempool and let you enforce your own policy rules.",
      "Pruned nodes offer full validation with minimal storage requirements.",
    ],
    keyTerms: [
      "Block explorer",
      "Txid",
      "Transaction ID",
      "Confirmation",
      "Mempool",
      "Merkle path",
      "Merkle proof",
      "Full node",
      "Pruned node",
      "Light node",
    ],
    nextSlug: "proof-of-work-and-block-rewards",
  },
  {
    slug: "proof-of-work-and-block-rewards",
    number: 13,
    title: "Proof of Work and Block Rewards",
    level: "Intermediate",
    duration: "55 min",
    type: "Theory",
    hook: "PoW makes blocks hard to forge but easy to verify.",
    learn: [
      "PoW asymmetry",
      "Block rewards (3.125 BTC post-Apr 2024) and fees",
      "Halving schedule and fixed supply",
      "Subsidy timeline to 2140",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Bitcoin's security and consensus mechanism is built on something called Proof of Work (PoW). This system makes it extremely expensive to create new blocks but very easy to verify that blocks are valid. This asymmetry is what prevents attacks like double-spending and ensures everyone agrees on the same version of the blockchain. In this chapter, we'll explore how Proof of Work functions, how miners are rewarded, and how Bitcoin's fixed supply schedule creates predictable monetary policy.",
        ],
      },
      {
        heading: "13.0 Proof of Work (Asymmetry: Costly to Create, Trivial to Verify)",
        paragraphs: [
          "Proof of Work is like a cryptographic puzzle that miners must solve to create a new block. The puzzle requires finding a number (called a nonce) that, when combined with the block's data and hashed, produces a result below a certain target. This process requires enormous computational power — miners must try trillions of different numbers until they find one that works. The difficulty adjusts automatically so that, on average, a new block is found every 10 minutes.",
          "The genius of Proof of Work is its asymmetry: creating a valid block is extremely expensive (requiring massive amounts of electricity and specialized hardware), but verifying that a block is valid is trivial (any computer can check the hash in milliseconds). This makes it economically irrational to attack the network — the cost of creating a fraudulent block far exceeds any potential gain, and the network will reject invalid blocks instantly.",
        ],
        callouts: [
          {
            type: "note",
            content: "Proof of Work makes attacks economically irrational. The cost of creating a fraudulent block far exceeds any potential gain.",
          },
        ],
        images: [
          {
            src: "/images/proof-of-work.png",
            alt: "Diagram showing miners solving cryptographic puzzles to create blocks",
            caption: "Proof of Work requires expensive computation but easy verification",
          },
        ],
      },
      {
        heading: "13.1 Miners and Block Rewards (New Coins + Fees)",
        paragraphs: [
          "Miners are rewarded for their work in two ways: block rewards (newly created Bitcoin) and transaction fees. The block reward is currently 3.125 BTC per block (as of the April 2024 halving). This reward is how new Bitcoin enters circulation — it's the only way new coins are created. In addition to the block reward, miners collect all the transaction fees from the transactions they include in their block.",
          "These rewards incentivize miners to act honestly. If a miner tries to include invalid transactions or create fraudulent blocks, the network will reject them, and the miner will have wasted expensive electricity for nothing. The economic incentive to follow the rules keeps the network secure and decentralized.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Block rewards (currently 3.125 BTC) plus transaction fees incentivize miners to secure the network honestly.",
          },
        ],
        images: [
          {
            src: "/images/block-reward.png",
            alt: "Diagram showing block reward and fees going to miners",
            caption: "Miners receive block rewards and transaction fees",
          },
        ],
      },
      {
        heading: "13.2 Halving Schedule and Fixed Supply (Declining Inflation)",
        paragraphs: [
          "Bitcoin's monetary policy is completely predictable and transparent. Approximately every four years (or every 210,000 blocks), the block reward is cut in half in an event called 'the halving.' This means the rate at which new Bitcoin is created decreases over time. The first halving occurred in 2012 (reward dropped from 50 to 25 BTC), the second in 2016 (25 to 12.5 BTC), the third in 2020 (12.5 to 6.25 BTC), and the fourth in 2024 (6.25 to 3.125 BTC).",
          "This predictable, declining inflation stands in stark contrast to fiat currencies, where central banks can print money at will. Bitcoin's total supply is fixed at 21 million coins, and the halving schedule ensures that the last Bitcoin will be mined around the year 2140. This fixed supply and predictable issuance schedule make Bitcoin a truly scarce digital asset.",
        ],
        callouts: [
          {
            type: "note",
            content: "Bitcoin's supply is fixed at 21 million coins. The halving schedule ensures predictable, declining inflation until 2140.",
          },
        ],
        images: [],
      },
      {
        heading: "13.3 End of Subsidy (2140 Timeline; Fee Market)",
        paragraphs: [
          "Around the year 2140, the block reward will drop to zero, and miners will rely entirely on transaction fees for their income. This transition is already beginning — as block rewards decrease with each halving, fees become a larger percentage of miner revenue. For Bitcoin to remain secure after the subsidy ends, there must be a healthy fee market where users pay sufficient fees to incentivize miners to continue securing the network.",
          "This is one of Bitcoin's most important long-term questions: will transaction fees be high enough to maintain network security? The answer depends on Bitcoin's adoption and usage. If Bitcoin becomes widely used as a store of value and medium of exchange, transaction fees should naturally rise to support the network. Layer 2 solutions like Lightning can help by enabling low-fee payments while still generating on-chain fees for settlement.",
        ],
        callouts: [
          {
            type: "note",
            content: "After 2140, miners will rely entirely on transaction fees. A healthy fee market is essential for long-term network security.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Proof-of-Work by Hand Game",
      "To understand Proof of Work conceptually, students can play a simplified version:",
      "• Each student gets a block of data (a simple string)",
      "• They must find a number (nonce) that, when added to the data and hashed, produces a result starting with a certain number of zeros",
      "• The first to find a valid nonce 'wins' and creates the block",
      "• The difficulty adjusts based on how quickly blocks are found",
      "This hands-on exercise demonstrates the asymmetry of Proof of Work — it's hard to find a valid nonce, but easy to verify that someone else's nonce works.",
    ],
    summary: [
      "Proof of Work makes blocks expensive to create but trivial to verify, preventing attacks.",
      "Miners are rewarded with new coins (block rewards) and transaction fees.",
      "Block rewards are currently 3.125 BTC per block (post-April 2024 halving).",
      "Bitcoin's supply is fixed at 21 million coins with predictable halving every ~4 years.",
      "Around 2140, block rewards will end, and miners will rely entirely on transaction fees.",
      "A healthy fee market is essential for long-term network security.",
    ],
    keyTerms: [
      "Proof of Work",
      "PoW",
      "Block reward",
      "Halving",
      "Fee market",
      "Subsidy",
      "Miner",
      "Nonce",
      "Difficulty",
      "Hash",
    ],
    nextSlug: "mining-in-practice",
  },
  {
    slug: "mining-in-practice",
    number: 14,
    title: "Mining in Practice",
    level: "Intermediate",
    duration: "60 min",
    type: "Theory",
    hook: "Mining economics—difficulty, pools, fees—shape network security.",
    learn: [
      "Difficulty adjustment mechanics",
      "Mining pools, payout schemes, censorship risk",
      "Security budget: subsidy vs fees",
      "ASIC supply chain and geopolitical risks",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "While Proof of Work provides Bitcoin's security, the practical reality of mining involves complex economics, coordination challenges, and real-world risks. Understanding how mining actually works — from difficulty adjustments to mining pools to hardware supply chains — helps you appreciate both Bitcoin's strengths and its ongoing challenges. This chapter explores the mechanics and economics that keep the network running.",
        ],
      },
      {
        heading: "14.0 Difficulty Adjustment (Every 2016 Blocks; Self-Regulation)",
        paragraphs: [
          "Bitcoin's difficulty adjustment is a brilliant self-regulating mechanism. Every 2016 blocks (approximately every two weeks), the network automatically adjusts the mining difficulty based on how quickly blocks were found. If blocks were found faster than 10 minutes on average, difficulty increases. If they were found slower, difficulty decreases. This keeps block times stable at around 10 minutes regardless of how much mining power joins or leaves the network.",
          "This automatic adjustment is crucial for Bitcoin's stability. It means the network can handle massive changes in mining power — whether from new miners joining, old miners leaving, or even attacks — without breaking. The difficulty adjustment ensures that Bitcoin's monetary policy (new blocks every 10 minutes) remains predictable and reliable.",
        ],
        callouts: [
          {
            type: "note",
            content: "Difficulty adjusts every 2016 blocks to maintain ~10-minute block times, regardless of mining power changes.",
          },
        ],
        images: [
          {
            src: "/images/difficulty-adjustment.png",
            alt: "Chart showing Bitcoin difficulty adjustment over time",
            caption: "Difficulty automatically adjusts to maintain 10-minute block times",
          },
        ],
      },
      {
        heading: "14.1 Mining Pools and Centralization Risk (Stratum, Payout Models, Censorship)",
        paragraphs: [
          "Mining Bitcoin solo is like playing the lottery — you might find a block and win the full reward, but the odds are extremely low. Most miners join mining pools, which combine their hashing power and share rewards proportionally. This gives miners more predictable income, but it also creates centralization risks.",
          "Large mining pools could potentially censor transactions, influence network upgrades, or even attempt attacks if they gain too much control. The Stratum protocol used by most pools gives pool operators significant power. Additionally, different payout models (like PPS, PPLNS, or FPPS) affect how rewards are distributed and can influence miner behavior.",
          "While pool centralization is a concern, it's important to remember that pool operators don't control the actual mining hardware — miners can switch pools at any time. This provides some protection, but the concentration of hashing power in a few large pools remains a risk to monitor.",
        ],
        callouts: [
          {
            type: "warning",
            content: "Large mining pools could potentially censor transactions or influence network policy. Monitor pool concentration and consider supporting smaller pools.",
          },
        ],
        images: [
          {
            src: "/images/mining-pools.png",
            alt: "Diagram showing how mining pools combine hashing power",
            caption: "Mining pools combine hashing power and share rewards",
          },
        ],
      },
      {
        heading: "14.2 Security Budget (Subsidy vs Fees; Long-Term Sustainability)",
        paragraphs: [
          "Bitcoin's security budget — the total value miners receive for securing the network — comes from two sources: block rewards (subsidy) and transaction fees. Currently, block rewards dominate, but as halvings continue, fees must grow to maintain security. This transition is already happening — fees now represent a larger percentage of miner revenue than in Bitcoin's early days.",
          "The question is whether fees will be sufficient to maintain network security after block rewards end around 2140. If Bitcoin adoption grows and transaction volume increases, fees should naturally rise. However, if fees remain too low, miners might leave the network, reducing security. This is one of Bitcoin's most important long-term challenges.",
        ],
        callouts: [
          {
            type: "note",
            content: "As block rewards decline, transaction fees must grow to maintain network security. A healthy fee market is essential for Bitcoin's long-term sustainability.",
          },
        ],
      },
      {
        heading: "14.3 ASIC Supply Chains and Geopolitical Risks",
        paragraphs: [
          "Bitcoin mining requires specialized hardware called ASICs (Application-Specific Integrated Circuits). These devices are extremely efficient at mining Bitcoin but are expensive and have a concentrated supply chain. Most ASICs are manufactured in a few countries, creating potential geopolitical risks. If a major manufacturer is shut down or sanctioned, it could affect the global hash rate and network security.",
          "Additionally, mining itself has become concentrated in certain regions due to cheap electricity. While this concentration doesn't directly threaten Bitcoin's security (miners can't change the rules), it does create risks from regulatory changes, natural disasters, or political instability. Understanding these supply chain and geographic risks helps you appreciate the real-world challenges Bitcoin faces.",
        ],
        callouts: [
          {
            type: "warning",
            content: "ASIC supply chain concentration and geographic mining concentration create potential risks. Diversification is important for network resilience.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Chart Difficulty and Fee Impact on Security",
      "To understand mining economics, students can analyze historical or simulated data:",
      "• Chart Bitcoin's difficulty over time and correlate with hash rate changes",
      "• Calculate the security budget (block rewards + fees) over time",
      "• Project future security budgets based on halving schedule and fee growth scenarios",
      "• Discuss what happens if fees don't grow sufficiently",
      "This exercise helps students understand the economic forces that secure Bitcoin and the challenges ahead.",
    ],
    summary: [
      "Difficulty automatically adjusts every 2016 blocks to maintain ~10-minute block times.",
      "Mining pools combine hashing power but create centralization risks.",
      "Large pools could potentially censor transactions or influence network policy.",
      "Security budget (block rewards + fees) must remain sufficient to secure the network.",
      "As block rewards decline, transaction fees must grow to maintain security.",
      "ASIC supply chain concentration and geographic mining concentration create risks.",
    ],
    keyTerms: [
      "Difficulty",
      "Difficulty adjustment",
      "Mining pool",
      "Stratum",
      "Security budget",
      "ASIC",
      "Censorship risk",
      "Hash rate",
      "Payout model",
    ],
    nextSlug: "layer-2-sidechains-in-daily-life",
  },
  {
    slug: "layer-2-sidechains-in-daily-life",
    number: 15,
    title: "Layer 2 & Sidechains in Daily Life",
    level: "Intermediate",
    duration: "70 min",
    type: "Practice",
    hook: "Lightning and sidechains make Bitcoin faster and more flexible—with trade-offs.",
    learn: [
      "Lightning basics and settlement trade-offs",
      "Custodial vs non-custodial Lightning",
      "Sidechains (e.g., Liquid) and federated trust",
      "Circular economies running on sats",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Bitcoin's base layer is secure and decentralized, but it has limitations: transactions can take time to confirm, and fees can be high during busy periods. Layer 2 solutions and sidechains address these challenges by building additional layers on top of Bitcoin, enabling faster payments, lower fees, and new features. However, these solutions come with trade-offs, including different security models and trust assumptions. Understanding these options helps you choose the right tool for each situation.",
        ],
      },
      {
        heading: "15.0 Lightning Basics (Off-Chain Channels; Settlement Trade-Offs)",
        paragraphs: [
          "The Lightning Network is a Layer 2 solution that enables instant, low-fee payments by moving transactions off the main Bitcoin blockchain. Instead of broadcasting every payment to the entire network, Lightning uses payment channels — private connections between two parties that allow them to send and receive Bitcoin instantly, with fees often just a fraction of a cent.",
          "To use Lightning, you first open a channel by locking some Bitcoin on the main chain. Once the channel is open, you can make unlimited payments through it without touching the blockchain. When you're done, you close the channel, and the final balance is settled back on Bitcoin's main chain. This design trades immediate speed and low fees for delayed final settlement — a trade-off that works well for everyday spending.",
        ],
        callouts: [
          {
            type: "note",
            content: "Lightning channels require liquidity management. You need inbound capacity to receive and outbound capacity to send.",
          },
        ],
        images: [
          {
            src: "/images/book_images/lightning_networ.png",
            alt: "Diagram showing Lightning payment channel opening, payments, and closing",
            caption: "Lightning channels enable instant off-chain payments",
          },
        ],
      },
      {
        heading: "15.1 Receive and Spend on Lightning (Custodial vs Non-Custodial)",
        paragraphs: [
          "There are two main ways to use Lightning: custodial and non-custodial. Custodial Lightning wallets are like bank accounts — a company holds your funds and handles all the technical details. They're convenient and easy to use, but you're trusting that company with your money. If they disappear or get hacked, your funds could be at risk.",
          "Non-custodial Lightning wallets give you full control. You manage your own channels, liquidity, and keys. This offers better privacy and sovereignty, but it requires more technical knowledge and active management. You need to understand channel capacity, routing, and how to keep channels healthy. For beginners, custodial options are a good starting point, but as you learn more, non-custodial solutions offer greater independence.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Start with a custodial Lightning wallet to learn, then graduate to non-custodial for full control and privacy.",
          },
          {
            type: "warning",
            content: "Custodial Lightning wallets require trust in the provider. Only keep small amounts in custodial wallets.",
          },
        ],
      },
      {
        heading: "15.2 Sidechains (e.g., Liquid) and Federated Trust",
        paragraphs: [
          "Sidechains are separate blockchains that are pegged to Bitcoin, meaning you can move Bitcoin onto them and back. They often have their own consensus rules, enabling features like faster confirmations, confidential transactions, or smart contracts. However, sidechains typically use federated trust — a group of trusted entities (called a federation) that validate transactions and manage the peg.",
          "This introduces a trust assumption that doesn't exist on Bitcoin's main chain. If the federation is compromised or acts maliciously, your funds could be at risk. That said, sidechains can be useful for specific use cases where speed or features matter more than absolute decentralization. Understanding the trade-offs helps you make informed decisions about when to use them.",
        ],
        callouts: [
          {
            type: "warning",
            content: "Sidechains introduce trust in federations. Only use them if you understand and accept this trade-off.",
          },
        ],
        images: [
          {
            src: "/images/sidechain-peg.png",
            alt: "Diagram showing Bitcoin pegged to sidechain and back",
            caption: "Sidechains are pegged to Bitcoin but use different consensus",
          },
        ],
      },
      {
        heading: "15.3 Circular Economies Running on Sats",
        paragraphs: [
          "One of the most exciting developments in Bitcoin is the growth of circular economies — communities where people earn and spend Bitcoin entirely within their local network. These economies can run on Lightning for fast, cheap payments, or on sidechains for additional features. By keeping value circulating locally, these communities reduce dependence on traditional banking systems and build financial resilience.",
          "Examples include local marketplaces, freelancer networks, and community currencies. These systems demonstrate how Bitcoin can enable economic activity that's both global (anyone can join) and local (value stays in the community). As more people adopt Bitcoin, these circular economies become more powerful and self-sustaining.",
        ],
        callouts: [
          {
            type: "example",
            content: "A local marketplace where vendors accept Lightning payments, and customers can spend their earnings at other vendors in the same network, creating a circular economy.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Live Lightning Payment Demo (Testnet or Small Real)",
      "To experience Lightning firsthand, students can participate in a live payment demo. Using either a testnet Lightning wallet (free, no real value) or a small real Lightning wallet, students:",
      "• Open a Lightning wallet (custodial or non-custodial)",
      "• Receive a small amount of sats",
      "• Make a payment to another student or a merchant",
      "• Observe the instant confirmation and low fees",
      "This hands-on experience makes the abstract concept of Layer 2 tangible and helps students understand when Lightning is the right tool for a payment.",
    ],
    summary: [
      "Lightning Network enables instant, low-fee payments through off-chain channels.",
      "Lightning trades immediate speed for delayed on-chain final settlement.",
      "Custodial Lightning is convenient but requires trust; non-custodial offers control but needs more management.",
      "Sidechains add features but introduce trust in federations.",
      "Circular economies demonstrate how Bitcoin can enable local economic activity.",
    ],
    keyTerms: [
      "Lightning Network",
      "Lightning channel",
      "Liquidity",
      "Custodial",
      "Non-custodial",
      "Sidechain",
      "Federation",
      "Peg",
      "Layer 2",
    ],
    nextSlug: "full-node-opening-a-lightning-channel",
  },
  {
    slug: "full-node-opening-a-lightning-channel",
    number: 16,
    title: "Full Node & Opening a Lightning Channel",
    level: "Advanced",
    duration: "60–75 min",
    type: "Practice",
    hook: "Running a node and a channel makes you your own verifier and payment rail.",
    learn: [
      "Choosing a node stack; privacy tips",
      "Opening/closing Lightning channels; routing basics",
      "Backups and watchtowers",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Running your own Bitcoin node and Lightning channel is the ultimate expression of Bitcoin sovereignty. It makes you your own verifier, your own payment rail, and gives you complete independence from third-party services. While this requires more technical knowledge and setup, the benefits in terms of privacy, security, and control are significant. This chapter guides you through choosing a node stack, opening and managing Lightning channels, and protecting your setup with proper backups.",
        ],
      },
      {
        heading: "16.0 Choosing a Node Stack (Core + Lightning; Privacy Tips)",
        paragraphs: [
          "The most common setup is Bitcoin Core (the reference implementation) combined with a Lightning implementation like LND (Lightning Network Daemon) or CLN (Core Lightning). Both have their strengths: LND is more feature-rich and widely supported, while CLN is lighter and more modular. Choose based on your needs and technical comfort level.",
          "Privacy is crucial when running a node. Using Tor or a VPN helps hide your IP address from network observers. Additionally, consider running your node on a dedicated device or virtual private server (VPS) to isolate it from your daily-use computer. Plan for storage (500+ GB for full node, or ~5 GB for pruned), bandwidth (initial sync requires significant data), and ensure your operating system is compatible with your chosen stack.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Use Tor or a VPN when running a node to protect your privacy. Consider a dedicated device or VPS for better isolation.",
          },
        ],
        images: [
          {
            src: "/images/node-stack.png",
            alt: "Diagram showing Bitcoin Core + Lightning node setup",
            caption: "Bitcoin Core + Lightning enables full sovereignty",
          },
        ],
      },
      {
        heading: "16.1 Opening and Closing Lightning Channels (Multi-Sig, Routing, Liquidity)",
        paragraphs: [
          "Opening a Lightning channel requires locking Bitcoin in a 2-of-2 multi-signature address. This means both you and your channel partner must sign to spend the funds. Once the channel is open, you can make instant, low-fee payments through it. The channel can route payments to other nodes, creating a network of interconnected payment channels.",
          "When you're done with a channel, you can close it cooperatively (both parties agree) or unilaterally (one party closes without the other's cooperation). Closing settles the final balance back on the Bitcoin blockchain. It's important to manage liquidity — you need inbound capacity to receive and outbound capacity to send. Understanding these mechanics helps you use Lightning effectively.",
        ],
        callouts: [
          {
            type: "note",
            content: "Lightning channels lock funds in a 2-of-2 multi-sig. You need both inbound and outbound liquidity to use channels effectively.",
          },
        ],
        images: [
          {
            src: "/images/lightning-channel-open.png",
            alt: "Diagram showing Lightning channel opening process",
            caption: "Opening a Lightning channel locks funds in multi-sig",
          },
        ],
      },
      {
        heading: "16.2 Backups and Watchtowers (Channel State Protection)",
        paragraphs: [
          "Lightning channels have a critical security requirement: you must back up your channel state. If you lose your channel state data and your channel partner tries to close with an old state (attempting to steal funds), you need your latest state to prove fraud. Regular backups of your Lightning node's data are essential.",
          "Watchtowers are services that monitor your channels for you. If you're offline and your channel partner tries to close with an old state, the watchtower can catch it and broadcast a penalty transaction. This provides protection even when your node is offline. However, watchtowers require some trust — you're relying on them to monitor honestly. Understanding these trade-offs helps you secure your Lightning setup properly.",
        ],
        callouts: [
          {
            type: "warning",
            content: "Always back up your Lightning channel states. Losing channel state data can result in fund loss if your channel partner attempts fraud.",
          },
          {
            type: "tip",
            content: "Watchtowers can protect your channels when your node is offline, but they require some trust in the watchtower operator.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Simulated Channel Open/Close on Testnet/Regtest",
      "To practice Lightning channel management safely, students can:",
      "• Set up a testnet or regtest Lightning node",
      "• Open a channel with another node (or simulate with a partner)",
      "• Route a payment through the channel",
      "• Close the channel (both cooperatively and unilaterally)",
      "• Test backup and recovery procedures",
      "• Set up and test a watchtower",
      "This hands-on exercise builds confidence in managing Lightning channels and understanding the security requirements.",
    ],
    summary: [
      "Running your own node gives you complete sovereignty and independence from third parties.",
      "Bitcoin Core + Lightning (LND/CLN) is the standard node stack.",
      "Use Tor or VPN to protect privacy when running a node.",
      "Lightning channels lock funds in 2-of-2 multi-sig and enable instant payments.",
      "Channel liquidity management (inbound/outbound) is essential for effective use.",
      "Always back up Lightning channel states to prevent fund loss from fraud.",
      "Watchtowers can protect channels when your node is offline.",
    ],
    keyTerms: [
      "Full node",
      "Bitcoin Core",
      "Lightning channel",
      "LND",
      "CLN",
      "Routing",
      "Watchtower",
      "Backup",
      "Channel state",
      "Multi-sig",
      "Liquidity",
    ],
    nextSlug: "multi-sig-collaborative-custody",
  },
  {
    slug: "multi-sig-collaborative-custody",
    number: 17,
    title: "Multi-Sig (Collaborative Custody)",
    level: "Advanced",
    duration: "60–75 min",
    type: "Practice",
    hook: "Multi-sig distributes power—no single point of failure.",
    learn: [
      "Why multi-sig for family/orgs/inheritance",
      "M-of-N designs; coordinator vs coordinator-less",
      "Backup strategies and operational playbooks",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Multi-signature (multi-sig) wallets require multiple keys to authorize a transaction, distributing control and eliminating single points of failure. This makes them ideal for families, organizations, inheritance planning, and any situation where you want shared control or redundancy. Instead of one person holding all the keys, multiple people or devices must cooperate to spend funds. This chapter explores why multi-sig matters, how to design effective setups, and how to manage them securely.",
        ],
      },
      {
        heading: "17.0 Why Multi-Sig (Family/Org/Inheritance Use Cases)",
        paragraphs: [
          "Multi-sig solves several critical problems. For families, it can require multiple family members to approve large expenses, preventing impulsive spending or protecting against one person making mistakes. For organizations, it encodes governance — requiring board approval or multiple executives to authorize transactions. For inheritance, it can ensure funds are accessible even if one key holder dies or becomes incapacitated.",
          "Multi-sig also reduces theft risk. An attacker would need to compromise multiple keys instead of just one. It also protects against mistakes — if one person accidentally signs a fraudulent transaction, others can catch it before it's finalized. These benefits make multi-sig essential for serious Bitcoin storage.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Multi-sig distributes control and eliminates single points of failure. Essential for families, organizations, and inheritance planning.",
          },
        ],
        images: [
          {
            src: "/images/book_images/single_signiture.png",
            alt: "Diagram showing single signature transaction",
            caption: "Single signature requires one key to authorize transactions",
          },
          {
            src: "/images/book_images/multi_sig.png",
            alt: "Diagram showing multi-sig requiring multiple signatures",
            caption: "Multi-sig requires multiple keys to authorize transactions",
          },
        ],
      },
      {
        heading: "17.1 Multi-Sig Designs and Flows (M-of-N; Coordinator vs Coordinator-Less)",
        paragraphs: [
          "Multi-sig setups are described as 'M-of-N,' meaning M signatures are required out of N total keys. Common examples include 2-of-3 (two signatures needed from three keys) or 3-of-5 (three signatures needed from five keys). The choice depends on your security and redundancy needs. More keys provide more redundancy but also more complexity.",
          "There are two main approaches: coordinator-based and coordinator-less. Coordinator-based setups use a service (like Unchained Capital or Casa) that helps coordinate signing, making it easier but requiring some trust. Coordinator-less setups use manual PSBT exchange, giving you complete control but requiring more technical knowledge. Key generation and distribution should always happen offline and be well-documented to ensure security.",
        ],
        callouts: [
          {
            type: "note",
            content: "Key generation and distribution should always happen offline. Document the process carefully for future reference.",
          },
        ],
        images: [
          {
            src: "/images/multi-sig-design.png",
            alt: "Diagram showing 2-of-3 and 3-of-5 multi-sig setups",
            caption: "Different multi-sig designs balance security and redundancy",
          },
        ],
      },
      {
        heading: "17.2 Backup Strategies and Operational Playbooks",
        paragraphs: [
          "Multi-sig requires careful backup planning. Keys should be stored in geographically separated locations to protect against natural disasters, theft, or loss. Each key holder should have clear instructions on what to do if they lose their key, if another key holder dies, or if there's an emergency.",
          "Operational playbooks should document:",
          "Regular drills — like practicing a spend with all signers — ensure everyone knows the process and can execute it when needed. These playbooks are as important as the technical setup itself.",
        ],
        bullets: [
          "Key generation and distribution procedures",
          "Lost key recovery process",
          "Emergency spending protocols",
          "Signer rotation procedures (if someone leaves or needs to be replaced)",
          "Regular testing and verification",
        ],
        callouts: [
          {
            type: "warning",
            content: "Always test your multi-sig setup regularly. Practice spending with all signers to ensure everyone knows the process.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Design a 2-of-3 Family Custody Plan",
      "To practice multi-sig planning, students can design a complete custody plan:",
      "• Assign roles (who holds which keys)",
      "• Plan backup storage (geographically separated)",
      "• Document PSBT flow (how signers coordinate)",
      "• Create emergency protocols (lost key, death, etc.)",
      "• Design signer rotation procedures",
      "• Write a testing schedule",
      "This exercise helps students understand the operational complexity of multi-sig and the importance of clear procedures.",
    ],
    summary: [
      "Multi-sig distributes control and eliminates single points of failure.",
      "M-of-N designs (like 2-of-3 or 3-of-5) balance security and redundancy.",
      "Coordinator-based setups are easier but require trust; coordinator-less gives full control.",
      "Key generation and distribution must happen offline and be well-documented.",
      "Geographically separated backups protect against disasters and theft.",
      "Operational playbooks (lost key, emergency, rotation) are as critical as the technical setup.",
      "Regular testing ensures everyone knows the process.",
    ],
    keyTerms: [
      "Multi-sig",
      "M-of-N",
      "PSBT",
      "Coordinator",
      "Coordinator-less",
      "Signer rotation",
      "Emergency protocol",
      "Backup strategy",
      "Key generation",
    ],
    nextSlug: "intro-to-bitcoin-script-optional-track",
  },
  {
    slug: "intro-to-bitcoin-script-optional-track",
    number: 18,
    title: "Intro to Bitcoin Script",
    level: "Advanced",
    duration: "60–75 min",
    type: "Mixed",
    hook: "Scripts are the rules that lock and unlock your coins.",
    learn: [
      "Locking/unlocking basics (P2PKH, P2WPKH, P2SH, P2TR)",
      "Timelocks (CLTV/CSV) and simple policies",
      "How wallets abstract scripts",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Bitcoin Script is the programming language that defines how Bitcoin can be spent. Every transaction output has a 'locking script' that specifies the conditions for spending it, and every transaction input has an 'unlocking script' that satisfies those conditions. While most users never see Script directly (wallets handle it automatically), understanding Script helps you appreciate Bitcoin's flexibility and power. This chapter introduces the basics of Script and how it enables everything from simple payments to complex multi-sig and timelocks.",
        ],
      },
      {
        heading: "18.0 Locking and Unlocking Types (P2PKH, P2WPKH, P2SH, P2TR)",
        paragraphs: [
          "Bitcoin has evolved several standard script types, each with different characteristics:",
          "Each type has trade-offs in terms of fees, privacy, and features. Modern wallets typically use P2WPKH or P2TR for single-sig, and P2SH or P2TR for multi-sig. Understanding these types helps you understand what your wallet is doing under the hood.",
        ],
        bullets: [
          "P2PKH (Pay to Public Key Hash): The original script type, now mostly legacy. Uses public key hashes.",
          "P2WPKH (Pay to Witness Public Key Hash): SegWit version of P2PKH, more efficient and cheaper.",
          "P2SH (Pay to Script Hash): Allows complex scripts to be hidden behind a hash, enabling features like multi-sig.",
          "P2TR (Pay to Taproot): The newest script type, offering better privacy and efficiency. Uses Schnorr signatures.",
        ],
        callouts: [
          {
            type: "note",
            content: "Modern wallets use P2WPKH or P2TR for efficiency and privacy. P2SH enables complex scripts like multi-sig.",
          },
        ],
        images: [
          {
            src: "/images/book_images/script.png",
            alt: "P2PKH (Pay-to-Public-Key-Hash) script diagram",
            caption: "P2PKH (Pay-to-Public-Key-Hash): The original script type",
          },
          {
            src: "/images/book_images/p2sh.png",
            alt: "P2SH (Pay-to-Script-Hash) script diagram",
            caption: "P2SH (Pay-to-Script-Hash): Allows complex scripts to be hidden behind a hash",
          },
          {
            src: "/images/script-types.png",
            alt: "Diagram comparing P2PKH, P2WPKH, P2SH, and P2TR script types",
            caption: "Different script types offer different features and efficiency",
          },
        ],
      },
      {
        heading: "18.1 Timelocks and Simple Policies (CLTV/CSV)",
        paragraphs: [
          "Timelocks are Script features that enable conditional spending based on time. There are two types:",
          "These enable powerful use cases like vaults (requiring a delay before spending), inheritance (funds unlock after a certain date), or escrow (requiring time for disputes). Timelocks add an extra layer of security and enable more sophisticated Bitcoin applications.",
        ],
        bullets: [
          "CLTV (CheckLockTimeVerify): Absolute timelock — funds can only be spent after a specific date/time.",
          "CSV (CheckSequenceVerify): Relative timelock — funds can only be spent after a certain number of blocks or time has passed since the output was created.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Timelocks enable vaults, inheritance planning, and escrow. They add time-based conditions to spending.",
          },
        ],
        images: [
          {
            src: "/images/book_images/time_lock.png",
            alt: "Diagram showing CLTV and CSV timelock mechanisms",
            caption: "Timelocks enable time-based spending conditions",
          },
        ],
      },
      {
        heading: "18.2 How Wallets Abstract Scripts",
        paragraphs: [
          "Most users never interact with Script directly because wallets handle it automatically. When you create a transaction, your wallet:",
          "This abstraction makes Bitcoin user-friendly, but understanding what's happening underneath helps you make better decisions about wallet choice, transaction types, and security. Lightning and multi-sig both rely heavily on Script, so understanding Script helps you understand these advanced features.",
        ],
        bullets: [
          "Generates the appropriate locking script for the recipient",
          "Builds a PSBT with the necessary unlocking script",
          "Handles witness data (for SegWit transactions)",
          "Manages complex scripts like multi-sig or Lightning channels",
        ],
        callouts: [
          {
            type: "note",
            content: "Wallets abstract Script complexity, but understanding Script helps you understand Lightning, multi-sig, and other advanced features.",
          },
        ],
      },
      {
        heading: "18.3 Transaction Flow (Create → Lock → Sign → Validate → Broadcast)",
        paragraphs: [
          "The complete flow of a Bitcoin transaction involves Script at every step:",
          "Understanding this flow helps you appreciate how Bitcoin transactions work and why certain operations (like multi-sig) require coordination between multiple parties.",
        ],
        bullets: [
          "Create transaction: Define inputs (UTXOs to spend) and outputs (recipients and amounts)",
          "Lock script: Each output has a locking script that defines spending conditions",
          "Sign/unlock: Create unlocking script with signatures and other required data",
          "Validate: Network verifies that unlocking script satisfies locking script",
          "Broadcast: Valid transaction is broadcast to the network",
        ],
      },
    ],
    activities: [
      "Activity: Build and Broadcast a Testnet PSBT",
      "To practice Script hands-on, students can:",
      "• Create a testnet transaction with P2WPKH or simple multi-sig",
      "• Build a PSBT manually (or use a tool)",
      "• Sign the transaction",
      "• Validate the script",
      "• Broadcast to testnet",
      "• Optionally test a timelock transaction",
      "This exercise makes Script tangible and helps students understand what wallets do automatically.",
    ],
    summary: [
      "Bitcoin Script defines how coins can be spent through locking and unlocking scripts.",
      "P2PKH, P2WPKH, P2SH, and P2TR are different script types with different features and efficiency.",
      "Timelocks (CLTV/CSV) enable time-based spending conditions for vaults, inheritance, and escrow.",
      "Wallets abstract Script complexity, but understanding Script helps you understand Lightning and multi-sig.",
      "Transaction flow: create → lock → sign → validate → broadcast.",
    ],
    keyTerms: [
      "Bitcoin Script",
      "ScriptPubKey",
      "Locking script",
      "Unlocking script",
      "ScriptSig",
      "Witness",
      "P2PKH",
      "P2WPKH",
      "P2SH",
      "P2TR",
      "CLTV",
      "CSV",
      "Timelock",
      "Taproot",
    ],
    nextSlug: "utxo-consolidation-privacy-risks",
  },
  {
    slug: "utxo-consolidation-privacy-risks",
    number: 19,
    title: "UTXO Consolidation & Privacy Risks",
    level: "Advanced",
    duration: "45–60 min",
    type: "Practice",
    hook: "Consolidate smartly—save fees without leaking your history.",
    learn: [
      "When to consolidate (fee windows, mempool conditions)",
      "Privacy erosion from merging UTXOs",
      "Planning future spends for cost and privacy",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "UTXO consolidation — combining multiple small UTXOs into fewer, larger ones — is a common practice to reduce future transaction fees. However, consolidation comes with privacy trade-offs. Every time you merge UTXOs, you're linking them together on the blockchain, potentially revealing information about your financial history. This chapter explores when to consolidate, the privacy risks involved, and how to plan spends to balance cost and privacy.",
        ],
      },
      {
        heading: "19.0 When to Consolidate (Fee Windows, Mempool Conditions)",
        paragraphs: [
          "The best time to consolidate is during low-fee periods. When the mempool is empty or fees are cheap, you can combine many small UTXOs into larger ones without paying high fees. This saves money on future transactions because you'll have fewer inputs to include.",
          "Watch the mempool to identify these windows. Fee tracking websites and tools can help you see when fees drop. Some people consolidate during weekends or late-night hours when network activity is lower. The key is timing your consolidation to minimize costs while still achieving your goal.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Consolidate during low-fee windows (empty mempool, weekends, late nights) to save money on future transactions.",
          },
        ],
        images: [
          {
            src: "/images/mempool-fees.png",
            alt: "Chart showing mempool fee levels over time",
            caption: "Watch mempool conditions to time consolidation",
          },
        ],
      },
      {
        heading: "19.1 Privacy Risks of Consolidation (Merging Links Sources)",
        paragraphs: [
          "Every consolidation transaction links the merged UTXOs together. Anyone analyzing the blockchain can see that these coins were combined, which suggests they belong to the same person. This is especially problematic if the UTXOs came from different sources (different exchanges, different people, different time periods) that you'd prefer to keep separate.",
          "Maintaining coin-control discipline means being selective about which UTXOs you combine. Don't merge UTXOs that came from different sources or have different privacy characteristics. Keep sensitive UTXOs separate from less sensitive ones. This discipline helps preserve your privacy even when you need to consolidate for fee savings.",
        ],
        callouts: [
          {
            type: "warning",
            content: "Consolidation links UTXOs together on the blockchain. Avoid merging UTXOs from different sources or with different privacy characteristics.",
          },
        ],
      },
      {
        heading: "19.2 Planning Future Spends (Cost and Privacy Balance)",
        paragraphs: [
          "Smart spend planning balances cost and privacy. Forecast your future spending needs and design your UTXO structure accordingly. If you know you'll need to make several payments, consider consolidating related UTXOs in advance during a low-fee window. But keep sensitive UTXOs separate — don't mix funds from different sources or purposes.",
          "When opening Lightning channels or funding other activities, think about future privacy implications. Design your funding transactions with privacy in mind from the start. This forward-thinking approach helps you maintain both cost efficiency and privacy over time.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Plan future spends in advance. Consolidate related UTXOs during low-fee windows, but keep sensitive UTXOs separate.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Draft a Consolidation Plan",
      "To practice UTXO management, students can:",
      "• Analyze a noisy UTXO set (many small UTXOs from different sources)",
      "• Identify which UTXOs can be safely consolidated together",
      "• Plan consolidation timing based on fee windows",
      "• Design spend paths that balance cost and privacy",
      "• Optionally execute a testnet dry-run",
      "This exercise helps students understand the trade-offs between fee savings and privacy preservation.",
    ],
    summary: [
      "Consolidate during low-fee windows (empty mempool, weekends, late nights) to save money.",
      "Every consolidation links UTXOs together on the blockchain, potentially revealing financial history.",
      "Maintain coin-control discipline — don't merge UTXOs from different sources or with different privacy characteristics.",
      "Plan future spends in advance, balancing cost efficiency and privacy.",
      "Keep sensitive UTXOs separate from less sensitive ones.",
    ],
    keyTerms: [
      "Consolidation",
      "Coin control",
      "Mempool",
      "Fee window",
      "Change management",
      "UTXO linking",
      "Privacy risk",
    ],
    nextSlug: "why-bitcoin-philosophy-adoption",
  },
  {
    slug: "why-bitcoin-philosophy-adoption",
    number: 20,
    title: "Why Bitcoin? Philosophy & Adoption",
    level: "Advanced",
    duration: "50–60 min",
    type: "Theory",
    hook: "Bitcoin reframes money—from state decree or metal to network consensus.",
    learn: [
      "Chartalist vs metallist vs platform money",
      "Bitcoin (network) vs bitcoin (asset)",
      "Trust-minimized finance and beneficiaries",
    ],
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Bitcoin represents a fundamental shift in how we think about money. For thousands of years, money has been either state-issued (fiat) or commodity-based (gold, silver). Bitcoin introduces a third category: platform money — money that derives its value from network consensus and cryptographic scarcity, not from government decree or physical properties. Understanding this philosophical shift helps you appreciate why Bitcoin matters and who benefits from it.",
        ],
      },
      {
        heading: "20.0 Money Frameworks (Chartalism, Metallism, Platform Money)",
        paragraphs: [
          "Throughout history, there have been different theories about what makes money valuable:",
          "Bitcoin's innovation is creating platform money that doesn't require state backing or physical properties. Instead, it relies on cryptographic proof, network consensus, and transparent rules enforced by code.",
        ],
        bullets: [
          "Chartalism: Money has value because the state says it does and requires it for taxes. Fiat currencies are chartalist — they're valuable because governments accept them and citizens need them to pay taxes.",
          "Metallism: Money has value because of its physical properties (like gold's scarcity and durability). Commodity money is metallist — its value comes from the material itself.",
          "Platform Money: Money has value because of network consensus and cryptographic scarcity. Bitcoin is platform money — its value comes from the network agreeing on its rules and the mathematical guarantee of limited supply.",
        ],
        callouts: [
          {
            type: "note",
            content: "Bitcoin introduces platform money — value from network consensus and cryptographic scarcity, not state decree or physical properties.",
          },
        ],
        images: [
          {
            src: "/images/money-frameworks.png",
            alt: "Diagram comparing Chartalism, Metallism, and Platform Money",
            caption: "Bitcoin represents a new category of money",
          },
        ],
      },
      {
        heading: "20.1 Bitcoin vs bitcoin (Protocol/Network vs Asset/Unit)",
        paragraphs: [
          "It's important to distinguish between Bitcoin (capital B) and bitcoin (lowercase b). Bitcoin refers to the protocol and network — the decentralized system of nodes, miners, and rules that make everything work. bitcoin refers to the asset and unit — the actual tokens that people hold and trade.",
          "This distinction matters because the protocol can succeed even if the asset's price fluctuates. The network's value comes from its utility (enabling trust-minimized transactions), while the asset's value comes from supply and demand. Separating these concepts helps clarify debates about Bitcoin's future and helps you think strategically about adoption.",
        ],
        callouts: [
          {
            type: "tip",
            content: "Bitcoin (capital B) = protocol/network. bitcoin (lowercase b) = asset/unit. This distinction clarifies debates and strategy.",
          },
        ],
      },
      {
        heading: "20.2 Trust-Minimized Finance and Who Benefits",
        paragraphs: [
          "Bitcoin enables trust-minimized finance — financial transactions that don't require trusting banks, governments, or other intermediaries. This is revolutionary because it broadens access to financial services. People who are unbanked, underbanked, or living under oppressive regimes can now participate in the global economy without permission.",
          "The benefits extend to:",
          "Bitcoin's permissionless access, censorship resistance, and fixed supply make it uniquely suited to serve these populations. Understanding who benefits helps you appreciate Bitcoin's real-world impact beyond price speculation.",
        ],
        bullets: [
          "The unbanked: People without access to traditional banking can store and transfer value",
          "Savers: People in countries with high inflation can protect their wealth",
          "Global users: People can send value across borders without expensive remittance services",
          "Anyone seeking financial sovereignty: People who want to control their own money without gatekeepers",
        ],
        callouts: [
          {
            type: "example",
            content: "A worker in a developing country can receive Bitcoin payments from anywhere in the world, store value without a bank account, and send money to family members across borders — all without permission from any institution.",
          },
        ],
      },
    ],
    activities: [
      "Activity: Debate — Do You Trust Code or the State?",
      "To explore the philosophical implications of Bitcoin, students can engage in a structured debate:",
      "• Consider security: Which is more secure — cryptographic proof or government backing?",
      "• Consider policy: Which is more predictable — code rules or political decisions?",
      "• Consider access: Which is more inclusive — permissionless networks or traditional banking?",
      "• Consider privacy: Which offers better privacy — pseudonymous blockchain or bank records?",
      "This exercise helps students think critically about Bitcoin's trade-offs and understand different perspectives on trust and money.",
    ],
    summary: [
      "Bitcoin introduces platform money — value from network consensus and cryptographic scarcity.",
      "Chartalism (state money), Metallism (commodity money), and Platform Money (Bitcoin) are different frameworks for understanding value.",
      "Bitcoin (capital B) = protocol/network. bitcoin (lowercase b) = asset/unit. This distinction matters.",
      "Trust-minimized finance enables permissionless access, censorship resistance, and fixed supply.",
      "Bitcoin benefits the unbanked, savers in high-inflation countries, global users, and anyone seeking financial sovereignty.",
    ],
    keyTerms: [
      "Chartalism",
      "Metallism",
      "Platform money",
      "Trust-minimized finance",
      "Censorship resistance",
      "Permissionless",
      "Financial sovereignty",
      "Network consensus",
      "Cryptographic scarcity",
    ],
    nextSlug: undefined,
  },
];

export const getChapterBySlug = (slug: string) =>
  chaptersContent.find((chapter) => chapter.slug === slug);


