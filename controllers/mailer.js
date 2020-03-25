var nodemailer = require("nodemailer");

exports.send = async function(to, subject, html) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || "smtp.ethereal.email",
    port: process.env.EMAIL_SMTP_PORT || 587,
    secure: process.env.EMAIL_SMTP_SECURE || false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SMTP_USERNAME || "eliezer.reichel@ethereal.email", // generated ethereal user
      pass: process.env.EMAIL_SMTP_PASSWORD || "K9uQJJENp7bRcyrQzw" // generated ethereal password
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"info" <' + process.env.EMAIL_FROM + ">", // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: html // html body
  });

  console.log("Message sent: %s", info.messageId);

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  return info;
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};
