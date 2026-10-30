export interface DocItem {
  id: string;
  label: string;
  note: string;
  /** Needed only in some countries; check the embassy’s list. */
  someCountries?: boolean;
}

export interface DocStage {
  id: string;
  title: string;
  items: DocItem[];
}

export const STAGES: DocStage[] = [
  {
    id: 'identity',
    title: '1. Identity and education',
    items: [
      { id: 'passport', label: 'Passport', note: 'Check how long it must stay valid for the visa. Renewing abroad is harder than renewing at home.' },
      { id: 'class10', label: 'Class 10 marksheet and certificate', note: 'Usually accepted as proof of date of birth.' },
      { id: 'class12', label: 'Class 12 marksheet and passing certificate', note: 'Shows your Physics, Chemistry, Biology and English marks.' },
      { id: 'neet', label: 'NEET-UG scorecard', note: 'Needed for admission abroad and again when you return to India.' },
      { id: 'birth', label: 'Birth certificate', note: 'Some universities and embassies ask for it in addition to Class 10 records.' },
      { id: 'photos', label: 'Passport-size photographs', note: 'Check the size and background rules for the visa; they differ by country.' },
    ],
  },
  {
    id: 'admission',
    title: '2. Admission',
    items: [
      { id: 'offer', label: 'Admission or offer letter from the university', note: 'Must come from the university itself, not only from an agent.' },
      { id: 'invitation', label: 'Official invitation letter for the visa', note: 'Some countries issue a separate invitation that the visa application needs.', someCountries: true },
      { id: 'course-details', label: 'Written course details', note: 'Course length in months, internship length and place, and language of teaching for every year. You need these to check NMC’s rules.' },
      { id: 'fee-schedule', label: 'Full fee schedule for every year', note: 'Tuition, hostel and other charges, in writing.' },
      { id: 'fee-receipt', label: 'Fee payment receipt', note: 'Often asked for in the visa application.' },
    ],
  },
  {
    id: 'attestation',
    title: '3. Attestation and translation',
    items: [
      { id: 'apostille', label: 'Apostille or embassy attestation of certificates', note: 'Countries in the Hague Apostille Convention accept an apostille from India’s Ministry of External Affairs. Others need embassy attestation.' },
      { id: 'translation', label: 'Certified translations', note: 'Some countries need certificates translated into their language by an approved translator.', someCountries: true },
    ],
  },
  {
    id: 'visa',
    title: '4. Visa application',
    items: [
      { id: 'visa-form', label: 'Completed student visa application and fee', note: 'Apply only through the embassy, its official visa centre or its official website.' },
      { id: 'medical', label: 'Medical fitness certificate', note: 'Check whether a specific format or doctor is required.' },
      { id: 'hiv', label: 'HIV test report', note: 'Required by some countries for long stays.', someCountries: true },
      { id: 'pcc', label: 'Police clearance certificate', note: 'Required by some countries. Apply through Passport Seva.', someCountries: true },
      { id: 'funds', label: 'Proof of funds', note: 'Bank statements or a loan sanction letter, if the embassy asks for them.', someCountries: true },
      { id: 'insurance', label: 'Medical or travel insurance', note: 'Check the minimum cover the country or university requires.' },
    ],
  },
  {
    id: 'travel',
    title: '5. Before you fly',
    items: [
      { id: 'ticket', label: 'Flight ticket', note: 'Book once the visa is issued.' },
      { id: 'copies', label: 'Paper and digital copies of every document', note: 'Keep one set with you and one with your family.' },
      { id: 'money', label: 'Money for the first weeks', note: 'A forex card or foreign currency within the legal limits, plus a plan for paying fees.' },
      { id: 'contacts', label: 'Emergency contacts', note: 'University international office, Indian embassy or consulate, and family.' },
    ],
  },
  {
    id: 'return',
    title: '6. Keep for your return to India',
    items: [
      { id: 'degree', label: 'Degree certificate', note: 'Your primary medical qualification.' },
      { id: 'transcript', label: 'Transcript with subjects and clinical training', note: 'Shows the course matched the Indian MBBS subjects.' },
      { id: 'internship', label: 'Internship completion certificate', note: 'At least 12 months at the same foreign institution, as NMC requires.' },
      { id: 'licence', label: 'Licence or registration to practise in that country', note: 'NMC requires eligibility for a licence at par with that country’s citizens.' },
      { id: 'online-cert', label: 'Certificate for any online classes', note: 'NMC asks for a certificate of successful completion if you took theory classes online.' },
      { id: 'old-passports', label: 'All passports with entry and exit stamps', note: 'Keep old passports too; they show the time you spent studying abroad.' },
    ],
  },
];

export const ALL_IDS = STAGES.flatMap((s) => s.items.map((i) => i.id));

/** Share of items done, 0 to 100, counting only ids that exist. */
export function progress(done: Set<string>, ids: string[] = ALL_IDS): number {
  if (ids.length === 0) return 0;
  const count = ids.filter((id) => done.has(id)).length;
  return Math.round((count / ids.length) * 100);
}
