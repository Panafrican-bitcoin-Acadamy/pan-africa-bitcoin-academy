
const faqs = [
  {
    category: "Time Zones & Schedule",
    questions: [
      {
        q: "What time zones do you support?",
        a: "Our cohorts are designed to accommodate students across Africa. Sessions are typically scheduled in UTC+0 (GMT) or UTC+1 to ensure maximum participation. We also record all sessions for students who cannot attend live.",
      },
      {
        q: "What are the class times?",
        a: "Classes are held twice a week, typically on Tuesdays and Thursdays at 6:00 PM UTC. Each session lasts 90 minutes. We also offer weekend sessions for students who prefer Saturday mornings.",
      },
      {
        q: "Can I attend if I'm in a different time zone?",
        a: "Yes! All sessions are recorded and made available within 24 hours. You can watch at your convenience and participate in asynchronous discussions.",
      },
    ],
  },
  {
    category: "Device Requirements",
    questions: [
      {
        q: "What devices do I need?",
        a: "You'll need a computer (Windows, Mac, or Linux) or a tablet with a keyboard. A smartphone can work for viewing content, but a computer is recommended for hands-on exercises and assignments.",
      },
      {
        q: "What are the internet requirements?",
        a: "A stable internet connection is required. Minimum 2 Mbps for video streaming. We recommend 5 Mbps or higher for the best experience. All course materials can be downloaded for offline viewing.",
      },
      {
        q: "Do I need special software?",
        a: "No special software is required initially. We'll guide you through installing Bitcoin Core, Lightning nodes, and other tools during the course. All software is free and open-source.",
      },
    ],
  },
  {
    category: "Prerequisites",
    questions: [
      {
        q: "Do I need prior Bitcoin knowledge?",
        a: "No! Our beginner cohorts are designed for complete beginners. We start from the basics and build up. Intermediate cohorts require some basic understanding.",
      },
      {
        q: "What technical skills do I need?",
        a: "Basic computer literacy is sufficient. You should be comfortable using a computer, installing software, and following instructions. No programming experience is required for beginner cohorts.",
      },
      {
        q: "Is there an age requirement?",
        a: "Students must be 18 years or older to participate. We welcome learners of all ages and backgrounds.",
      },
    ],
  },
  {
    category: "Policies",
    questions: [
      {
        q: "What is your refund policy?",
        a: "Our courses are free! However, if you're accepted into a cohort, we expect full participation. Missing more than 3 sessions without prior notice may result in removal from the cohort.",
      },
      {
        q: "Can I switch cohorts?",
        a: "Yes, if there's availability in another cohort and you provide at least 2 weeks' notice. Contact support@bitcoinacademy.africa to request a transfer.",
      },
      {
        q: "What happens if I miss a session?",
        a: "All sessions are recorded and available within 24 hours. You can catch up on your own time. However, live participation is highly encouraged for Q&A and community interaction.",
      },
      {
        q: "Do I get a certificate?",
        a: "Yes! Upon successful completion of the cohort (80% attendance and all assignments submitted), you'll receive a digital certificate. You can also request a certificate image for printing.",
      },
      {
        q: "How are assignments graded?",
        a: "Assignments are reviewed by mentors and guest lecturers. You'll receive feedback within 5-7 days. Completing assignments also earns you sats rewards!",
      },
    ],
  },
  {
    category: "Payment & Rewards",
    questions: [
      {
        q: "How much does the course cost?",
        a: "The course is completely free! We're funded by donations and sponsors who believe in Bitcoin education.",
      },
      {
        q: "How do sats rewards work?",
        a: "Students earn sats for completing assignments, participating in discussions, and helping peers. Rewards are distributed via Lightning Network. You'll need a Lightning wallet to receive rewards.",
      },
      {
        q: "Do I need a Bitcoin wallet before starting?",
        a: "No, we'll help you set up a wallet during the course. However, having a Lightning wallet ready (like Breez, Phoenix, or Zeus) will help you receive rewards faster.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
              Everything you need to know about joining our Pan-Africa Bitcoin Academy.
            </p>
          </div>

      <div className="space-y-12">
        {faqs.map((category, categoryIndex) => (
          <section key={categoryIndex} className="space-y-4">
            <h2 className="text-xl font-semibold text-cyan-200">{category.category}</h2>
            <div className="space-y-4">
              {category.questions.map((faq, faqIndex) => (
                <div
                  key={faqIndex}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                >
                  <h3 className="mb-3 text-base font-semibold text-orange-200">{faq.q}</h3>
                  <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Still Have Questions */}
        <section className="rounded-xl border border-orange-500/25 bg-black/80 p-8 text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
          <h2 className="text-xl font-semibold text-orange-200">Still Have Questions?</h2>
          <p className="mt-4 text-sm text-zinc-300 sm:text-base">
            Can't find what you're looking for? We're here to help!
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="mailto:support@bitcoinacademy.africa"
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-6 py-2 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Email Us
            </a>
            <a
              href="/contact"
              className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Contact Page
            </a>
          </div>
        </section>
      </div>
        </div>
      </div>
    </div>
  );
}

