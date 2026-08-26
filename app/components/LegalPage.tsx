"use client";

import { legalDocs } from "../legal-data";
import { commonCopy, WHATSAPP_URL } from "../site-data";
import { normalizeDeliveryCopy } from "../lib/delivery-copy";
import { useLanguage } from "./LanguageProvider";
import { Arrow, PageShell, SiteFooter, SiteHeader } from "./SiteChrome";

export function LegalPage({ documentKey }: { documentKey: string }) {
  const { lang } = useLanguage();
  const doc = legalDocs[documentKey][lang];
  const common = commonCopy[lang];
  const sections = doc.sections.map(([title, body]) => [
    title,
    normalizeDeliveryCopy(body, lang),
  ] as const);

  return (
    <PageShell>
      <SiteHeader current="documents" />

      <section className="document-hero">
        <div className="document-hero__glow" aria-hidden="true" />
        <div data-reveal>
          <span className="kicker">JETKIZ · {lang === "ru" ? "Документы" : "Құжаттар"}</span>
          <h1>{doc.title}</h1>
          <p>{doc.subtitle}</p>
          <small>{doc.date}</small>
        </div>
      </section>

      <section className="document-layout section-pad">
        <aside className="document-nav" data-reveal>
          <strong>{common.footerDocs}</strong>
          {common.documents.map(([label, href]) => (
            <a className={href === `/${documentKey}` ? "is-active" : ""} href={href} key={href}>
              <span>{label}</span><Arrow />
            </a>
          ))}
        </aside>

        <article className="document-content">
          <div className="document-basis" data-reveal>
            <strong>{lang === "ru" ? "Нормативная база Республики Казахстан" : "Қазақстан Республикасының құқықтық негізі"}</strong>
            <p>{lang === "ru" ? "Официальные действующие тексты — в информационно-правовой системе «Әділет»." : "Ресми қолданыстағы мәтіндер «Әділет» ақпараттық-құқықтық жүйесінде жарияланған."}</p>
            <div>
              <a href="https://adilet.zan.kz/rus/docs/Z100000274_" target="_blank" rel="noreferrer">{lang === "ru" ? "Защита прав потребителей" : "Тұтынушылардың құқықтарын қорғау"}</a>
              <a href="https://adilet.zan.kz/rus/docs/Z1300000094" target="_blank" rel="noreferrer">{lang === "ru" ? "Персональные данные" : "Дербес деректер"}</a>
              <a href="https://adilet.zan.kz/rus/docs/Z040000544_" target="_blank" rel="noreferrer">{lang === "ru" ? "Регулирование торговли" : "Сауда қызметін реттеу"}</a>
            </div>
          </div>

          {sections.map(([title, body]) => (
            <section key={title} data-reveal>
              <h2>{title}</h2>
              {body.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p>
              ))}
            </section>
          ))}

          {documentKey !== "contacts" && (
            <section className="document-requisites" data-reveal>
              <h2>{lang === "ru" ? "Реквизиты" : "Деректемелер"}</h2>
              <dl>
                <div><dt>{lang === "ru" ? "Компания" : "Компания"}</dt><dd>{common.company}</dd></div>
                <div><dt>{lang === "ru" ? "БИН" : "БСН"}</dt><dd>260540025332</dd></div>
                <div><dt>{lang === "ru" ? "Адрес" : "Мекенжайы"}</dt><dd>{common.address}</dd></div>
                <div><dt>Телефон / WhatsApp</dt><dd><a href="tel:+77086810693">+7 708 681 06 93</a></dd></div>
                <div><dt>Email</dt><dd><a href="mailto:support@jetkiz.asia">support@jetkiz.asia</a></dd></div>
              </dl>
            </section>
          )}

          <div className="document-help" data-reveal>
            <div>
              <span className="kicker">JETKIZ SUPPORT</span>
              <h2>{lang === "ru" ? "Остался вопрос?" : "Сұрағыңыз қалды ма?"}</h2>
            </div>
            <a className="button button--lime" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              {lang === "ru" ? "Написать в WhatsApp" : "WhatsApp-қа жазу"}<Arrow />
            </a>
          </div>
        </article>
      </section>

      <SiteFooter />
    </PageShell>
  );
}
