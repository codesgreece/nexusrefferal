import "server-only";

import type { ProgramSettings } from "@prisma/client";

import { prisma } from "@/lib/db";

export const SETTINGS_ID = "singleton";

export const DEFAULT_TERMS_EN = `## NexusDevStudio Affiliates — Program Terms

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

export const DEFAULT_TERMS_EL = `## NexusDevStudio Affiliates — Όροι προγράμματος

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

export const DEFAULT_PRIVACY_EN = `## Privacy policy

**What we collect.** For affiliates: name, email, phone, date of birth, social profiles, the text you submit in your application and your payout details. For referred customers: name, business name, email, phone and the service they are interested in. For referral links: the referral code, timestamp, landing path, source and campaign parameters, coarse device type, a hashed form of the IP address and an anonymous visitor identifier.

**Why we collect it.** To operate the affiliate program: reviewing applications, attributing referrals, calculating commission and processing payouts.

**IP addresses.** Raw IP addresses are not stored against referral clicks. They are hashed before storage.

**Payout details.** Bank and PayPal details are visible only to you and to NexusDevStudio administrators. They are never shown publicly or to other affiliates.

**Cookies.** We set a session cookie for authentication, a language preference cookie, and a referral attribution cookie when someone arrives through an affiliate referral link.

**Retention.** Affiliate, lead, sale, commission and payout records are retained for as long as required for accounting and audit purposes.

**Your rights.** You can request access to, correction of, or deletion of your personal data by contacting us.`;

export const DEFAULT_PRIVACY_EL = `## Πολιτική απορρήτου

**Τι συλλέγουμε.** Για affiliates: όνομα, email, τηλέφωνο, ημερομηνία γέννησης, προφίλ social, το κείμενο της αίτησής σου και τα στοιχεία πληρωμής σου. Για πελάτες που συστήνονται: όνομα, επωνυμία, email, τηλέφωνο και την υπηρεσία που τους ενδιαφέρει. Για links σύστασης: τον κωδικό σύστασης, χρονοσήμανση, σελίδα προορισμού, παραμέτρους πηγής και καμπάνιας, γενικό τύπο συσκευής, κρυπτογραφημένη μορφή της IP και ανώνυμο αναγνωριστικό επισκέπτη.

**Γιατί τα συλλέγουμε.** Για τη λειτουργία του προγράμματος affiliate: έλεγχο αιτήσεων, απόδοση συστάσεων, υπολογισμό προμηθειών και εκτέλεση πληρωμών.

**Διευθύνσεις IP.** Οι πραγματικές διευθύνσεις IP δεν αποθηκεύονται στα κλικ σύστασης. Κρυπτογραφούνται πριν την αποθήκευση.

**Στοιχεία πληρωμής.** Τα τραπεζικά και PayPal στοιχεία είναι ορατά μόνο σε εσένα και στους διαχειριστές της NexusDevStudio. Δεν εμφανίζονται ποτέ δημόσια ή σε άλλους affiliates.

**Cookies.** Χρησιμοποιούμε cookie συνεδρίας για την ταυτοποίηση, cookie προτίμησης γλώσσας και cookie απόδοσης σύστασης όταν κάποιος έρχεται μέσω link affiliate.

**Διατήρηση.** Οι εγγραφές affiliate, leads, πωλήσεων, προμηθειών και πληρωμών διατηρούνται για όσο απαιτείται για λογιστικούς και ελεγκτικούς σκοπούς.

**Τα δικαιώματά σου.** Μπορείς να ζητήσεις πρόσβαση, διόρθωση ή διαγραφή των προσωπικών σου δεδομένων επικοινωνώντας μαζί μας.`;

const DEFAULT_PAYMENT_INSTRUCTIONS_EN =
  "Payouts are made by bank transfer or PayPal within 10 working days of approval. Make sure your payout details are complete and match your legal name.";
const DEFAULT_PAYMENT_INSTRUCTIONS_EL =
  "Οι πληρωμές γίνονται με τραπεζική κατάθεση ή PayPal εντός 10 εργάσιμων ημερών από την έγκριση. Βεβαιώσου ότι τα στοιχεία πληρωμής είναι πλήρη και αντιστοιχούν στο πραγματικό σου όνομα.";

export const SETTINGS_DEFAULTS = {
  termsContentEn: DEFAULT_TERMS_EN,
  termsContentEl: DEFAULT_TERMS_EL,
  privacyContentEn: DEFAULT_PRIVACY_EN,
  privacyContentEl: DEFAULT_PRIVACY_EL,
  paymentInstructionsEn: DEFAULT_PAYMENT_INSTRUCTIONS_EN,
  paymentInstructionsEl: DEFAULT_PAYMENT_INSTRUCTIONS_EL,
};

/** Reads program settings, creating the singleton row on first access. */
export async function getSettings(): Promise<ProgramSettings> {
  const existing = await prisma.programSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (existing) return existing;

  return prisma.programSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, ...SETTINGS_DEFAULTS },
  });
}

export function localizedSetting(
  settings: ProgramSettings,
  field: "terms" | "privacy" | "paymentInstructions",
  locale: string,
): string {
  const suffix = locale === "el" ? "El" : "En";
  const key = `${field}Content${suffix}` as keyof ProgramSettings;
  const altKey = `${field}${suffix}` as keyof ProgramSettings;
  const value = (settings[key] ?? settings[altKey]) as string | undefined;
  return value ?? "";
}
