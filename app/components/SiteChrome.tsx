"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { commonCopy } from "../site-data";
import { useLanguage } from "./LanguageProvider";

export const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Spark = () => (
  <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
    <path d="M16 1c.9 8.6 6.4 14.1 15 15-8.6.9-14.1 6.4-15 15C15.1 22.4 9.6 16.9 1 16 9.6 15.1 15.1 9.6 16 1Z" fill="currentColor" />
  </svg>
);

export function PageShell({ children }: { children: React.ReactNode }) {
  const pageRef = useRef<HTMLElement>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    const updateProgress = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll", String(height > 0 ? window.scrollY / height : 0));
    };

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      }),
      { threshold: 0.1 },
    );

    document.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, [lang]);

  const movePage = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = Math.min(event.clientY, window.innerHeight) / window.innerHeight - 0.5;
    pageRef.current?.style.setProperty("--mx", `${x * 16}px`);
    pageRef.current?.style.setProperty("--my", `${y * 12}px`);
  };

  return (
    <main ref={pageRef} className="page" onPointerMove={movePage}>
      <div className="scroll-progress" aria-hidden="true" />
      {children}
      <CookieNotice />
    </main>
  );
}

function CookieNotice() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(!window.localStorage.getItem("jetkiz-cookie-choice"));
    }, 450);
    return () => window.clearTimeout(timer);
  }, []);

  const remember = (choice: "all" | "essential") => {
    window.localStorage.setItem("jetkiz-cookie-choice", choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="cookie-notice" role="dialog" aria-modal="false" aria-label={lang === "ru" ? "Настройки Cookie" : "Cookie баптаулары"}>
      <div>
        <strong>{lang === "ru" ? "Cookie — только по делу" : "Cookie — тек қажетіне"}</strong>
        <p>
          {lang === "ru"
            ? "Мы используем необходимые технологии для работы сайта и сохраняем выбранный язык. Необязательные инструменты включаются только с вашего согласия."
            : "Сайт жұмысы үшін қажетті технологияларды қолданамыз және таңдалған тілді сақтаймыз. Міндетті емес құралдар тек келісіміңізбен қосылады."}
          {" "}<Link href="/cookies">{lang === "ru" ? "Подробнее" : "Толығырақ"}</Link>
        </p>
      </div>
      <div className="cookie-notice__actions">
        <button onClick={() => remember("essential")}>{lang === "ru" ? "Только необходимые" : "Тек қажетті"}</button>
        <button className="is-primary" onClick={() => remember("all")}>{lang === "ru" ? "Принять" : "Қабылдау"}</button>
      </div>
    </aside>
  );
}

export function SiteHeader({ current }: { current?: "restaurants" | "couriers" | "documents" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useLanguage();
  const t = commonCopy[lang];

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="JETKIZ">
          JETKIZ<span>●</span>
        </Link>
        <nav className="desktop-nav" aria-label={lang === "ru" ? "Навигация" : "Навигация"}>
          {t.nav.map(([label, href]) => {
            const active = (current === "restaurants" && href === "/restaurants") ||
              (current === "couriers" && href === "/couriers");
            return <Link className={active ? "is-active" : ""} href={href} key={href}>{label}</Link>;
          })}
        </nav>
        <div className="header-actions">
          <div className="lang-switch" aria-label={lang === "ru" ? "Язык сайта" : "Сайт тілі"}>
            <span className={lang === "kz" ? "lang-switch__thumb is-kz" : "lang-switch__thumb"} />
            <button className={lang === "ru" ? "is-active" : ""} onClick={() => setLang("ru")}>RU</button>
            <button className={lang === "kz" ? "is-active" : ""} onClick={() => setLang("kz")}>KZ</button>
          </div>
          <Link className="header-order" href="/#how-order">{t.order}<Arrow /></Link>
          <button className="menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-label={mobileOpen ? t.close : t.menu}>
            <span>{mobileOpen ? t.close : t.menu}</span>
            <i className={mobileOpen ? "is-open" : ""} />
          </button>
        </div>
      </header>

      <div className={mobileOpen ? "mobile-menu is-open" : "mobile-menu"}>
        {t.nav.map(([label, href], index) => (
          <Link href={href} key={href} onClick={() => setMobileOpen(false)}><span>0{index + 1}</span>{label}</Link>
        ))}
        <Link href="/contacts" onClick={() => setMobileOpen(false)}><span>04</span>{lang === "ru" ? "Контакты" : "Байланыстар"}</Link>
      </div>
    </>
  );
}

export function SiteFooter() {
  const { lang } = useLanguage();
  const t = commonCopy[lang];

  return (
    <footer className="mega-footer">
      <div className="mega-footer__brand">
        <Link className="brand" href="/">JETKIZ<span>●</span></Link>
        <h2>{t.footerTagline}</h2>
        <p>{t.footerText}</p>
        <a className="astana-hub-badge" href="https://astanahub.com/" target="_blank" rel="noreferrer">
          <span className="astana-hub-badge__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://cdn.astanahub.com/static/img_v2/logo.svg" alt="Astana Hub" />
          </span>
          <span>
            <strong>{lang === "ru" ? "Участник Astana Hub" : "Astana Hub қатысушысы"}</strong>
            <small>{lang === "ru" ? "Международный технопарк IT-стартапов" : "Халықаралық IT-стартаптар технопаркі"}</small>
          </span>
        </a>
      </div>
      <div className="mega-footer__column">
        <strong>{t.footerMenu}</strong>
        {t.links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </div>
      <div className="mega-footer__column mega-footer__column--docs">
        <strong>{t.footerDocs}</strong>
        {t.documents.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        <Link href="/account-deletion">
          {lang === "ru" ? "Удаление аккаунта" : "Аккаунтты жою"}
        </Link>
      </div>
      <div className="mega-footer__column mega-footer__contact">
        <strong>{t.footerContacts}</strong>
        <a href="tel:+77086810693">+7 708 681 06 93</a>
        <a href="mailto:support@jetkiz.asia">support@jetkiz.asia</a>
        <p>{t.company}<br />{t.bin}<br />{t.address}</p>
      </div>
      <div className="mega-footer__bottom">
        <small>{t.copyright}</small>
        <span>SHCHUCHINSK · BURABAY · KAZAKHSTAN</span>
      </div>
    </footer>
  );
}

export function FaqList({ items }: { items: readonly (readonly [string, string])[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq__list" data-reveal>
      {items.map(([question, answer], index) => (
        <article className={open === index ? "faq-item is-open" : "faq-item"} key={question}>
          <button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}>
            <span>{question}</span><i>+</i>
          </button>
          <div><p>{answer}</p></div>
        </article>
      ))}
    </div>
  );
}
