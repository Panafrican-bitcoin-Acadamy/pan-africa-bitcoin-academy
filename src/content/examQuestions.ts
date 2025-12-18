// Final Exam Questions for Pan-Africa Bitcoin Academy
// 50 Multiple Choice Questions with 4 options each

export interface ExamQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export const examQuestions: ExamQuestion[] = [
  {
    id: 1,
    question: "Why did early barter systems often fail?",
    options: {
      A: "Goods were too valuable",
      B: "People preferred gold",
      C: "The double coincidence of wants",
      D: "Trade was illegal"
    },
    correctAnswer: 'C'
  },
  {
    id: 2,
    question: "The \"double coincidence of wants\" means:",
    options: {
      A: "Both people want money",
      B: "Both sides want exactly what the other has at the same time",
      C: "Goods must be equal in value",
      D: "Trade must involve three people"
    },
    correctAnswer: 'B'
  },
  {
    id: 3,
    question: "Which of the following best describes money's role as a medium of exchange?",
    options: {
      A: "Measuring prices",
      B: "Saving wealth",
      C: "Making barter unnecessary",
      D: "Storing gold"
    },
    correctAnswer: 'C'
  },
  {
    id: 4,
    question: "Which function of money helps compare prices easily?",
    options: {
      A: "Medium of exchange",
      B: "Store of value",
      C: "Unit of account",
      D: "Means of payment"
    },
    correctAnswer: 'C'
  },
  {
    id: 5,
    question: "Why did societies prefer gold and silver as money?",
    options: {
      A: "Easy to grow",
      B: "Government controlled",
      C: "Durable and scarce",
      D: "Backed by banks"
    },
    correctAnswer: 'C'
  },
  {
    id: 6,
    question: "Which is NOT a property of sound money?",
    options: {
      A: "Durable",
      B: "Divisible",
      C: "Infinite supply",
      D: "Recognizable"
    },
    correctAnswer: 'C'
  },
  {
    id: 7,
    question: "Why is scarcity important for money?",
    options: {
      A: "It allows free printing",
      B: "It prevents loss",
      C: "It preserves value",
      D: "It increases fees"
    },
    correctAnswer: 'C'
  },
  {
    id: 8,
    question: "Cowrie shells are an example of:",
    options: {
      A: "Fiat money",
      B: "Digital money",
      C: "Commodity money",
      D: "Credit money"
    },
    correctAnswer: 'C'
  },
  {
    id: 9,
    question: "What problem did coinage solve?",
    options: {
      A: "Trust in governments",
      B: "Heavy and impractical trade goods",
      C: "Lack of inflation",
      D: "Theft prevention"
    },
    correctAnswer: 'B'
  },
  {
    id: 10,
    question: "Which African kingdom minted early coins?",
    options: {
      A: "Mali",
      B: "Songhai",
      C: "Aksum",
      D: "Benin"
    },
    correctAnswer: 'C'
  },
  {
    id: 11,
    question: "Why did paper money originally gain trust?",
    options: {
      A: "It was cheap",
      B: "It was backed by gold",
      C: "It was government-issued",
      D: "It replaced coins"
    },
    correctAnswer: 'B'
  },
  {
    id: 12,
    question: "The first known fiat paper currency was:",
    options: {
      A: "Dollar",
      B: "Pound",
      C: "Jiaozi",
      D: "Euro"
    },
    correctAnswer: 'C'
  },
  {
    id: 13,
    question: "What does \"fiat\" mean?",
    options: {
      A: "Backed by gold",
      B: "Limited supply",
      C: "By decree",
      D: "Peer-to-peer"
    },
    correctAnswer: 'C'
  },
  {
    id: 14,
    question: "What major event ended the gold standard?",
    options: {
      A: "World War I",
      B: "2008 crisis",
      C: "1971 US decision",
      D: "Bitcoin launch"
    },
    correctAnswer: 'C'
  },
  {
    id: 15,
    question: "Which risk is common in fiat systems?",
    options: {
      A: "Fixed supply",
      B: "Inflation",
      C: "Transparency",
      D: "Decentralization"
    },
    correctAnswer: 'B'
  },
  {
    id: 16,
    question: "Monetary inflation refers to:",
    options: {
      A: "Rising prices only",
      B: "Printing more money",
      C: "Falling wages",
      D: "Trade deficits"
    },
    correctAnswer: 'B'
  },
  {
    id: 17,
    question: "Who controls fiat money supply?",
    options: {
      A: "Miners",
      B: "Markets",
      C: "Governments and central banks",
      D: "Citizens"
    },
    correctAnswer: 'C'
  },
  {
    id: 18,
    question: "Financial exclusion means:",
    options: {
      A: "High inflation",
      B: "Lack of internet",
      C: "Limited access to banking",
      D: "Tax evasion"
    },
    correctAnswer: 'C'
  },
  {
    id: 19,
    question: "What showed the fragility of fiat systems globally?",
    options: {
      A: "Gold shortages",
      B: "2008 financial crisis",
      C: "Bitcoin mining",
      D: "Internet shutdowns"
    },
    correctAnswer: 'B'
  },
  {
    id: 20,
    question: "Who created the time-stamping system that inspired Bitcoin?",
    options: {
      A: "Adam Back",
      B: "David Chaum",
      C: "Haber & Stornetta",
      D: "Hal Finney"
    },
    correctAnswer: 'C'
  },
  {
    id: 21,
    question: "Which group emphasized privacy and digital money?",
    options: {
      A: "Bankers",
      B: "Cypherpunks",
      C: "Economists",
      D: "Politicians"
    },
    correctAnswer: 'B'
  },
  {
    id: 22,
    question: "What problem did Satoshi Nakamoto solve?",
    options: {
      A: "Inflation only",
      B: "Digital scarcity without central control",
      C: "Banking efficiency",
      D: "Faster fiat payments"
    },
    correctAnswer: 'B'
  },
  {
    id: 23,
    question: "Bitcoin was released during which crisis?",
    options: {
      A: "Dot-com bubble",
      B: "Asian financial crisis",
      C: "2008 global financial crisis",
      D: "COVID-19"
    },
    correctAnswer: 'C'
  },
  {
    id: 24,
    question: "Bitcoin's ledger is called:",
    options: {
      A: "Bank database",
      B: "Distributed spreadsheet",
      C: "Blockchain",
      D: "Accounting book"
    },
    correctAnswer: 'C'
  },
  {
    id: 25,
    question: "What proves ownership in Bitcoin?",
    options: {
      A: "Password",
      B: "Account name",
      C: "Private key",
      D: "Government ID"
    },
    correctAnswer: 'C'
  },
  {
    id: 26,
    question: "What happens if you lose your private key?",
    options: {
      A: "Bank resets it",
      B: "Wallet recovers it",
      C: "Funds are lost permanently",
      D: "Network restores access"
    },
    correctAnswer: 'C'
  },
  {
    id: 27,
    question: "Which step comes first in a Bitcoin transaction?",
    options: {
      A: "Mining",
      B: "Broadcasting",
      C: "Signing",
      D: "Confirmation"
    },
    correctAnswer: 'C'
  },
  {
    id: 28,
    question: "What role do miners play?",
    options: {
      A: "Approve users",
      B: "Create wallets",
      C: "Add transactions to blocks",
      D: "Store private keys"
    },
    correctAnswer: 'C'
  },
  {
    id: 29,
    question: "A block contains:",
    options: {
      A: "Only balances",
      B: "Only fees",
      C: "Transactions and hashes",
      D: "Wallet addresses"
    },
    correctAnswer: 'C'
  },
  {
    id: 30,
    question: "Why are hashes important?",
    options: {
      A: "They encrypt money",
      B: "They lock blocks together",
      C: "They store private keys",
      D: "They reduce fees"
    },
    correctAnswer: 'B'
  },
  {
    id: 31,
    question: "Why is blockchain hard to change?",
    options: {
      A: "It uses passwords",
      B: "Blocks depend on previous hashes",
      C: "Governments enforce it",
      D: "Miners refuse changes"
    },
    correctAnswer: 'B'
  },
  {
    id: 32,
    question: "Exchanges are best described as:",
    options: {
      A: "Wallets",
      B: "Miners",
      C: "On-ramps for acquiring Bitcoin",
      D: "Nodes"
    },
    correctAnswer: 'C'
  },
  {
    id: 33,
    question: "Why should Bitcoin be withdrawn from exchanges?",
    options: {
      A: "To reduce taxes",
      B: "Exchanges are slow",
      C: "You don't control the keys",
      D: "Fees are higher"
    },
    correctAnswer: 'C'
  },
  {
    id: 34,
    question: "A seed phrase is:",
    options: {
      A: "A password",
      B: "A recovery master key",
      C: "A wallet address",
      D: "A transaction ID"
    },
    correctAnswer: 'B'
  },
  {
    id: 35,
    question: "Why avoid address reuse?",
    options: {
      A: "Increases fees",
      B: "Slows confirmations",
      C: "Harms privacy",
      D: "Causes loss"
    },
    correctAnswer: 'C'
  },
  {
    id: 36,
    question: "Bitcoin uses which ownership model?",
    options: {
      A: "Account-based",
      B: "Credit-based",
      C: "UTXO-based",
      D: "Balance-based"
    },
    correctAnswer: 'C'
  },
  {
    id: 37,
    question: "What determines Bitcoin transaction fees?",
    options: {
      A: "Amount sent",
      B: "Wallet balance",
      C: "Transaction size (vB)",
      D: "Address type"
    },
    correctAnswer: 'C'
  },
  {
    id: 38,
    question: "Consolidation is best done when:",
    options: {
      A: "Fees are high",
      B: "Mempool is full",
      C: "Fees are low",
      D: "During halving"
    },
    correctAnswer: 'C'
  },
  {
    id: 39,
    question: "Hardware wallets are safer because:",
    options: {
      A: "They are expensive",
      B: "They store keys offline",
      C: "They connect faster",
      D: "They reduce fees"
    },
    correctAnswer: 'B'
  },
  {
    id: 40,
    question: "A PSBT is used to:",
    options: {
      A: "Create addresses",
      B: "Broadcast blocks",
      C: "Sign transactions securely",
      D: "Store keys"
    },
    correctAnswer: 'C'
  },
  {
    id: 41,
    question: "Lightning Network is best for:",
    options: {
      A: "Long-term storage",
      B: "Large settlements",
      C: "Fast, small payments",
      D: "Mining"
    },
    correctAnswer: 'C'
  },
  {
    id: 42,
    question: "Custodial Lightning wallets require:",
    options: {
      A: "Running a node",
      B: "Trust in a third party",
      C: "Hardware wallets",
      D: "Mining"
    },
    correctAnswer: 'B'
  },
  {
    id: 43,
    question: "Sidechains differ from Lightning because they:",
    options: {
      A: "Are slower",
      B: "Use on-chain settlement",
      C: "Have separate consensus",
      D: "Don't use Bitcoin"
    },
    correctAnswer: 'C'
  },
  {
    id: 44,
    question: "What does a block explorer allow you to do?",
    options: {
      A: "Send Bitcoin",
      B: "Mine blocks",
      C: "Verify transactions",
      D: "Create wallets"
    },
    correctAnswer: 'C'
  },
  {
    id: 45,
    question: "Running a node allows you to:",
    options: {
      A: "Earn rewards",
      B: "Trust banks",
      C: "Verify independently",
      D: "Control mining"
    },
    correctAnswer: 'C'
  },
  {
    id: 46,
    question: "Proof of Work is:",
    options: {
      A: "Easy to create, hard to verify",
      B: "Hard to create, easy to verify",
      C: "Centralized",
      D: "Optional"
    },
    correctAnswer: 'B'
  },
  {
    id: 47,
    question: "The current block reward (post-April 2024) is:",
    options: {
      A: "6.25 BTC",
      B: "12.5 BTC",
      C: "3.125 BTC",
      D: "1 BTC"
    },
    correctAnswer: 'C'
  },
  {
    id: 48,
    question: "Bitcoin's maximum supply is:",
    options: {
      A: "Unlimited",
      B: "100 million",
      C: "21 million",
      D: "2140 BTC"
    },
    correctAnswer: 'C'
  },
  {
    id: 49,
    question: "Mining difficulty adjusts every:",
    options: {
      A: "10 blocks",
      B: "1,000 blocks",
      C: "2,016 blocks",
      D: "210,000 blocks"
    },
    correctAnswer: 'C'
  },
  {
    id: 50,
    question: "Bitcoin best fits which money philosophy?",
    options: {
      A: "Chartalist",
      B: "Metallist",
      C: "Platform money",
      D: "Credit money"
    },
    correctAnswer: 'C'
  }
];
