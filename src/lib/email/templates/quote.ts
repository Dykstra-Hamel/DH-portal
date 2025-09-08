import { QuoteEmailData } from '../types';

// Function to convert plural pest types to singular forms
function getSingularPestType(pestType: string): string {
  switch (pestType.toLowerCase()) {
    case 'ants':
      return 'ant';
    case 'spiders':
      return 'spider';
    case 'cockroaches':
      return 'cockroach';
    case 'rodents':
      return 'rodent';
    case 'termites':
      return 'termite';
    case 'wasps':
      return 'wasp';
    case 'others':
      return 'pest';
    case 'other':
      return 'pest';
    // Legacy mappings (in case they're still used)
    case 'roaches':
      return 'roach';
    case 'mice':
      return 'mouse';
    case 'rats':
      return 'rat';
    default:
      return 'pest';
  }
}

export function generateQuoteEmailTemplate(quoteData: QuoteEmailData): string {
  const { firstName, pestType, address, selectedPlan } = quoteData;
  const singularPestType = getSingularPestType(pestType);

  // Use selectedPlan pricing if available, otherwise fallback to defaults
  const recurringPrice = selectedPlan?.recurring_price
    ? `$${selectedPlan.recurring_price} ${selectedPlan.billing_frequency.charAt(0).toUpperCase() + selectedPlan.billing_frequency.slice(1)}`
    : '$49 Monthly';
  const initialPrice = selectedPlan?.initial_price
    ? `$${selectedPlan.initial_price}`
    : '$199';

  return `<!doctype html>
<html
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  lang="en"
>
  <head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--[if mso]>
      <xml
        ><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"
          ><w:DontUseAdvancedTypographyReadingMail
        /></w:WordDocument>
        <o:OfficeDocumentSettings
          ><o:PixelsPerInch>96</o:PixelsPerInch
          ><o:AllowPNG /></o:OfficeDocumentSettings
      ></xml>
    <![endif]-->
    <!--[if !mso]><!-->
    <!--<![endif]-->
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
      }

      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: inherit !important;
      }

      #MessageViewBody a {
        color: inherit;
        text-decoration: none;
      }

      p {
        line-height: inherit;
      }

      .desktop_hide,
      .desktop_hide table {
        mso-hide: all;
        display: none;
        max-height: 0px;
        overflow: hidden;
      }

      .image_block img + div {
        display: none;
      }

      sup,
      sub {
        font-size: 75%;
        line-height: 0;
      }

      @media (max-width: 620px) {
        .social_block.desktop_hide .social-table {
          display: inline-block !important;
        }

        .image_block div.fullWidth {
          max-width: 100% !important;
        }

        .mobile_hide {
          display: none;
        }

        .row-content {
          width: 100% !important;
        }

        .stack .column {
          width: 100%;
          display: block;
        }

        .mobile_hide {
          min-height: 0;
          max-height: 0;
          max-width: 0;
          overflow: hidden;
          font-size: 0px;
        }

        .desktop_hide,
        .desktop_hide table {
          display: table !important;
          max-height: none !important;
        }

        .row-2 .column-1 .block-1.paragraph_block td.pad,
        .row-3 .column-1 .block-1.heading_block td.pad,
        .row-4 .column-1 .block-2.heading_block td.pad,
        .row-4 .column-1 .block-3.paragraph_block td.pad,
        .row-4 .column-2 .block-2.heading_block td.pad,
        .row-4 .column-2 .block-3.paragraph_block td.pad,
        .row-5 .column-1 .block-2.heading_block td.pad,
        .row-5 .column-1 .block-3.heading_block td.pad,
        .row-6 .column-1 .block-2.heading_block td.pad,
        .row-6 .column-1 .block-3.paragraph_block td.pad,
        .row-6 .column-2 .block-3.paragraph_block td.pad {
          padding: 0 20px !important;
        }

        .row-3 .column-1 .block-1.heading_block h1,
        .row-5 .column-1 .block-2.heading_block h1,
        .row-5 .column-1 .block-3.heading_block h1,
        .row-6 .column-2 .block-2.heading_block h1 {
          font-size: 30px !important;
        }

        .row-4 .column-1 .block-2.heading_block h1,
        .row-4 .column-2 .block-2.heading_block h1 {
          font-size: 20px !important;
        }

        .row-6 .column-1 .block-2.heading_block h1 {
          text-align: left !important;
          font-size: 30px !important;
        }

        .row-6 .column-2 .block-1.image_block td.pad {
          padding: 30px 0 0 !important;
        }

        .row-6 .column-2 .block-2.heading_block td.pad {
          padding: 10px 20px 5px !important;
        }

        .row-3 .column-1 {
          padding: 40px 0 5px !important;
        }

        .row-4 .column-1 {
          padding: 30px 0 !important;
        }

        .row-4 .column-2 {
          padding: 0 0 30px !important;
        }

        .row-7 .column-1 {
          padding: 60px 0 0 !important;
        }

        .row-8 .column-1 {
          padding: 20px 0 5px !important;
        }

        .row-8 .column-2 {
          padding: 10px 0 20px !important;
        }

        .button_block .alignment {
          text-align: center !important;
        }

        .row-1 .column-2 .block-1.paragraph_block td.pad {
          text-align: center !important;
        }

        .row-5 .column-1 .block-3.heading_block h1,
        .row-6 .column-2 .block-2.heading_block h1 {
          line-height: 1.1 !important;
        }
      }
    </style>
    <!--[if mso
      ]><style>
        sup,
        sub {
          font-size: 100% !important;
        }
        sup {
          mso-text-raise: 10%;
        }
        sub {
          mso-text-raise: -10%;
        }
      </style>
    <![endif]-->
  </head>

  <body
    class="body"
    style="
      background-color: #f0f0f0;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: none;
      text-size-adjust: none;
    "
  >
    <table
      class="nl-container"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        background-color: #f0f0f0;
      "
    >
      <tbody>
        <tr>
          <td>
            <table
              class="row row-1"
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                background-size: auto;
              "
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      class="row-content stack"
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-size: auto;
                        background-color: #ffffff;
                        color: #000000;
                        border-radius: 0;
                        width: 600px;
                        margin: 0 auto;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            width="50%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 5px;
                              padding-top: 5px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="image_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 10px;
                                    padding-left: 35px;
                                    padding-right: 10px;
                                    padding-top: 15px;
                                    width: 100%;
                                  "
                                >
                                  <div class="alignment" align="left">
                                    <div style="max-width: 195px">
                                      <img
                                        src="https://d15k2d11r6t6rl.cloudfront.net/pub/bfra/ikek4pu4/xfw/tu8/smb/northwest%20exterminating%20logo.png"
                                        style="
                                          display: block;
                                          height: auto;
                                          border: 0;
                                          width: 100%;
                                        "
                                        width="195"
                                        alt
                                        title
                                        height="auto"
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td
                            class="column column-2"
                            width="50%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 5px;
                              padding-top: 5px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="paragraph_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 10px;
                                    padding-left: 40px;
                                    padding-right: 10px;
                                    padding-top: 10px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 19px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 2;
                                      text-align: left;
                                      mso-line-height-alt: 38px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      <strong>Your Pest Control Quote</strong>
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              class="row row-2"
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      class="row-content stack"
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #ffffff;
                        border-radius: 0;
                        color: #000000;
                        width: 600px;
                        margin: 0 auto;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-top: 20px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="paragraph_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 40px;
                                    padding-right: 40px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.5;
                                      text-align: left;
                                      mso-line-height-alt: 24px;
                                    "
                                  >
                                    <p style="margin: 0; margin-bottom: 16px">
                                      Hi ${firstName},
                                    </p>
                                    <p style="margin: 0">
                                      Thank you for contacting us about your
                                      ${singularPestType} issue. Based on the information you
                                      provided, your personalized quote is
                                      listed below. If everything looks great,
                                      click the book my service button to get
                                      started.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="button_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 40px;
                                    padding-right: 40px;
                                    padding-top: 20px;
                                    text-align: left;
                                  "
                                >
                                  <div class="alignment" align="left">
                                    <a
                                      href="https://www.nwexterminating.com/"
                                      target="_blank"
                                      style="
                                        color: #ffffff;
                                        text-decoration: none;
                                      "
                                      ><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="https://www.nwexterminating.com/"  style="height:38px;width:192px;v-text-anchor:middle;" arcsize="79%" fillcolor="#00ae42">
<v:stroke dashstyle="Solid" weight="0px" color="#00ae42"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:14px">
<![endif]--><span
                                        class="button"
                                        style="
                                          background-color: #00ae42;
                                          border-bottom: 0px solid transparent;
                                          border-left: 0px solid transparent;
                                          border-radius: 30px;
                                          border-right: 0px solid transparent;
                                          border-top: 0px solid transparent;
                                          color: #ffffff;
                                          display: inline-block;
                                          font-family:
                                            Helvetica Neue,
                                            Helvetica,
                                            Arial,
                                            sans-serif;
                                          font-size: 14px;
                                          font-weight: 700;
                                          mso-border-alt: none;
                                          padding-bottom: 5px;
                                          padding-top: 5px;
                                          padding-left: 40px;
                                          padding-right: 40px;
                                          text-align: center;
                                          width: auto;
                                          word-break: keep-all;
                                          letter-spacing: normal;
                                        "
                                        ><span
                                          style="
                                            word-break: break-word;
                                            line-height: 28px;
                                          "
                                          >Book My Service</span
                                        ></span
                                      ><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a
                                    >
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="image_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td class="pad" style="width: 100%">
                                  <div class="alignment" align="center">
                                    <div style="max-width: 600px">
                                      <a
                                        href="www.examplelink.com"
                                        target="_blank"
                                        ><img
                                          src="https://d15k2d11r6t6rl.cloudfront.net/pub/bfra/ikek4pu4/iz0/s8o/xaq/Banner.png"
                                          style="
                                            display: block;
                                            height: auto;
                                            border: 0;
                                            width: 100%;
                                          "
                                          width="600"
                                          alt="MainBanner Image - Blue Car"
                                          title="MainBanner Image - Blue Car"
                                          height="auto"
                                      /></a>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              class="row row-3"
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      class="row-content stack"
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #ffffff;
                        color: #000000;
                        border-radius: 0;
                        padding: 5px 40px;
                        width: 600px;
                        margin: 0 auto;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 5px;
                              padding-top: 50px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="heading_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 20px;
                                    padding-right: 20px;
                                    text-align: center;
                                    width: 100%;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #000;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 30px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 1.2;
                                      text-align: center;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 36px;
                                    "
                                  >
                                    <span
                                      class="tinyMce-placeholder"
                                      style="word-break: break-word"
                                      >Quote Details</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="10"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.2;
                                      text-align: center;
                                      mso-line-height-alt: 19px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      Based on your home at ${address}, your pricing
                                      details are as follows below.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              class="row row-4"
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      class="row-content stack"
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #ffffff;
                        border-radius: 0;
                        color: #000000;
                        width: 600px;
                        margin: 0 auto;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            width="50%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 50px;
                              padding-top: 30px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="image_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td class="pad" style="width: 100%">
                                  <div class="alignment" align="center">
                                    <div style="max-width: 36px">
                                      <a
                                        href="www.examplelink.com"
                                        target="_blank"
                                        ><img
                                          src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/7371/FastBookingIcom.png"
                                          style="
                                            display: block;
                                            height: auto;
                                            border: 0;
                                            width: 100%;
                                          "
                                          width="36"
                                          alt="Fast Booking icon Image"
                                          title="Fast Booking icon Image"
                                          height="auto"
                                      /></a>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
${
  selectedPlan?.requires_quote
    ? `
                            <table
                              class="heading_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 10px;
                                    padding-left: 20px;
                                    padding-right: 20px;
                                    padding-top: 10px;
                                    text-align: center;
                                    width: 100%;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #3b82f6;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 24px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 18px;
                                      text-align: center;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 18px;
                                    "
                                  >
                                    <span
                                      class="tinyMce-placeholder"
                                      style="word-break: break-word"
                                      >Custom Quote Required</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 20px;
                                    padding-right: 20px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 19px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 20px;
                                      text-align: center;
                                      mso-line-height-alt: 20px;
                                    "
                                  >
                                    <p align="center" style="margin: 0">
                                      We&apos;ll call right away with your custom quote.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
`
    : `
                            <table
                              class="heading_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 10px;
                                    padding-left: 20px;
                                    padding-right: 20px;
                                    padding-top: 10px;
                                    text-align: center;
                                    width: 100%;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #000;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 20px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 1.5;
                                      text-align: center;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 30px;
                                    "
                                  >
                                    <span
                                      class="tinyMce-placeholder"
                                      style="word-break: break-word"
                                      >${recurringPrice}</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 20px;
                                    padding-right: 20px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 14px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.2;
                                      text-align: center;
                                      mso-line-height-alt: 17px;
                                    "
                                  >
                                    <p align="center" style="margin: 0">
                                      20% Off List Price ($149)<br />Initial
                                      cost: ${initialPrice}<br />Quote Code:
                                      1753736966782-SL4XF
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
`
}
                          </td>
                          <td
                            class="column column-2"
                            width="50%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 50px;
                              padding-top: 30px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="image_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td class="pad" style="width: 100%">
                                  <div class="alignment" align="center">
                                    <div style="max-width: 36px">
                                      <a
                                        href="www.examplelink.com"
                                        target="_blank"
                                        ><img
                                          src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/7371/PULocationIcon.png"
                                          style="
                                            display: block;
                                            height: auto;
                                            border: 0;
                                            width: 100%;
                                          "
                                          width="36"
                                          alt="Pick Up Location Icon Image"
                                          title="Pick Up Location Icon Image"
                                          height="auto"
                                      /></a>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="heading_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 10px;
                                    padding-left: 20px;
                                    padding-right: 20px;
                                    padding-top: 10px;
                                    text-align: center;
                                    width: 100%;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #000;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 20px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 1.5;
                                      text-align: center;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 30px;
                                    "
                                  >
                                    <span
                                      class="tinyMce-placeholder"
                                      style="word-break: break-word"
                                      >Professional ${singularPestType} Control</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 20px;
                                    padding-right: 20px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 14px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.2;
                                      text-align: center;
                                      mso-line-height-alt: 17px;
                                    "
                                  >
                                    <p align="center" style="margin: 0">
                                      Our team is ready to protect your property with professional pest control service.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              class="row row-5"
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      class="row-content stack"
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #ffffff;
                        border-radius: 0;
                        color: #000000;
                        width: 600px;
                        margin: 0 auto;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 30px;
                              padding-top: 30px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="paragraph_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 35px;
                                    padding-left: 40px;
                                    padding-right: 40px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 16px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.2;
                                      text-align: left;
                                      mso-line-height-alt: 19px;
                                    "
                                  >
                                    <p style="margin: 0; margin-bottom: 16px">
                                      If you have any immediate questions or
                                      would like to schedule sooner, please
                                      don&apos;t hesitate to contact us:
                                    </p>
                                    <p style="margin: 0; margin-bottom: 16px">
                                      <strong>Phone:</strong>&nbsp;(520)
                                      210-4162<br /><strong>Email:</strong
                                      >&nbsp;<a
                                        href="mailto:info@nwexterminating.com"
                                        target="_blank"
                                        style="
                                          text-decoration: underline;
                                          color: #7747ff;
                                        "
                                        rel="noopener"
                                        >info@nwexterminating.com</a
                                      >
                                    </p>
                                    <p style="margin: 0; margin-bottom: 16px">
                                      We look forward to helping you resolve
                                      your pest control needs!
                                    </p>
                                    <p style="margin: 0">
                                      Best regards,<br />The Northwest
                                      Exterminating Team
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="heading_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 20px;
                                    padding-right: 20px;
                                    text-align: center;
                                    width: 100%;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #012979;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 50px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 1.2;
                                      text-align: center;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 60px;
                                    "
                                  >
                                    <span
                                      class="tinyMce-placeholder"
                                      style="word-break: break-word"
                                      >Next Steps</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="heading_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 20px;
                                    padding-right: 20px;
                                    text-align: center;
                                    width: 100%;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #000;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 26px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 1.5;
                                      text-align: center;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 39px;
                                    "
                                  >
                                    <span
                                      class="tinyMce-placeholder"
                                      style="word-break: break-word"
                                      >for your pest control service</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="divider_block block-4"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 10px;
                                    padding-left: 10px;
                                    padding-right: 10px;
                                    padding-top: 30px;
                                  "
                                >
                                  <div class="alignment" align="center">
                                    <table
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      width="100%"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                      "
                                    >
                                      <tr>
                                        <td
                                          class="divider_inner"
                                          style="
                                            font-size: 1px;
                                            line-height: 1px;
                                            border-top: 1px dashed #0056f1;
                                          "
                                        >
                                          <span style="word-break: break-word"
                                            >&#8202;</span
                                          >
                                        </td>
                                      </tr>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              class="row row-6"
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      class="row-content stack"
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #ffffff;
                        border-radius: 0;
                        color: #000000;
                        width: 600px;
                        margin: 0 auto;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            width="50%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 5px;
                              padding-top: 5px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="image_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    width: 100%;
                                    padding-right: 0px;
                                    padding-left: 0px;
                                  "
                                >
                                  <div class="alignment" align="center">
                                    <div
                                      class="fullWidth"
                                      style="max-width: 231px"
                                    >
                                      <a
                                        href="www.examplelink.com"
                                        target="_blank"
                                        ><img
                                          src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/7371/MecedesSclass.png"
                                          style="
                                            display: block;
                                            height: auto;
                                            border: 0;
                                            width: 100%;
                                          "
                                          width="231"
                                          alt="Mercedes Benz - S Class Image"
                                          title="Mercedes Benz - S Class Image"
                                          height="auto"
                                      /></a>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="heading_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 10px;
                                    padding-left: 40px;
                                    padding-right: 20px;
                                    padding-top: 10px;
                                    text-align: center;
                                    width: 100%;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #000;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 16px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 1.5;
                                      text-align: left;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 24px;
                                    "
                                  >
                                    <span
                                      class="tinyMce-placeholder"
                                      style="word-break: break-word"
                                      >Confirm Your Service</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 40px;
                                    padding-right: 30px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 14px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.5;
                                      text-align: left;
                                      mso-line-height-alt: 21px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      Our schedule fills up fast so book early
                                      and get priority scheduling for your pest
                                      problem
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td
                            class="column column-2"
                            width="50%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 5px;
                              padding-top: 5px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="image_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    width: 100%;
                                    padding-right: 0px;
                                    padding-left: 0px;
                                  "
                                >
                                  <div class="alignment" align="center">
                                    <div
                                      class="fullWidth"
                                      style="max-width: 231px"
                                    >
                                      <a
                                        href="www.examplelink.com"
                                        target="_blank"
                                        ><img
                                          src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/7371/AudiRS8.png"
                                          style="
                                            display: block;
                                            height: auto;
                                            border: 0;
                                            width: 100%;
                                          "
                                          width="231"
                                          alt="Audi RS8 Image"
                                          title="Audi RS8 Image"
                                          height="auto"
                                      /></a>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="heading_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-bottom: 10px;
                                    padding-left: 40px;
                                    padding-right: 20px;
                                    padding-top: 10px;
                                    text-align: center;
                                    width: 100%;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #000;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 16px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 1.5;
                                      text-align: left;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 24px;
                                    "
                                  >
                                    <span
                                      class="tinyMce-placeholder"
                                      style="word-break: break-word"
                                      >We&apos;ll Get You Scheduled</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    padding-left: 40px;
                                    padding-right: 30px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #101112;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 14px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.5;
                                      text-align: left;
                                      mso-line-height-alt: 21px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      Lorem ipsum dolor sit amet, consectetur
                                      adipiscing elit, sed do eiusm.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              class="row row-7"
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      class="row-content stack"
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #ffffff;
                        border-radius: 0;
                        color: #000000;
                        width: 600px;
                        margin: 0 auto;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-top: 60px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="image_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    width: 100%;
                                    padding-right: 0px;
                                    padding-left: 0px;
                                  "
                                >
                                  <div class="alignment" align="center">
                                    <div style="max-width: 150px">
                                      <a
                                        href="www.examplelink.com"
                                        target="_blank"
                                        ><img
                                          src="https://d15k2d11r6t6rl.cloudfront.net/pub/bfra/ikek4pu4/xfw/tu8/smb/northwest%20exterminating%20logo.png"
                                          style="
                                            display: block;
                                            height: auto;
                                            border: 0;
                                            width: 100%;
                                          "
                                          width="150"
                                          alt="Logo CarRental Image"
                                          title="Logo CarRental Image"
                                          height="auto"
                                      /></a>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td class="pad" style="padding-top: 20px">
                                  <div
                                    style="
                                      color: #b0b0b0;
                                      direction: ltr;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 25px;
                                      font-weight: 400;
                                      letter-spacing: 0px;
                                      line-height: 1.2;
                                      text-align: center;
                                      mso-line-height-alt: 30px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      Any Pest. On-Time. Guaranteed.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="button_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="20"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td class="pad">
                                  <div class="alignment" align="center">
                                    <a
                                      href="https://www.nwexterminating.com/"
                                      target="_blank"
                                      style="
                                        color: #ffffff;
                                        text-decoration: none;
                                      "
                                      ><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="https://www.nwexterminating.com/"  style="height:38px;width:166px;v-text-anchor:middle;" arcsize="79%" fillcolor="#00ae42">
<v:stroke dashstyle="Solid" weight="0px" color="#00ae42"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:14px">
<![endif]--><span
                                        class="button"
                                        style="
                                          background-color: #00ae42;
                                          border-bottom: 0px solid transparent;
                                          border-left: 0px solid transparent;
                                          border-radius: 30px;
                                          border-right: 0px solid transparent;
                                          border-top: 0px solid transparent;
                                          color: #ffffff;
                                          display: inline-block;
                                          font-family:
                                            Helvetica Neue,
                                            Helvetica,
                                            Arial,
                                            sans-serif;
                                          font-size: 14px;
                                          font-weight: 700;
                                          mso-border-alt: none;
                                          padding-bottom: 5px;
                                          padding-top: 5px;
                                          padding-left: 20px;
                                          padding-right: 20px;
                                          text-align: center;
                                          width: auto;
                                          word-break: keep-all;
                                          letter-spacing: normal;
                                        "
                                        ><span
                                          style="
                                            word-break: break-word;
                                            line-height: 28px;
                                          "
                                          ><strong
                                            >Book Your Service&nbsp;</strong
                                          ></span
                                        ></span
                                      ><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a
                                    >
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="image_block block-4"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    width: 100%;
                                    padding-right: 0px;
                                    padding-left: 0px;
                                  "
                                >
                                  <div class="alignment" align="center">
                                    <div
                                      class="fullWidth"
                                      style="max-width: 600px"
                                    >
                                      <a
                                        href="https://www.nwexterminating.com/
                                        target="_blank"
                                        ><img
                                          src="https://d15k2d11r6t6rl.cloudfront.net/pub/bfra/ikek4pu4/o8n/v1n/m9a/footer%20banner.png"
                                          style="
                                            display: block;
                                            height: auto;
                                            border: 0;
                                            width: 100%;
                                          "
                                          width="600"
                                          alt="Footer Image"
                                          title="Footer Image"
                                          height="auto"
                                      /></a>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              class="row row-8"
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      class="row-content stack"
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #ffffff;
                        color: #000000;
                        width: 600px;
                        margin: 0 auto;
                      "
                      width="600"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            width="50%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 20px;
                              padding-left: 5px;
                              padding-top: 20px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="paragraph_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="10"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #ffffff;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 18px;
                                      font-weight: 700;
                                      line-height: 1.2;
                                      text-align: left;
                                      mso-line-height-alt: 22px;
                                    "
                                  >
                                    <p
                                      style="margin: 0; word-break: break-word"
                                    >
                                      <span
                                        style="
                                          word-break: break-word;
                                          color: #2e2e2e;
                                        "
                                        ><strong>Social media</strong></span
                                      >
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="10"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #c0c0c0;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 12px;
                                      font-weight: 700;
                                      line-height: 1.2;
                                      text-align: left;
                                      mso-line-height-alt: 14px;
                                    "
                                  >
                                    <p
                                      style="margin: 0; word-break: break-word"
                                    >
                                      <span
                                        style="
                                          word-break: break-word;
                                          color: #c0c0c0;
                                        "
                                        >Stay up-to-date with current activities
                                        and future events by following us on
                                        your favorite social media
                                        channels.</span
                                      >
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="social_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                            >
                              <tr>
                                <td
                                  class="pad"
                                  style="
                                    text-align: left;
                                    padding-right: 0px;
                                    padding-left: 0px;
                                  "
                                >
                                  <div class="alignment" align="left">
                                    <table
                                      class="social-table"
                                      width="126px"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        display: inline-block;
                                      "
                                    >
                                      <tr>
                                        <td style="padding: 0 10px 0 0">
                                          <a
                                            href="https://www.facebook.com"
                                            target="_blank"
                                            ><img
                                              src="https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-default-gray/facebook@2x.png"
                                              width="32"
                                              height="auto"
                                              alt="Facebook"
                                              title="Facebook"
                                              style="
                                                display: block;
                                                height: auto;
                                                border: 0;
                                              "
                                          /></a>
                                        </td>
                                        <td style="padding: 0 10px 0 0">
                                          <a
                                            href="https://www.twitter.com"
                                            target="_blank"
                                            ><img
                                              src="https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-default-gray/twitter@2x.png"
                                              width="32"
                                              height="auto"
                                              alt="Twitter"
                                              title="Twitter"
                                              style="
                                                display: block;
                                                height: auto;
                                                border: 0;
                                              "
                                          /></a>
                                        </td>
                                        <td style="padding: 0 10px 0 0">
                                          <a
                                            href="https://www.instagram.com"
                                            target="_blank"
                                            ><img
                                              src="https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-default-gray/instagram@2x.png"
                                              width="32"
                                              height="auto"
                                              alt="Instagram"
                                              title="Instagram"
                                              style="
                                                display: block;
                                                height: auto;
                                                border: 0;
                                              "
                                          /></a>
                                        </td>
                                      </tr>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td
                            class="column column-2"
                            width="50%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              padding-bottom: 20px;
                              padding-left: 5px;
                              padding-top: 20px;
                              vertical-align: top;
                            "
                          >
                            <table
                              class="paragraph_block block-1"
                              width="100%"
                              border="0"
                              cellpadding="10"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #000000;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 18px;
                                      font-weight: 700;
                                      line-height: 1.2;
                                      text-align: left;
                                      mso-line-height-alt: 22px;
                                    "
                                  >
                                    <p
                                      style="margin: 0; word-break: break-word"
                                    >
                                      <span
                                        style="
                                          word-break: break-word;
                                          color: #2e2e2e;
                                        "
                                        ><strong>Our Location</strong></span
                                      >
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-2"
                              width="100%"
                              border="0"
                              cellpadding="10"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #c0c0c0;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 12px;
                                      line-height: 1.2;
                                      text-align: left;
                                      mso-line-height-alt: 14px;
                                    "
                                  >
                                    <p
                                      style="margin: 0; word-break: break-word"
                                    >
                                      <span
                                        style="
                                          word-break: break-word;
                                          color: #c0c0c0;
                                        "
                                        >Northwest Exterminating</span
                                      >
                                    </p>
                                    <p
                                      style="margin: 0; word-break: break-word"
                                    >
                                      <span
                                        style="
                                          word-break: break-word;
                                          color: #c0c0c0;
                                        "
                                        >Address Goes Here<br
                                      /></span>
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              class="paragraph_block block-3"
                              width="100%"
                              border="0"
                              cellpadding="10"
                              cellspacing="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                            >
                              <tr>
                                <td class="pad">
                                  <div
                                    style="
                                      color: #c0c0c0;
                                      font-family:
                                        Helvetica Neue,
                                        Helvetica,
                                        Arial,
                                        sans-serif;
                                      font-size: 12px;
                                      line-height: 1.2;
                                      text-align: left;
                                      mso-line-height-alt: 14px;
                                    "
                                  >
                                    <p
                                      style="margin: 0; word-break: break-word"
                                    >
                                      <span
                                        style="
                                          word-break: break-word;
                                          color: #c0c0c0;
                                        "
                                        >Changed your mind?
                                        <a
                                          href="http://www.examplelink.com"
                                          target="_blank"
                                          rel="noopener"
                                          style="
                                            text-decoration: underline;
                                            color: #012979;
                                          "
                                          >Unsubscribe</a
                                        ></span
                                      >
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- End -->
  </body>
</html>`;
}
