/**
 * Seeds only real configuration: the administrator account, the NexusDevStudio
 * service catalogue, program settings and the affiliate resource library.
 *
 * No demo affiliates, leads, sales, commissions or payouts are created — every
 * number in the product comes from real activity.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SETTINGS_ID = "singleton";

const TERMS_EN = `## NexusDevStudio Affiliates — Program Terms

1. **Eligibility.** You must be 18 years of age or older to participate in the program.
2. **Application review.** Every application is reviewed manually. NexusDevStudio may accept or decline any application.
3. **No self-referrals.** You may not refer yourself, your own company, or accounts you control. Such referrals are rejected and do not generate commission.
4. **No fake leads.** Submitting fabricated, duplicated or non-consenting contact details is prohibited.
5. **No spam.** Unsolicited bulk messaging, comment spam and any activity that breaches a platform's terms of service is prohibited.
6. **No misleading advertising.** Do not misstate prices, delivery times, guarantees or anything else about NexusDevStudio services.
7. **No impersonation.** You may not present yourself as NexusDevStudio, an employee of NexusDevStudio, or as being able to make commitments on our behalf.
8. **No fraud.** Any attempt to manipulate tracking, attribution, commissions or payouts terminates participation immediately.
9. **Qualifying sales only.** Commission is earned only for completed sales where the customer's payment has been confirmed by NexusDevStudio.
10. **Cancelled and refunded sales.** Sales that are cancelled, charged back or refunded do not qualify, and any related commission may be cancelled.
11. **Suspension.** NexusDevStudio may suspend or terminate an affiliate account for fraud, abuse or breach of these terms.
12. **Changes.** These terms may change. Changes apply prospectively from the date they are published.
13. **Applicable law and platform rules.** You are responsible for complying with all applicable laws, tax obligations, advertising rules and the terms of the platforms you promote on.
14. **Payouts.** Commission becomes payable after approval by NexusDevStudio and once your balance reaches the published minimum payout threshold.
15. **No income guarantee.** NexusDevStudio makes no representation about the amount you may earn.`;

const TERMS_EL = `## NexusDevStudio Affiliates — Όροι προγράμματος

1. **Καταλληλότητα.** Πρέπει να είσαι 18 ετών ή μεγαλύτερος/η για να συμμετέχεις στο πρόγραμμα.
2. **Έλεγχος αίτησης.** Κάθε αίτηση ελέγχεται χειροκίνητα. Η NexusDevStudio μπορεί να αποδεχτεί ή να απορρίψει οποιαδήποτε αίτηση.
3. **Απαγόρευση αυτο-συστάσεων.** Δεν επιτρέπεται να συστήσεις τον εαυτό σου, την εταιρεία σου ή λογαριασμούς που ελέγχεις. Τέτοιες συστάσεις απορρίπτονται και δεν δημιουργούν προμήθεια.
4. **Απαγόρευση ψευδών leads.** Η υποβολή κατασκευασμένων, διπλών ή μη συναινετικών στοιχείων επικοινωνίας απαγορεύεται.
5. **Απαγόρευση spam.** Μαζικά ανεπιθύμητα μηνύματα, spam σε σχόλια και κάθε δραστηριότητα που παραβιάζει τους όρους μιας πλατφόρμας απαγορεύονται.
6. **Απαγόρευση παραπλανητικής διαφήμισης.** Μην παρουσιάζεις λανθασμένα τιμές, χρόνους παράδοσης, εγγυήσεις ή οτιδήποτε άλλο σχετικά με τις υπηρεσίες NexusDevStudio.
7. **Απαγόρευση πλαστοπροσωπίας.** Δεν επιτρέπεται να παρουσιάζεσαι ως NexusDevStudio, ως εργαζόμενος της NexusDevStudio ή ως πρόσωπο που δεσμεύει την εταιρεία.
8. **Απαγόρευση απάτης.** Κάθε απόπειρα χειραγώγησης της παρακολούθησης, της απόδοσης, των προμηθειών ή των πληρωμών τερματίζει άμεσα τη συμμετοχή.
9. **Μόνο επιλέξιμες πωλήσεις.** Προμήθεια κερδίζεται μόνο για ολοκληρωμένες πωλήσεις όπου η πληρωμή του πελάτη έχει επιβεβαιωθεί από τη NexusDevStudio.
10. **Ακυρωμένες και επιστραφείσες πωλήσεις.** Πωλήσεις που ακυρώνονται ή επιστρέφονται δεν είναι επιλέξιμες και η σχετική προμήθεια μπορεί να ακυρωθεί.
11. **Αναστολή.** Η NexusDevStudio μπορεί να αναστείλει ή να τερματίσει έναν λογαριασμό affiliate για απάτη, κατάχρηση ή παράβαση των όρων.
12. **Αλλαγές.** Οι όροι μπορούν να αλλάξουν. Οι αλλαγές ισχύουν για το μέλλον, από την ημερομηνία δημοσίευσής τους.
13. **Εφαρμοστέο δίκαιο και κανόνες πλατφορμών.** Είσαι υπεύθυνος/η για τη συμμόρφωση με τη νομοθεσία, τις φορολογικές υποχρεώσεις, τους κανόνες διαφήμισης και τους όρους των πλατφορμών όπου προωθείς.
14. **Πληρωμές.** Η προμήθεια γίνεται πληρωτέα μετά την έγκριση από τη NexusDevStudio και μόλις το υπόλοιπό σου φτάσει το δημοσιευμένο ελάχιστο ποσό.
15. **Καμία εγγύηση εισοδήματος.** Η NexusDevStudio δεν δίνει καμία υπόσχεση για το ποσό που μπορείς να κερδίσεις.`;

const PRIVACY_EN = `## Privacy policy

**What we collect.** For affiliates: name, email, phone, date of birth, social profiles, the text you submit in your application and your payout details. For referred customers: name, business name, email, phone and the service they are interested in. For referral links: the referral code, timestamp, landing path, source and campaign parameters, coarse device type, a hashed form of the IP address and an anonymous visitor identifier.

**Why we collect it.** To operate the affiliate program: reviewing applications, attributing referrals, calculating commission and processing payouts.

**IP addresses.** Raw IP addresses are not stored against referral clicks. They are hashed before storage.

**Payout details.** Bank and PayPal details are visible only to you and to NexusDevStudio administrators. They are never shown publicly or to other affiliates.

**Cookies.** We set a session cookie for authentication, a language preference cookie, and a referral attribution cookie when someone arrives through an affiliate referral link.

**Retention.** Affiliate, lead, sale, commission and payout records are retained for as long as required for accounting and audit purposes.

**Your rights.** You can request access to, correction of, or deletion of your personal data by contacting us.`;

const PRIVACY_EL = `## Πολιτική απορρήτου

**Τι συλλέγουμε.** Για affiliates: όνομα, email, τηλέφωνο, ημερομηνία γέννησης, προφίλ social, το κείμενο της αίτησής σου και τα στοιχεία πληρωμής σου. Για πελάτες που συστήνονται: όνομα, επωνυμία, email, τηλέφωνο και την υπηρεσία που τους ενδιαφέρει. Για links σύστασης: τον κωδικό σύστασης, χρονοσήμανση, σελίδα προορισμού, παραμέτρους πηγής και καμπάνιας, γενικό τύπο συσκευής, κρυπτογραφημένη μορφή της IP και ανώνυμο αναγνωριστικό επισκέπτη.

**Γιατί τα συλλέγουμε.** Για τη λειτουργία του προγράμματος affiliate: έλεγχο αιτήσεων, απόδοση συστάσεων, υπολογισμό προμηθειών και εκτέλεση πληρωμών.

**Διευθύνσεις IP.** Οι πραγματικές διευθύνσεις IP δεν αποθηκεύονται στα κλικ σύστασης. Κρυπτογραφούνται πριν την αποθήκευση.

**Στοιχεία πληρωμής.** Τα τραπεζικά και PayPal στοιχεία είναι ορατά μόνο σε εσένα και στους διαχειριστές της NexusDevStudio. Δεν εμφανίζονται ποτέ δημόσια ή σε άλλους affiliates.

**Cookies.** Χρησιμοποιούμε cookie συνεδρίας για την ταυτοποίηση, cookie προτίμησης γλώσσας και cookie απόδοσης σύστασης όταν κάποιος έρχεται μέσω link affiliate.

**Διατήρηση.** Οι εγγραφές affiliate, leads, πωλήσεων, προμηθειών και πληρωμών διατηρούνται για όσο απαιτείται για λογιστικούς και ελεγκτικούς σκοπούς.

**Τα δικαιώματά σου.** Μπορείς να ζητήσεις πρόσβαση, διόρθωση ή διαγραφή των προσωπικών σου δεδομένων επικοινωνώντας μαζί μας.`;

const SERVICES = [
  {
    slug: "landing-page",
    name: "Landing Page",
    nameEn: "Landing Page",
    nameEl: "Landing Page",
    descriptionEn:
      "A single focused page built to convert — ideal for a campaign, a launch or a first professional presence online.",
    descriptionEl:
      "Μία στοχευμένη σελίδα φτιαγμένη για μετατροπές — ιδανική για καμπάνια, λανσάρισμα ή την πρώτη επαγγελματική παρουσία online.",
    featuresEn: [
      "One high-converting page",
      "Mobile-first responsive design",
      "Contact form and click-to-call",
      "Basic on-page SEO",
      "Delivered ready to publish",
    ],
    featuresEl: [
      "Μία σελίδα υψηλής μετατροπής",
      "Responsive σχεδίαση mobile-first",
      "Φόρμα επικοινωνίας και κλήση με ένα κλικ",
      "Βασικό on-page SEO",
      "Παράδοση έτοιμη για δημοσίευση",
    ],
    startingPriceCents: 12_500,
    priceFrom: false,
    commissionType: "FIXED",
    commissionFixedCents: 1_500,
    commissionPercent: null,
    sortOrder: 1,
  },
  {
    slug: "portfolio-website",
    name: "Portfolio Website",
    nameEn: "Portfolio Website",
    nameEl: "Ιστοσελίδα Portfolio",
    descriptionEn:
      "A multi-page portfolio that shows the work properly — for photographers, designers, architects and freelancers.",
    descriptionEl:
      "Ένα portfolio πολλών σελίδων που παρουσιάζει σωστά τη δουλειά — για φωτογράφους, designers, αρχιτέκτονες και freelancers.",
    featuresEn: [
      "Up to 5 pages",
      "Project gallery with categories",
      "About and contact pages",
      "Optimised image delivery",
      "Social profile integration",
    ],
    featuresEl: [
      "Έως 5 σελίδες",
      "Gallery έργων με κατηγορίες",
      "Σελίδες about και επικοινωνίας",
      "Βελτιστοποιημένη παράδοση εικόνων",
      "Σύνδεση με προφίλ social",
    ],
    startingPriceCents: 15_000,
    priceFrom: false,
    commissionType: "FIXED",
    commissionFixedCents: 2_000,
    commissionPercent: null,
    sortOrder: 2,
  },
  {
    slug: "professional-website",
    name: "Professional Website",
    nameEn: "Professional Website",
    nameEl: "Επαγγελματική Ιστοσελίδα",
    descriptionEn:
      "A complete business website with services, pricing and lead capture — the standard choice for established businesses.",
    descriptionEl:
      "Μια ολοκληρωμένη επιχειρηματική ιστοσελίδα με υπηρεσίες, τιμές και συλλογή leads — η τυπική επιλογή για καθιερωμένες επιχειρήσεις.",
    featuresEn: [
      "Up to 10 pages",
      "Services and pricing sections",
      "Google Maps and business hours",
      "SEO structure and metadata",
      "Analytics setup",
      "One month of post-launch support",
    ],
    featuresEl: [
      "Έως 10 σελίδες",
      "Ενότητες υπηρεσιών και τιμών",
      "Google Maps και ώρες λειτουργίας",
      "Δομή SEO και metadata",
      "Εγκατάσταση analytics",
      "Ένας μήνας υποστήριξης μετά το launch",
    ],
    startingPriceCents: 20_000,
    priceFrom: false,
    commissionType: "FIXED",
    commissionFixedCents: 2_500,
    commissionPercent: null,
    sortOrder: 3,
  },
  {
    slug: "ecommerce-website",
    name: "E-Commerce Website",
    nameEn: "E-Commerce Website",
    nameEl: "Ηλεκτρονικό Κατάστημα",
    descriptionEn:
      "A full online shop with products, cart, checkout and payments — everything needed to start selling online.",
    descriptionEl:
      "Ένα πλήρες ηλεκτρονικό κατάστημα με προϊόντα, καλάθι, checkout και πληρωμές — ό,τι χρειάζεται για να ξεκινήσεις πωλήσεις online.",
    featuresEn: [
      "Product catalogue and categories",
      "Cart and checkout flow",
      "Card and bank transfer payments",
      "Order and stock management",
      "Shipping configuration",
      "Admin training session",
    ],
    featuresEl: [
      "Κατάλογος προϊόντων και κατηγορίες",
      "Καλάθι και διαδικασία checkout",
      "Πληρωμές με κάρτα και τραπεζική κατάθεση",
      "Διαχείριση παραγγελιών και αποθέματος",
      "Ρύθμιση μεταφορικών",
      "Εκπαίδευση στη διαχείριση",
    ],
    startingPriceCents: 30_000,
    priceFrom: false,
    commissionType: "FIXED",
    commissionFixedCents: 4_000,
    commissionPercent: null,
    sortOrder: 4,
  },
  {
    slug: "custom-web-app",
    name: "Custom Web App",
    nameEn: "Custom Web App",
    nameEl: "Custom Web Εφαρμογή",
    descriptionEn:
      "A bespoke application built around a specific workflow — booking systems, dashboards, portals and internal tools.",
    descriptionEl:
      "Μια custom εφαρμογή γύρω από μια συγκεκριμένη ροή εργασίας — συστήματα κρατήσεων, dashboards, portals και εσωτερικά εργαλεία.",
    featuresEn: [
      "Requirements and scoping session",
      "Custom database and business logic",
      "User accounts and roles",
      "Integrations with third-party services",
      "Staged delivery with review points",
    ],
    featuresEl: [
      "Συνάντηση καταγραφής απαιτήσεων",
      "Custom βάση δεδομένων και επιχειρησιακή λογική",
      "Λογαριασμοί χρηστών και ρόλοι",
      "Ενσωματώσεις με υπηρεσίες τρίτων",
      "Σταδιακή παράδοση με σημεία ελέγχου",
    ],
    startingPriceCents: 50_000,
    priceFrom: true,
    commissionType: "PERCENT",
    commissionFixedCents: null,
    commissionPercent: 10,
    sortOrder: 5,
  },
] as const;

const RESOURCES = [
  {
    titleEn: "TikTok hook: the €125 website",
    titleEl: "TikTok hook: η ιστοσελίδα των €125",
    descriptionEn:
      "A short opening line that works well for small local businesses scrolling on their phone.",
    descriptionEl:
      "Μια σύντομη εισαγωγική φράση που δουλεύει καλά για μικρές τοπικές επιχειρήσεις.",
    type: "SCRIPT",
    contentEn:
      "Stop. If your business still has no website in 2026, you are losing customers to the shop next door. A professional landing page from NexusDevStudio starts at €125. Comment WEBSITE or DM them my code and they will walk you through it.",
    contentEl:
      "Στοπ. Αν η επιχείρησή σου δεν έχει ακόμη ιστοσελίδα το 2026, χάνεις πελάτες από το μαγαζί δίπλα. Επαγγελματική landing page από τη NexusDevStudio ξεκινά από €125. Γράψε ΙΣΤΟΣΕΛΙΔΑ ή στείλε DM με τον κωδικό μου και θα σου εξηγήσουν όλα.",
    sortOrder: 1,
  },
  {
    titleEn: "Instagram Reel idea: before / after",
    titleEl: "Ιδέα για Instagram Reel: πριν / μετά",
    descriptionEn:
      "Show a business with no online presence, then the finished site. Works best at 12–18 seconds.",
    descriptionEl:
      "Δείξε μια επιχείρηση χωρίς online παρουσία και μετά το τελικό site. Δουλεύει καλύτερα στα 12–18 δευτερόλεπτα.",
    type: "IDEA",
    contentEn:
      "Shot 1: a Google search that returns nothing for the business. Shot 2: the phone opening their new site. Text overlay: 'From invisible to bookable in 7 days.' End card: 'Mention code {your code}.'",
    contentEl:
      "Πλάνο 1: αναζήτηση Google που δεν επιστρέφει τίποτα για την επιχείρηση. Πλάνο 2: το κινητό ανοίγει το νέο site. Κείμενο: «Από αόρατος σε ορατός σε 7 ημέρες.» Τελική κάρτα: «Ανάφερε τον κωδικό {ο κωδικός σου}.»",
    sortOrder: 2,
  },
  {
    titleEn: "Caption pack: local businesses",
    titleEl: "Πακέτο λεζάντων: τοπικές επιχειρήσεις",
    descriptionEn: "Three ready captions you can adapt. Always add your referral code.",
    descriptionEl:
      "Τρεις έτοιμες λεζάντες που μπορείς να προσαρμόσεις. Πρόσθετε πάντα τον κωδικό σύστασής σου.",
    type: "CAPTION",
    contentEn:
      "1. Your customers search before they visit. Make sure they find you. Websites from €125 — mention my code.\n2. A menu photo in your bio is not a website. NexusDevStudio builds the real thing from €125.\n3. Taking bookings over DM at 11pm? A professional site does it for you. Ask about my referral code.",
    contentEl:
      "1. Οι πελάτες σου ψάχνουν πριν έρθουν. Φρόντισε να σε βρίσκουν. Ιστοσελίδες από €125 — ανάφερε τον κωδικό μου.\n2. Μια φωτογραφία μενού στο bio δεν είναι ιστοσελίδα. Η NexusDevStudio φτιάχνει το σωστό, από €125.\n3. Κλείνεις ραντεβού με DM στις 11 το βράδυ; Μια επαγγελματική ιστοσελίδα το κάνει για σένα. Ρώτα για τον κωδικό σύστασής μου.",
    sortOrder: 3,
  },
  {
    titleEn: "Promotion guidelines",
    titleEl: "Οδηγίες προώθησης",
    descriptionEn:
      "What you can and cannot say when promoting NexusDevStudio. Read this before your first post.",
    descriptionEl:
      "Τι μπορείς και τι δεν μπορείς να λες όταν προωθείς τη NexusDevStudio. Διάβασέ το πριν την πρώτη ανάρτηση.",
    type: "GUIDELINE",
    contentEn:
      "Do: quote the published starting prices, say the domain costs €15 extra, describe yourself as an affiliate.\nDo not: promise delivery dates, quote a custom price, offer discounts we have not published, present yourself as an employee of NexusDevStudio, or contact people who have not asked to be contacted.",
    contentEl:
      "Κάνε: ανάφερε τις δημοσιευμένες αρχικές τιμές, πες ότι το domain κοστίζει €15 επιπλέον, παρουσιάσου ως affiliate.\nΜην κάνεις: μην υπόσχεσαι ημερομηνίες παράδοσης, μην δίνεις custom τιμή, μην προσφέρεις εκπτώσεις που δεν έχουμε δημοσιεύσει, μην παρουσιάζεσαι ως εργαζόμενος της NexusDevStudio και μην επικοινωνείς με άτομα που δεν το ζήτησαν.",
    sortOrder: 4,
  },
  {
    titleEn: "Objection handling: “it's too expensive”",
    titleEl: "Αντίρρηση: «είναι πολύ ακριβό»",
    descriptionEn: "How to respond when a business owner hesitates on price.",
    descriptionEl: "Πώς να απαντήσεις όταν ένας επιχειρηματίας διστάζει για την τιμή.",
    type: "SCRIPT",
    contentEn:
      "“I understand. One landing page at €125 is roughly what two days of ads cost — except the page keeps working every month after that. And if you only need something simple, that is exactly what the €125 package is for.”",
    contentEl:
      "«Καταλαβαίνω. Μια landing page στα €125 είναι περίπου όσο δύο μέρες διαφήμισης — μόνο που η σελίδα συνεχίζει να δουλεύει κάθε μήνα μετά. Και αν χρειάζεσαι κάτι απλό, γι' αυτό υπάρχει ακριβώς το πακέτο των €125.»",
    sortOrder: 5,
  },
  {
    titleEn: "Current offer: domain included messaging",
    titleEl: "Τρέχουσα προσφορά: μήνυμα για το domain",
    descriptionEn: "How to present the €15 domain add-on without confusing the price.",
    descriptionEl: "Πώς να παρουσιάσεις το domain των €15 χωρίς να μπερδέψεις την τιμή.",
    type: "OFFER",
    contentEn:
      "Always quote the package price first, then the domain as a separate line: “Landing page €125, plus €15 for the domain if you don't already own one.”",
    contentEl:
      "Ανάφερε πρώτα την τιμή του πακέτου και μετά το domain ξεχωριστά: «Landing page €125, συν €15 για το domain αν δεν έχεις ήδη.»",
    sortOrder: 6,
  },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@nexusdevstudio.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "NexusAdmin!2026";
  const adminName = process.env.ADMIN_NAME ?? "NexusDevStudio Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", name: adminName, isActive: true },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      name: adminName,
      locale: "el",
    },
  });
  console.log(`✔ admin user ${admin.email}`);

  await prisma.programSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: {
      id: SETTINGS_ID,
      programName: "NexusDevStudio Affiliates",
      programActive: true,
      minPayoutCents: 5_000,
      referralCookieDays: 30,
      domainFeeCents: 1_500,
      defaultCommissionType: "FIXED",
      defaultCommissionFixedCents: 2_000,
      defaultCommissionPercent: 10,
      contactEmail: "hello@nexusdevstudio.com",
      termsContentEn: TERMS_EN,
      termsContentEl: TERMS_EL,
      privacyContentEn: PRIVACY_EN,
      privacyContentEl: PRIVACY_EL,
      paymentInstructionsEn:
        "Payouts are made by bank transfer or PayPal within 10 working days of approval. Make sure your payout details are complete and match your legal name.",
      paymentInstructionsEl:
        "Οι πληρωμές γίνονται με τραπεζική κατάθεση ή PayPal εντός 10 εργάσιμων ημερών από την έγκριση. Βεβαιώσου ότι τα στοιχεία πληρωμής είναι πλήρη και αντιστοιχούν στο πραγματικό σου όνομα.",
    },
  });
  console.log("✔ program settings");

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        nameEn: service.nameEn,
        nameEl: service.nameEl,
        descriptionEn: service.descriptionEn,
        descriptionEl: service.descriptionEl,
        featuresEn: JSON.stringify(service.featuresEn),
        featuresEl: JSON.stringify(service.featuresEl),
        startingPriceCents: service.startingPriceCents,
        priceFrom: service.priceFrom,
        commissionType: service.commissionType,
        commissionFixedCents: service.commissionFixedCents,
        commissionPercent: service.commissionPercent,
        sortOrder: service.sortOrder,
        isActive: true,
      },
      create: {
        slug: service.slug,
        name: service.name,
        nameEn: service.nameEn,
        nameEl: service.nameEl,
        descriptionEn: service.descriptionEn,
        descriptionEl: service.descriptionEl,
        featuresEn: JSON.stringify(service.featuresEn),
        featuresEl: JSON.stringify(service.featuresEl),
        startingPriceCents: service.startingPriceCents,
        priceFrom: service.priceFrom,
        commissionType: service.commissionType,
        commissionFixedCents: service.commissionFixedCents,
        commissionPercent: service.commissionPercent,
        sortOrder: service.sortOrder,
        isActive: true,
      },
    });
  }
  console.log(`✔ ${SERVICES.length} services`);

  for (const resource of RESOURCES) {
    const existing = await prisma.affiliateResource.findFirst({
      where: { titleEn: resource.titleEn },
      select: { id: true },
    });
    if (existing) {
      await prisma.affiliateResource.update({
        where: { id: existing.id },
        data: { ...resource, isActive: true },
      });
    } else {
      await prisma.affiliateResource.create({ data: { ...resource, isActive: true } });
    }
  }
  console.log(`✔ ${RESOURCES.length} affiliate resources`);

  for (const name of ["LD", "SL", "PO"]) {
    await prisma.counter.upsert({ where: { name }, update: {}, create: { name, value: 0 } });
  }
  console.log("✔ reference counters");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
