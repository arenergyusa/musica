import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CAP_MULTIPLIER } from "@/lib/constants";

const faqs = [
  {
    question: "What is Revenue-Based Financing (RBF)?",
    answer: "RBF is an alternative investment model where you provide capital to entertainment production houses. In return, instead of equity, you receive a fixed percentage of ongoing revenues (Daily ROI) until a pre-agreed cap is reached.",
  },
  {
    question: "Is my principal amount refundable?",
    answer: "No. In the RBF model, the principal amount is directly invested into production and is non-refundable. You earn your returns purely through the daily rewards, which are capped at 2x (for passive investors) or 3x (if you build a team).",
  },
  {
    question: "How do the income caps work?",
    answer: `Passive (Non-Working) investors can earn up to ${CAP_MULTIPLIER.NON_WORKING}x their investment. Working investors (who build teams) can earn up to ${CAP_MULTIPLIER.WORKING}x their investment. Once the cap is reached, the investment plan closes automatically.`,
  },
  {
    question: "When can I withdraw my rewards?",
    answer: "Withdrawals are processed three times a month: on the 10th, 20th, and 30th. You must submit your withdrawal request before these dates. A minimum balance of ₹1,000 is required, and a 10% TDS deduction applies to all withdrawals.",
  },
  {
    question: "Is KYC mandatory?",
    answer: "Yes. As per regulatory requirements, you must complete your KYC (Aadhaar and PAN verification) before you can make any investments on the platform.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about investing with Musica.
          </p>
        </div>

        <Accordion className="w-full space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="bg-card px-6 rounded-lg border">
              <AccordionTrigger className="text-left font-semibold hover:no-underline hover:text-primary py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
