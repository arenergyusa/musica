import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What kind of content does Musica offer?",
    answer: "Musica exclusively offers Pure Desi Haryanvi content, including high-quality music videos, web series, short films, and exclusive behind-the-scenes footage from your favorite creators.",
  },
  {
    question: "Do I need an account to watch?",
    answer: "While some trailers and teasers are publicly available, you'll need to create a free account to get personalized recommendations and unlock access to our full library.",
  },
  {
    question: "Can I share videos with my friends?",
    answer: "Yes! You can easily share links to your favorite music videos and shows across social media platforms directly from the video player.",
  },
  {
    question: "How often is new content added?",
    answer: "We partner directly with top production houses like Pure Desi Haryanvi to bring you new releases every week. You'll always have something fresh to watch.",
  },
  {
    question: "Is the platform mobile-friendly?",
    answer: "Absolutely. Musica is designed to work seamlessly across all devices, so you can enjoy high-quality entertainment whether you're at home on a desktop or on the go with your mobile device.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about streaming with Musica.
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
