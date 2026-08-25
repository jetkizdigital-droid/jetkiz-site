"use client";

import { homeCopy } from "./site-data";
import { useLanguage } from "./components/LanguageProvider";
import { Arrow, FaqList, PageShell, SiteFooter, SiteHeader, Spark } from "./components/SiteChrome";

export default function Home() {
  const { lang } = useLanguage();
  const t = homeCopy[lang];
  const restaurantsCta = lang === "ru" ? "Открыть рестораны" : "Мейрамханаларды ашу";

  return (
    <PageShell>
      <SiteHeader />

      <section className="hero" id="top">
        <div className="hero__image-wrap" aria-hidden="true">
          <img src="/jetkiz-burabay-feast.webp" alt="" />
        </div>
        <div className="hero__shade" />
        <div className="hero__copy">
          <p className="hero__eyebrow"><span />{t.heroEyebrow}</p>
          <h1>
            <span>{t.heroLineOne}</span>
            <strong>{t.heroLineTwo}</strong>
          </h1>
          <div className="hero__under">
            <p>{t.heroText}</p>
            <div className="hero__actions">
              <a className="button button--lime" href="/restaurants">{restaurantsCta}<Arrow /></a>
              <a className="button button--glass" href="/delivery">{t.heroSecondary}<Arrow /></a>
            </div>
          </div>
          <ol className="hero__quick-order" aria-label={t.heroPrimary}>
            {t.heroSteps.map(([number, label]) => (
              <li key={number}><span>{number}</span><strong>{label}</strong></li>
            ))}
          </ol>
        </div>
        <div className="hero__status float-card">
          <span className="status-pulse"><i /></span>
          <div><strong>{t.statusLabel}</strong><small>{t.statusTime}</small></div>
        </div>
        <div className="hero__scribble" aria-hidden="true"><Spark /></div>
        <div className="hero__marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...t.marquee, ...t.marquee].map((item, index) => <span key={`${item}-${index}`}>{item}<i>✦</i></span>)}
          </div>
        </div>
      </section>

      <section className="manifesto section-pad" data-reveal>
        <span className="manifesto__mark"><Spark /></span>
        <p>{t.manifestoTop}</p>
        <h2>{t.manifestoBottom}</h2>
      </section>

      <section className="client-benefits section-pad" aria-labelledby="benefits-title">
        <div className="client-benefits__heading" data-reveal>
          <span className="kicker">01 — {t.benefitsKicker}</span>
          <h2 id="benefits-title">{t.benefitsTitle}</h2>
        </div>
        <div className="benefit-grid">
          {t.benefits.map(([number, title, text]) => (
            <article className="benefit-card" key={number} data-reveal>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <i aria-hidden="true"><Arrow /></i>
            </article>
          ))}
        </div>
      </section>

      <section className="food-gallery section-pad" aria-labelledby="gallery-title">
        <div className="gallery-heading" data-reveal>
          <div>
            <span className="kicker">02 — {t.galleryKicker}</span>
            <h2 id="gallery-title">{t.galleryTitle}</h2>
          </div>
          <p>{t.galleryText}</p>
        </div>
        <div className="gallery-grid">
          <figure className="gallery-shot gallery-shot--main" data-reveal>
            <img src="/jetkiz-feast-table.webp" alt={lang === "ru" ? "Блюда на большом столе" : "Үлкен дастархандағы тағамдар"} />
            <figcaption>{t.labels[2]}<span>01</span></figcaption>
          </figure>
          <figure className="gallery-shot gallery-shot--top" data-reveal>
            <img src="/jetkiz-delivery-bag.webp" alt={lang === "ru" ? "Еда с доставкой" : "Жеткізілетін тағам"} />
            <figcaption>{t.labels[1]}<span>02</span></figcaption>
          </figure>
          <figure className="gallery-shot gallery-shot--bottom" data-reveal>
            <img src="/jetkiz-burabay-feast.webp" alt={lang === "ru" ? "Еда на фоне природы Бурабая" : "Бурабай табиғатындағы тағам"} />
            <figcaption>{t.labels[0]}<span>03</span></figcaption>
          </figure>
        </div>
      </section>

      <section className="local-story" aria-labelledby="local-title">
        <div className="local-story__image" aria-hidden="true">
          <img src="/jetkiz-burabay-courier.webp" alt="" />
        </div>
        <div className="local-story__shade" />
        <div className="local-story__copy" data-reveal>
          <span className="kicker">03 — {t.localKicker}</span>
          <h2 id="local-title">{t.localTitle}</h2>
          <p>{t.localText}</p>
          <ul>{t.localPoints.map((point) => <li key={point}><span>✓</span>{point}</li>)}</ul>
          <a className="button button--lime" href="/restaurants">{restaurantsCta}<Arrow /></a>
        </div>
        <span className="local-story__place" aria-hidden="true">BURABAY · SHCHUCHINSK · JETKIZ</span>
      </section>

      <section className="process section-pad" id="how-order" aria-labelledby="process-title">
        <div className="process__intro" data-reveal>
          <span className="kicker">04 — {t.processKicker}</span>
          <h2 id="process-title">{t.processTitle}</h2>
          <p>{t.processText}</p>
        </div>
        <ol className="process__steps">
          {t.steps.map(([number, title, text]) => (
            <li key={number} data-reveal>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <i aria-hidden="true"><Arrow /></i>
            </li>
          ))}
        </ol>
      </section>

      <section className="service-facts section-pad" aria-label={lang === "ru" ? "Условия заказа" : "Тапсырыс шарттары"}>
        {t.facts.map(([title, text], index) => (
          <article key={title} data-reveal>
            <span>0{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <a href={index === 0 ? "/delivery" : index === 1 ? "/delivery" : "/payment"}><Arrow /></a>
          </article>
        ))}
      </section>

      <section className="faq section-pad" aria-labelledby="faq-title">
        <div className="faq__heading" data-reveal>
          <span className="kicker">05 — {t.faqKicker}</span>
          <h2 id="faq-title">{t.faqTitle}</h2>
        </div>
        <FaqList items={t.faqs} />
      </section>

      <section className="final-cta">
        <div className="final-cta__texture" aria-hidden="true" />
        <div className="final-cta__content" data-reveal>
          <span className="kicker">{t.finalKicker}</span>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalText}</p>
          <div>
            <a href="/restaurants">{restaurantsCta}<Arrow /></a>
            <a href="/delivery">{t.finalButtons[1]}<Arrow /></a>
          </div>
        </div>
        <span className="final-cta__orbit" aria-hidden="true">JETKIZ · JETKIZ · JETKIZ ·</span>
      </section>

      <SiteFooter />
    </PageShell>
  );
}
