import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      // Reset success banner after 5s
      setTimeout(() => setSuccess(false), 5000);
    }, 1200);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ paddingTop: "6rem" }}>
      {/* Page Header */}
      <section className="bg-light py-5 border-bottom border-light">
        <div className="container text-center">
          <span className="badge bg-primary-soft text-primary mb-2 px-3 py-2 rounded-pill fw-semibold">GET IN TOUCH</span>
          <h1 className="fw-bold display-5 public-display-font text-dark mb-3">Contact Support</h1>
          <p className="text-secondary mx-auto mb-0 lead" style={{ maxWidth: "700px" }}>
            Have questions about system setup, custom cloud deployment, or security features? Reach out to our technical team.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="py-5">
        <div className="container">
          <div className="row g-5">
            {/* Left Column: Contact details & decorative map */}
            <div className="col-lg-5">
              <h3 className="fw-bold public-display-font text-dark mb-4">Connect Directly</h3>
              <div className="d-flex flex-column gap-3 mb-5">
                <div className="contact-info-item">
                  <div className="contact-icon-box">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Our Location</h6>
                    <p className="text-secondary small mb-0">Bole District, Behind Friendship Mall, Addis Ababa, Ethiopia</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon-box">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Call Technical Support</h6>
                    <p className="text-secondary small mb-0">+251 116 673 892</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon-box">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Email Inquiries</h6>
                    <p className="text-secondary small mb-0">support@medicare-ai.com</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon-box">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Office & Clinic Hours</h6>
                    <p className="text-secondary small mb-0">Monday - Saturday: 8:00 AM - 8:00 PM<br />Sunday: Closed / Emergency Only</p>
                  </div>
                </div>
              </div>

              {/* Decorative Vector Map */}
              <div className="card border-0 bg-light p-3 rounded-4 overflow-hidden" style={{ minHeight: "220px", position: "relative" }}>
                <div className="position-absolute top-50 start-50 translate-middle text-center opacity-10">
                  <MapPin size={150} className="text-primary" />
                </div>
                <div className="position-relative z-2">
                  <h6 className="fw-bold text-dark mb-2">Technical HQ</h6>
                  <p className="text-secondary small mb-4">Located in the tech and medical hub of Addis Ababa.</p>
                  
                  {/* CSS Map Pin Animation */}
                  <div className="d-flex align-items-center gap-3 bg-white p-3 rounded-3 shadow-sm" style={{ width: "fit-content" }}>
                    <div className="position-relative" style={{ width: "16px", height: "16px" }}>
                      <div className="position-absolute bg-primary rounded-circle" style={{ width: "10px", height: "10px", top: "3px", left: "3px", zIndex: "2" }}></div>
                      <div className="position-absolute bg-primary rounded-circle border border-primary border-2 opacity-50" style={{ width: "16px", height: "16px", top: "0", left: "0", animation: "pulse-ring 1.5s infinite" }}></div>
                    </div>
                    <span className="small fw-semibold text-dark">Bole HQ - Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact form */}
            <div className="col-lg-7">
              <div className="card p-4 p-md-5 border-0 shadow-sm rounded-4 glass-card-light">
                <h3 className="fw-bold public-display-font text-dark mb-2">Send Message</h3>
                <p className="text-secondary small mb-4">Complete the form below and an engineer will contact you shortly.</p>

                {success && (
                  <div className="alert alert-success d-flex align-items-center gap-2 mb-4 border-0 rounded-3" style={{ backgroundColor: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                    <CheckCircle2 size={20} />
                    <span className="small fw-semibold">Message sent successfully! We will get back to you within 24 hours.</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        className="form-control bg-light border-0 py-2.5"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        className="form-control bg-light border-0 py-2.5"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={form.subject}
                        onChange={handleInputChange}
                        className="form-control bg-light border-0 py-2.5"
                        placeholder="Request for Clinic Cloud Demo"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">Message Details</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleInputChange}
                        className="form-control bg-light border-0 py-2.5"
                        rows="5"
                        placeholder="Provide details about your clinic size and requirements..."
                        required
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2.5"
                        style={{ boxShadow: "0 4px 15px rgba(45, 92, 254, 0.3)" }}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <Send size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
