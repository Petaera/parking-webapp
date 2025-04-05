import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy and Terms &amp; Conditions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="container">
        <h1>Privacy Policy and Terms &amp; Conditions</h1>
        <p><strong>Effective Date:</strong> 05-04-2025</p>

        <section className="section">
          <h2>Introduction</h2>
          <p>
            This Privacy Policy describes how <strong>PetaParking</strong> ("we", "our", or "us") collects, uses, and shares information about you through our mobile application ("App"), designed specifically for parking lot management.
          </p>
          <p>
            By downloading, accessing, or using the App, you agree to this Privacy Policy and Terms &amp; Conditions. If you disagree with any part of these terms, you must not use the App.
          </p>
        </section>

        <section className="section">
          <h2>Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>
            When you register or use our App, we may collect your email address, name, phone number, vehicle details, and other contact or identification information you voluntarily provide.
          </p>
          <h3>Usage Data</h3>
          <p>
            We automatically collect data such as device type, IP address, browser type, and details about your interaction with the App.
          </p>
          <h3>Parking Data</h3>
          <p>
            The App collects data relating to vehicle entries, exits, parking duration, and related financial transactions.
          </p>
          <h3>Cookies &amp; Tracking Technologies</h3>
          <p>
            The embedded web application within our App may use cookies or similar tracking technologies to enhance user experience.
          </p>
        </section>

        <section className="section">
          <h2>Data Ownership</h2>
          <p>
            All collected data is exclusively owned by the respective parking lot owner. Each parking lot owner is provided with a separate server instance, and all information collected is maintained independently for each owner.
          </p>
        </section>

        <section className="section">
          <h2>How We Use Your Information</h2>
          <ul>
            <li>To manage parking lot entries and exits effectively.</li>
            <li>To process transactions and calculate parking fees.</li>
            <li>To provide, maintain, and improve our App and parking management services.</li>
            <li>To communicate important updates, support messages, and promotional materials.</li>
            <li>To ensure security and compliance with parking lot rules.</li>
            <li>To comply with legal obligations and enforce our Terms &amp; Conditions.</li>
          </ul>
        </section>

        <section className="section">
          <h2>Sharing of Your Information</h2>
          <p>
            We do not sell or rent personal information. We may share your data with:
          </p>
          <ul>
            <li>Parking lot owners or authorized employees for management purposes.</li>
            <li>Trusted third-party service providers necessary for the App's functionality.</li>
            <li>Authorities, when required by law or to protect our rights and security.</li>
          </ul>
        </section>

        <section className="section">
          <h2>Security</h2>
          <p>
            We implement reasonable measures to protect your personal data, but no method of transmission or electronic storage is 100% secure. While we strive to protect your information, absolute security cannot be guaranteed.
          </p>
        </section>

        <section className="section">
          <h2>Third-Party Links</h2>
          <p>
            Our App may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those external websites.
          </p>
        </section>

        <section className="section">
          <h2>Children’s Privacy</h2>
          <p>
            Our App is not intended for use by individuals under the age of 13. We do not knowingly collect data from children under 13. If we become aware of such data collection, we will promptly delete it.
          </p>
        </section>

        <section className="section">
          <h2>Changes to this Policy</h2>
          <p>
            We reserve the right to update this Privacy Policy. Any changes will be reflected here, with the "Effective Date" updated accordingly. Continued use of the App constitutes acceptance of these changes.
          </p>
        </section>

        <section className="section">
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or Terms &amp; Conditions, please contact us at:
          </p>
          <p>
            <a href="mailto:Petaerallp@gmail.com">Petaerallp@gmail.com</a>
          </p>
        </section>

        <section className="section">
          <h2>Acceptance</h2>
          <p>
            By using the App, you signify your acceptance of this Privacy Policy and Terms &amp; Conditions. If you do not agree, please do not use our App.
          </p>
        </section>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 30px auto;
          background: #fff;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          font-family: Arial, sans-serif;
          color: #333;
        }
        h1 {
          text-align: center;
          color: #0056b3;
          margin-bottom: 20px;
        }
        h2 {
          color: #0056b3;
          border-bottom: 2px solid #0056b3;
          padding-bottom: 5px;
          margin-top: 20px;
        }
        h3 {
          color: #0056b3;
          margin-top: 15px;
        }
        p {
          line-height: 1.6;
          margin: 10px 0;
        }
        ul {
          margin: 10px 0 10px 20px;
          padding: 0;
        }
        a {
          color: #0056b3;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .section {
          margin-bottom: 20px;
        }
      `}</style>
    </>
  );
}
