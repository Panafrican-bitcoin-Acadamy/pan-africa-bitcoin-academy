# Chapter 17: Multi-Sig (Collaborative Custody)

## 17.0 Why Multi-Sig (Family/Orgs/Inheritance)
- Multiple signatures reduce single-point risk; good for shared or inherited funds.

## 17.1 M-of-N Designs; Coordinator vs Coordinator-Less
- 2-of-3, etc.; coordinator simplifies UX but adds a trust point; coordinator-less maximizes sovereignty.
- Secure key generation, distribution, and rotation are essential.

## 17.2 Backup Strategies and Operational Playbooks
- Geographic backups, encrypted storage, recovery drills, emergency access, and key rotation plans.

### Activity: Design a 2-of-3 Family Custody Plan
- Define keys, backups, signing flow (PSBT), and emergency procedures.

---

## Assignment: Multi-Sig Simulator

Complete the **Multi-Sig Simulator** at the end of this chapter. The assignment follows this architecture:

**Seed (local generation) → derive public key → share public key → verify partner key → construct multisig descriptor.**

### Step 1 — Seed phrase creation and verification
- Generate a 12-word BIP39 mnemonic in the browser (never stored on any server).
- Write it down, then re-enter the words in order to verify.
- From the mnemonic you derive: **seed → master key → xpub**. Only the **xpub** is used later; the seed phrase is never shared.

### Step 2 — Pair key exchange
- Each participant produces a **public key package** with identity so the UI can show who you are creating the multisig with:
  - Format: `MSKEY:Name:xpub...`
  - Example: `MSKEY:JohnDoe:xpub6CUGRU...`
- Copy your key and send it to your partner; paste your partner’s key in the simulator.
- Validation: format must start with `MSKEY`; then extract name and xpub. The UI will show: *"You are creating a multisig wallet with {PartnerName}"*.

### Step 3 — Multisig wallet construction
- The system combines both extended public keys into a **2-of-2 multisig**.
- A descriptor is generated (Electrum-style): `wsh(sortedmulti(2,xpub1,xpub2))`.
- The UI shows participants, policy (2-of-2), and a note that receive addresses are derived by your wallet from this descriptor.
- Optional: use the **signing simulation** (Create tx → Alice signs 1/2 → Bob signs 2/2 → Broadcast) to see that both keys are required.

### Security rule (emphasized)
- **Seed phrase** → never shared.
- **Public key (xpub)** → safe to share.

This distinction is exactly what multisig collaboration teaches: you share only public keys to build the wallet; seeds stay private.

