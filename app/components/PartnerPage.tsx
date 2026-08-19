"use client";

import { courierWhatsApp, partnerCopy, restaurantWhatsApp } from "../site-data";
import { useLanguage } from "./LanguageProvider";
import { Arrow, FaqList, PageShell, SiteFooter, SiteHeader, Spark } from "./SiteChrome";

type PartnerKind = keyof typeof partnerCopy;

export function PartnerPage({ kind }: { kind: PartnerKind }) {
  const { lang } = useLanguage();
  const t = partnerCopy[kind][lang];
  const action = kind === "restaurants" ? restaurantWhatsApp : courierWhatsApp;

  return (
    <PageShell>
      <SiteHeader current={kind} />

      <section className={`partner-hero partner-hero--${kind}`} id="top">
        <div className="partner-hero__media" aria-hidden="true">
          <img src={t.image} alt="" />
        </div>
        <div className="partner-hero__shade" />
        <div className="partner-hero__copy">
          <p className="hero__eyebrow"><span />{t.eyebrow}</p>
          <h1><span>{t.lineOne}</span><strong>{t.lineTwo}</strong></h1>
          <p className="partner-hero__lead">{t.text}</p>
          <div className="hero__actions">
            <a className="button button--lime" href={action} target="_blank" rel="noreferrer">{t.primary}<Arrow /></a>
            <a className="button button--glass" href="#benefits">{t.secondary}<Arrow /></a>
          </div>
        </div>
        <div className="partner-hero__float">
          <span className="status-pulse"><i /></span>
          <div><strong>{t.floatTitle}</strong><small>{t.floatText}</small></div>
        </div>
        <div className="partner-hero__spark" aria-hidden="true"><Spark /></div>
      </section>

      <section className="partner-strip" aria-label={t.eyebrow}>
        {t.strip.map(([value, label]) => (
          <div key={label} data-reveal><strong>{value}</strong><span>{label}</span></div>
        ))}
      </section>

      <section className="partner-benefits section-pad" id="benefits" aria-labelledby="partner-benefits-title">
        <div className="partner-benefits__intro" data-reveal>
          <span className="kicker">01 — {t.kicker}</span>
          <h2 id="partner-benefits-title">{t.title}</h2>
          <p>{t.intro}</p>
        </div>
        <div className="partner-benefits__grid">
          {t.benefits.map(([number, title, text]) => (
            <article key={number} data-reveal>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`partner-feature partner-feature--${kind}`}>
        <div className="partner-feature__media" data-reveal>
          <img
            src={kind === "restaurants" ? "/jetkiz-delivery-bag.webp" : "/jetkiz-burabay-courier.webp"}
            alt=""
          />
          <span>JETKIZ · SHCHUCHINSK</span>
        </div>
        <div className="partner-feature__copy" data-reveal>
          <span className="kicker">02 — {t.featureKicker}</span>
          <h2>{t.featureTitle}</h2>
          <p>{t.featureText}</p>
          <ul>{t.featurePoints.map((point) => <li key={point}><span>✓</span>{point}</li>)}</ul>
        </div>
      </section>

      <section className="partner-process section-pad" aria-labelledby="partner-process-title">
        <div className="partner-process__heading" data-reveal>
          <span className="kicker">03 — JETKIZ</span>
          <h2 id="partner-process-title">{t.processTitle}</h2>
        </div>
        <ol>
          {t.steps.map(([number, title, text]) => (
            <li key={number} data-reveal>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <i><Arrow /></i>
            </li>
          ))}
        </ol>
      </section>

      <section className="faq section-pad partner-faq" aria-labelledby="partner-faq-title">
        <div className="faq__heading" data-reveal>
          <span className="kicker">04 — FAQ</span>
          <h2 id="partner-faq-title">{t.faqTitle}</h2>
        </div>
        <FaqList items={t.faqs} />
      </section>

      <section className={`partner-final partner-final--${kind}`}>
        <div className="partner-final__texture" aria-hidden="true" />
        <div data-reveal>
          <span className="kicker">{t.finalKicker}</span>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalText}</p>
          <a className="button button--dark" href={action} target="_blank" rel="noreferrer">{t.finalButton}<Arrow /></a>
        </div>
      </section>

      <SiteFooter />
    </PageShell>
  );
}
