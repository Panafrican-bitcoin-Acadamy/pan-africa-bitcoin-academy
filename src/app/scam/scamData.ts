/**
 * Scam types per section — titles and short descriptions.
 * Expand "howItWorks" / "warningSigns" in content as needed.
 */

export type InvestmentScamCard = {
  title: string;
  explanation: string;
  howItWorks: string;
  warningSigns: string;
};

export type SocialScamCard = {
  title: string;
  scenario: string;
  manipulation: string;
  warningSigns: string;
};

export type TechnicalScamCard = {
  title: string;
  technicalExplanation: string;
  example: string;
  preventionTips: string;
};

export type MalwareScamCard = {
  title: string;
  howAttackWorks: string;
  howPressured: string;
  preventionAdvice: string;
};

export const investmentScams: InvestmentScamCard[] = [
  { title: "Fake investment platforms", explanation: "Websites that look like real exchanges or brokers but steal deposits.", howItWorks: "You sign up, deposit funds, and see fake gains. When you try to withdraw, you are blocked or asked for more fees.", warningSigns: "Unregulated, no real company behind it, withdrawal delays, requests for more money to unlock." },
  { title: "High-yield investment programs (HYIPs)", explanation: "Programs promising unusually high, steady returns.", howItWorks: "They pay early investors with money from new investors until the scheme collapses.", warningSigns: "Returns that sound too good (e.g. 1% daily), pressure to reinvest, no clear business model." },
  { title: "Ponzi schemes", explanation: "Returns are paid from new investors’ money, not from real profit.", howItWorks: "Operators recruit new people to fund payouts. When recruitment slows, the scheme fails.", warningSigns: "Focus on recruiting others, guaranteed returns, unclear or secret strategy." },
  { title: "Pyramid schemes", explanation: "Earnings depend on recruiting others rather than selling a real product.", howItWorks: "You pay to join and earn by bringing in more members. Most people at the bottom lose money.", warningSigns: "Heavy focus on recruiting, upfront fees, promise of passive income from referrals." },
  { title: "“Guaranteed returns” trading bots", explanation: "Software or services that claim to trade for you with guaranteed profits.", howItWorks: "You connect API keys or send funds. Bots may be fake; profits are fabricated or from other victims.", warningSigns: "Guaranteed or very high returns, pressure to deposit more, no verifiable track record." },
  { title: "Fake crypto hedge funds", explanation: "Entities posing as professional funds managing crypto assets.", howItWorks: "They take your Bitcoin or cash, show fake performance, and disappear or refuse withdrawals.", warningSigns: "No regulatory registration, no audited results, opaque team or location." },
  { title: "Rug pulls", explanation: "Developers drain liquidity or abandon a project after people invest.", howItWorks: "A token or project gains attention; insiders sell or remove funds, leaving the token worthless.", warningSigns: "Anonymous team, liquidity not locked, code not audited, hype over substance." },
  { title: "Pump-and-dump groups", explanation: "Coordinated groups inflate a token’s price then sell, leaving others with losses.", howItWorks: "Organizers buy first, promote the token, then sell when others buy. Price crashes.", warningSigns: "Private groups promising “calls,” heavy hype, pressure to buy quickly." },
  { title: "Fake ICO / IDO / token sales", explanation: "Fake or fraudulent token launches that take money and deliver nothing.", howItWorks: "You send crypto to “participate”; the token never lists or is worthless; team vanishes.", warningSigns: "Unverified team, no real product, urgency to send funds, too-good promises." },
  { title: "Fake mining investment scams", explanation: "Offers to invest in mining operations that do not exist or are misrepresented.", howItWorks: "You pay for “mining contracts” or “hash power”; returns are fake or from new investors.", warningSigns: "Unrealistic returns, no proof of mining, company not traceable." },
  { title: "Cloud mining scams", explanation: "Rental of “mining power” that is often fake or unsustainable.", howItWorks: "You pay for hashrate; either there is no real mining or returns stop after a short time.", warningSigns: "Long-term contracts, promises of steady profit, company based in unclear jurisdictions." },
  { title: "Fake staking programs (e.g. wrapped BTC)", explanation: "Fake or misleading staking or “wrapped” schemes promising yield.", howItWorks: "You lock or send Bitcoin; promised returns are paid from new users or never materialize.", warningSigns: "Unusually high APY, unclear smart contracts, unofficial or copycat sites." },
  { title: "Fake arbitrage opportunities", explanation: "Claims of risk-free profit from price differences across platforms.", howItWorks: "You send funds to “execute” arbitrage; the platform or bot is controlled by scammers.", warningSigns: "Risk-free or guaranteed profit, need to send funds to a third party." },
  { title: "Telegram trading group scams", explanation: "Groups that charge for “signals” or “calls” that are often fake or used to pump and dump.", howItWorks: "You pay to join; “signals” may be late, wrong, or used to move price against you.", warningSigns: "Paid access, screenshots of gains only, no accountability for losses." },
  { title: "Signal copying scams", explanation: "Services that claim to copy “expert” trades automatically.", howItWorks: "You connect exchange API or send funds; trades may be fake, late, or used to benefit the operator.", warningSigns: "Too-good performance, full API access requested, unverified track record." },
  { title: "Insider trading tip scams", explanation: "Fake “insider” or “leak” information sold as trading tips.", howItWorks: "You pay for “exclusive” info; it is either public, wrong, or used to manipulate price.", warningSigns: "Secret or exclusive tips, pressure to act fast, request for payment in crypto." },
  { title: "AI trading bot scams", explanation: "Bots claiming to use AI for guaranteed or very high returns.", howItWorks: "You deposit or connect API; the “AI” is often a front for a Ponzi or theft.", warningSigns: "Guaranteed profits, little transparency, requests for large deposits." },
  { title: "Fake Bitcoin doubling schemes", explanation: "Promises to “double” or multiply your Bitcoin if you send it to an address.", howItWorks: "You send Bitcoin; nothing is returned. There is no doubling mechanism.", warningSigns: "Anyone offering to double Bitcoin is a scam. No legitimate service does this." },
  { title: "Cloud wallet exit scams", explanation: "Online “wallets” or platforms that shut down and take users’ funds.", howItWorks: "You store crypto on their platform; one day it goes offline and funds are gone.", warningSigns: "Not your keys, not your coins. Custodial services can disappear." },
];

export const socialScams: SocialScamCard[] = [
  { title: "Impersonation (celebrities, influencers)", scenario: "Fake accounts or deepfakes of famous people promote a giveaway or investment.", manipulation: "Authority and trust in the figure; urgency and exclusivity.", warningSigns: "Celebrities do not give away Bitcoin in DMs. Check verified badges and official links." },
  { title: "Social media giveaway scams", scenario: "Posts claiming “send 0.1 BTC, get 1 BTC back” or similar.", manipulation: "Greed and FOMO; fake proof from “winners.”", warningSigns: "No company gives away crypto for sending crypto first. It is always a scam." },
  { title: "Elon Musk / Tesla giveaway scams", scenario: "Fake Elon or Tesla promotions offering double-your-Bitcoin or free cars.", manipulation: "Trust in a famous name; urgency and limited “slots.”", warningSigns: "Elon Musk and Tesla do not run Bitcoin giveaways. Any such offer is fake." },
  { title: "Deepfake video endorsement scams", scenario: "Videos that look like a CEO or celebrity endorsing a project or exchange.", manipulation: "Realistic video creates false trust.", warningSigns: "Verify on official channels. Deepfakes are increasingly common in crypto scams." },
  { title: "Giveaway livestream scams", scenario: "Fake livestreams of events with a “send Bitcoin to participate” address.", manipulation: "Liveness and event context; fake countdown and “winners.”", warningSigns: "Legitimate events do not ask you to send crypto to an address to “participate.”" },
  { title: "Romance scams (pig-butchering)", scenario: "Someone builds a relationship online, then introduces “investments” and takes your money.", manipulation: "Emotional attachment, trust over time, gradual financial requests.", warningSigns: "Meeting only online, refusal to video call, quick talk of investing together." },
  { title: "Fake customer support scams", scenario: "Impersonators offer “help” via chat, email, or social media and ask for keys or login.", manipulation: "Urgency (“your account will be locked”); authority of “support.”", warningSigns: "Real support never asks for seed phrase, password, or 2FA codes." },
  { title: "Tech support scams demanding Bitcoin", scenario: "Call or pop-up claiming your device is infected; payment in Bitcoin to “fix” it.", manipulation: "Fear and urgency; fake “technician” authority.", warningSigns: "No legitimate company demands payment in Bitcoin for tech support. Hang up." },
  { title: "Fake job offers paying in crypto", scenario: "Job listing pays in crypto or asks you to “receive and send” funds as part of work.", manipulation: "Need for income; legitimacy of “employer.”", warningSigns: "Real jobs do not ask you to move crypto through your own wallet. Often overpayment scam." },
  { title: "Employment “task” scams", scenario: "You are paid to do small tasks, then asked to “invest” or pay fees to unlock more.", manipulation: "Initial small payouts build trust; then larger “investments” or fees.", warningSigns: "Any job that requires you to pay or invest to continue is a scam." },
  { title: "Advance-fee scams", scenario: "You are told you have won or inherited something but must pay fees or taxes first.", manipulation: "Greed; urgency and official-sounding language.", warningSigns: "You should never pay to receive a prize or inheritance. It is a scam." },
  { title: "Charity donation scams", scenario: "Fake charities or disaster relief asking for Bitcoin donations.", manipulation: "Emotional appeal; desire to help.", warningSigns: "Verify charity via official websites. Do not send crypto to addresses from social media or email." },
  { title: "Fake tax / IRS payment demands in BTC", scenario: "Emails or calls claiming you owe taxes and must pay in Bitcoin.", manipulation: "Fear of authority; urgency and threats.", warningSigns: "Tax authorities do not demand payment in Bitcoin. Do not pay via crypto to “tax” addresses." },
  { title: "Fake recovery service scams", scenario: "Offers to “recover” lost or stolen crypto for a fee or access to your wallet.", manipulation: "Hope of getting funds back; authority of “recovery experts.”", warningSigns: "Recovery services that ask for fee upfront or your keys are usually scams." },
  { title: "Escrow scams", scenario: "Fake escrow services or “middlemen” that take funds and disappear.", manipulation: "Trust in a third party to hold funds fairly.", warningSigns: "Use only well-known escrow. Verify the service; fake escrow sites are common." },
  { title: "Overpayment / refund scams", scenario: "Buyer “overpays” and asks you to send back the difference; original payment is fraudulent.", manipulation: "Confusion and desire to be honest; pressure to refund quickly.", warningSigns: "If you sell something and receive “too much,” the initial payment may reverse. Do not send “refunds” in crypto." },
];

export const technicalScams: TechnicalScamCard[] = [
  { title: "Fake crypto exchanges", technicalExplanation: "Sites that mimic real exchanges to steal login credentials and funds.", example: "Clone of a well-known exchange with a slightly different URL.", preventionTips: "Bookmark official sites; check URL and SSL; never enter credentials from an email link." },
  { title: "Fake wallet apps", technicalExplanation: "Apps that look like real wallets but capture seed phrases or private keys.", example: "Wallet app in an app store that is not the official developer.", preventionTips: "Download only from official sources; verify developer name; consider hardware wallets." },
  { title: "Phishing emails (exchange login theft)", technicalExplanation: "Emails with links to fake login pages that steal usernames and passwords.", example: "“Your account will be suspended – log in here” with a fake link.", preventionTips: "Never click login links in email. Go to the exchange directly. Use 2FA." },
  { title: "Fake airdrops", technicalExplanation: "Fake token claims that require connecting a wallet or signing a transaction that drains funds.", example: "“Claim free tokens” site that asks for wallet connect or approval.", preventionTips: "Do not connect wallets to unknown sites. Real airdrops rarely require signing." },
  { title: "Seed phrase theft scams", technicalExplanation: "Tricks to get you to type or share your 12/24-word recovery phrase.", example: "Fake “wallet verification” or “support” asking for your phrase.", preventionTips: "Never type or share your seed phrase with anyone. No legitimate service needs it." },
  { title: "Crypto drainers (wallet-connect scams)", technicalExplanation: "Sites or dApps that request unlimited approval to spend your tokens.", example: "Connecting wallet to a “mint” or “claim” site that asks for full token approval.", preventionTips: "Revoke approvals on chain when not needed. Use a burner wallet for unknown dApps." },
  { title: "Fake browser extensions", technicalExplanation: "Extensions that replace addresses or steal data when you copy/paste or sign.", example: "“Wallet” or “portfolio” extension that swaps your send address.", preventionTips: "Install only official extensions; remove unused ones; double-check addresses before sending." },
  { title: "Fake Bitcoin forks / upgrade scams", technicalExplanation: "Claims you must “upgrade” or “claim” fork coins by sending Bitcoin or keys.", example: "“Send your BTC to get new fork coin.”", preventionTips: "No upgrade requires sending Bitcoin or your keys. Ignore fork/upgrade pressure." },
  { title: "NFT phishing (e.g. BTC Ordinals)", technicalExplanation: "Fake mint or claim pages that drain wallets when you sign.", example: "Fake Ordinals or NFT site with “sign to mint” that actually transfers assets.", preventionTips: "Verify project and URL. Use a separate wallet for risky mints." },
  { title: "QR code replacement scams", technicalExplanation: "Malware or physical tampering replaces your receive QR or address with the scammer’s.", example: "Malware changes copied address; or sticker on a real ATM.", preventionTips: "Always verify a few characters of the address. Check QR on device screen." },
  { title: "Address poisoning attacks", technicalExplanation: "Scammers send tiny amounts so a similar-looking address appears in your history.", example: "You copy “recent” address and send to a scammer’s lookalike.", preventionTips: "Never copy from history without verifying. Always check full address." },
  { title: "Dusting attacks", technicalExplanation: "Small amounts sent to link addresses to identity or to promote scam tokens.", example: "Unexpected token in wallet with link to malicious site.", preventionTips: "Do not interact with unknown tokens. Ignore or hide them; do not “claim” or sell via unknown links." },
  { title: "SIM-swap attacks", technicalExplanation: "Attacker takes over your phone number to reset 2FA and access accounts.", example: "You lose SMS 2FA; attacker logs into exchange and withdraws.", preventionTips: "Use app-based 2FA (not SMS) where possible. Protect your SIM with your carrier." },
  { title: "Fake hardware wallet resellers", technicalExplanation: "Unauthorized sellers ship tampered or pre-seeded devices.", example: "Cheap “Ledger” from third-party site with seed phrase already set.", preventionTips: "Buy only from official stores. Set up device yourself; never use pre-written seed." },
  { title: "Counterfeit hardware wallets", technicalExplanation: "Fake devices that look like Trezor/Ledger but steal keys or show fake screens.", example: "Device that records your seed or shows a different receive address.", preventionTips: "Purchase from official sources only. Verify packaging and firmware." },
  { title: "Fake Bitcoin ATMs", technicalExplanation: "ATMs or kiosks that overcharge, steal data, or are front-ends for scams.", example: "Unbranded “Bitcoin ATM” with huge fees or that asks for remote access.", preventionTips: "Use known operators; check fees and limits; never allow remote access." },
];

export const malwareScams: MalwareScamCard[] = [
  { title: "Malware clipboard hijacking", howAttackWorks: "Malware replaces the Bitcoin address in your clipboard with the attacker’s when you paste.", howPressured: "You believe you are sending to the right address; no coercion, just stealth.", preventionAdvice: "Always verify the first and last characters of the address before sending." },
  { title: "Malware disguised as trading software", howAttackWorks: "Trojans bundled with “trading tools” or “signals” apps that steal keys or take over the machine.", howPressured: "You install willingly; malware runs in background.", preventionAdvice: "Only use software from official or well-known sources. Use a separate device for large holdings." },
  { title: "Ransomware payments in Bitcoin", howAttackWorks: "Ransomware encrypts your files and demands Bitcoin to get a decryption key.", howPressured: "You must pay or lose data; attackers often threaten to leak data.", preventionAdvice: "Keep backups offline. Do not pay if possible; report to authorities. Harden systems." },
  { title: "Sextortion emails demanding BTC", howAttackWorks: "Emails claiming the sender has compromising material and will share it unless you pay in Bitcoin.", howPressured: "Shame and fear; often no real material exists.", preventionAdvice: "Do not pay. Block and report. These are almost always bluffs." },
  { title: "Blackmail with leaked passwords", howAttackWorks: "Attacker claims to have your passwords (from past breaches) and demands Bitcoin.", howPressured: "Fear of account takeover or exposure.", preventionAdvice: "Change passwords; use 2FA. Do not pay. They rarely have active access." },
  { title: "OTC trading fraud", howAttackWorks: "Peer-to-peer or “over the counter” deals where one party takes funds and does not deliver.", howPressured: "Trust in “reputable” counterparty; urgency to complete deal.", preventionAdvice: "Use escrow or known platforms. Verify identity; avoid deals that skip safeguards." },
  { title: "Dark web marketplace exit scams", howAttackWorks: "Marketplace or vendor takes deposits and disappears; no product or refund.", howPressured: "Trust in the platform; often no recourse.", preventionAdvice: "Assume high risk. Do not leave large balances on such platforms." },
];
