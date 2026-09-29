import { useState } from "react";
import {
  Plus,
  Minus,
  HelpCircle,
  ShieldCheck,
  Zap,
  CreditCard,
  RotateCcw,
} from "lucide-react";

import "./FAQ.css";

const questions = [
  {
    question: "How do I create an account?",
    answer:
      "Select Sign Up and enter your required details. Follow the verification steps to create your BukzEx account.",
    icon: HelpCircle,
  },
  {
    question: "What payment methods do you support?",
    answer:
      "Available payment methods will be displayed during checkout. Supported options may expand as the BukzEx platform develops.",
    icon: CreditCard,
  },
  {
    question: "How fast are services delivered?",
    answer:
      "Delivery time depends on the service selected. Many digital services are processed shortly after a successful transaction.",
    icon: Zap,
  },
  {
    question: "Is my payment information safe?",
    answer:
      "BukzEx is designed with secure account and transaction handling in mind. Payment processing will use the supported payment infrastructure connected to the platform.",
    icon: ShieldCheck,
  },
  {
    question: "Can I get a refund?",
    answer:
      "Refund eligibility depends on the service and transaction status. Contact support if you need assistance with a specific transaction.",
    icon: RotateCcw,
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-orb faq-orb-one"></div>
      <div className="faq-orb faq-orb-two"></div>

      <div className="faq-container">

        <div className="faq-intro">
          <div className="faq-label">
            <span className="faq-label-dot"></span>
            FREQUENTLY ASKED QUESTIONS
          </div>

          <h2>
            Questions?
            <span> We've Got Answers.</span>
          </h2>

          <p>
            Everything you need to know about using BukzEx
            and accessing the services available on the platform.
          </p>

          <div className="faq-intro-note">
            <span>
              <HelpCircle size={15} />
            </span>
            <div>
              <strong>Can't find what you need?</strong>
              <small>Our support team can help.</small>
            </div>
          </div>
        </div>

        <div className="faq-list">

          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            const QuestionIcon = item.icon;

            return (
              <div
                className={`faq-item ${isOpen ? "open" : ""}`}
                key={item.question}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleQuestion(index)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-question-main">
                    <span className="faq-question-icon">
                      <QuestionIcon size={17} strokeWidth={1.8} />
                    </span>

                    <span className="faq-question-text">
                      {item.question}
                    </span>
                  </div>

                  <span className="faq-toggle">
                    <span className="faq-toggle-plus">
                      <Plus size={15} />
                    </span>

                    <span className="faq-toggle-minus">
                      <Minus size={15} />
                    </span>
                  </span>
                </button>

                <div className="faq-answer">
                  <div className="faq-answer-inner">
                    <div className="faq-answer-line"></div>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}
