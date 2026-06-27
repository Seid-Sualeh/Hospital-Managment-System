import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const METADATA = {
  "/": {
    title: "MediCareAI — Clinic Management Platform for Ethiopia",
    description: "Multi-tenant clinic management system for Ethiopian private clinics. Connect registration, triage, doctor consultations, lab, pharmacy, and billing.",
  },
  "/about": {
    title: "About Us — MediCareAI Clinic Management",
    description: "Learn about the mission, vision, and technology behind the leading healthcare SaaS platform in Ethiopia.",
  },
  "/features": {
    title: "Platform Features — MediCareAI",
    description: "Explore modules for patient EMR, queue control, billing ledger, laboratory results, pharmacy inventory, and AI clinical summaries.",
  },
  "/services": {
    title: "Our Services — MediCareAI",
    description: "Discover how we support medical clinics with custom workflows, cloud hosting, training, and 24/7 technical support.",
  },
  "/contact": {
    title: "Contact Us — Get a Demo of MediCareAI",
    description: "Request a custom demo or get in touch with our healthcare optimization team in Addis Ababa.",
  },
  "/login": {
    title: "Staff Login — MediCareAI CMS",
    description: "Secure login for doctors, nurses, cashiers, pharmacists, and clinic administrators.",
  },
};

export const useDocumentMetadata = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const meta = METADATA[path] || {
      title: "MediCareAI Workspace",
      description: "Clinic Management System Workspace",
    };

    document.title = meta.title;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", meta.description);

    // Update Open Graph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", meta.title);

    // Update Open Graph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", meta.description);

    // Update Twitter Title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement("meta");
      twitterTitle.setAttribute("name", "twitter:title");
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute("content", meta.title);

    // Update Twitter Description
    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDesc) {
      twitterDesc = document.createElement("meta");
      twitterDesc.setAttribute("name", "twitter:description");
      document.head.appendChild(twitterDesc);
    }
    twitterDesc.setAttribute("content", meta.description);

    // Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);

  }, [location]);
};
export default useDocumentMetadata;
