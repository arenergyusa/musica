import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What content is available on Musica?",
    answer: "Musica exclusively features official Haryanvi music videos, dance tracks, studio audio recordings, and artist releases.",
  },
  {
    question: "Is an account required to watch music videos?",
    answer: "Featured music videos can be viewed directly. Creating a free account allows you to save favorites and access custom playlists.",
  },
  {
    question: "Is Musica accessible on mobile and desktop devices?",
    answer: "Yes, Musica is fully responsive and optimized for smooth video playback across mobile phones, tablets, and desktop browsers.",
  },
  {
    question: "How frequently are new music videos released?",
    answer: "New Haryanvi music videos and song tracks are uploaded regularly directly from our official production house.",
  },
  {
    question: "Is registering an account free?",
    answer: "Yes, creating an account on Musica is completely free.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-16 bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3 border border-blue-200/60 dark:border-blue-900">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            Frequently Asked <span className="text-blue-600 dark:text-blue-400">Questions</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Everything you need to know about streaming music videos on Musica.
          </p>
        </div>

        <Accordion className="w-full space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="bg-white dark:bg-slate-900 px-5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <AccordionTrigger className="text-left font-bold text-sm text-slate-900 dark:text-white hover:no-underline hover:text-blue-600 py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
