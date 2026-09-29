import {
  UserPlus,
  WalletCards,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import "./HowItWorks.css";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create an Account",
    description:
      "Sign up in less than a minute and create your BukzEx account.",
    label: "GET STARTED",
  },
  {
    number: "02",
    icon: WalletCards,
    title: "Fund Your Wallet",
    description:
      "Add funds using your preferred available payment method.",
    label: "ADD FUNDS",
  },
  {
    number: "03",
    icon: ShoppingBag,
    title: "Buy Services",
    description:
      "Choose the service you need and complete your request.",
    label: "GET SERVICES",
  },
];

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">

      <div className="how-it-works-glow how-it-works-glow-one"></div>
      <div className="how-it-works-glow how-it-works-glow-two"></div>

      <div className="how-it-works-container">

        {/* HEADER */}

        <div className="how-it-works-header">

          <div className="how-it-works-label">
            <Sparkles size={12} />
            HOW BUKZEX WORKS
            <Sparkles size={12} />
          </div>

          <h2>
            Get Started in
            <span> 3 Easy Steps.</span>
          </h2>

          <p>
            Getting started with BukzEx is simple,
            fast and straightforward.
          </p>

        </div>

        {/* STEPS */}

        <div className="steps-wrapper">

          {steps.map((step, index) => {
            const StepIcon = step.icon;

            return (
              <div className="step-group" key={step.number}>

                <article
                  className="step"
                  style={{
                    "--step-delay": `${index * 160}ms`,
                  }}
                >

                  {/* TOP */}

                  <div className="step-top">

                    <div className="step-number">
                      {step.number}
                    </div>

                    <span className="step-label">
                      {step.label}
                    </span>

                  </div>

                  {/* ICON */}

                  <div className="step-icon-wrapper">

                    <div className="step-icon-glow"></div>

                    <div className="step-icon">
                      <StepIcon
                        size={32}
                        strokeWidth={1.7}
                      />
                    </div>

                  </div>

                  {/* CONTENT */}

                  <div className="step-content">

                    <h3>
                      {step.title}
                    </h3>

                    <p>
                      {step.description}
                    </p>

                  </div>

                  {/* BOTTOM */}

                  <div className="step-bottom">

                    <span>
                      Step {index + 1}
                    </span>

                    <ArrowRight
                      size={15}
                      strokeWidth={2}
                    />

                  </div>

                </article>

                {/* CONNECTION */}

                {index < steps.length - 1 && (
                  <div className="step-arrow">

                    <div className="step-arrow-line"></div>

                    <div className="step-arrow-icon">
                      <ArrowRight
                        size={16}
                        strokeWidth={2}
                      />
                    </div>

                  </div>
                )}

              </div>
            );
          })}

        </div>

        {/* PROGRESS */}

        <div className="steps-progress">

          <div className="steps-progress-track">
            <span></span>
          </div>

          <div className="steps-progress-label">
            <span>01</span>
            <span>02</span>
            <span>03</span>
          </div>

        </div>

      </div>

    </section>
  );
}
