import { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | IllinoisTrivia.com",
  description: "Get in touch with the IllinoisTrivia.com team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-[#0B1C3A] mb-2">Contact Us</h1>
      <p className="text-gray-600 mb-8">
        Have a question, suggestion, or issue? Send us a message and we&apos;ll get back to you.
      </p>
      <ContactForm />
    </div>
  );
}
